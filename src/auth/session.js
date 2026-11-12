import { ErroApi } from "../lib/api.js";

export const CHAVE_SESSAO = "okinawa-sc-auth-v1";
const AVISO_SESSAO = "Sua sessão expirou ou sua conta não possui mais acesso. Entre novamente.";
const AVISO_SENHA_ALTERADA = "Senha alterada com sucesso. Entre novamente com a nova senha.";
const estadoInicial = { status: "restaurando", usuario: null, permissoes: [], erro: null, aviso: null, atualizando: false };

function validarContexto(dados) {
  const usuario = dados?.usuario;
  if (!Number.isInteger(usuario?.id) || typeof usuario.nome !== "string" || typeof usuario.email !== "string"
    || !Number.isInteger(usuario.funcaoSistema?.id) || typeof usuario.funcaoSistema.nome !== "string"
    || typeof dados.primeiroAcesso !== "boolean"
    || !Array.isArray(dados?.permissoes) || !dados.permissoes.every((codigo) => typeof codigo === "string" && codigo.length > 0)) {
    throw new ErroApi(502, "Não foi possível carregar sua conta. Tente novamente.");
  }
  const { primeiroAcesso } = dados;
  return {
    usuario,
    permissoes: primeiroAcesso ? [] : [...new Set(dados.permissoes)],
    status: primeiroAcesso ? "trocaSenhaObrigatoria" : "autenticado",
  };
}

// O ciclo da sessão é independente do React para controlar cancelamento e respostas atrasadas.
export function criarSessao({ api, storage, agora = Date.now, agendar = setTimeout, cancelarAgendamento = clearTimeout }) {
  let estado = { ...estadoInicial };
  let credencial = null;
  let versao = 0;
  let controle = new AbortController();
  let temporizador;
  let tarefaLogin;
  let tarefaContexto;
  let versaoContexto = 0;
  const ouvintes = new Set();
  const publicar = (alteracoes) => {
    estado = { ...estado, ...alteracoes };
    ouvintes.forEach((ouvinte) => ouvinte());
  };
  const salvar = () => {
    try {
      if (credencial) storage?.setItem(CHAVE_SESSAO, JSON.stringify(credencial));
      else storage?.removeItem(CHAVE_SESSAO);
    } catch { /* Armazenamento bloqueado: a sessão permanece somente em memória. */ }
  };
  const cancelarPendencias = () => {
    versao += 1;
    controle.abort();
    controle = new AbortController();
    cancelarAgendamento(temporizador);
    tarefaContexto = null;
    tarefaLogin = null;
  };
  const sair = (aviso = null) => {
    cancelarPendencias();
    credencial = null;
    salvar();
    publicar({ ...estadoInicial, status: "anonimo", aviso });
  };
  const verificarExpiracao = () => {
    if (credencial && credencial.expiresAt <= agora()) { sair(AVISO_SESSAO); return true; }
    return false;
  };
  const agendarExpiracao = () => {
    cancelarAgendamento(temporizador);
    if (credencial) temporizador = agendar(() => {
      if (!verificarExpiracao()) agendarExpiracao();
    }, Math.min(Math.max(credencial.expiresAt - agora(), 0), 2147483647));
  };

  const atualizarContexto = ({ forcar = false } = {}) => {
    if (tarefaContexto && !forcar) return tarefaContexto;
    if (!credencial || verificarExpiracao()) return Promise.resolve(false);
    const atual = versao;
    // Após uma alteração própria, consultas anteriores não podem restaurar permissões antigas.
    const contextoAtual = ++versaoContexto;
    const { token } = credencial;
    const signal = controle.signal;
    publicar({ status: estado.status === "autenticado" ? "autenticado" : "carregando", atualizando: true, erro: null });
    const tarefa = (async () => {
      try {
        const dados = await api("/auth/me", { token, signal });
        if (atual !== versao || contextoAtual !== versaoContexto || signal.aborted || verificarExpiracao()) return false;
        const contexto = validarContexto(dados);
        salvar();
        publicar({ ...contexto, atualizando: false, erro: null, aviso: null });
        return true;
      } catch (erro) {
        if (atual !== versao || contextoAtual !== versaoContexto || signal.aborted) return false;
        if (erro.status === 401) sair(AVISO_SESSAO);
        else publicar({ status: "erro", usuario: null, permissoes: [], atualizando: false, erro: erro.message });
        return false;
      }
    })();
    tarefaContexto = tarefa;
    tarefa.finally(() => { if (tarefaContexto === tarefa) tarefaContexto = null; });
    return tarefa;
  };

  const entrar = (email, senha) => {
    if (tarefaLogin) return tarefaLogin;
    cancelarPendencias();
    credencial = null;
    salvar();
    publicar({ ...estadoInicial, status: "autenticando" });
    const atual = versao;
    const signal = controle.signal;
    const inicio = agora();
    const tarefa = (async () => {
      try {
        const resposta = await api("/auth/login", { method: "POST", body: { email: email.trim().toLowerCase(), senha }, signal });
        if (atual !== versao || signal.aborted) return false;
        if (typeof resposta?.accesToken !== "string" || !resposta.accesToken.trim()
          || resposta.tokenType !== "Bearer" || !Number.isFinite(resposta.expiresIn) || resposta.expiresIn <= 0
          || !Number.isFinite(inicio + resposta.expiresIn * 1000)) {
          throw new ErroApi(502, "Não foi possível iniciar sua sessão. Tente novamente.");
        }
        credencial = { token: resposta.accesToken, expiresAt: inicio + resposta.expiresIn * 1000 };
        agendarExpiracao();
        return await atualizarContexto();
      } catch (erro) {
        if (atual !== versao || signal.aborted) return false;
        publicar({ ...estadoInicial, status: "anonimo", erro: erro.message });
        return false;
      }
    })();
    tarefaLogin = tarefa;
    tarefa.finally(() => { if (tarefaLogin === tarefa) tarefaLogin = null; });
    return tarefa;
  };

  const restaurar = async () => {
    cancelarPendencias();
    credencial = null;
    publicar({ ...estadoInicial });
    try {
      const salvo = JSON.parse(storage?.getItem(CHAVE_SESSAO) || "null");
      if (typeof salvo?.token === "string" && salvo.token.trim() && Number.isFinite(salvo.expiresAt)) credencial = salvo;
    } catch { /* Dados ausentes ou inválidos são descartados. */ }
    if (!credencial) { sair(); return false; }
    if (verificarExpiracao()) return false;
    agendarExpiracao();
    return atualizarContexto();
  };

  const requisitar = async (caminho, opcoes = {}) => {
    if (!credencial || verificarExpiracao()) throw new ErroApi(401, AVISO_SESSAO);
    const trocaObrigatoria = estado.status === "trocaSenhaObrigatoria";
    if (trocaObrigatoria) {
      if (caminho !== "/minha-conta/senha" || opcoes.method !== "PUT") {
        throw new ErroApi(403, "Altere sua senha para acessar o sistema.");
      }
    } else if (estado.status !== "autenticado") {
      throw new ErroApi(401, AVISO_SESSAO);
    }
    const atual = versao;
    const solicitacao = new AbortController();
    const cancelar = () => solicitacao.abort();
    const sinais = [controle.signal, opcoes.signal].filter(Boolean);
    sinais.forEach((sinal) => {
      if (sinal.aborted) cancelar();
      else sinal.addEventListener("abort", cancelar, { once: true });
    });
    const signal = solicitacao.signal;
    try {
      const resposta = await api(caminho, {
        ...opcoes, token: credencial.token, signal,
        ...(trocaObrigatoria ? { statusEsperado: 204 } : {}),
      });
      if (atual !== versao || signal.aborted) throw new DOMException("Requisição cancelada", "AbortError");
      if (trocaObrigatoria) sair(AVISO_SENHA_ALTERADA);
      else if (verificarExpiracao()) throw new ErroApi(401, AVISO_SESSAO);
      return resposta;
    } catch (erro) {
      if (atual === versao && !signal.aborted) {
        if (erro.status === 401) sair(AVISO_SESSAO);
        if (erro.status === 403 && !trocaObrigatoria) await atualizarContexto();
      }
      throw erro;
    } finally {
      sinais.forEach((sinal) => sinal.removeEventListener("abort", cancelar));
    }
  };

  return {
    getState: () => estado,
    subscribe: (ouvinte) => { ouvintes.add(ouvinte); return () => ouvintes.delete(ouvinte); },
    entrar, sair, restaurar, atualizarContexto, requisitar, verificarExpiracao,
    limparAviso: () => publicar({ aviso: null, erro: null }),
    cancelarPendencias,
  };
}

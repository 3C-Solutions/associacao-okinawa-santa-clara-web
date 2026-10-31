import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { criarDadosIniciais, identificadorUnico } from "@/lib/data.js";
import DialogoConfirmacao from "./ConfirmDialog.jsx";
import HospedeiroAvisos from "./ToastHost.jsx";

const CHAVE_ARMAZENAMENTO = "okinawa-sc-v2";
const DEPARTAMENTOS_COM_NOVA_IMAGEM = new Set(["d-eisa", "d-odori", "d-karaoke", "d-tenis", "d-shodo", "d-sanshin", "d-seinenkai", "d-sextou", "d-volei"]);

const ContextoArmazenamento = createContext(null);

// Completa dados salvos por versões anteriores (perfis novos, famílias) sem perder o que o usuário já criou.
function migrar(dadosIniciais, salvo) {
  const perfis = { ...dadosIniciais.profiles };
  Object.entries(salvo.profiles || {}).forEach(([chave, parametro]) => { perfis[chave] = { ...dadosIniciais.profiles[chave], ...parametro }; });
  const associados = (salvo.associates || dadosIniciais.associates).map((elementoA) => ({ ...elementoA, familyId: elementoA.familyId ?? dadosIniciais.associates.find((segundo) => segundo.id === elementoA.id)?.familyId ?? null }));
  // só na primeira carga após esta versão (seed.v), para não recriar um departamento que a diretoria excluiu de propósito
  const primeiroCarregamento = salvo.v !== dadosIniciais.v;
  // Atualiza as imagens fornecidas com a versão nova sem substituir alterações posteriores feitas pela Diretoria.
  const departamentos = (salvo.departments || dadosIniciais.departments).map((dataValor) => {
    const departamento = /^eisa\s*(e|&)\s*taiko$/i.test(dataValor.name) ? { ...dataValor, name: "Eisa Taiko" } : dataValor;
    if (!primeiroCarregamento || !DEPARTAMENTOS_COM_NOVA_IMAGEM.has(departamento.id)) return departamento;
    const imagemInicial = dadosIniciais.departments.find((valor) => valor.id === departamento.id)?.image;
    return imagemInicial ? { ...departamento, image: imagemInicial } : departamento;
  });
  if (primeiroCarregamento && !departamentos.some((dataValor) => dataValor.id === "d-acupuntura")) departamentos.push(dadosIniciais.departments.find((dataValor) => dataValor.id === "d-acupuntura"));
  if (!departamentos.some((dataValor) => dataValor.id === "d-acupuntura")) delete perfis.acupuntura; // sem o departamento, não há conta dele
  return { ...dadosIniciais, ...salvo, v: dadosIniciais.v, departments: departamentos, profiles: perfis, passwords: { ...dadosIniciais.passwords, ...salvo.passwords }, associates: associados, families: salvo.families || dadosIniciais.families };
}

function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (bruto) return migrar(criarDadosIniciais(), JSON.parse(bruto));
  } catch {
    /* localStorage indisponível: usa dados de exemplo */
  }
  return criarDadosIniciais();
}

// remove contas de acesso (perfil + senha) que atendam ao critério
const semContas = (dadosAplicacao, correspondencia) => {
  const chaves = Object.keys(dadosAplicacao.profiles).filter((chave) => correspondencia(dadosAplicacao.profiles[chave], chave));
  if (!chaves.length) return {};
  const perfis = { ...dadosAplicacao.profiles };
  const senhas = { ...dadosAplicacao.passwords };
  chaves.forEach((chave) => { delete perfis[chave]; delete senhas[chave]; });
  return { profiles: perfis, passwords: senhas };
};

function redutor(dadosAplicacao, acao) {
  switch (acao.type) {
    case "UPSERT": {
      const lista = dadosAplicacao[acao.key];
      const existe = lista.some((item) => item.id === acao.item.id);
      return { ...dadosAplicacao, [acao.key]: existe ? lista.map((item) => (item.id === acao.item.id ? acao.item : item)) : [...lista, acao.item] };
    }
    case "REMOVE": {
      const proximo = { ...dadosAplicacao, [acao.key]: dadosAplicacao[acao.key].filter((item) => item.id !== acao.id) };
      if (acao.key === "departments") {
        // remove as inscrições do departamento excluído
        proximo.enrollmentRequests = (dadosAplicacao.enrollmentRequests || []).filter((resultado) => resultado.departmentId !== acao.id);
        proximo.associates = dadosAplicacao.associates.map((elementoA) => ({
          ...elementoA,
          departmentIds: elementoA.departmentIds.filter((dataValor) => dataValor !== acao.id),
          dependents: elementoA.dependents.map((parametro) => ({ ...parametro, departmentIds: parametro.departmentIds.filter((dataValor) => dataValor !== acao.id) })),
        }));
      }
      if (acao.key === "associates") {
        proximo.enrollmentRequests = (dadosAplicacao.enrollmentRequests || []).filter((resultado) => resultado.associateId !== acao.id);
        Object.assign(proximo, semContas(dadosAplicacao, (parametro) => parametro.associateId === acao.id));
      }
      return proximo;
    }
    case "REMOVE_WHERE":
      return { ...dadosAplicacao, [acao.key]: dadosAplicacao[acao.key].filter((item) => !acao.predicate(item)) };
    case "NOTIFY":
      return { ...dadosAplicacao, notifications: [{ id: identificadorUnico(), read: false, time: new Date().toISOString(), ...acao.payload }, ...dadosAplicacao.notifications] };
    case "READ":
      return { ...dadosAplicacao, notifications: dadosAplicacao.notifications.map((quantidadeN) => (acao.ids.includes(quantidadeN.id) ? { ...quantidadeN, read: true } : quantidadeN)) };
    case "PROFILE":
      return { ...dadosAplicacao, profiles: { ...dadosAplicacao.profiles, [acao.key]: { ...dadosAplicacao.profiles[acao.key], ...acao.patch } } };
    case "PASSWORD":
      return { ...dadosAplicacao, passwords: { ...dadosAplicacao.passwords, [acao.key]: acao.value } };
    case "ADD_ACCOUNT":
      return { ...dadosAplicacao, profiles: { ...dadosAplicacao.profiles, [acao.key]: acao.profile }, passwords: { ...dadosAplicacao.passwords, [acao.key]: acao.password } };
    case "UPDATE_ACCOUNTS": {
      const perfis = Object.fromEntries(Object.entries(dadosAplicacao.profiles).map(([chave, parametro]) => [chave, acao.match(parametro, chave) ? { ...parametro, ...acao.patch } : parametro]));
      return { ...dadosAplicacao, profiles: perfis };
    }
    case "REMOVE_ACCOUNTS":
      return { ...dadosAplicacao, ...semContas(dadosAplicacao, acao.match) };
    case "RESET":
      return criarDadosIniciais();
    default:
      return dadosAplicacao;
  }
}

export function ProvedorArmazenamento({ children: filhos }) {
  const [dadosAplicacao, despachar] = useReducer(redutor, undefined, carregar);
  const [avisos, definirAvisos] = useState([]);
  const [estadoConfirmacao, definirEstadoConfirmacao] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(dadosAplicacao));
    } catch {
      /* ignora: armazenamento cheio ou bloqueado */
    }
  }, [dadosAplicacao]);

  const aviso = useCallback((mensagem, tom = "success") => {
    const identificador = identificadorUnico();
    definirAvisos((lista) => [...lista, { id: identificador, message: mensagem, tone: tom }]);
    window.setTimeout(() => definirAvisos((lista) => lista.filter((tempo) => tempo.id !== identificador)), 3200);
  }, []);

  const confirmar = useCallback((opcoes) => definirEstadoConfirmacao(opcoes), []);

  const servico = useMemo(
    () => ({
      save: (chave, item) => despachar({ type: "UPSERT", key: chave, item: item.id ? item : { ...item, id: identificadorUnico() } }),
      remove: (chave, identificador) => despachar({ type: "REMOVE", key: chave, id: identificador }),
      removeWhere: (chave, predicado) => despachar({ type: "REMOVE_WHERE", key: chave, predicate: predicado }),
      // target (opcional): { departmentId } ou { associateId } restringe a notificação a quem pertence ao departamento/família
      notify: (papel, titulo, detalhe, tela, alvo = {}) => despachar({ type: "NOTIFY", payload: { role: papel, title: titulo, detail: detalhe, screen: tela, ...alvo } }),
      markRead: (identificadores) => despachar({ type: "READ", ids: identificadores }),
      setProfile: (chave, atualizarParcial) => despachar({ type: "PROFILE", key: chave, patch: atualizarParcial }),
      setPassword: (chave, valor) => despachar({ type: "PASSWORD", key: chave, value: valor }),
      addAccount: (chave, perfil, senha) => despachar({ type: "ADD_ACCOUNT", key: chave, profile: perfil, password: senha }),
      updateAccounts: (correspondencia, atualizarParcial) => despachar({ type: "UPDATE_ACCOUNTS", match: correspondencia, patch: atualizarParcial }),
      removeAccounts: (correspondencia) => despachar({ type: "REMOVE_ACCOUNTS", match: correspondencia }),
      reset: () => despachar({ type: "RESET" }),
    }),
    [],
  );

  const valor = useMemo(() => ({ state: dadosAplicacao, ...servico, toast: aviso, confirm: confirmar }), [dadosAplicacao, servico, aviso, confirmar]);

  return (
    <ContextoArmazenamento.Provider value={valor}>
      {filhos}
      <HospedeiroAvisos toasts={avisos} />
      {estadoConfirmacao && <DialogoConfirmacao {...estadoConfirmacao} onClose={() => definirEstadoConfirmacao(null)} />}
    </ContextoArmazenamento.Provider>
  );
}

export function usarArmazenamento() {
  const contexto = useContext(ContextoArmazenamento);
  if (!contexto) throw new Error("useStore precisa estar dentro de <StoreProvider>");
  return contexto;
}

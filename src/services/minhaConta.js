import { ErroApi } from "../lib/api.js";
import { normalizarFamilia } from "./familias.js";
import { normalizarFuncaoSistema } from "./funcoesSistema.js";

const emailNormalizado = (valor) => valor.trim().toLowerCase();
const senhaLonga = (valor) => new TextEncoder().encode(valor).length > 72;

export function normalizarMinhaConta(dados) {
  if (!Number.isInteger(dados?.id) || dados.id <= 0 || typeof dados.nome !== "string" || typeof dados.email !== "string"
    || (dados.telefone != null && typeof dados.telefone !== "string") || (dados.dataNascimento != null && typeof dados.dataNascimento !== "string")) {
    throw new ErroApi(502, "Não foi possível carregar sua conta. Tente novamente.");
  }
  return {
    id: dados.id, name: dados.nome, email: dados.email, phone: dados.telefone || "",
    birthDateLabel: dados.dataNascimento || "Não informada", funcao: normalizarFuncaoSistema(dados.funcaoSistema),
    family: dados.familia == null ? null : normalizarFamilia(dados.familia),
  };
}

export function mudouEmail(formulario, conta) {
  return emailNormalizado(formulario.email) !== emailNormalizado(conta.email);
}

export function validarMinhaConta(formulario, conta) {
  const erros = {};
  if (formulario.name.trim().length < 3 || formulario.name.trim().length > 255) erros.name = "Informe um nome entre 3 e 255 caracteres.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email.trim()) || formulario.email.trim().length > 255) erros.email = "Informe um e-mail válido.";
  if (formulario.phone.trim().length > 20) erros.phone = "O telefone deve ter no máximo 20 caracteres.";
  if (mudouEmail(formulario, conta) && !formulario.current.trim()) erros.current = "Informe sua senha atual para alterar o e-mail.";
  return erros;
}

export function validarNovaSenha(formulario) {
  const erros = {};
  if (!formulario.current.trim()) erros.current = "Informe a senha atual.";
  if (!formulario.next.trim() || formulario.next.length < 8) erros.next = "A nova senha deve ter no mínimo 8 caracteres.";
  else if (senhaLonga(formulario.next)) erros.next = "A nova senha excede o limite de 72 bytes. Use uma senha menor.";
  else if (formulario.next === formulario.current) erros.next = "A nova senha deve ser diferente da atual.";
  if (formulario.confirm !== formulario.next) erros.confirm = "As senhas não conferem.";
  return erros;
}

const mensagensSenha = {
  SENHA_ATUAL_INCORRETA: "Senha atual incorreta.",
  NOVA_SENHA_IGUAL: "A nova senha deve ser diferente da atual.",
  NOVA_SENHA_LONGA: "A nova senha excede o limite de 72 bytes. Use uma senha menor.",
};

export function criarServicoMinhaConta(requisitar) {
  const executar = async (url, opcoes) => {
    try { return await requisitar(url, opcoes); }
    catch (erro) {
      if (erro.status === 400 && Object.hasOwn(mensagensSenha, erro.codigo)) throw new ErroApi(400, mensagensSenha[erro.codigo], erro.codigo);
      if (erro.status === 409) throw new ErroApi(409, "Este e-mail já está em uso. Informe outro endereço.");
      throw erro;
    }
  };
  return {
    consultar: async (signal) => normalizarMinhaConta(await executar("/minha-conta", { signal })),
    atualizar: async (conta, formulario, signal) => {
      const erros = validarMinhaConta(formulario, conta);
      if (Object.keys(erros).length) throw new ErroApi(400, Object.values(erros)[0]);
      const atualizada = normalizarMinhaConta(await executar("/minha-conta", { method: "PUT", signal, body: {
        nome: formulario.name.trim(), email: emailNormalizado(formulario.email), telefone: formulario.phone.trim() || null,
        ...(mudouEmail(formulario, conta) ? { senhaAtual: formulario.current } : {}),
      } }));
      if (atualizada.id !== conta.id) throw new ErroApi(502, "A resposta não corresponde à sua conta. Recarregue os dados.");
      return atualizada;
    },
    alterarSenha: async (formulario, signal) => {
      const erros = validarNovaSenha(formulario);
      if (Object.keys(erros).length) throw new ErroApi(400, Object.values(erros)[0]);
      return executar("/minha-conta/senha", { method: "PUT", signal, body: { senhaAtual: formulario.current, novaSenha: formulario.next } });
    },
  };
}

import { ErroApi } from "../lib/api.js";

const contratoInvalido = () => new ErroApi(502, "Não foi possível carregar as funções disponíveis. Tente novamente.");

export function normalizarFuncaoSistema(funcao) {
  if (!Number.isInteger(funcao?.id) || funcao.id <= 0 || typeof funcao.nome !== "string" || !funcao.nome.trim()
    || (funcao.descricao != null && typeof funcao.descricao !== "string")) throw contratoInvalido();
  return { id: funcao.id, nome: funcao.nome, descricao: funcao.descricao ?? "" };
}

export function criarServicoFuncoesSistema(requisitar) {
  return {
    listar: async (signal) => {
      const dados = await requisitar("/funcoes-sistema", { signal });
      if (!Array.isArray(dados)) throw contratoInvalido();
      return dados.map(normalizarFuncaoSistema);
    },
  };
}

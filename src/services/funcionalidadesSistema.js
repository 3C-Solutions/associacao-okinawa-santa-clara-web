import { ErroApi } from "../lib/api.js";

const contratoInvalido = () => new ErroApi(502, "Não foi possível carregar as funcionalidades disponíveis. Tente novamente.");

export function normalizarFuncionalidadeSistema(item) {
  if (!Number.isInteger(item?.id) || item.id <= 0 || typeof item.nome !== "string" || !item.nome.trim()
    || typeof item.codigo !== "string" || !item.codigo.trim()
    || (item.descricao != null && typeof item.descricao !== "string")) throw contratoInvalido();
  return { id: item.id, nome: item.nome, descricao: item.descricao ?? "", codigo: item.codigo };
}

export function criarServicoFuncionalidadesSistema(requisitar) {
  return {
    listar: async (signal) => {
      const dados = await requisitar("/funcionalidades-sistema", { signal });
      if (!Array.isArray(dados)) throw contratoInvalido();
      return dados.map(normalizarFuncionalidadeSistema);
    },
  };
}

export const interpretarValor = (valorAuxiliar) => Math.round(Number(String(valorAuxiliar).replace(",", ".")) * 100) / 100;

// ---------- Tabela de pagamentos / reembolsos (diretoria verifica; os demais acompanham) ----------
export const comTipo = (pagamentos, reembolsos) => [
  ...pagamentos.map((parametro) => ({ ...parametro, type: "payment", title: parametro.kind === "mensalidade" ? "Mensalidade" : "Anuidade" })),
  ...reembolsos.map((resultado) => ({ ...resultado, type: "refund", title: "Reembolso" })),
].sort((elementoA, elementoB) => elementoB.createdAt.localeCompare(elementoA.createdAt));

export const limpar = ({ type: tipo, title: titulo, ...restante }) => restante; // remove campos só de exibição

export const estaAberto = (resultado) => resultado.status === "Em verificação" || resultado.status === "Em análise";

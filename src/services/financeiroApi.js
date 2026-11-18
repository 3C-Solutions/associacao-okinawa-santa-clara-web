const parametros = (dados) => new URLSearchParams(dados).toString();

function adaptarLancamento(lancamento) {
 return {
 id: lancamento.id,
 date: lancamento.data,
 description: lancamento.descricao,
 category: lancamento.categoria,
 type: lancamento.tipo === "ENTRADA" ? "in" : "out",
 amount: Number(lancamento.valor),
 status: /^(pago|confirmado)$/i.test(lancamento.status?.trim() || "")
 ? "Pago" : lancamento.status?.trim(),
 locked: lancamento.bloqueado,
 fkUsuario: lancamento.fkUsuario,
 fkFamilia: lancamento.fkFamilia,
 };
}
const parametrosExportacao = (dados) => {
 const query = new URLSearchParams();
 Object.entries(dados).forEach(([chave, valor]) => {
  if (valor !== undefined && valor !== null && valor !== "") query.set(chave, String(valor));
 });
 return query.toString();
};
export function criarServicoFinanceiro(requisitar) {
 const chamar = (caminho, opcoes = {}) => requisitar(`/financeiro${caminho}`, opcoes);
 return {
 familias: ({ signal } = {}) => requisitar("/familias", { signal }),
 async dashboard(ano, mes, { signal } = {}) {
 const resposta = await chamar(`/dashboard?${parametros({ ano, mes })}`, { signal });
 return {
 resumo: resposta.resumo,
 transactions: (resposta.lancamentos || []).map(adaptarLancamento),
 };
 },
 exportarXlsx: (dados) => chamar(`/dashboard/export.xlsx?${parametrosExportacao(dados)}`, { download: true }),
 despesas: () => chamar("/despesas"),
 criarDespesa: (dados) => chamar("/despesas", { method: "POST", body: dados }),
 editarDespesa: (id, dados) => chamar(`/despesas/${id}`, { method: "PUT", body: dados }),
 confirmarDespesa: (id) => chamar(`/despesas/${id}/confirmar`, { method: "PATCH" }),
 excluirDespesa: (id) => chamar(`/despesas/${id}`, { method: "DELETE" }),
 entradas: () => chamar("/entradas"),
 criarEntrada: (dados) => chamar("/entradas", { method: "POST", body: dados }),
 editarEntrada: (id, dados) => chamar(`/entradas/${id}`, { method: "PUT", body: dados }),
 confirmarEntrada: (id) => chamar(`/entradas/${id}/confirmar`, { method: "PATCH" }),
 excluirEntrada: (id) => chamar(`/entradas/${id}`, { method: "DELETE" }),
 pagamentos: () => chamar("/pagamentos"),
 criarPagamento: (dados) => chamar("/pagamentos", { method: "POST", body: dados }),
 confirmarPagamento: (id, dtPagamento) => chamar(`/pagamentos/${id}/confirmar`, {
 method: "PATCH", body: { dtPagamento },
 }),
 recusarPagamento: (id) => chamar(`/pagamentos/${id}/recusar`, { method: "PATCH" }),
 pagamentosDepartamento: () => chamar("/pagamentos-departamento"),
 criarPagamentoDepartamento: (dados) => chamar("/pagamentos-departamento", {
 method: "POST", body: dados,
 }),
 confirmarPagamentoDepartamento: (id, dtPagamento) => chamar(
 `/pagamentos-departamento/${id}/confirmar`,
 { method: "PATCH", body: { dtPagamento } },
 ),
 recusarPagamentoDepartamento: (id) => chamar(
 `/pagamentos-departamento/${id}/recusar`, { method: "PATCH" },
 ),
 taxaAnuidade: (fkFamilia, ano) => chamar(
 `/taxas/anuidade?${parametros({ fkFamilia, ano })}`,
 ),
 taxaMensalidade: (fkDepartamento, ano, mes) => chamar(
 `/taxas/mensalidade?${parametros({ fkDepartamento, ano, mes })}`,
 ),
 };
}

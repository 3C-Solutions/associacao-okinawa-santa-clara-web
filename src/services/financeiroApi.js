const parametros = (dados) => new URLSearchParams(dados).toString();
function adaptarLancamento(item) {
return {
id: item.id,
date: item.dt_lancamento,
description: item.descricao,
category: item.categoria,
type: item.tipo_lancamento === "ENTRADA" ? "in" : "out",
amount: Number(item.valor),
status: /^(pago|confirmado|recebido)$/i.test(item.status || "") ? "Pago" : item.status,
locked: item.bloqueado,
fk_usuario: item.fk_usuario,
fk_familia: item.fk_familia,
};
}
export function criarServicoFinanceiro(requisitar) {
const chamar = (caminho, opcoes = {}) => requisitar(`/financeiro${caminho}`, opcoes);
return {
async dashboard(ano, mes, { signal } = {}) {
const resposta = await chamar(`/dashboard?${parametros({ ano, mes })}`, { signal });
return { resumo: resposta.resumo, transactions: (resposta.lancamentos || []).map(adaptarLancamento) };
},
criarLancamento: (dados) => chamar("/lancamentos", { method: "POST", body: dados }),
editarLancamento: (id, dados) => chamar(`/lancamentos/${id}`, { method: "PUT", body: dados }),
confirmarLancamento: (id) => chamar(`/lancamentos/${id}/confirmar`, { method: "PATCH" }),
excluirLancamento: (id) => chamar(`/lancamentos/${id}`, { method: "DELETE" }),
cobrancas: () => chamar("/cobrancas"),
emitirCobranca: (dados) => chamar("/cobrancas", { method: "POST", body: dados }),
destinatarios: (busca = "", pagina = 0, tamanho = 20, { signal } = {}) =>
chamar(`/destinatarios?${parametros({ busca, pagina, tamanho })}`, { signal }),
pagamentosCobranca: () => chamar("/pagamentos-cobranca"),
confirmarPagamento: (id) => chamar(`/pagamentos-cobranca/${id}/confirmar`, { method: "PATCH" }),
recusarPagamento: (id) => chamar(`/pagamentos-cobranca/${id}/recusar`, { method: "PATCH" }),
minhasCobrancas: () => chamar("/minhas-cobrancas"),
informarPagamento: (id, forma_pagamento) => chamar(`/pagamentos-cobranca/${id}/informar`, {
method: "PATCH", body: { forma_pagamento },
}),
};
}

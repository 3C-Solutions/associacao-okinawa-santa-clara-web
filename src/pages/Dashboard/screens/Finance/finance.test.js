import test from "node:test";
import assert from "node:assert/strict";
import { criarServicoFinanceiro } from "../../../../services/financeiroApi.js";
test("dashboard mantém a rota autenticada e adapta os campos snake_case do DER financeiro vigente", async () => {
const controle = new AbortController();
const api = criarServicoFinanceiro(async (rota, opcoes) => {
assert.equal(rota, "/financeiro/dashboard?ano=2026&mes=11");
assert.equal(opcoes.signal, controle.signal);
return { resumo: { saldo_mensal: 25, entradas_anuais: 100 }, lancamentos: [
{ id: "PCO-9", dt_lancamento: "2026-11-10", tipo_lancamento: "ENTRADA", valor: 100,
descricao: "Mensalidade", categoria: "Mensalidades", status: "Pago", bloqueado: true },
]};
});
const resultado = await api.dashboard(2026, 11, { signal: controle.signal });
assert.equal(resultado.resumo.saldo_mensal, 25);
assert.equal(resultado.transactions[0].type, "in");
assert.equal(resultado.transactions[0].locked, true);
assert.equal(resultado.transactions[0].amount, 100);
assert.equal(resultado.transactions[0].status, "Pago");
});
test("cobranças usam apenas Cobranca e pagamentoCobranca do DER financeiro vigente", async () => {
const chamadas = [];
const api = criarServicoFinanceiro(async (rota, opts = {}) => {
chamadas.push([rota, opts.method || "GET", opts.body]);return [];
});
const req = { nome_da_cobranca: "Mensalidade", periodo: "Mensal", valor: 25,
vencimento: "2026-11-30", forma_selecao: "grupos", grupos_destinatarios: ["departamentos"] };
await api.emitirCobranca(req);
await api.cobrancas();await api.pagamentosCobranca();await api.minhasCobrancas();
await api.informarPagamento(7, "Pix");await api.confirmarPagamento(7);await api.recusarPagamento(8);
assert.deepEqual(chamadas.map(([rota, metodo]) => [rota, metodo]), [
["/financeiro/cobrancas", "POST"], ["/financeiro/cobrancas", "GET"],
["/financeiro/pagamentos-cobranca", "GET"], ["/financeiro/minhas-cobrancas", "GET"],
["/financeiro/pagamentos-cobranca/7/informar", "PATCH"],
["/financeiro/pagamentos-cobranca/7/confirmar", "PATCH"],
["/financeiro/pagamentos-cobranca/8/recusar", "PATCH"],
]);
assert.equal(chamadas[4][2].forma_pagamento, "Pix");
assert.equal(chamadas[0][2], req);
});
test("lançamentos usam apenas Lancamento do DER financeiro vigente e não pedem fk_usuario", async () => {
const chamadas=[];
const api=criarServicoFinanceiro(async (rota, opts={}) => { chamadas.push([rota,opts]);return null; });
const dados={ descricao: "Doação", dt_lancamento:"2026-11-13", tipo_lancamento:"ENTRADA",
categoria:"Doações", valor:100, status:"Pago", fk_familia:null };
await api.criarLancamento(dados);
await api.editarLancamento(6,dados);
await api.confirmarLancamento(6);
await api.excluirLancamento(6);
assert.deepEqual(chamadas.map(([rota,opts])=>[rota,opts.method]),[
["/financeiro/lancamentos","POST"],
["/financeiro/lancamentos/6","PUT"],
["/financeiro/lancamentos/6/confirmar","PATCH"],
["/financeiro/lancamentos/6","DELETE"],
]);
assert.ok(!("fk_usuario" in dados));
});
test("busca de usuários usa paginação", async () => {
const api=criarServicoFinanceiro(async (rota) => {
assert.equal(rota,"/financeiro/destinatarios?busca=ana&pagina=2&tamanho=20");
return { usuarios: [], total: 0, pagina: 2, paginas: 0 };
});
assert.equal((await api.destinatarios("ana",2)).pagina,2);
});

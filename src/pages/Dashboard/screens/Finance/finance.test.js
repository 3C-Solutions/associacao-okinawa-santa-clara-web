import test from 'node:test';
import assert from 'node:assert/strict';
import { validarDespesa } from './financeValidation.js';
import { criarServicoFinanceiro } from '../../../../services/financeiroApi.js';
import { atualizarReembolsos, lerReembolsos, reembolsosVisiveis, usuarioEhFinanceiro } from '../../../../lib/refunds.js';
import { validarReembolso } from './requests/refundHelpers.js';

const despesa = { descricao: 'Materiais', categoria: 'Outros', valor: '12.50', dtDepesa: '2026-11-03', status: 'Pendente', fkFamilia: '' };
test('consulta famílias no endpoint do develop e encaminha cancelamento', async () => {
  const controle = new AbortController();
  const familias = [{ id: 5, nome: 'Okinawa', endereco: null }];
  const api = criarServicoFinanceiro(async (path, options) => {
    assert.equal(path, '/familias');
    assert.equal(options.signal, controle.signal);
    return familias;
  });
  assert.deepEqual(await api.familias({ signal: controle.signal }), familias);
});
test('solicita a exportação CSV ao backend com filtros e resposta de arquivo', async () => {
  const chamadas = [];
  const api = criarServicoFinanceiro(async (path, options) => { chamadas.push([path, options]); });
  await api.exportarCsv({ ano: 2026, mes: 11, dataInicio: '2026-11-01', tipo: 'SAIDA', status: 'Pago', busca: 'água e luz' });
  assert.equal(chamadas[0][0], '/financeiro/dashboard/export.csv?ano=2026&mes=11&dataInicio=2026-11-01&tipo=SAIDA&status=Pago&busca=%C3%A1gua+e+luz');
  assert.equal(chamadas[0][1].download, true);
});
test('aceita centavos e família opcional', () => {
  assert.deepEqual(validarDespesa(despesa), {});
  assert.deepEqual(validarDespesa({ ...despesa, valor: '0,01', fkFamilia: '5' }), {});
});
test('solicitação de reembolso valida motivo, valor positivo e comprovante', () => {
  const valida = { reason: 'Compra de materiais', amount: '12,50', receipt: { name: 'nota.pdf' } };
  assert.deepEqual(validarReembolso(valida), { erros: {}, valor: 12.5 });
  assert.ok(validarReembolso({ ...valida, amount: '0' }).erros.amount);
  assert.ok(validarReembolso({ ...valida, amount: 'invalido' }).erros.amount);
  assert.ok(validarReembolso({ ...valida, amount: '12.501' }).erros.amount);
  assert.ok(validarReembolso({ ...valida, reason: 'abc' }).erros.reason);
  assert.ok(validarReembolso({ ...valida, receipt: null }).erros.receipt);
});
test('reembolsos locais ficam acessíveis ao Financeiro e isolados para o solicitante', () => {
  const itens = [{ id: 'r1', ownerId: 7 }, { id: 'r2', ownerId: 8 }];
  assert.deepEqual(reembolsosVisiveis(itens, 7, false), [itens[0]]);
  assert.deepEqual(reembolsosVisiveis(itens, 8, true), itens);
  assert.equal(usuarioEhFinanceiro('Financeiro'), true);
  assert.equal(usuarioEhFinanceiro('Diretoria'), false);
});
test('atualiza solicitações locais e informa dados salvos inválidos', () => {
  const valores = new Map();
  const storage = {
    getItem: (chave) => valores.get(chave) ?? null,
    setItem: (chave, valor) => valores.set(chave, valor),
  };
  assert.deepEqual(lerReembolsos(storage), []);
  atualizarReembolsos((itens) => [...itens, { id: 'r1', status: 'Pendente' }], storage);
  assert.deepEqual(lerReembolsos(storage), [{ id: 'r1', status: 'Pendente' }]);
  valores.set('okinawa-sc-reembolsos-v1', '{');
  assert.throws(() => lerReembolsos(storage), /dados salvos estão inválidos/);
});
test('rejeita valores vazios, negativos, não finitos e casas extras', () => {
  for (const valor of ['', 'abc', 'NaN', 'Infinity', '-1', '0', '1.001', '1000000000000']) assert.ok(validarDespesa({ ...despesa, valor }).valor, valor);
});
test('rejeita datas impossíveis, descrição vazia, status e vínculo inválidos', () => {
  assert.ok(validarDespesa({ ...despesa, dtDepesa: '2026-02-30' }).dtDepesa);
  assert.ok(validarDespesa({ ...despesa, descricao: '   ' }).descricao);
  assert.ok(validarDespesa({ ...despesa, status: 'Qualquer' }).status);
  for (const fkFamilia of ['0', '-1', '1.5', '2147483648']) assert.ok(validarDespesa({ ...despesa, fkFamilia }).fkFamilia);
});
test('entrada aceita recebido ou pendente, valor positivo e família opcional', () => {
  assert.deepEqual(validarDespesa({ ...despesa, status: 'Recebido' }, true), {});
  assert.deepEqual(validarDespesa(despesa, true), {});
  assert.ok(validarDespesa({ ...despesa, status: 'Pago' }, true).status);
  assert.ok(validarDespesa({ ...despesa, valor: '-12' }, true).valor);
});
test('operações de entrada usam a rota própria sem alterar despesas', async () => {
  const chamadas = [];
  const api = criarServicoFinanceiro(async (path, options) => { chamadas.push([path, options]); });
  const dados = { data: '2026-11-04', valor: 10, status: 'Recebido', fkFamilia: null };
  await api.criarEntrada(dados);
  await api.editarEntrada(7, dados);
  await api.confirmarEntrada(7);
  await api.excluirEntrada(7);
  assert.deepEqual(chamadas.map(([path, options]) => [path, options.method]), [
    ['/financeiro/entradas', 'POST'], ['/financeiro/entradas/7', 'PUT'],
    ['/financeiro/entradas/7/confirmar', 'PATCH'], ['/financeiro/entradas/7', 'DELETE'],
  ]);
  assert.equal(chamadas[0][1].body, dados);
});
test('adapta valores, status confirmado e encaminha cancelamento', async () => {
  const controller = new AbortController();
  const api = criarServicoFinanceiro(async (path, options) => {
    assert.equal(path, '/financeiro/dashboard?ano=2026&mes=11');
    assert.equal(options.signal, controller.signal);
    return { resumo: { saldoMensal: 12.5 }, lancamentos: [{ id: 'PAG-1', data: '2026-11-03', descricao: 'Anuidade', categoria: 'Anuidades', valor: '12.50', tipo: 'ENTRADA', status: ' Confirmado ', bloqueado: true }] };
  });
  const resultado = await api.dashboard(2026, 11, { signal: controller.signal });
  assert.equal(resultado.transactions[0].amount, 12.5);
  assert.equal(resultado.transactions[0].status, 'Pago');
  assert.equal(resultado.transactions[0].type, 'in');
  assert.equal(resultado.transactions[0].locked, true);
});

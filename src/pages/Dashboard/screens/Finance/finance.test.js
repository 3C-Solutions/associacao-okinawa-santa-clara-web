import test from 'node:test';
import assert from 'node:assert/strict';
import { validarDespesa } from './financeValidation.js';
import { criarServicoFinanceiro } from '../../../../services/financeiroApi.js';

const despesa = { descricao: 'Materiais', categoria: 'Outros', valor: '12.50', dtDepesa: '2026-11-03', status: 'Pendente', fkFamilia: '' };
test('aceita centavos e família opcional', () => {
  assert.deepEqual(validarDespesa(despesa), {});
  assert.deepEqual(validarDespesa({ ...despesa, valor: '0,01', fkFamilia: '5' }), {});
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

import test from "node:test";
import assert from "node:assert/strict";
import { ESPACOS_EVENTO, criarServicoEventos } from "./eventosApi.js";

test("lista os cinco espaços de aluguel", () => {
  assert.deepEqual(ESPACOS_EVENTO.map((espaco) => espaco.label),
    ["Cozinha", "Espaço externo", "Palco", "Salão", "Espaço completo"]);
});

test("consulta o calendário pelo endpoint protegido", async () => {
  const chamadas = [];
  const api = criarServicoEventos(async (caminho, opcoes) => { chamadas.push([caminho, opcoes]); return []; });
  await api.calendario("2026-12-01", "2026-12-31");
  assert.equal(chamadas[0][0], "/eventos/calendario?inicio=2026-12-01&fim=2026-12-31");
});

test("solicitação usa POST e corpo original", async () => {
  const chamadas = [];
  const api = criarServicoEventos(async (caminho, opcoes) => { chamadas.push([caminho, opcoes]); return {}; });
  const dados = { titulo: "Evento", codigoEspaco: "SALAO" };
  await api.solicitar(dados);
  assert.deepEqual(chamadas[0], ["/eventos/solicitacoes", { method: "POST", body: dados }]);
});

test("aprovação e recusa usam PATCH", async () => {
  const chamadas = [];
  const api = criarServicoEventos(async (caminho, opcoes) => { chamadas.push([caminho, opcoes]); return {}; });
  await api.aprovar(7);
  await api.recusar(7, "Sem disponibilidade");
  assert.equal(chamadas[0][0], "/eventos/7/aprovar");
  assert.equal(chamadas[1][0], "/eventos/7/recusar");
  assert.deepEqual(chamadas[1][1].body, { motivoRecusa: "Sem disponibilidade" });
});
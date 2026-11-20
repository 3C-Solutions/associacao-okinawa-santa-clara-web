import test from "node:test";
import assert from "node:assert/strict";
import { criarClienteApi } from "./api.js";

test("cliente da API retorna XLSX binário e os headers do download autenticado", async () => {
  const arquivo = new Blob(["xlsx"], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  let configRecebida;
  const requisitar = criarClienteApi({
    baseUrl: "/api",
    adapter: async (config) => {
      configRecebida = config;
      return {
        data: arquivo,
        status: 200,
        statusText: "OK",
        headers: { "content-disposition": "attachment; filename=usuarios.xlsx" },
        config,
      };
    },
  });

  const resposta = await requisitar("/usuarios/export.xlsx", { token: "jwt-teste", download: true });

  assert.equal(resposta.data, arquivo);
  assert.equal(resposta.contentDisposition, "attachment; filename=usuarios.xlsx");
  assert.equal(configRecebida.responseType, "blob");
  assert.equal(configRecebida.headers.get("Accept"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.equal(configRecebida.headers.get("Authorization"), "Bearer jwt-teste");
});

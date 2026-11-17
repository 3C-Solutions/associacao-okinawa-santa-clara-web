import test from "node:test";
import assert from "node:assert/strict";
import { criarClienteApi } from "./api.js";

test("cliente da API retorna o CSV binário e os headers do download autenticado", async () => {
  const arquivo = new Blob(["Nome;Email"], { type: "text/csv;charset=utf-8" });
  let configRecebida;
  const requisitar = criarClienteApi({
    baseUrl: "/api",
    adapter: async (config) => {
      configRecebida = config;
      return {
        data: arquivo,
        status: 200,
        statusText: "OK",
        headers: { "content-disposition": "attachment; filename=usuarios.csv" },
        config,
      };
    },
  });

  const resposta = await requisitar("/usuarios/export.csv", { token: "jwt-teste", download: true });

  assert.equal(resposta.data, arquivo);
  assert.equal(resposta.contentDisposition, "attachment; filename=usuarios.csv");
  assert.equal(configRecebida.responseType, "blob");
  assert.equal(configRecebida.headers.get("Accept"), "text/csv");
  assert.equal(configRecebida.headers.get("Authorization"), "Bearer jwt-teste");
});

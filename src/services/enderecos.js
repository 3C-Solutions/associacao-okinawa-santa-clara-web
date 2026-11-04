import { ErroApi } from "@/lib/api.js";

function normalizarEndereco(dados) {
  if (!Number.isInteger(dados?.id) || dados.id <= 0 || typeof dados.rua !== "string") {
    throw new ErroApi(502, "O servidor retornou um endereço inválido. Tente novamente.");
  }
  return { id: dados.id };
}

export function montarEnderecoRequest(familia) {
  return {
    rua: familia.address.trim(),
    bairro: familia.district || null,
    cidade: familia.city || null,
    numero: familia.number || null,
    uf: familia.uf || null,
    cep: familia.cep || null,
    complemento: familia.complement || null,
  };
}

export function criarServicoEnderecos(requisitar) {
  return {
    cadastrar: async (familia, signal) => {
      const resposta = await requisitar("/enderecos", {
        method: "POST",
        body: montarEnderecoRequest(familia),
        signal,
      });
      return normalizarEndereco(resposta);
    },
  };
}

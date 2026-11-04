import { ErroApi } from "@/lib/api.js";
import { criarServicoEnderecos } from "./enderecos.js";

function normalizarFamilia(dados, enderecoId) {
  if (!Number.isInteger(dados?.id) || dados.id <= 0 || typeof dados.nome !== "string"
    || !Number.isInteger(dados.endereco?.id) || dados.endereco.id !== enderecoId
    || typeof dados.endereco.rua !== "string") {
    throw new ErroApi(502, "O servidor retornou uma família inválida. Tente novamente.");
  }
  return { id: dados.id, addressId: enderecoId, apiManaged: true };
}

export function criarServicoFamilias(requisitar) {
  const servicoEnderecos = criarServicoEnderecos(requisitar);
  return {
    cadastrar: async (familia, signal) => {
      const endereco = await servicoEnderecos.cadastrar(familia, signal);
      let dados;
      try {
        dados = await requisitar("/familias", {
          method: "POST",
          body: { nome: familia.surname.trim(), fkEndereco: endereco.id },
          signal,
        });
      } catch (falha) {
        if (falha.name === "AbortError") throw falha;
        throw new ErroApi(
          falha.status,
          `O endereço foi salvo (ID ${endereco.id}), mas a família não foi cadastrada. Verifique o erro antes de tentar novamente para evitar endereços sem vínculo. ${falha.message}`,
        );
      }
      return normalizarFamilia(dados, endereco.id);
    },
  };
}

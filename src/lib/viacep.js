export async function consultarCep(cep, { signal } = {}) {
  const digitos = cep.replace(/\D/g, "");
  if (digitos.length !== 8) throw new Error("CEP inválido.");

  const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`, { signal });
  if (!resposta.ok) throw new Error("Falha na consulta ao ViaCEP.");

  const endereco = await resposta.json();
  if (endereco.erro) throw new Error("CEP não encontrado.");

  return {
    address: endereco.logradouro || "",
    district: endereco.bairro || "",
    city: endereco.localidade || "",
    uf: endereco.uf || "",
  };
}

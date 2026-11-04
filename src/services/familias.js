import { ErroApi } from "../lib/api.js";

const idValido = (id) => Number.isInteger(id) && id > 0;
const contratoInvalido = () => new ErroApi(502, "Não foi possível carregar os dados da família. Tente novamente.");
const camposEndereco = { address: "rua", number: "numero", complement: "complemento", district: "bairro", city: "cidade", uf: "uf", cep: "cep" };

export function normalizarFamilia(dados) {
  if (!idValido(dados?.id) || typeof dados.nome !== "string" || !dados.nome.trim()) throw contratoInvalido();
  const endereco = dados.endereco;
  if (endereco != null && (!idValido(endereco.id) || Object.values(camposEndereco).some((campo) => endereco[campo] != null && typeof endereco[campo] !== "string"))) throw contratoInvalido();
  return {
    id: dados.id, surname: dados.nome,
    ...Object.fromEntries(Object.entries(camposEndereco).map(([campo, chave]) => [campo, endereco?.[chave] ?? ""])),
  };
}

export function validarCadastroFamilia(formulario) {
  const erros = {};
  if ((formulario.surname || "").trim().length < 2) erros.surname = "Informe o sobrenome da família com pelo menos 2 caracteres.";
  if (!(formulario.address || "").trim()) erros.address = "Informe o endereço.";
  for (const campo of ["surname", "address", "number", "complement", "district", "city"]) {
    if ((formulario[campo] || "").trim().length > 255) erros[campo] = "Use no máximo 255 caracteres.";
  }
  if (formulario.uf && !/^[A-Za-z]{2}$/.test(formulario.uf)) erros.uf = "Use a sigla com 2 letras.";
  if (formulario.cep && !/^\d{5}-?\d{3}$/.test(formulario.cep)) erros.cep = "O CEP deve ter 8 dígitos.";
  return erros;
}

export function montarCadastroFamilia(formulario) {
  const erros = validarCadastroFamilia(formulario);
  if (Object.keys(erros).length) throw new ErroApi(400, Object.values(erros)[0]);
  return {
    nome: formulario.surname.trim(),
    endereco: Object.fromEntries(Object.entries(camposEndereco).map(([campo, chave]) => {
      const valor = (formulario[campo] || "").trim();
      return [chave, valor ? (campo === "uf" ? valor.toUpperCase() : valor) : null];
    })),
  };
}

export function criarServicoFamilias(requisitar) {
  return {
    listar: async (signal) => {
      const dados = await requisitar("/familias", { signal });
      if (!Array.isArray(dados)) throw contratoInvalido();
      return dados.map(normalizarFamilia);
    },
    buscar: async (id, signal) => {
      if (!idValido(id)) throw contratoInvalido();
      const familia = normalizarFamilia(await requisitar(`/familias/${id}`, { signal }));
      if (familia.id !== id) throw contratoInvalido();
      return familia;
    },
    cadastrar: async (formulario, signal) => normalizarFamilia(await requisitar("/familias/com-endereco", {
      method: "POST", body: montarCadastroFamilia(formulario), signal,
    })),
  };
}

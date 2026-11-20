
import { criarClienteApi, ErroApi } from "../lib/api.js";
import { urlImagem } from "./departamentos.js";

const requisitar = criarClienteApi();

const contratoInvalido = () =>
  new ErroApi(
    502,
    "Não foi possível carregar os departamentos. Tente novamente."
  );

export function normalizarDepartamentoPublico(dados) {
  if (
    !Number.isInteger(dados?.id) ||
    typeof dados.nome !== "string"
  ) {
    throw contratoInvalido();
  }

  return {
    id: dados.id,
    name: dados.nome,
    description: dados.descricao ?? "",
    day: dados.diaSemana ?? "",
    time: (dados.horario || "").slice(0, 5),
    teacher: dados.professor ?? "",
    school: dados.escola ?? "",
    image: urlImagem(dados.imagem?.url),
  };
}

export const servicoDepartamentosPublicos = {
  listar: async (signal) => {
    const dados = await requisitar(
      "/publico/departamentos",
      { signal }
    );

    if (!Array.isArray(dados)) {
      throw contratoInvalido();
    }

    return dados.map(normalizarDepartamentoPublico);
  },
};

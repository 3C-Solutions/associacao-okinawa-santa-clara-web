
import { ErroApi } from "../lib/api.js";

const idValido = (id) =>
  Number.isInteger(id) && id > 0;

const contratoInvalido = () =>
  new ErroApi(
    502,
    "Não foi possível carregar os dados do departamento. Tente novamente."
  );

const BASE = (
  import.meta.env?.VITE_API_URL || "/api"
).replace(/\/+$/, "");

export const urlImagem = (caminho) =>
  caminho ? `${BASE}${caminho}` : "";

export function normalizarDepartamento(dados) {
  if (!idValido(dados?.id) || typeof dados.nome !== "string") {
    throw contratoInvalido();
  }

  return {
    id: dados.id,
    name: dados.nome,
    description: dados.descricao ?? "",
    day: dados.diaSemana,
    time: (dados.horario || "").slice(0, 5),
    teacher: dados.professor ?? "",
    school: dados.escola ?? "",
    fee: Number(dados.valorMensal ?? 0),
    capacity: dados.quantidadeVagas,
    active: dados.ativo,
    responsavelId: dados.fkResponsavelDepartamento,
    familiaId: dados.fkFamilia,
    image: urlImagem(dados.imagem?.url),
  };
}

export function montarCorpo(formulario) {
  const dados = {
    nome: formulario.name.trim(),
    descricao: formulario.description.trim(),
    diaSemana: formulario.day,
    horario: formulario.time,
    professor: formulario.teacher.trim(),

    // NOVO CAMPO
    escola: (formulario.school || "").trim() || null,

    valorMensal: Number(formulario.fee),

    // IDs preenchidos pela seleção da pessoa
    fkResponsavelDepartamento: Number(formulario.responsavelId),
    fkFamilia: Number(formulario.familiaId),

    quantidadeVagas: Number(formulario.capacity),
    ativo: formulario.active,
  };

  const corpo = new FormData();

  corpo.append(
    "dados",
    new Blob(
      [JSON.stringify(dados)],
      { type: "application/json" }
    )
  );

  if (formulario.imageFile) {
    corpo.append("imagem", formulario.imageFile);
  }

  return corpo;
}

export function criarServicoDepartamentos(requisitar) {
  return {
    listar: async (signal) => {
      const dados = await requisitar(
        "/departamentos",
        { signal }
      );

      if (!Array.isArray(dados)) {
        throw contratoInvalido();
      }

      return dados.map(normalizarDepartamento);
    },

    cadastrar: async (formulario, signal) =>
      normalizarDepartamento(
        await requisitar("/departamentos", {
          method: "POST",
          body: montarCorpo(formulario),
          signal
        })
      ),

    editar: async (id, formulario, signal) =>
      normalizarDepartamento(
        await requisitar(`/departamentos/${id}`, {
          method: "PUT",
          body: montarCorpo(formulario),
          signal
        })
      ),

    excluir: (id, signal) =>
      requisitar(`/departamentos/${id}`, {
        method: "DELETE",
        signal
      }),
  };
}

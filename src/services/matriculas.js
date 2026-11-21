export function normalizarMatricula(dados) {
  return {
    id: dados.id,
    userId: dados.fkUsuario,
    familyId: dados.fkFamilia,
    departmentId: dados.fkDepartamento,
    startDate: dados.dataInicioMatricula,
    active: dados.ativo
  };
}

export function criarServicoMatriculas(requisitar) {
  return {
    listar: async (signal) => {
      const dados = await requisitar("/matriculas", { signal });

      if (!Array.isArray(dados)) {
        throw new Error("Resposta inválida ao carregar matrículas.");
      }

      return dados.map(normalizarMatricula);
    },

    cadastrar: async (matricula, signal) => {
      const dados = await requisitar("/matriculas", {
        method: "POST",
        body: {
          fkUsuario: Number(matricula.userId),
          fkFamilia: Number(matricula.familyId),
          fkDepartamento: Number(matricula.departmentId),
          dataInicioMatricula: matricula.startDate,
          ativo: true
        },
        signal
      });

      return normalizarMatricula(dados);
    },

    excluir: async (id, signal) => {
      await requisitar(`/matriculas/${id}`, {
        method: "DELETE",
        signal
      });
    }
  };
}
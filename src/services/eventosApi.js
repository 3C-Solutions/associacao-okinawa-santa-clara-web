
export const ESPACOS_EVENTO = [
  { value: "COZINHA", label: "Cozinha" },
  { value: "ESPACO_EXTERNO", label: "Espaço externo" },
  { value: "PALCO", label: "Palco" },
  { value: "SALAO", label: "Salão" },
  { value: "ESPACO_COMPLETO", label: "Espaço completo" },
];

const parametrosPeriodo = (inicio, fim) =>
  new URLSearchParams({ inicio, fim }).toString();

export function criarServicoEventos(requisitar) {
  const chamar = (caminho, opcoes = {}) =>
    requisitar(`/eventos${caminho}`, opcoes);

  return {
    reservantes: ({ signal } = {}) =>
      chamar("/reservantes", { signal }),

    calendario: (inicio, fim, { signal } = {}) =>
      chamar(`/calendario?${parametrosPeriodo(inicio, fim)}`, { signal }),

    listar: (inicio, fim, { signal } = {}) =>
      chamar(`?${parametrosPeriodo(inicio, fim)}`, { signal }),

    buscar: (id) => chamar(`/${id}`),

    criar: (dados) =>
      chamar("", { method: "POST", body: dados }),

    editar: (id, dados) =>
      chamar(`/${id}`, { method: "PUT", body: dados }),

    cancelar: (id) =>
      chamar(`/${id}/cancelar`, { method: "PATCH" }),

    solicitar: (dados) =>
      chamar("/solicitacoes", { method: "POST", body: dados }),

    solicitacoes: ({ signal } = {}) =>
      chamar("/solicitacoes", { signal }),

    minhasSolicitacoes: ({ signal } = {}) =>
      chamar("/minhas-solicitacoes", { signal }),

    minhaSolicitacao: (id) =>
      chamar(`/minhas-solicitacoes/${id}`),

    aprovar: (id) =>
      chamar(`/${id}/aprovar`, { method: "PATCH" }),

    recusar: (id, motivoRecusa) =>
      chamar(`/${id}/recusar`, {
        method: "PATCH",
        body: { motivoRecusa },
      }),

    cancelarSolicitacao: (id) =>
      chamar(`/${id}/cancelar-solicitacao`, { method: "PATCH" }),

    sincronizar: (id) =>
      chamar(`/${id}/sincronizar`, { method: "PATCH" }),
  };
}

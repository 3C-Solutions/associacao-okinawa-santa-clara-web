export function criarServicoReembolsos(requisitar) {
  const base = "/reembolsos";
  return {
    listar: ({ signal } = {}) => requisitar(base, { signal }),
    meus: ({ signal } = {}) => requisitar(`${base}/meus`, { signal }),
    criar: (dados) => requisitar(base, { method: "POST", body: dados }),
    aprovar: (id) => requisitar(`${base}/${id}/aprovar`, { method: "PATCH" }),
    recusar: (id, motivo) => requisitar(`${base}/${id}/recusar`, {
      method: "PATCH",
      body: { motivo },
    }),
  };
}

export const parseAmount = (v) => Math.round(Number(String(v).replace(",", ".")) * 100) / 100;

// ---------- Tabela de pagamentos / reembolsos (diretoria verifica; os demais acompanham) ----------
export const withType = (payments, refunds) => [
  ...payments.map((p) => ({ ...p, type: "payment", title: p.kind === "mensalidade" ? "Mensalidade" : "Anuidade" })),
  ...refunds.map((r) => ({ ...r, type: "refund", title: "Reembolso" })),
].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const clean = ({ type, title, ...rest }) => rest; // remove campos só de exibição

export const isOpen = (r) => r.status === "Em verificação" || r.status === "Em análise";

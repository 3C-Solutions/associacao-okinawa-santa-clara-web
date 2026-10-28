import { DEPT_FEE, DEPT_FEE_DUE_DAY, MEMBER_FEE, MEMBER_FEE_DUE, monthKey, todayISO } from "./data.js";

export const sum = (list) => list.reduce((total, t) => total + t.amount, 0);
export const balanceOf = (list) => list.filter((t) => t.status === "Pago").reduce((total, t) => total + (t.type === "in" ? t.amount : -t.amount), 0);

export function scopeTransactions(state, scope) {
  return state.transactions.filter((t) => t.scope === scope);
}

// Situação da mensalidade (departamento) ou anuidade (associado).
// Só vira "paga" quando a diretoria confirma o pagamento enviado.
export function feeStatus(state, role, scope) {
  const today = todayISO();
  const fees = scopeTransactions(state, scope).filter((t) => t.fee);
  const monthly = role === "department";
  const sameRef = (t) => (monthly ? monthKey(t.date) === monthKey(today) : t.date.slice(0, 4) === today.slice(0, 4));
  const tx = fees.find((t) => t.status === "Pago" && sameRef(t));
  const pendingPayment = (state.payments || []).find((p) => p.scope === scope && p.status === "Em verificação");
  const rejected = !tx && !pendingPayment ? (state.payments || []).filter((p) => p.scope === scope && p.status === "Recusado" && p.period === (monthly ? monthKey(today) : today.slice(0, 4))).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] : null;
  const dueDate = monthly ? `${monthKey(today)}-${String(DEPT_FEE_DUE_DAY).padStart(2, "0")}` : `${today.slice(0, 4)}-${MEMBER_FEE_DUE}`;
  return {
    paid: !!tx,
    tx,
    pendingPayment,
    rejected,
    overdue: !tx && !pendingPayment && today > dueDate,
    dueDate,
    amount: monthly ? DEPT_FEE : MEMBER_FEE,
    period: monthly ? "mensal" : "anual",
    periodKey: monthly ? monthKey(today) : today.slice(0, 4),
    label: monthly ? "Mensalidade para associação" : "Anuidade para associação",
  };
}

export function upcomingEvents(state, limit = 4) {
  const today = todayISO();
  return state.events
    .filter((e) => e.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, limit);
}

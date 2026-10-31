import { TAXA_DEPARTAMENTO, DIA_VENCIMENTO_TAXA_DEPARTAMENTO, TAXA_ASSOCIADO, DIA_VENCIMENTO_TAXA_ASSOCIADO, chaveMes, hojeISO } from "./data.js";

export const somar = (lista) => lista.reduce((total, tempo) => total + tempo.amount, 0);
export const saldoDe = (lista) => lista.filter((tempo) => tempo.status === "Pago").reduce((total, tempo) => total + (tempo.type === "in" ? tempo.amount : -tempo.amount), 0);

export function transacoesDoEscopo(dadosAplicacao, escopo) {
  return dadosAplicacao.transactions.filter((tempo) => tempo.scope === escopo);
}

// Situação da mensalidade (departamento) ou anuidade (associado).
// Só vira "paga" quando a diretoria confirma o pagamento enviado.
export function estadoTaxa(dadosAplicacao, papel, escopo) {
  const hoje = hojeISO();
  const taxas = transacoesDoEscopo(dadosAplicacao, escopo).filter((tempo) => tempo.fee);
  const mensal = papel === "department";
  const mesmaReferencia = (tempo) => (mensal ? chaveMes(tempo.date) === chaveMes(hoje) : tempo.date.slice(0, 4) === hoje.slice(0, 4));
  const transacao = taxas.find((tempo) => tempo.status === "Pago" && mesmaReferencia(tempo));
  const pagamentoPendente = (dadosAplicacao.payments || []).find((parametro) => parametro.scope === escopo && parametro.status === "Em verificação");
  const rejeitado = !transacao && !pagamentoPendente ? (dadosAplicacao.payments || []).filter((parametro) => parametro.scope === escopo && parametro.status === "Recusado" && parametro.period === (mensal ? chaveMes(hoje) : hoje.slice(0, 4))).sort((elementoA, elementoB) => elementoB.createdAt.localeCompare(elementoA.createdAt))[0] : null;
  const dataVencimento = mensal ? `${chaveMes(hoje)}-${String(DIA_VENCIMENTO_TAXA_DEPARTAMENTO).padStart(2, "0")}` : `${hoje.slice(0, 4)}-${DIA_VENCIMENTO_TAXA_ASSOCIADO}`;
  return {
    paid: !!transacao,
    tx: transacao,
    pendingPayment: pagamentoPendente,
    rejected: rejeitado,
    overdue: !transacao && !pagamentoPendente && hoje > dataVencimento,
    dueDate: dataVencimento,
    amount: mensal ? TAXA_DEPARTAMENTO : TAXA_ASSOCIADO,
    period: mensal ? "mensal" : "anual",
    periodKey: mensal ? chaveMes(hoje) : hoje.slice(0, 4),
    label: mensal ? "Mensalidade para associação" : "Anuidade para associação",
  };
}

export function proximosEventos(dadosAplicacao, limite = 4) {
  const hoje = hojeISO();
  return dadosAplicacao.events
    .filter((evento) => evento.date >= hoje)
    .sort((elementoA, elementoB) => (elementoA.date + elementoA.time).localeCompare(elementoB.date + elementoB.time))
    .slice(0, limite);
}

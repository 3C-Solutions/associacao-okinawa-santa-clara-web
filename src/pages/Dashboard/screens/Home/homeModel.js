import { chaveMes, formatarData, formatarMoeda, hojeISO } from "../../../../lib/data.js";
import { saldoDe } from "../../../../lib/finance.js";

// Escolhe somente a apresentação. A autorização continua nas permissões da sessão.
export function usaVisaoGeral(nomeFuncao) {
  const nome = typeof nomeFuncao === "string" ? nomeFuncao.trim().replace(/\s+/g, " ").toLowerCase() : "";
  return nome === "diretoria" || nome === "teste local swagger" || nome === "teste swagger";
}

const lista = (valor) => Array.isArray(valor) ? valor : [];

// Todos os blocos usam somente exemplos; as permissões controlam os atalhos na tela.
export function criarModeloHome(dados = {}, hoje = hojeISO()) {
  const reservas = lista(dados.reservations).filter((item) => item.status === "Pendente");
  const transacoes = lista(dados.transactions).filter((item) => item.scope === "assoc");
  const departamentos = lista(dados.departments);
  const eventosAgenda = lista(dados.events);
  const noticias = lista(dados.news);
  const tarefas = [];

  reservas.forEach((item) => tarefas.push({
    key: `reserva:${item.id}`, title: `Aprovar reserva: ${item.title}`,
    sub: `${item.ownerName} · ${formatarData(item.date)}`, status: "Pendente", tone: "warning", destino: "agenda",
  }));

  // As pendências financeiras são exemplos informativos: não abrem registros reais.
  transacoes.filter((item) => item.status === "Pendente").forEach((item) => tarefas.push({
    key: `transacao:${item.id}`, title: `Lançamento pendente: ${item.description}`,
    sub: `Exemplo financeiro · ${formatarMoeda(item.amount)}`, status: "Exemplo", tone: "info",
  }));
  lista(dados.payments).filter((item) => item.status === "Em verificação").forEach((item) => tarefas.push({
    key: `pagamento:${item.id}`, title: `Verificar ${item.kind}: ${item.ownerName}`,
    sub: `Exemplo financeiro · ${formatarMoeda(item.amount)}`, status: "Exemplo", tone: "info",
  }));
  lista(dados.refunds).filter((item) => item.status === "Em análise").forEach((item) => tarefas.push({
    key: `reembolso:${item.id}`, title: `Analisar reembolso: ${item.ownerName}`,
    sub: `Exemplo financeiro · ${formatarMoeda(item.amount)}`, status: "Exemplo", tone: "info",
  }));
  noticias.filter((item) => item.status === "Rascunho").forEach((item) => tarefas.push({
    key: `noticia:${item.id}`, title: `Publicar: ${item.title}`,
    sub: "Notícias · rascunho", status: "Rascunho", tone: "info", destino: "news",
  }));

  return {
    saldoMensal: saldoDe(transacoes.filter((item) => chaveMes(item.date) === chaveMes(hoje))),
    reservasPendentes: reservas.length,
    familias: lista(dados.families).length,
    pessoas: lista(dados.associates).reduce((total, item) => total + 1 + lista(item.dependents).length, 0),
    departamentosAtivos: departamentos.filter((item) => item.active).length,
    departamentosTotal: departamentos.length,
    tarefas: tarefas.slice(0, 5),
    noticias: noticias.filter((item) => item.status === "Publicado")
      .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2),
    eventos: eventosAgenda.filter((item) => item.date >= hoje)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 4),
    marcacoes: Object.fromEntries(eventosAgenda.map((item) => [item.date, "event"])),
  };
}

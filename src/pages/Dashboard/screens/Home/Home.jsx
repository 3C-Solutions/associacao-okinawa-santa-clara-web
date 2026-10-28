import { useState } from "react";
import { fmtDate, fmtDay, fmtMoney, fromISO, isFamilyRole, monthKey, todayISO } from "@/lib/data.js";
import { balanceOf, feeStatus, scopeTransactions, upcomingEvents } from "@/lib/finance.js";
import { useStore, useUser } from "@/store";
import { Badge, Button, Card } from "@/components/ui";
import Calendar from "@/pages/Dashboard/components/Calendar.jsx";
import Metric from "@/pages/Dashboard/components/Metric.jsx";
import SummaryList from "@/pages/Dashboard/components/SummaryList.jsx";
import ArticleModal from "@/pages/Dashboard/screens/News/ArticleModal.jsx";
import { newsFor } from "@/pages/Dashboard/screens/News/helpers.js";

export default function Home({ role, account, navigate }) {
  const { state } = useStore();
  const user = useUser(account);
  const today = todayISO();
  const [view, setView] = useState({ y: fromISO(today).getFullYear(), m: fromISO(today).getMonth() });
  const [article, setArticle] = useState(null);

  const events = upcomingEvents(state, 4);
  const eventRows = events.map((e) => ({ key: e.id, title: e.title, sub: `${fmtDay(e.date)} · ${e.time}`, onClick: () => navigate("agenda") }));
  const marks = {};
  state.events.forEach((e) => { marks[e.date] = "event"; });

  const mine = (r) => (role === "admin" ? true : r.ownerId === user.ownerId);
  const pendingRes = state.reservations.filter((r) => r.status === "Pendente" && mine(r));
  const scoped = scopeTransactions(state, user.scope);
  const pendingTx = scoped.filter((t) => t.status === "Pendente");
  const fee = role === "admin" ? null : feeStatus(state, role, user.scope);
  const news = newsFor(state, role, user).slice(0, 3);

  const tasks = [];
  if (role === "admin") {
    pendingRes.forEach((r) => tasks.push({ key: r.id, title: `Aprovar reserva: ${r.title}`, sub: `${r.ownerName} · ${fmtDate(r.date)}`, badge: <Badge tone="warning">Pendente</Badge>, onClick: () => navigate("agenda") }));
    pendingTx.forEach((t) => tasks.push({ key: t.id, title: `Pagamento pendente: ${t.description}`, sub: `Financeiro · ${fmtMoney(t.amount)}`, badge: <Badge tone="warning">Pendente</Badge>, onClick: () => navigate("finance") }));
    state.payments.filter((p) => p.status === "Em verificação").forEach((p) => tasks.push({ key: p.id, title: `Verificar ${p.kind}: ${p.ownerName}`, sub: `Financeiro · ${fmtMoney(p.amount)}`, badge: <Badge tone="warning">Em verificação</Badge>, onClick: () => navigate("finance") }));
    state.refunds.filter((r) => r.status === "Em análise").forEach((r) => tasks.push({ key: r.id, title: `Analisar reembolso: ${r.ownerName}`, sub: `Financeiro · ${fmtMoney(r.amount)}`, badge: <Badge tone="warning">Em análise</Badge>, onClick: () => navigate("finance") }));
    state.news.filter((n) => n.status === "Rascunho").forEach((n) => tasks.push({ key: n.id, title: `Publicar: ${n.title}`, sub: "Notícias · rascunho", badge: <Badge tone="info">Rascunho</Badge>, onClick: () => navigate("news") }));
  } else {
    pendingRes.forEach((r) => tasks.push({ key: r.id, title: `Reserva aguardando análise: ${r.title}`, sub: fmtDate(r.date), badge: <Badge tone="warning">Pendente</Badge>, onClick: () => navigate("agenda") }));
    if (fee && !fee.paid && !fee.pendingPayment) tasks.push({ key: "fee", title: `${fee.label} em aberto`, sub: `${fmtMoney(fee.amount)} · vence em ${fmtDate(fee.dueDate)}`, badge: <Badge tone={fee.overdue ? "danger" : "warning"}>{fee.overdue ? "Vencida" : "Pendente"}</Badge>, onClick: () => navigate("finance") });
    if (fee?.pendingPayment) tasks.push({ key: "fee-ver", title: `${fee.label}: comprovante em verificação`, sub: `${fmtMoney(fee.pendingPayment.amount)} · aguardando a Diretoria`, badge: <Badge tone="warning">Em verificação</Badge>, onClick: () => navigate("finance") });
    if (role === "department" && user.department) {
      const pend = state.enrollmentRequests.filter((r) => r.departmentId === user.department.id && r.status === "Pendente").length;
      if (pend) tasks.push({ key: "enr", title: `${pend} ${pend === 1 ? "solicitação de inscrição" : "solicitações de inscrição"}`, sub: "Associados · aprovar ou colocar em lista de espera", badge: <Badge tone="warning">Pendente</Badge>, onClick: () => navigate("associates") });
    }
    if (role === "department") pendingTx.forEach((t) => tasks.push({ key: t.id, title: `Pendente: ${t.description}`, sub: `Financeiro · ${fmtMoney(t.amount)}`, badge: <Badge tone="warning">Pendente</Badge>, onClick: () => navigate("finance") }));
  }

  const monthBalance = balanceOf(scopeTransactions(state, "assoc").filter((t) => monthKey(t.date) === monthKey(today)));
  const family = isFamilyRole(role) && user.associate ? 1 + user.associate.dependents.length : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="space-y-6 xl:col-span-7">
        {role === "admin" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Metric label="Saldo do mês" value={fmtMoney(monthBalance)} trend={monthBalance >= 0 ? "Entradas acima das saídas" : "Saídas acima das entradas"} tone={monthBalance >= 0 ? "success" : "danger"} onClick={() => navigate("finance")} />
            <Metric label="Reservas pendentes" value={String(pendingRes.length)} trend={pendingRes.length ? "Aguardando autorização" : "Nenhuma pendência"} tone={pendingRes.length ? "danger" : "success"} onClick={() => navigate("agenda")} />
            <Metric label="Famílias associadas" value={String(state.families.length)} onClick={() => navigate("families")} trend={`${state.associates.reduce((s, a) => s + 1 + a.dependents.length, 0)} pessoas no total`} tone="muted" />
            <Metric label="Departamentos ativos" value={String(state.departments.filter((d) => d.active).length)} onClick={() => navigate("departments")} trend={`${state.departments.length} cadastrados`} tone="muted" />
          </div>
        )}
        {role === "department" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Metric label="Saldo do departamento" value={fmtMoney(balanceOf(scoped))} onClick={() => navigate("finance")} trend={`${user.department?.name || ""}`} tone="muted" />
            <Metric label={fee.label} value={fee.paid ? "Pago" : fee.pendingPayment ? "Em verificação" : "Em aberto"} trend={fee.paid ? `Confirmado em ${fmtDate(fee.tx.date)}` : fee.pendingPayment ? "Aguardando a Diretoria" : `${fmtMoney(fee.amount)} neste mês`} tone={fee.paid ? "success" : fee.pendingPayment ? "muted" : "danger"} onClick={() => navigate("finance")} />
          </div>
        )}
        {isFamilyRole(role) && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Metric label={fee.label} value={fee.paid ? "Pago" : fee.pendingPayment ? "Em verificação" : "Em aberto"} trend={fee.paid ? `Confirmado em ${fmtDate(fee.tx.date)}` : fee.pendingPayment ? "Aguardando a Diretoria" : `${fmtMoney(fee.amount)} neste ano`} tone={fee.paid ? "success" : fee.pendingPayment ? "muted" : "danger"} onClick={() => navigate("finance")} />
            <Metric label="Minha família" value={`${family} ${family === 1 ? "pessoa" : "pessoas"}`} onClick={() => navigate("associates")} trend={role === "dependent" ? "Ver familiares" : "Gerenciar membros"} tone="muted" />
          </div>
        )}

        <SummaryList title="Tarefas e pendências" rows={tasks.slice(0, 5)} empty="Tudo em dia por aqui." />

        {news.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Notícias</h2><Button variant="ghost" className="min-h-9 px-3 text-sm" onClick={() => navigate("news")}>Ver todas</Button></div>
            <div className="space-y-4">
              {news.slice(0, 2).map((n) => (
                <Card key={n.id} className="grid overflow-hidden sm:grid-cols-[1fr_12rem]">
                  <div className="p-5">
                    <Badge tone="info">{n.category}</Badge>
                    <h3 className="mt-3 text-lg font-bold">{n.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{n.body}</p>
                    <button type="button" onClick={() => setArticle(n)} className="mt-4 font-semibold text-brand hover:underline">Ler notícia</button>
                  </div>
                  <img src={n.image} alt="" className="h-full min-h-40 w-full object-cover" />
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-6 xl:col-span-5">
        <SummaryList title="Próximos eventos" rows={eventRows} onSeeAll={() => navigate("agenda")} empty="Nenhum evento agendado." />
        <Calendar marks={marks} view={view} onView={setView} onSelect={() => navigate("agenda")} />
      </div>
      {article && <ArticleModal article={article} onClose={() => setArticle(null)} />}
    </div>
  );
}

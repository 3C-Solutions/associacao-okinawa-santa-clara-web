import { useMemo, useState } from "react";
import { downloadCSV, fmtDate, fmtMoney, isFamilyRole, monthKey, todayISO } from "@/lib/data.js";
import { balanceOf, feeStatus, scopeTransactions, sum } from "@/lib/finance.js";
import { useStore, useUser } from "@/store";
import { Button, DataTable, EmptyState, Icon, IconButton, SearchInput, SelectField, StatusBadge, Tabs } from "@/components/ui";
import Metric from "@/pages/Dashboard/components/Metric.jsx";
import Charts from "./Charts.jsx";
import TransactionForm from "./TransactionForm.jsx";
import PaymentPage from "./requests/PaymentPage.jsx";
import RefundModal from "./requests/RefundModal.jsx";
import RequestsTable from "./requests/RequestsTable.jsx";
import { withType } from "./requests/helpers.js";

export default function Finance({ role, account }) {
  const { state, save, remove, toast, confirm } = useStore();
  const user = useUser(account);
  const today = todayISO();
  const canEdit = !isFamilyRole(role);
  const [filters, setFilters] = useState({ q: "", status: "Todos", type: "Todos", period: "Este ano" });
  const [editing, setEditing] = useState(null); // transação (nova ou existente)
  const [paying, setPaying] = useState(false); // abre a página de pagamento
  const [refunding, setRefunding] = useState(false);
  const [tab, setTab] = useState("ledger");

  const all = useMemo(() => scopeTransactions(state, user.scope), [state, user.scope]);
  const year = today.slice(0, 4);
  const fee = role === "admin" ? null : feeStatus(state, role, user.scope);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return all
      .filter((t) => (filters.period === "Este ano" ? t.date.startsWith(year) : filters.period === "Este mês" ? monthKey(t.date) === monthKey(today) : true))
      .filter((t) => filters.status === "Todos" || t.status === filters.status)
      .filter((t) => filters.type === "Todos" || t.type === (filters.type === "Entradas" ? "in" : "out"))
      .filter((t) => !q || `${t.description} ${t.category}`.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [all, filters, year, today]);

  // métricas
  const curMonth = balanceOf(all.filter((t) => monthKey(t.date) === monthKey(today)));
  const prevDate = new Date(Number(year), Number(today.slice(5, 7)) - 2, 1);
  const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const prevMonth = balanceOf(all.filter((t) => monthKey(t.date) === prevKey));
  const change = prevMonth !== 0 ? ((curMonth - prevMonth) / Math.abs(prevMonth)) * 100 : null;
  const yearBalance = balanceOf(all.filter((t) => t.date.startsWith(year)));
  const yearIn = sum(all.filter((t) => t.date.startsWith(year) && t.type === "in" && t.status === "Pago"));
  const yearOut = sum(all.filter((t) => t.date.startsWith(year) && t.type === "out" && t.status === "Pago"));

  const setFilter = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));

  const removeTx = (t) => confirm({ title: "Excluir lançamento", message: `Excluir “${t.description}” (${fmtMoney(t.amount)})? Essa ação não pode ser desfeita.`, onConfirm: () => { remove("transactions", t.id); toast("Lançamento excluído"); } });
  const markPaid = (t) => { save("transactions", { ...t, status: "Pago" }); toast("Marcado como pago"); };

  const exportCsv = () => {
    downloadCSV(`financeiro-${today}.csv`, ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Status"], filtered.map((t) => [fmtDate(t.date), t.description, t.category, t.type === "in" ? "Entrada" : "Saída", t.amount.toFixed(2).replace(".", ","), t.status]));
    toast("Arquivo CSV gerado");
  };

  const myPayments = state.payments.filter((p) => role === "admin" || p.scope === user.scope);
  const myRefunds = state.refunds.filter((r) => role === "admin" || r.scope === user.scope);
  const pendingPayments = state.payments.filter((p) => p.status === "Em verificação").length;
  const pendingRefunds = state.refunds.filter((r) => r.status === "Em análise").length;
  const mineOpen = [...myPayments, ...myRefunds].filter((r) => r.status === "Em verificação" || r.status === "Em análise").length;

  if (paying && fee) return <PaymentPage role={role} user={user} fee={fee} onBack={() => setPaying(false)} />;

  const columns = [
    { key: "date", label: "Data", render: (t) => fmtDate(t.date) },
    { key: "description", label: "Descrição" },
    { key: "category", label: "Categoria" },
    { key: "amount", label: "Valor", render: (t) => <span className={`whitespace-nowrap font-semibold ${t.type === "out" ? "text-danger" : "text-success"}`}>{t.type === "out" ? "- " : ""}{fmtMoney(t.amount)}</span> },
    { key: "status", label: "Status", render: (t) => <StatusBadge status={t.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {role === "admin" ? (
          <>
            <Metric label="Saldo mensal" value={fmtMoney(curMonth)} trend={change === null ? "Sem comparação com o mês anterior" : `${change >= 0 ? "+" : "−"} ${Math.abs(change).toFixed(1).replace(".", ",")}% em relação ao mês anterior`} tone={change === null ? "muted" : change >= 0 ? "success" : "danger"} />
            <Metric label="Saldo anual" value={fmtMoney(yearBalance)} trend={`Entradas ${fmtMoney(yearIn)} · Saídas ${fmtMoney(yearOut)}`} tone="muted" />
          </>
        ) : (
          <>
            {role === "department" && <Metric label="Saldo do departamento" value={fmtMoney(balanceOf(all))} trend={`Neste mês: ${fmtMoney(curMonth)}`} tone="muted" />}
            <Metric label={fee.label} value={fee.paid ? "Pago" : fee.pendingPayment ? "Em verificação" : fee.rejected ? "Recusado" : "Em aberto"} trend={fee.paid ? `Pagamento confirmado em ${fmtDate(fee.tx.date)}` : fee.pendingPayment ? "Aguardando verificação da Diretoria" : fee.rejected ? "Comprovante recusado — envie novamente" : `Vencimento ${fmtDate(fee.dueDate)}${fee.overdue ? " (vencida)" : ""}`} tone={fee.paid ? "success" : fee.pendingPayment ? "muted" : "danger"} />
            <Metric label="Valor" value={fmtMoney(fee.amount)} trend={fee.period === "mensal" ? "Cobrança mensal" : "Cobrança anual"} tone="muted" />
          </>
        )}
        <div className="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-1 xl:justify-end">
          {canEdit && <Button onClick={() => setEditing({ date: today, description: "", category: "Outros", type: "out", amount: "", status: "Pago", scope: user.scope })}><Icon name="plus" size={18} /> Novo lançamento</Button>}
          {fee && !fee.paid && !fee.pendingPayment && <Button variant={canEdit ? "secondary" : "primary"} onClick={() => setPaying(true)}>Pagar {role === "department" ? "mensalidade" : "anuidade"}</Button>}
          {role !== "admin" && <Button variant="outline" onClick={() => setRefunding(true)}>Solicitar reembolso</Button>}
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} options={role === "admin"
        ? [{ value: "ledger", label: "Lançamentos" }, { value: "payments", label: `Verificar pagamentos${pendingPayments ? ` (${pendingPayments})` : ""}` }, { value: "refunds", label: `Verificar reembolsos${pendingRefunds ? ` (${pendingRefunds})` : ""}` }]
        : [{ value: "ledger", label: "Lançamentos" }, { value: "requests", label: `Meus envios${mineOpen ? ` (${mineOpen})` : ""}` }]} />

      {tab === "payments" && role === "admin" && <RequestsTable items={withType(myPayments, [])} canReview />}
      {tab === "refunds" && role === "admin" && <RequestsTable items={withType([], myRefunds)} canReview />}
      {tab === "requests" && role !== "admin" && <RequestsTable items={withType(myPayments, myRefunds)} showOwner={false} />}

      {tab === "ledger" && <>
      {canEdit && <Charts all={all} year={year} />}

      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <SearchInput value={filters.q} onChange={setFilter("q")} placeholder="Buscar por descrição ou categoria" />
          <SelectField label="" value={filters.period} onChange={setFilter("period")} options={["Este mês", "Este ano", "Todos"]} className="[&>span:first-child]:hidden" />
          <SelectField label="" value={filters.type} onChange={setFilter("type")} options={["Todos", "Entradas", "Saídas"]} className="[&>span:first-child]:hidden" />
          <SelectField label="" value={filters.status} onChange={setFilter("status")} options={["Todos", "Pago", "Pendente", "Em verificação", "Recusado"]} className="[&>span:first-child]:hidden" />
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Icon name="download" size={18} /> Exportar</Button>
        </div>
        <p className="text-sm text-muted">
          {filtered.length} {filtered.length === 1 ? "lançamento" : "lançamentos"} · Entradas <strong className="text-success">{fmtMoney(sum(filtered.filter((t) => t.type === "in")))}</strong> · Saídas <strong className="text-danger">{fmtMoney(sum(filtered.filter((t) => t.type === "out")))}</strong>
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        empty={<EmptyState icon="wallet" title="Nenhum lançamento encontrado">Ajuste os filtros{canEdit ? " ou crie um novo lançamento" : ""}.</EmptyState>}
        actions={canEdit ? (t) => (t.paymentId || (t.fee && role !== "admin") ? <span className="text-xs text-muted">Via verificação</span> : (
          <>
            {t.status === "Pendente" && <IconButton icon="check" label="Marcar como pago" onClick={() => markPaid(t)} size="sm" />}
            <IconButton icon="edit" label="Editar" onClick={() => setEditing(t)} size="sm" />
            <IconButton icon="trash" label="Excluir" tone="danger" onClick={() => removeTx(t)} size="sm" />
          </>
        )) : undefined}
      />
      </>}

      {editing && <TransactionForm tx={editing} onClose={() => setEditing(null)} onSave={(t) => { save("transactions", t); toast(t.id ? "Lançamento atualizado" : "Lançamento criado"); setEditing(null); }} />}
      {refunding && <RefundModal role={role} user={user} onClose={() => setRefunding(false)} />}
    </div>
  );
}

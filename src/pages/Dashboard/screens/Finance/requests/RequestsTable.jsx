import { useState } from "react";
import { fmtDate, fmtMoney } from "@/lib/data.js";
import { Button, DataTable, EmptyState, IconButton, SelectField, StatusBadge } from "@/components/ui";
import ReviewModal from "./ReviewModal.jsx";
import { isOpen } from "./helpers.js";

export default function RequestsTable({ items, canReview, showOwner = true }) {
  const [filter, setFilter] = useState("Todos");
  const [viewingId, setViewingId] = useState(null);
  const rows = items.filter((r) => filter === "Todos" || (filter === "Pendentes" ? isOpen(r) : !isOpen(r))).sort((a, b) => Number(isOpen(b)) - Number(isOpen(a)));
  const viewing = items.find((r) => r.id === viewingId);
  const columns = [
    { key: "createdAt", label: "Enviado em", render: (r) => fmtDate(r.createdAt.slice(0, 10)) },
    ...(showOwner ? [{ key: "ownerName", label: "Solicitante", render: (r) => <span className="font-semibold">{r.ownerName}</span> }] : []),
    { key: "title", label: "Tipo", render: (r) => (r.type === "payment" ? `${r.title} · ${r.period}` : r.title) },
    { key: "amount", label: "Valor", render: (r) => <span className="whitespace-nowrap font-semibold">{fmtMoney(r.amount)}</span> },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{items.filter(isOpen).length} aguardando verificação · {items.length} no total</p>
        <SelectField label="" value={filter} onChange={setFilter} options={["Todos", "Pendentes", "Concluídos"]} className="w-48 [&>span:first-child]:hidden" />
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        empty={<EmptyState icon="wallet" title="Nada por aqui">{canReview ? "Nenhum envio para verificar." : "Você ainda não enviou pagamentos ou reembolsos."}</EmptyState>}
        actions={(r) => (canReview && isOpen(r) ? <Button className="min-h-9 px-3 text-sm" onClick={() => setViewingId(r.id)}>Verificar</Button> : <IconButton icon="eye" label="Ver detalhes" size="sm" onClick={() => setViewingId(r.id)} />)}
      />
      {viewing && <ReviewModal item={viewing} canReview={canReview} onClose={() => setViewingId(null)} />}
    </div>
  );
}

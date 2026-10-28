export function Badge({ children, tone = "success" }) {
  const tones = { success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", danger: "bg-danger-soft text-danger", info: "bg-brand-soft text-brand" };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

const STATUS_TONES = { Pago: "success", Publicado: "success", Aprovada: "success", Aprovado: "success", Confirmado: "success", Ativo: "success", Pendente: "warning", Rascunho: "warning", "Em verificação": "warning", "Em análise": "warning", "Lista de espera": "info", Recusada: "danger", Recusado: "danger", Cancelada: "danger", Inativo: "danger" };

export function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONES[status] || "info"}>{status}</Badge>;
}

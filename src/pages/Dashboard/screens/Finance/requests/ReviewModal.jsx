import { useState } from "react";
import { fmtDate, fmtMoney, todayISO, uid } from "@/lib/data.js";
import { useStore } from "@/store";
import { Badge, Button, Modal, StatusBadge, TextAreaField } from "@/components/ui";
import ReceiptView from "@/pages/Dashboard/components/ReceiptView.jsx";
import { clean, isOpen } from "./helpers.js";
import { targetOf } from "@/lib/people.js";

export default function ReviewModal({ item, canReview, onClose }) {
  const { state, save, notify, toast } = useStore();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const open = isOpen(item);
  const payment = item.type === "payment";
  const key = payment ? "payments" : "refunds";
  const today = todayISO();
  const diverges = payment && item.amount !== item.expected;

  const approve = () => {
    save(key, { ...clean(item), status: payment ? "Confirmado" : "Aprovado", reviewedAt: new Date().toISOString() });
    if (payment) {
      const tx = state.transactions.find((t) => t.id === item.txId);
      if (tx) save("transactions", { ...tx, status: "Pago" });
      const monthly = item.kind === "mensalidade";
      save("transactions", { id: uid(), date: today, description: `${monthly ? "Mensalidade" : "Anuidade"} — ${item.ownerName}`, category: monthly ? "Mensalidades" : "Anuidades", type: "in", amount: item.amount, status: "Pago", scope: "assoc", method: item.method, paymentId: item.id });
    } else {
      save("transactions", { id: uid(), date: today, description: `Reembolso — ${item.reason}`, category: "Reembolsos", type: "in", amount: item.amount, status: "Pago", scope: item.scope, refundId: item.id, paymentId: item.id });
      save("transactions", { id: uid(), date: today, description: `Reembolso — ${item.ownerName}`, category: "Reembolsos", type: "out", amount: item.amount, status: "Pago", scope: "assoc", refundId: item.id, paymentId: item.id });
    }
    notify(item.role, payment ? "Pagamento confirmado" : "Reembolso aprovado", payment ? `A Diretoria confirmou seu pagamento de ${fmtMoney(item.amount)}.` : `Seu reembolso de ${fmtMoney(item.amount)} foi aprovado.`, "finance", targetOf(item.role, item.scope.split(":")[1]));
    toast(payment ? "Pagamento confirmado" : "Reembolso aprovado");
    onClose();
  };

  const reject = () => {
    if (reason.trim().length < 3) { setError("Informe o motivo da recusa."); return; }
    save(key, { ...clean(item), status: "Recusado", rejectReason: reason.trim(), reviewedAt: new Date().toISOString() });
    if (payment) {
      const tx = state.transactions.find((t) => t.id === item.txId);
      if (tx) save("transactions", { ...tx, status: "Recusado" });
    }
    notify(item.role, payment ? "Pagamento recusado" : "Reembolso recusado", `${payment ? "Seu comprovante" : "Sua solicitação"} foi recusado. Motivo: ${reason.trim()}`, "finance", targetOf(item.role, item.scope.split(":")[1]));
    toast(payment ? "Pagamento recusado" : "Reembolso recusado");
    onClose();
  };

  const footer = canReview && open
    ? rejecting
      ? <><Button variant="outline" onClick={() => setRejecting(false)}>Voltar</Button><Button variant="danger" onClick={reject}>Confirmar recusa</Button></>
      : <><Button variant="outline" onClick={onClose}>Fechar</Button><Button variant="danger" onClick={() => setRejecting(true)}>Recusar</Button><Button onClick={approve}>{payment ? "Confirmar pagamento" : "Aprovar reembolso"}</Button></>
    : <Button onClick={onClose}>Fechar</Button>;

  return (
    <Modal title={payment ? `${item.title} — ${item.ownerName}` : `Reembolso — ${item.ownerName}`} onClose={onClose} footer={footer}>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="text-muted">Status</dt><dd className="mt-1"><StatusBadge status={item.status} /></dd></div>
        <div><dt className="text-muted">Enviado em</dt><dd className="font-semibold">{fmtDate(item.createdAt.slice(0, 10))}</dd></div>
        <div><dt className="text-muted">Valor informado</dt><dd className="font-semibold">{fmtMoney(item.amount)}</dd></div>
        {payment ? <div><dt className="text-muted">Método</dt><dd className="font-semibold">{item.method}</dd></div> : <div className="sm:col-span-2"><dt className="text-muted">Motivo</dt><dd className="font-semibold">{item.reason}</dd></div>}
        {payment && <div><dt className="text-muted">Referência</dt><dd className="font-semibold">{item.kind === "mensalidade" ? `Mensalidade ${item.period.slice(5)}/${item.period.slice(0, 4)}` : `Anuidade ${item.period}`}</dd></div>}
        {payment && <div><dt className="text-muted">Valor devido</dt><dd className="font-semibold">{fmtMoney(item.expected)}</dd></div>}
      </dl>
      {diverges && canReview && open && <p className="mt-4"><Badge tone="warning">O valor informado difere do valor devido</Badge></p>}
      {item.status === "Recusado" && item.rejectReason && payment && <p className="mt-4 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger"><strong>Motivo da recusa:</strong> {item.rejectReason}</p>}
      {item.status === "Recusado" && !payment && <p className="mt-4 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger"><strong>Solicitação recusada.</strong>{item.rejectReason ? ` Motivo: ${item.rejectReason}` : ""}</p>}
      <h3 className="mb-2 mt-6 font-bold">Comprovante</h3>
      <ReceiptView receipt={item.receipt} />
      {rejecting && <div className="mt-5"><TextAreaField label="Motivo da recusa" rows={3} value={reason} onChange={(v) => { setReason(v); setError(""); }} error={error} required /></div>}
    </Modal>
  );
}

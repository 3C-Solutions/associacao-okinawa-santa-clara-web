import { useState } from "react";
import { fmtMoney } from "@/lib/data.js";
import { useStore } from "@/store";
import { Button, Field, Modal, TextAreaField } from "@/components/ui";
import ReceiptField from "@/pages/Dashboard/components/ReceiptField.jsx";
import { parseAmount } from "./helpers.js";

// ---------- Solicitação de reembolso ----------
export default function RefundModal({ role, user, onClose }) {
  const { save, notify, toast } = useStore();
  const ownerName = role === "department" ? user.department?.name || user.profile.name : user.profile.name;
  const [form, setForm] = useState({ reason: "", amount: "", receipt: null });
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined })); };
  const submit = () => {
    const next = {};
    const amount = parseAmount(form.amount);
    if (form.reason.trim().length < 5) next.reason = "Descreva o motivo do reembolso.";
    if (!amount || amount <= 0) next.amount = "Informe um valor maior que zero.";
    if (!form.receipt) next.receipt = "Anexe o comprovante.";
    setErrors(next);
    if (Object.keys(next).length) return;
    save("refunds", { scope: user.scope, role, ownerName, reason: form.reason.trim(), amount, receipt: form.receipt, status: "Em análise", createdAt: new Date().toISOString() });
    notify("admin", "Reembolso solicitado", `${ownerName} solicitou reembolso de ${fmtMoney(amount)}.`, "finance");
    toast("Solicitação de reembolso enviada");
    onClose();
  };
  return (
    <Modal title="Solicitar reembolso" onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={submit}>Enviar solicitação</Button></>}>
      <div className="space-y-4">
        <TextAreaField label="Motivo" rows={3} value={form.reason} onChange={set("reason")} error={errors.reason} placeholder="Ex.: compra de materiais para o ensaio" required />
        <Field label="Valor (R$)" type="number" min="0" step="0.01" value={form.amount} onChange={set("amount")} error={errors.amount} required />
        <ReceiptField value={form.receipt} onChange={set("receipt")} error={errors.receipt} />
      </div>
    </Modal>
  );
}

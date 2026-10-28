import { useState } from "react";
import { PAYMENT_METHODS, fmtDate, fmtMoney, todayISO, uid } from "@/lib/data.js";
import { useStore } from "@/store";
import { Button, Card, Field, SelectField } from "@/components/ui";
import ReceiptField from "@/pages/Dashboard/components/ReceiptField.jsx";
import { parseAmount } from "./helpers.js";

// ---------- Página de envio de pagamento (mensalidade do departamento / anuidade do associado) ----------
// O pagamento só muda para "Pago" depois que a diretoria verificar o comprovante.
export default function PaymentPage({ role, user, fee, onBack }) {
  const { save, notify, toast } = useStore();
  const monthly = role === "department";
  const ownerName = monthly ? user.department?.name : user.profile.name;
  const [form, setForm] = useState({ amount: String(fee.amount), method: PAYMENT_METHODS[0], receipt: null });
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined })); };

  const submit = () => {
    const next = {};
    const amount = parseAmount(form.amount);
    if (!amount || amount <= 0) next.amount = "Informe um valor maior que zero.";
    if (!form.receipt) next.receipt = "Anexe o comprovante de pagamento.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const id = uid();
    const txId = uid();
    const kind = monthly ? "mensalidade" : "anuidade";
    const category = monthly ? "Mensalidades" : "Anuidades";
    save("payments", { id, kind, scope: user.scope, role, ownerName, period: fee.periodKey, dueDate: fee.dueDate, expected: fee.amount, amount, method: form.method, receipt: form.receipt, status: "Em verificação", createdAt: new Date().toISOString(), txId });
    save("transactions", { id: txId, date: todayISO(), description: monthly ? `Mensalidade da Associação — ${ownerName}` : "Anuidade", category, type: "out", amount, status: "Em verificação", scope: user.scope, fee: true, method: form.method, paymentId: id });
    notify("admin", "Pagamento aguardando verificação", `${ownerName} enviou o comprovante de ${kind} (${fmtMoney(amount)}).`, "finance");
    toast("Pagamento enviado para verificação");
    onBack();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button type="button" onClick={onBack} className="text-sm font-semibold text-brand hover:underline">← Voltar ao financeiro</button>
      <div>
        <h2 className="text-2xl font-bold">{monthly ? "Pagar mensalidade" : "Pagar anuidade"}</h2>
        <p className="mt-1 text-sm text-muted">Envie o comprovante para a Diretoria. O status só muda para “Pago” depois da verificação.</p>
      </div>
      {fee.rejected && (
        <Card className="border-danger/40 bg-danger-soft p-4 text-sm text-danger">
          <strong>Seu último envio foi recusado.</strong>{fee.rejected.rejectReason ? ` Motivo: ${fee.rejected.rejectReason}` : ""}
        </Card>
      )}
      <Card className="grid gap-4 p-5 text-sm sm:grid-cols-3">
        <div><p className="text-muted">Referência</p><p className="font-semibold">{monthly ? `Mensalidade ${fee.periodKey.slice(5)}/${fee.periodKey.slice(0, 4)}` : `Anuidade ${fee.periodKey}`}</p></div>
        <div><p className="text-muted">Vencimento</p><p className={`font-semibold ${fee.overdue ? "text-danger" : ""}`}>{fmtDate(fee.dueDate)}{fee.overdue ? " (vencida)" : ""}</p></div>
        <div><p className="text-muted">Valor devido</p><p className="font-semibold">{fmtMoney(fee.amount)}</p></div>
      </Card>
      <Card className="space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valor pago (R$)" type="number" min="0" step="0.01" value={form.amount} onChange={set("amount")} error={errors.amount} required />
          <SelectField label="Método de pagamento" value={form.method} onChange={set("method")} options={PAYMENT_METHODS} required />
        </div>
        <ReceiptField value={form.receipt} onChange={set("receipt")} error={errors.receipt} />
        <p className="text-xs text-muted">Pagamento simulado: no protótipo nenhuma cobrança real é feita e o comprovante fica salvo apenas neste navegador.</p>
      </Card>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onBack}>Cancelar</Button>
        <Button onClick={submit}>Enviar para verificação</Button>
      </div>
    </div>
  );
}

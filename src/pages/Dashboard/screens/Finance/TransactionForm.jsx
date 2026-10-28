import { useState } from "react";
import { FINANCE_CATEGORIES } from "@/lib/data.js";
import { Button, Field, Modal, SelectField } from "@/components/ui";

export default function TransactionForm({ tx, onClose, onSave }) {
  const [form, setForm] = useState({ ...tx, amount: tx.amount === "" ? "" : String(tx.amount) });
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined })); };
  const submit = () => {
    const next = {};
    if (form.description.trim().length < 3) next.description = "Descreva o lançamento.";
    const amount = Number(String(form.amount).replace(",", "."));
    if (!amount || amount <= 0) next.amount = "Informe um valor maior que zero.";
    if (!form.date) next.date = "Informe a data.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({ ...form, description: form.description.trim(), amount: Math.round(amount * 100) / 100 });
  };
  return (
    <Modal title={tx.id ? "Editar lançamento" : "Novo lançamento"} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={submit}>Salvar</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2" label="Descrição" value={form.description} onChange={set("description")} error={errors.description} required />
        <SelectField label="Tipo" value={form.type} onChange={set("type")} options={[{ value: "in", label: "Entrada" }, { value: "out", label: "Saída" }]} />
        <SelectField label="Categoria" value={form.category} onChange={set("category")} options={FINANCE_CATEGORIES} />
        <Field label="Valor (R$)" type="number" min="0" step="0.01" value={form.amount} onChange={set("amount")} error={errors.amount} required />
        <Field label="Data" type="date" value={form.date} onChange={set("date")} error={errors.date} required />
        <SelectField className="sm:col-span-2" label="Status" value={form.status} onChange={set("status")} options={["Pago", "Pendente"]} />
      </div>
    </Modal>
  );
}

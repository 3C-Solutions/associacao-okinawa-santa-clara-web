import { useState } from "react";
import { Button, Field, Modal } from "@/components/ui";

export default function ReservationForm({ initialDate, today, hasConflict, onClose, onSave }) {
  const [form, setForm] = useState({ date: initialDate, time: "19:00", title: "" });
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined })); };
  const submit = () => {
    const next = {};
    if (!form.date || form.date < today) next.date = "Escolha uma data a partir de hoje.";
    else if (hasConflict(form.date, form.time)) next.time = "Já existe um evento neste horário. Escolha outro.";
    if (!form.time) next.time = "Informe o horário.";
    if (form.title.trim().length < 3) next.title = "Descreva a finalidade da reserva.";
    setErrors(next);
    if (!Object.keys(next).length) onSave({ ...form, title: form.title.trim() });
  };
  return (
    <Modal title="Solicitar reserva do salão" onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={submit}>Enviar solicitação</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data" type="date" min={today} value={form.date} onChange={set("date")} error={errors.date} required />
        <Field label="Horário" type="time" value={form.time} onChange={set("time")} error={errors.time} required />
        <Field className="sm:col-span-2" label="Finalidade" placeholder="Ex.: ensaio extra, aniversário…" value={form.title} onChange={set("title")} error={errors.title} required />
      </div>
      <p className="mt-4 text-xs text-muted">A Diretoria analisa o pedido e você recebe uma notificação com a resposta.</p>
    </Modal>
  );
}

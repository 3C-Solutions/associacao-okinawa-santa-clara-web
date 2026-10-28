import { useState } from "react";
import { EVENT_CATEGORIES } from "@/lib/data.js";
import { Button, Field, Modal, SelectField } from "@/components/ui";

export default function EventForm({ event, onClose, onSave }) {
  const [form, setForm] = useState(event);
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined })); };
  const submit = () => {
    const next = {};
    if (form.title.trim().length < 3) next.title = "Informe o nome do evento.";
    if (!form.date) next.date = "Informe a data.";
    if (!form.time) next.time = "Informe o horário.";
    setErrors(next);
    if (!Object.keys(next).length) onSave({ ...form, title: form.title.trim() });
  };
  return (
    <Modal title={event.id ? "Editar evento" : "Novo evento"} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={submit}>Salvar</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2" label="Nome do evento" value={form.title} onChange={set("title")} error={errors.title} required />
        <Field label="Data" type="date" value={form.date} onChange={set("date")} error={errors.date} required />
        <Field label="Horário" type="time" value={form.time} onChange={set("time")} error={errors.time} required />
        <SelectField label="Categoria" value={form.category} onChange={set("category")} options={EVENT_CATEGORIES} />
        <Field label="Responsável" value={form.owner} onChange={set("owner")} />
      </div>
    </Modal>
  );
}

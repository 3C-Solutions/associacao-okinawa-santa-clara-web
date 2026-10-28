import { useState } from "react";
import { WEEKDAYS } from "@/lib/data.js";
import { Button, Field, Modal, SelectField, TextAreaField, Toggle } from "@/components/ui";
import ImagePicker from "@/pages/Dashboard/components/ImagePicker.jsx";
import { validateDepartment } from "../validation.js";

export default function DepartmentForm({ department, enrolled = 0, onClose, onSave }) {
  const [form, setForm] = useState(department);
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined })); };
  const submit = () => {
    const next = validateDepartment(form, enrolled);
    setErrors(next);
    if (!Object.keys(next).length) onSave({ ...form, name: form.name.trim(), description: form.description.trim(), teacher: form.teacher.trim() });
  };
  return (
    <Modal size="lg" title={department.id ? "Editar departamento" : "Novo departamento"} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={submit}>Salvar</Button></>}>
      <div className="grid gap-5 md:grid-cols-[1fr_16rem]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="sm:col-span-2" label="Nome do departamento" value={form.name} onChange={set("name")} error={errors.name} required />
          <TextAreaField className="sm:col-span-2" label="Descrição" rows={3} value={form.description} onChange={set("description")} error={errors.description} required />
          <SelectField label="Dia da semana" value={form.day} onChange={set("day")} options={WEEKDAYS} />
          <Field label="Horário" type="time" value={form.time} onChange={set("time")} />
          <Field label="Professor / responsável" value={form.teacher} onChange={set("teacher")} error={errors.teacher} required />
          <Field label="Mensalidade (R$)" type="number" min="0" step="0.01" value={form.fee} onChange={set("fee")} error={errors.fee} />
          <Field label="Limite de inscritos" type="number" min="1" step="1" value={form.capacity} onChange={set("capacity")} error={errors.capacity} hint={enrolled ? `${enrolled} inscritos no momento.` : undefined} required />
          <div className="flex items-center gap-3 sm:col-span-2"><Toggle checked={form.active} onChange={set("active")} label="Departamento ativo" /><span className="text-sm font-semibold">Departamento ativo (aparece no site)</span></div>
        </div>
        <ImagePicker value={form.image} onChange={set("image")} />
      </div>
    </Modal>
  );
}

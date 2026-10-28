import { useState } from "react";
import { WEEKDAYS } from "@/lib/data.js";
import { capacityOf, membersOf, seatsLeft } from "@/lib/people.js";
import { useStore, useUser } from "@/store";
import { Button, Card, EmptyState, Field, Icon, PageHeader, SelectField, TextAreaField } from "@/components/ui";
import ImagePicker from "@/pages/Dashboard/components/ImagePicker.jsx";
import { validateDepartment } from "../validation.js";
import DepartmentUsers from "./DepartmentUsers.jsx";

// ---------- Departamento (responsável edita o próprio) ----------
export default function DepartmentEditor({ account }) {
  const { state, save, toast } = useStore();
  const user = useUser(account);
  const department = user.department;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(department ? { ...department, fee: String(department.fee), capacity: String(capacityOf(department) || "") } : null);
  const [errors, setErrors] = useState({});
  if (!department) return <Card><EmptyState icon="groups" title="Departamento não encontrado">O departamento deste perfil foi excluído pela Diretoria.</EmptyState></Card>;
  const members = membersOf(state, department.id);
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined })); };
  const cancel = () => { setForm({ ...department, fee: String(department.fee), capacity: String(capacityOf(department) || "") }); setErrors({}); setEditing(false); };
  const submit = () => {
    const next = validateDepartment(form, members.length);
    setErrors(next);
    if (Object.keys(next).length) return;
    save("departments", { ...form, name: form.name.trim(), description: form.description.trim(), teacher: form.teacher.trim(), fee: Number(form.fee), capacity: Number(form.capacity) });
    toast("Informações do departamento salvas");
    setEditing(false);
  };
  return (
    <div>
      <PageHeader>
        {editing ? <><Button variant="outline" onClick={cancel}>Cancelar</Button><Button onClick={submit}><Icon name="check" size={18} /> Salvar alterações</Button></> : <Button variant="secondary" onClick={() => setEditing(true)}><Icon name="edit" size={18} /> Alterar informações</Button>}
      </PageHeader>
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <Field label="Nome do departamento" value={form.name} onChange={set("name")} error={errors.name} readOnly={!editing} />
          <TextAreaField label="Descrição" rows={3} value={form.description} onChange={editing ? set("description") : () => {}} error={errors.description} />
          <div className="grid gap-5 md:grid-cols-2">
            {editing ? <SelectField label="Dia da semana" value={form.day} onChange={set("day")} options={WEEKDAYS} /> : <Field label="Dia da semana" value={form.day} readOnly />}
            <Field label="Horário" type="time" value={form.time} onChange={set("time")} readOnly={!editing} />
            <Field label="Professor" value={form.teacher} onChange={set("teacher")} error={errors.teacher} readOnly={!editing} />
            <Field label="Valor da mensalidade (R$)" type="number" min="0" step="0.01" value={form.fee} onChange={set("fee")} error={errors.fee} readOnly={!editing} />
            <Field label="Limite de inscritos" type="number" min="1" step="1" value={form.capacity} onChange={set("capacity")} error={errors.capacity} readOnly={!editing} hint={`${members.length} inscritos · ${capacityOf(department) ? `${seatsLeft(state, department)} vagas disponíveis` : "sem limite definido"}`} />
          </div>
          <Card className="p-5">
            <h2 className="font-bold">Inscritos ({members.length}{capacityOf(department) ? ` de ${capacityOf(department)}` : ""})</h2>
            <p className="mt-1 text-xs text-muted">Para aprovar solicitações ou adicionar e remover inscritos, use a tela Associados.</p>
            {members.length === 0 ? <p className="mt-2 text-sm text-muted">Ninguém inscrito ainda.</p> : <p className="mt-2 text-sm leading-relaxed text-muted">{members.map((m) => m.name).join(", ")}</p>}
          </Card>
          <DepartmentUsers department={department} account={account} />
        </div>
        <div className="xl:col-span-4">
          {editing ? <ImagePicker value={form.image} onChange={set("image")} /> : (
            <div>
              <span className="mb-2 block text-sm font-semibold">Imagem do departamento</span>
              {department.image ? <img src={department.image} alt="" className="aspect-video w-full rounded-xl object-cover" /> : <Card className="grid aspect-video place-items-center border-dashed text-brand"><Icon name="upload" size={28} /></Card>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

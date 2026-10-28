import { useState } from "react";
import { INITIAL_PASSWORD, RELATIONS, isEmail, maskPhone } from "@/lib/data.js";
import { emailInUse } from "@/lib/people.js";
import { useStore } from "@/store";
import { Badge, Button, Checkbox, Field, Modal, SelectField } from "@/components/ui";

export default function PersonForm({ person, departments, requests, hasAccess = false, onClose, onSave, onRemove }) {
  const { state } = useStore();
  const [form, setForm] = useState({ email: "", phone: "", ...person });
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [requested, setRequested] = useState([]);
  const toggle = (id, on) => setRequested((list) => (on ? [...list, id] : list.filter((d) => d !== id)));
  const openFor = (departmentId) => requests.find((r) => r.departmentId === departmentId && r.personId === person.id && (r.status === "Pendente" || r.status === "Lista de espera"));
  const submit = () => {
    const next = {};
    if (form.name.trim().length < 2) { setError("Informe o nome."); return; }
    const email = form.email.trim();
    if (!form.main) {
      if (hasAccess && !email) next.email = "Este dependente tem acesso ao sistema: informe o e-mail.";
      else if (email && !isEmail(email)) next.email = "Informe um e-mail válido.";
      else if (email && emailInUse(state, email, [person.id])) next.email = "Já existe um usuário com este e-mail.";
      if (form.phone && form.phone.replace(/\D/g, "").length < 10) next.phone = "Informe um telefone com DDD.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({ ...form, name: form.name.trim(), email, phone: form.phone }, requested);
  };
  return (
    <Modal title={person.isNew ? "Novo membro da família" : person.name} onClose={onClose} footer={<>{onRemove && <Button variant="danger" onClick={onRemove} className="sm:mr-auto">Remover</Button>}<Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={submit}>{requested.length ? "Salvar e solicitar" : "Salvar"}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" value={form.name} onChange={(v) => { setForm({ ...form, name: v }); setError(""); }} error={error} readOnly={form.main} hint={form.main ? "Para alterar seus dados, use Configurações." : undefined} required />
        {form.main ? <Field label="Vínculo" value="Responsável" readOnly /> : <SelectField label="Vínculo" value={form.relation} onChange={(v) => setForm({ ...form, relation: v })} options={RELATIONS} />}
        {!form.main && <Field label="E-mail (opcional)" type="email" value={form.email} onChange={(v) => { setForm({ ...form, email: v }); setErrors((e) => ({ ...e, email: undefined })); }} error={errors.email} hint={hasAccess ? undefined : `Com e-mail, o dependente ganha acesso ao sistema (senha inicial: ${INITIAL_PASSWORD}).`} />}
        {!form.main && <Field label="Telefone (opcional)" type="tel" value={form.phone} onChange={(v) => { setForm({ ...form, phone: maskPhone(v) }); setErrors((e) => ({ ...e, phone: undefined })); }} error={errors.phone} placeholder="(11) 99999-9999" />}
      </div>
      <h3 className="mb-1 mt-6 font-bold">Departamentos</h3>
      <p className="mb-3 text-xs text-muted">Marque os departamentos que deseja solicitar. A inscrição só é efetivada quando o departamento aprovar.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {departments.map((d) => {
          const enrolled = form.departmentIds.includes(d.id);
          const open = openFor(d.id);
          if (enrolled || open) return <div key={d.id} className="flex min-h-10 items-center justify-between gap-2 rounded-lg border border-divider bg-canvas px-3 text-sm font-medium"><span>{d.name}</span><Badge tone={enrolled ? "success" : open.status === "Pendente" ? "warning" : "info"}>{enrolled ? "Inscrito" : open.status === "Pendente" ? "Solicitado" : "Em espera"}</Badge></div>;
          return <Checkbox key={d.id} checked={requested.includes(d.id)} onChange={(on) => toggle(d.id, on)}>{d.name}</Checkbox>;
        })}
      </div>
    </Modal>
  );
}

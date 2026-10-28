import { useState } from "react";
import { ADMIN_CREATABLE_TYPES, INITIAL_PASSWORD, RELATIONS, USER_TYPES, isEmail, maskPhone, todayISO } from "@/lib/data.js";
import { associateOfFamily, emailInUse, familyLabel } from "@/lib/people.js";
import { useStore } from "@/store";
import { Button, Field, Modal, SelectField } from "@/components/ui";

const typeLabel = (type) => USER_TYPES.find((t) => t.value === type)?.label || "";

// Cadastro de UM usuário por vez: a diretoria só cadastra Diretoria e Associado responsável (Departamento e Dependente são cadastrados por quem é dono deles).
// user = null (novo) ou a linha da lista (edição; o tipo não pode ser trocado).
export default function UserForm({ user, onClose, onSave, onGoToFamilies }) {
  const { state } = useStore();
  const editing = !!user;
  const [form, setForm] = useState(() => ({
    type: user?.type || "",
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    departmentId: user?.departmentIds?.[0] || "",
    familyId: user?.associate?.familyId || "",
    since: user?.associate?.since || todayISO(),
    relation: user?.person?.relation || "Filho(a)",
  }));
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: key === "phone" ? maskPhone(value) : value })); setErrors((e) => ({ ...e, [key]: undefined })); };

  // Associado responsável: só famílias já cadastradas e que ainda não têm responsável (a própria, se estiver editando).
  // Dependente: só famílias que já têm um associado responsável.
  const ownFamilyId = editing && user.type === "member" ? user.associate.familyId : null;
  const familiesFor = (type) => state.families.filter((f) => {
    const responsible = associateOfFamily(state, f.id);
    return type === "member" ? !responsible || f.id === ownFamilyId : !!responsible;
  });
  const familyOptions = (type) => familiesFor(type).map((f) => ({ value: f.id, label: `${familyLabel(f)} · ${f.address}${f.number ? `, ${f.number}` : ""}` }));
  const availableFamilies = form.type === "member" || form.type === "dependent" ? familyOptions(form.type) : [];
  const needsFamily = form.type === "member" || form.type === "dependent";
  const noFamily = needsFamily && availableFamilies.length === 0;

  const ignoreIds = editing ? [user.id, user.person?.id, user.associate?.id].filter(Boolean) : [];

  const submit = () => {
    const next = {};
    if (!form.type) next.type = "Selecione o tipo de perfil.";
    if (form.name.trim().length < 3) next.name = "Informe o nome completo.";
    if (!isEmail(form.email)) next.email = "Informe um e-mail válido.";
    else if (emailInUse(state, form.email, ignoreIds)) next.email = "Já existe um usuário com este e-mail.";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Informe um telefone com DDD.";
    if (form.type === "department" && !form.departmentId) next.departmentId = "Selecione o departamento.";
    if (needsFamily && !form.familyId) next.familyId = noFamily ? "Cadastre uma família antes de continuar." : "Selecione a família.";
    if (form.type === "member" && !form.since) next.since = "Informe a data de início.";
    setErrors(next);
    if (!Object.keys(next).length) onSave({ ...form, name: form.name.trim(), email: form.email.trim() });
  };

  return (
    <Modal title={editing ? `Editar ${typeLabel(form.type).toLowerCase()}` : "Novo usuário"} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={submit} disabled={noFamily}>Salvar</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {editing
          ? <Field className="sm:col-span-2" label="Tipo de perfil" value={typeLabel(form.type)} readOnly />
          : <SelectField className="sm:col-span-2" label="Tipo de perfil" value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v, familyId: "" }))} error={errors.type} placeholder="Selecione o tipo de perfil" options={ADMIN_CREATABLE_TYPES} required />}

        {form.type && (
          <>
            <Field className="sm:col-span-2" label="Nome completo" value={form.name} onChange={set("name")} error={errors.name} required />
            <Field label="E-mail" type="email" value={form.email} onChange={set("email")} error={errors.email} required />
            <Field label="Telefone" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} placeholder="(11) 99999-9999" required />
          </>
        )}

        {form.type === "department" && (
          <SelectField className="sm:col-span-2" label="Departamento responsável" value={form.departmentId} onChange={set("departmentId")} error={errors.departmentId} placeholder="Selecione o departamento" options={state.departments.map((d) => ({ value: d.id, label: d.name }))} required />
        )}

        {needsFamily && (
          editing && user.type === "dependent"
            ? <Field className="sm:col-span-2" label="Família" value={familyLabel(state.families.find((f) => f.id === form.familyId))} readOnly />
            : <SelectField className="sm:col-span-2" label="Família" value={form.familyId} onChange={set("familyId")} error={errors.familyId} placeholder={noFamily ? "Nenhuma família disponível" : "Selecione a família"} options={availableFamilies} required />
        )}

        {form.type === "member" && <Field label="Associado desde" type="date" value={form.since} onChange={set("since")} error={errors.since} required />}
        {form.type === "dependent" && <SelectField label="Vínculo com o responsável" value={form.relation} onChange={set("relation")} options={RELATIONS} required />}
      </div>

      {noFamily && (
        <div className="mt-5 rounded-lg border border-warning bg-warning-soft px-4 py-3 text-sm" role="alert">
          <p className="font-semibold">{form.type === "member" ? "Cadastre a família antes do associado responsável." : "Nenhuma família com associado responsável."}</p>
          <p className="mt-1 text-muted">{form.type === "member" ? "Todo associado responsável pertence a uma família. Não há famílias sem responsável disponíveis no momento." : "Cadastre primeiro o associado responsável da família para depois incluir dependentes."}</p>
          {form.type === "member" && <Button variant="outline" className="mt-3" onClick={onGoToFamilies}>Cadastrar família</Button>}
        </div>
      )}
      <p className="mt-5 rounded-lg bg-brand-soft px-4 py-3 text-xs text-brand">Cada cadastro cria um único usuário. {editing ? "" : `A senha inicial é ${INITIAL_PASSWORD}; o próprio usuário pode alterá-la em Configurações.`}</p>
    </Modal>
  );
}

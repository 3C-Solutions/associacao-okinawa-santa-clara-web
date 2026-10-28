import { useState } from "react";
import { INITIAL_PASSWORD, isEmail, maskPhone, uid } from "@/lib/data.js";
import { emailInUse } from "@/lib/people.js";
import { useStore } from "@/store";
import { Badge, Button, Card, Field, Icon, IconButton, Modal } from "@/components/ui";

// Usuários com perfil Departamento: quem cadastra novos usuários do departamento é um usuário do próprio departamento.
export default function DepartmentUsers({ department, account }) {
  const { state, addAccount, removeAccounts, toast, confirm } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});
  const users = Object.entries(state.profiles).filter(([, p]) => p.role === "department" && p.departmentId === department.id);
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: key === "phone" ? maskPhone(value) : value })); setErrors((e) => ({ ...e, [key]: undefined })); };
  const close = () => { setOpen(false); setForm({ name: "", email: "", phone: "" }); setErrors({}); };

  const submit = () => {
    const next = {};
    if (form.name.trim().length < 3) next.name = "Informe o nome completo.";
    if (!isEmail(form.email)) next.email = "Informe um e-mail válido.";
    else if (emailInUse(state, form.email)) next.email = "Já existe um usuário com este e-mail.";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Informe um telefone com DDD.";
    setErrors(next);
    if (Object.keys(next).length) return;
    addAccount(`u-${uid()}`, { role: "department", name: form.name.trim(), email: form.email.trim(), phone: form.phone, departmentId: department.id, emailNotifications: true }, INITIAL_PASSWORD);
    toast(`Usuário do departamento cadastrado. Senha inicial: ${INITIAL_PASSWORD}.`);
    close();
  };

  const del = ([key, p]) => confirm({ title: "Excluir usuário", message: `Excluir ${p.name}? Ele(a) perderá o acesso ao departamento.`, onConfirm: () => { removeAccounts((_, k) => k === key); toast("Usuário excluído"); } });

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">Usuários do departamento ({users.length})</h2>
          <p className="mt-1 text-xs text-muted">Quem tem perfil Departamento cadastra outros usuários do mesmo departamento.</p>
        </div>
        <Button variant="secondary" className="min-h-9 px-4 text-sm" onClick={() => setOpen(true)}><Icon name="plus" size={16} /> Novo usuário</Button>
      </div>
      <ul className="mt-4 divide-y divide-divider rounded-lg border border-divider text-sm">
        {users.map(([key, p]) => (
          <li key={key} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span><span className="font-semibold">{p.name}</span><span className="block text-xs text-muted">{p.email}</span></span>
            {key === account ? <Badge tone="info">Você</Badge> : <IconButton icon="trash" label={`Excluir ${p.name}`} tone="danger" size="sm" onClick={() => del([key, p])} />}
          </li>
        ))}
      </ul>
      {open && (
        <Modal title="Novo usuário do departamento" onClose={close} footer={<><Button variant="outline" onClick={close}>Cancelar</Button><Button onClick={submit}>Salvar</Button></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" label="Nome completo" value={form.name} onChange={set("name")} error={errors.name} required />
            <Field label="E-mail" type="email" value={form.email} onChange={set("email")} error={errors.email} required />
            <Field label="Telefone" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} placeholder="(11) 99999-9999" required />
          </div>
          <p className="mt-5 rounded-lg bg-brand-soft px-4 py-3 text-xs text-brand">O novo usuário terá acesso a {department.name}. A senha inicial é {INITIAL_PASSWORD}; ele(a) pode alterá-la em Configurações.</p>
        </Modal>
      )}
    </Card>
  );
}

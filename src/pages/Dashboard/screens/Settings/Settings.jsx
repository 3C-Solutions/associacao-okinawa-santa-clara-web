import { useState } from "react";
import { isEmail, maskCep, maskPhone } from "@/lib/data.js";
import { useStore, useUser } from "@/store";
import { Button, Card, Field, Icon, Toggle } from "@/components/ui";
import PasswordModal from "./PasswordModal.jsx";

const ADDRESS_KEYS = ["address", "number", "complement", "uf", "city", "cep", "district"];

export default function Settings({ role, account }) {
  const { state, save, setProfile, setPassword, reset, toast, confirm } = useStore();
  const user = useUser(account);
  const [editing, setEditing] = useState(false);
  // o endereço do associado é o da sua família (cadastrado em Usuários › Famílias)
  const addressOf = () => (role === "member" && user.family ? ADDRESS_KEYS.reduce((acc, key) => ({ ...acc, [key]: user.family[key] || "" }), {}) : {});
  const initialForm = () => ({ ...user.profile, ...addressOf() });
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [pwd, setPwd] = useState(false);

  const set = (key) => (value) => {
    const masked = key === "phone" ? maskPhone(value) : key === "cep" ? maskCep(value) : key === "uf" ? value.toUpperCase().slice(0, 2) : value;
    setForm((f) => ({ ...f, [key]: masked }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const cancel = () => { setForm(initialForm()); setErrors({}); setEditing(false); };
  const submit = () => {
    const next = {};
    if (form.name.trim().length < 3) next.name = "Informe o nome.";
    if (!isEmail(form.email)) next.email = "Informe um e-mail válido.";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Informe um telefone com DDD.";
    if (role === "member") {
      if (form.cep && form.cep.replace(/\D/g, "").length !== 8) next.cep = "CEP deve ter 8 dígitos.";
      if (form.uf && form.uf.length !== 2) next.uf = "Use a sigla com 2 letras.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    const clean = { ...form, name: form.name.trim(), email: form.email.trim() };
    const profileData = Object.fromEntries(Object.entries(clean).filter(([key]) => !ADDRESS_KEYS.includes(key)));
    setProfile(account, profileData);
    if (role === "member" && user.family) save("families", { ...user.family, ...Object.fromEntries(ADDRESS_KEYS.map((key) => [key, clean[key] || ""])) });
    if (role === "member" && user.associate) save("associates", { ...user.associate, name: clean.name, email: clean.email, phone: clean.phone });
    if (role === "dependent" && user.associate) save("associates", { ...user.associate, dependents: user.associate.dependents.map((p) => (p.id === user.profile.personId ? { ...p, name: clean.name, email: clean.email, phone: clean.phone } : p)) });
    setForm(clean);
    setEditing(false);
    toast("Dados atualizados");
  };

  const accountFields = [["name", "Nome"], ["email", "E-mail", "email"], ["phone", "Telefone", "tel"]];
  const memberFields = [["address", "Endereço"], ["number", "Número"], ["complement", "Complemento"], ["uf", "UF"], ["city", "Cidade"], ["cep", "CEP"], ["district", "Bairro"]];

  return (
    <div className="max-w-4xl space-y-6">
      <Card className="p-5 md:p-7">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><h2 className="text-xl font-bold">Dados pessoais</h2><p className="mt-1 text-sm text-muted">Mantenha seus dados atualizados para receber comunicados.</p></div>
          {editing ? <div className="flex gap-2"><Button variant="outline" onClick={cancel}>Cancelar</Button><Button onClick={submit}><Icon name="check" size={18} /> Salvar</Button></div> : <Button variant="secondary" onClick={() => setEditing(true)}><Icon name="edit" size={18} /> Editar dados</Button>}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {accountFields.map(([key, label, type]) => <Field key={key} className={key === "name" ? "md:col-span-2" : ""} label={label} type={type} value={form[key]} onChange={set(key)} error={errors[key]} readOnly={!editing} />)}
          {role === "member" && memberFields.map(([key, label]) => <Field key={key} className={key === "address" ? "md:col-span-2" : ""} label={label} value={form[key] || ""} onChange={set(key)} error={errors[key]} readOnly={!editing} />)}
        </div>
      </Card>

      <Card className="p-5 md:p-7">
        <h2 className="text-xl font-bold">Segurança</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">Senha: ••••••••</p>
          <Button variant="secondary" onClick={() => setPwd(true)}>Alterar senha</Button>
        </div>
      </Card>

      <Card className="p-5 md:p-7">
        <h2 className="text-xl font-bold">Preferências</h2>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div><p className="font-semibold">Notificações por e-mail</p><p className="text-sm text-muted">Receba avisos de reservas, pagamentos e notícias no seu e-mail.</p></div>
          <Toggle checked={!!user.profile.emailNotifications} onChange={(v) => { setProfile(account, { emailNotifications: v }); setForm((f) => ({ ...f, emailNotifications: v })); toast(v ? "Notificações por e-mail ativadas" : "Notificações por e-mail desativadas"); }} label="Notificações por e-mail" />
        </div>
      </Card>

      {role === "admin" && (
        <Card className="p-5 md:p-7">
          <h2 className="text-xl font-bold">Dados do protótipo</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">Tudo o que você cadastra fica salvo neste navegador. Restaure para voltar aos dados de exemplo.</p>
            <Button variant="outline" onClick={() => confirm({ title: "Restaurar dados de exemplo", message: "Todos os cadastros, lançamentos e notificações criados por você serão apagados.", confirmLabel: "Restaurar", onConfirm: () => { reset(); setForm(state.profiles[account]); toast("Dados de exemplo restaurados"); } })}>Restaurar dados</Button>
          </div>
        </Card>
      )}

      {pwd && <PasswordModal current={state.passwords[account]} onClose={() => setPwd(false)} onSave={(value) => { setPassword(account, value); setPwd(false); toast("Senha alterada"); }} />}
    </div>
  );
}

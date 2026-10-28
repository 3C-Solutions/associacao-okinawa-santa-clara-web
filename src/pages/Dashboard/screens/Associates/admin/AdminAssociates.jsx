import { useMemo, useState } from "react";
import { INITIAL_PASSWORD, USER_TYPES, downloadCSV, todayISO, uid } from "@/lib/data.js";
import { familyLabel, familyOf } from "@/lib/people.js";
import { useStore } from "@/store";
import { Badge, Button, DataTable, EmptyState, Icon, IconButton, SearchInput, SelectField } from "@/components/ui";
import { deptNames } from "../helpers.js";
import AssociateDetails from "./AssociateDetails.jsx";
import UserForm from "./UserForm.jsx";

// ---------- Diretoria ----------
// Lista todos os usuários do sistema e cadastra UM usuário por vez, escolhendo o tipo de perfil.
const ROLE_TONES = { Diretoria: "danger", Departamento: "warning", "Associado responsável": "success", Dependente: "info" };
const TYPE_ORDER = USER_TYPES.map((t) => t.value);

export default function AdminAssociates({ account, navigate }) {
  const { state, save, remove, removeWhere, addAccount, updateAccounts, removeAccounts, toast, confirm } = useStore();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [form, setForm] = useState(null); // { user } — user = null cadastra um novo usuário
  const [viewing, setViewing] = useState(null);

  const users = useMemo(() => {
    const list = [];
    Object.entries(state.profiles).forEach(([key, p]) => {
      if (p.role === "admin") list.push({ id: key, type: "admin", name: p.name, email: p.email, phone: p.phone, departmentIds: [], note: "Diretoria da associação" });
      if (p.role === "department") list.push({ id: key, type: "department", name: p.name, email: p.email, phone: p.phone, departmentIds: p.departmentId ? [p.departmentId] : [], note: "Responsável pelo departamento" });
    });
    state.associates.forEach((a) => {
      const family = familyOf(state, a);
      list.push({ id: a.id, type: "member", name: a.name, email: a.email, phone: a.phone, departmentIds: a.departmentIds, associate: a, family: familyLabel(family), note: `${familyLabel(family)} · ${a.dependents.length} dependente(s)` });
      a.dependents.forEach((p) => list.push({ id: p.id, type: "dependent", name: p.name, email: p.email || "", phone: p.phone || a.phone, departmentIds: p.departmentIds, associate: a, person: p, family: familyLabel(family), note: `${p.relation} de ${a.name} · ${familyLabel(family)}` }));
    });
    return list.map((u) => ({ ...u, role: USER_TYPES.find((t) => t.value === u.type).label }));
  }, [state]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users
      .filter((u) => !roleFilter || u.type === roleFilter)
      .filter((u) => !dept || u.departmentIds.includes(dept))
      .filter((u) => !term || `${u.name} ${u.email} ${u.phone} ${u.note}`.toLowerCase().includes(term))
      .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || a.name.localeCompare(b.name));
  }, [users, q, dept, roleFilter]);

  // ---------- cadastro (um usuário por vez) ----------
  const create = (f) => {
    const base = { name: f.name, email: f.email, phone: f.phone };
    if (f.type === "admin") {
      addAccount(`u-${uid()}`, { role: "admin", ...base, emailNotifications: true }, INITIAL_PASSWORD);
    } else {
      const id = `a-${uid()}`;
      save("associates", { id, familyId: f.familyId, ...base, since: f.since, departmentIds: [], dependents: [] });
      addAccount(`u-${id}`, { role: "member", ...base, associateId: id, emailNotifications: true }, INITIAL_PASSWORD);
    }
    toast(`${USER_TYPES.find((t) => t.value === f.type).label} cadastrado(a). Senha inicial: ${INITIAL_PASSWORD}.`);
  };

  const update = (f, u) => {
    const base = { name: f.name, email: f.email, phone: f.phone };
    if (u.type === "admin" || u.type === "department") {
      updateAccounts((_, key) => key === u.id, { ...base, ...(u.type === "department" ? { departmentId: f.departmentId } : {}) });
    } else if (u.type === "member") {
      save("associates", { ...u.associate, ...base, familyId: f.familyId, since: f.since });
      updateAccounts((p) => p.role === "member" && p.associateId === u.associate.id, base);
    } else {
      save("associates", { ...u.associate, dependents: u.associate.dependents.map((p) => (p.id === u.id ? { ...p, ...base, relation: f.relation } : p)) });
      updateAccounts((p) => p.personId === u.id, base);
    }
    toast("Usuário atualizado");
  };

  const submit = (f) => { if (form.user) update(f, form.user); else create(f); setForm(null); };

  // ---------- exclusão ----------
  const del = (u) => {
    if (u.type === "admin" && Object.values(state.profiles).filter((p) => p.role === "admin").length <= 1) { toast("Mantenha ao menos um usuário da Diretoria.", "error"); return; }
    const messages = {
      admin: `Excluir ${u.name}? Ele(a) perderá o acesso à Diretoria.`,
      department: `Excluir ${u.name}? Ele(a) perderá o acesso ao departamento.`,
      member: `Excluir ${u.name} e seus ${u.associate?.dependents.length} dependente(s)? Essa ação não pode ser desfeita.`,
      dependent: `Excluir ${u.name}? As inscrições em departamentos também serão removidas.`,
    };
    confirm({
      title: "Excluir usuário",
      message: messages[u.type],
      onConfirm: () => {
        if (u.type === "member") remove("associates", u.associate.id);
        else if (u.type === "dependent") {
          save("associates", { ...u.associate, dependents: u.associate.dependents.filter((p) => p.id !== u.id) });
          removeWhere("enrollmentRequests", (r) => r.personId === u.id);
          removeAccounts((p) => p.personId === u.id);
        } else removeAccounts((_, key) => key === u.id);
        toast("Usuário excluído");
      },
    });
  };

  const exportCsv = () => { downloadCSV(`usuarios-${todayISO()}.csv`, ["Nome", "Função", "E-mail", "Telefone", "Família", "Vínculo", "Departamentos"], rows.map((u) => [u.name, u.role, u.email, u.phone, u.family || "", u.note, deptNames(state, u.departmentIds).join(", ")])); toast("Arquivo CSV gerado"); };

  const columns = [
    { key: "name", label: "Nome", render: (u) => <span className="font-semibold">{u.name}</span> },
    { key: "role", label: "Função", render: (u) => <Badge tone={ROLE_TONES[u.role]}>{u.role}</Badge> },
    { key: "note", label: "Vínculo", render: (u) => <span className="text-muted">{u.note}</span> },
    { key: "phone", label: "Telefone" },
    { key: "departments", label: "Departamentos", render: (u) => <span className="text-muted">{deptNames(state, u.departmentIds).join(", ") || "—"}</span> },
  ];
  const counts = (type) => users.filter((u) => u.type === type).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar por nome" className="flex-1 sm:max-w-md" />
          <SelectField label="" value={roleFilter} onChange={setRoleFilter} placeholder="Todas as funções" options={USER_TYPES.map((t) => ({ value: t.value, label: `${t.label} (${counts(t.value)})` }))} className="sm:w-60 [&>span:first-child]:hidden" />
          <SelectField label="" value={dept} onChange={setDept} placeholder="Todos os departamentos" options={state.departments.map((d) => ({ value: d.id, label: d.name }))} className="sm:w-60 [&>span:first-child]:hidden" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!rows.length}><Icon name="download" size={18} /> Exportar</Button>
          <Button onClick={() => setForm({ user: null })}><Icon name="plus" size={18} /> Novo usuário</Button>
        </div>
      </div>
      <p className="text-sm text-muted">{rows.length} {rows.length === 1 ? "usuário encontrado" : "usuários encontrados"}.</p>
      <DataTable
        columns={columns}
        rows={rows}
        empty={<EmptyState icon="person" title="Nenhum usuário encontrado">Ajuste a busca ou os filtros, ou cadastre um novo usuário.</EmptyState>}
        actions={(u) => (u.id === account
          ? <span className="text-xs text-muted">Em Configurações</span>
          : (<>
              {u.associate && <IconButton icon="eye" label={u.type === "member" ? `Ver detalhes de ${u.name}` : `Ver família de ${u.name}`} size="sm" onClick={() => setViewing(u.associate)} />}
              <IconButton icon="edit" label={`Editar ${u.name}`} size="sm" onClick={() => setForm({ user: u })} />
              <IconButton icon="trash" label={`Excluir ${u.name}`} tone="danger" size="sm" onClick={() => del(u)} />
            </>))}
      />
      {form && <UserForm user={form.user} onClose={() => setForm(null)} onSave={submit} onGoToFamilies={() => { setForm(null); navigate?.("families"); }} />}
      {viewing && <AssociateDetails associate={state.associates.find((a) => a.id === viewing.id) || viewing} onClose={() => setViewing(null)} onEdit={() => { setForm({ user: users.find((u) => u.id === viewing.id) }); setViewing(null); }} />}
    </div>
  );
}

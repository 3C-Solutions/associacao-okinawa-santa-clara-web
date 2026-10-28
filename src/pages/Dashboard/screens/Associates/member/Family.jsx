import { useState } from "react";
import { INITIAL_PASSWORD, uid } from "@/lib/data.js";
import { isFull, peopleOf } from "@/lib/people.js";
import { useStore, useUser } from "@/store";
import { Badge, Button, Card, EmptyState, Icon, PageHeader } from "@/components/ui";
import { deptNames } from "../helpers.js";
import PersonForm from "./PersonForm.jsx";

// ---------- Associado (família) ----------
export default function Family({ role = "member", account }) {
  const { state, save, removeWhere, removeAccounts, addAccount, setProfile, notify, toast, confirm } = useStore();
  const user = useUser(account);
  const readOnly = role === "dependent"; // dependente apenas consulta: quem cadastra a família é o responsável
  const [editing, setEditing] = useState(null);
  const associate = user.associate;
  if (!associate) return <Card><EmptyState icon="person" title="Cadastro não encontrado" /></Card>;
  const people = peopleOf(associate);
  const active = state.departments.filter((d) => d.active);

  // A família não se inscreve diretamente: os departamentos marcados viram SOLICITAÇÕES para o departamento aprovar.
  const accountKeyOf = (personId) => Object.keys(state.profiles).find((key) => state.profiles[key].personId === personId);
  const savePerson = (person, requestedIds) => {
    if (readOnly) return;
    let createdAccess = false;
    if (!person.main) {
      const exists = associate.dependents.some((p) => p.id === person.id);
      const dep = { id: person.id, name: person.name, relation: person.relation, departmentIds: exists ? associate.dependents.find((p) => p.id === person.id).departmentIds : [] };
      if (person.email) dep.email = person.email;
      if (person.phone) dep.phone = person.phone;
      save("associates", { ...associate, dependents: exists ? associate.dependents.map((p) => (p.id === dep.id ? dep : p)) : [...associate.dependents, dep] });
      // o associado responsável é quem cadastra o dependente (e, com e-mail, o acesso dele ao sistema)
      const key = accountKeyOf(person.id);
      const patch = { name: person.name, email: person.email, phone: person.phone || associate.phone };
      if (key) setProfile(key, patch);
      else if (person.email) { addAccount(`u-${person.id}`, { role: "dependent", ...patch, associateId: associate.id, personId: person.id, emailNotifications: true }, INITIAL_PASSWORD); createdAccess = true; }
    }
    requestedIds.forEach((departmentId) => {
      const department = state.departments.find((d) => d.id === departmentId);
      save("enrollmentRequests", { departmentId, associateId: associate.id, associateName: associate.name, personId: person.id, personName: person.name, relation: person.main ? "Responsável" : person.relation, status: isFull(state, department) ? "Lista de espera" : "Pendente", createdAt: new Date().toISOString() });
      notify("department", "Nova solicitação de inscrição", `${person.name} solicitou inscrição em ${department.name}.`, "associates", { departmentId });
    });
    toast(createdAccess ? `Dependente cadastrado. Senha inicial de acesso: ${INITIAL_PASSWORD}.` : requestedIds.length ? "Dados salvos e solicitações enviadas" : "Família atualizada");
    setEditing(null);
  };
  const removePerson = (p) => readOnly ? undefined : confirm({ title: "Remover membro", message: `Remover ${p.name} da sua família? As inscrições e solicitações dele(a) também serão removidas.`, confirmLabel: "Remover", onConfirm: () => { removeAccounts((a) => a.personId === p.id); save("associates", { ...associate, dependents: associate.dependents.filter((d) => d.id !== p.id) }); removeWhere("enrollmentRequests", (r) => r.personId === p.id); toast("Membro removido"); setEditing(null); } });

  return (
    <div>
      {readOnly ? (
        <p className="mb-6 text-sm text-muted">Somente o associado responsável cadastra e edita os membros da família.</p>
      ) : (
        <PageHeader><Button onClick={() => setEditing({ id: uid(), name: "", relation: "Filho(a)", departmentIds: [], main: false, isNew: true })}><Icon name="plus" size={18} /> Novo membro</Button></PageHeader>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        {people.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex gap-4">
              <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-brand-soft text-2xl font-bold text-brand">{p.name[0]}</div>
              <div className="min-w-0">
                <Badge tone="info">{p.relation}</Badge>
                <h2 className="mt-2 text-lg font-bold">{p.name}</h2>
                <p className="mt-1 text-sm text-muted">Departamentos inscritos</p>
                <p className="text-sm font-semibold">{deptNames(state, p.departmentIds).join(", ") || "Nenhum"}</p>
              </div>
            </div>
            {!readOnly && <Button variant="secondary" className="mt-5 w-full" onClick={() => setEditing(p)}>Gerenciar</Button>}
          </Card>
        ))}
      </div>
      {editing && !readOnly && <PersonForm person={editing} hasAccess={!!accountKeyOf(editing.id)} departments={active} requests={state.enrollmentRequests || []} onClose={() => setEditing(null)} onSave={savePerson} onRemove={!editing.main && !editing.isNew ? () => removePerson(editing) : undefined} />}
    </div>
  );
}

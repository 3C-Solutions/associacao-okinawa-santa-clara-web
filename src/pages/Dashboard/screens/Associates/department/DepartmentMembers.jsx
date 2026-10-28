import { useState } from "react";
import { downloadCSV, fmtDate } from "@/lib/data.js";
import { capacityOf, enrollPerson, isFull, membersOf, openRequest, requestsOf, unenrollPerson } from "@/lib/people.js";
import { useStore, useUser } from "@/store";
import { Button, Card, DataTable, EmptyState, Icon, IconButton, PageHeader, SearchInput, StatusBadge, Tabs } from "@/components/ui";
import AddMemberModal from "./AddMemberModal.jsx";

// ---------- Departamento ----------
// Único perfil que adiciona/remove inscritos: aprova solicitações, coloca em lista de espera ou adiciona pela lista completa.
export default function DepartmentMembers({ account }) {
  const { state, save, notify, toast, confirm } = useStore();
  const user = useUser(account);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("enrolled");
  const [adding, setAdding] = useState(false);
  const department = user.department;
  if (!department) return <Card><EmptyState icon="groups" title="Departamento não encontrado" /></Card>;

  const members = membersOf(state, department.id);
  const rows = members.filter((m) => `${m.name} ${m.associateName}`.toLowerCase().includes(q.trim().toLowerCase()));
  const pending = requestsOf(state, department.id, "Pendente");
  const waitlist = requestsOf(state, department.id, "Lista de espera");
  const cap = capacityOf(department);
  const full = isFull(state, department);
  const phoneOf = (id) => state.associates.find((a) => a.id === id)?.phone || "";
  const sinceOf = (id) => state.associates.find((a) => a.id === id)?.since || "";
  const matches = (r) => `${r.personName} ${r.associateName}`.toLowerCase().includes(q.trim().toLowerCase());

  const notifyMember = (associateId, title, detail) => notify("member", title, detail, "department", { associateId });
  const enroll = (associateId, personId) => {
    const a = state.associates.find((x) => x.id === associateId);
    if (a) save("associates", enrollPerson(a, personId, department.id));
  };

  const approve = (r) => {
    if (full) { toast("Departamento lotado. Aumente o limite ou remova um inscrito antes de aprovar.", "error"); return; }
    enroll(r.associateId, r.personId);
    save("enrollmentRequests", { ...r, status: "Aprovada" });
    notifyMember(r.associateId, "Inscrição aprovada", `${r.personName} foi inscrito(a) em ${department.name}.`);
    toast(`${r.personName} inscrito(a)`);
  };
  const toWaitlist = (r) => { save("enrollmentRequests", { ...r, status: "Lista de espera" }); notifyMember(r.associateId, "Lista de espera", `${r.personName} entrou na lista de espera de ${department.name}.`); toast("Colocado em lista de espera"); };
  const reject = (r) => confirm({ title: "Recusar solicitação", message: `Recusar a solicitação de ${r.personName}?`, confirmLabel: "Recusar", onConfirm: () => { save("enrollmentRequests", { ...r, status: "Recusada" }); notifyMember(r.associateId, "Solicitação recusada", `A solicitação de ${r.personName} em ${department.name} não foi aprovada.`); toast("Solicitação recusada"); } });
  const addDirect = (p) => {
    if (full) { toast("Departamento lotado.", "error"); return; }
    enroll(p.associateId, p.id);
    const open = openRequest(state, department.id, p.id);
    if (open) save("enrollmentRequests", { ...open, status: "Aprovada" });
    notifyMember(p.associateId, "Inscrição realizada", `${p.name} foi inscrito(a) em ${department.name}.`);
    toast(`${p.name} adicionado(a)`);
  };
  const removeMember = (m) => confirm({ title: "Remover inscrito", message: `Remover ${m.name} de ${department.name}?`, confirmLabel: "Remover", onConfirm: () => {
    const a = state.associates.find((x) => x.id === m.associateId);
    if (a) save("associates", unenrollPerson(a, m.id, department.id));
    notifyMember(m.associateId, "Inscrição encerrada", `${m.name} foi removido(a) de ${department.name}.`);
    toast("Inscrito removido");
  } });

  const exportCsv = () => { downloadCSV(`inscritos-${department.name}.csv`, ["Nome", "Vínculo", "Responsável", "Telefone"], rows.map((m) => [m.name, m.relation, m.associateName, phoneOf(m.associateId)])); toast("Arquivo CSV gerado"); };

  const memberColumns = [
    { key: "name", label: "Inscrito", render: (m) => <span className="font-semibold">{m.name}</span> },
    { key: "relation", label: "Vínculo", render: (m) => (m.main ? "Responsável" : `${m.relation} de ${m.associateName}`) },
    { key: "phone", label: "Telefone", render: (m) => phoneOf(m.associateId) },
    { key: "since", label: "Associado desde", render: (m) => fmtDate(sinceOf(m.associateId)) },
  ];
  const requestColumns = [
    { key: "personName", label: "Solicitante", render: (r) => <span className="font-semibold">{r.personName}</span> },
    { key: "relation", label: "Vínculo", render: (r) => (r.relation === "Responsável" ? "Responsável" : `${r.relation} de ${r.associateName}`) },
    { key: "createdAt", label: "Solicitado em", render: (r) => fmtDate(r.createdAt.slice(0, 10)) },
    { key: "status", label: "Situação", render: (r) => <StatusBadge status={r.status} /> },
  ];
  const requestActions = (r) => (
    <>
      <Button className="min-h-9 px-3 text-sm" onClick={() => approve(r)}><Icon name="check" size={16} /> Aprovar</Button>
      {r.status === "Pendente" && <Button variant="secondary" className="min-h-9 px-3 text-sm" onClick={() => toWaitlist(r)}><Icon name="clock" size={16} /> Lista de espera</Button>}
      <IconButton icon="close" label="Recusar" tone="danger" size="sm" onClick={() => reject(r)} />
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader left={<SearchInput value={q} onChange={setQ} placeholder="Buscar por nome" className="max-w-md" />}>
        <Button variant="outline" onClick={exportCsv} disabled={!rows.length}><Icon name="download" size={18} /> Exportar</Button>
        <Button onClick={() => setAdding(true)}><Icon name="plus" size={18} /> Adicionar associado</Button>
      </PageHeader>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onChange={setTab} options={[{ value: "enrolled", label: `Inscritos (${members.length})` }, { value: "requests", label: `Solicitações (${pending.length})` }, { value: "waitlist", label: `Lista de espera (${waitlist.length})` }]} />
        <p className="text-sm text-muted">{cap ? <>Vagas: <strong className={full ? "text-danger" : "text-brand"}>{members.length} de {cap}</strong> preenchidas{full ? " — departamento lotado" : ""}</> : `${members.length} inscritos · sem limite definido`}</p>
      </div>
      {tab === "enrolled" && <DataTable columns={memberColumns} rows={rows} empty={<EmptyState icon="person" title="Nenhum inscrito encontrado" />} actions={(m) => <IconButton icon="trash" label="Remover do departamento" tone="danger" size="sm" onClick={() => removeMember(m)} />} />}
      {tab === "requests" && <DataTable columns={requestColumns} rows={pending.filter(matches)} empty={<EmptyState icon="clock" title="Nenhuma solicitação pendente">Quando um associado solicitar inscrição, ela aparecerá aqui para você aprovar ou colocar em lista de espera.</EmptyState>} actions={requestActions} />}
      {tab === "waitlist" && <DataTable columns={requestColumns} rows={waitlist.filter(matches)} empty={<EmptyState icon="clock" title="Lista de espera vazia" />} actions={requestActions} />}
      {adding && <AddMemberModal department={department} onClose={() => setAdding(false)} onAdd={addDirect} />}
    </div>
  );
}

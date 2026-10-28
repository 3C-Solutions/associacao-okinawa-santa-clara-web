import { useState } from "react";
import { fmtMoney } from "@/lib/data.js";
import { capacityOf, isFull, openRequest, peopleOf, seatsLeft } from "@/lib/people.js";
import { useStore, useUser } from "@/store";
import { Badge, Button, Card, EmptyState, Icon, SearchInput } from "@/components/ui";
import RequestModal from "./RequestModal.jsx";

// ---------- Associado ----------
// O associado responsável apenas SOLICITA a inscrição; quem aprova, coloca em lista de espera,
// adiciona ou remove inscritos é o departamento.
export default function MemberDepartments({ role = "member", account }) {
  const { state, save, notify, toast, confirm } = useStore();
  const user = useUser(account);
  const [enrolling, setEnrolling] = useState(null);
  const [q, setQ] = useState("");
  const associate = user.associate;
  if (!associate) return <Card><EmptyState icon="person" title="Cadastro não encontrado" /></Card>;
  const people = peopleOf(associate);
  // o dependente solicita inscrição apenas para si mesmo
  const requestable = role === "dependent" ? people.filter((p) => p.id === user.profile.personId) : people;
  const active = state.departments.filter((d) => d.active);
  const myRequests = (state.enrollmentRequests || []).filter((r) => r.associateId === associate.id && (r.status === "Pendente" || r.status === "Lista de espera"));
  const enrolled = active.filter((d) => people.some((p) => p.departmentIds.includes(d.id)));
  const withRequest = active.filter((d) => !enrolled.includes(d) && myRequests.some((r) => r.departmentId === d.id));
  const others = active.filter((d) => !enrolled.includes(d) && !withRequest.includes(d) && d.name.toLowerCase().includes(q.trim().toLowerCase()));

  const sendRequests = (department, selectedIds) => {
    const full = isFull(state, department);
    const created = selectedIds.map((id) => requestable.find((p) => p.id === id)).filter((p) => p && !p.departmentIds.includes(department.id) && !openRequest(state, department.id, p.id));
    created.forEach((p) => save("enrollmentRequests", { departmentId: department.id, associateId: associate.id, associateName: associate.name, personId: p.id, personName: p.name, relation: p.relation, status: full ? "Lista de espera" : "Pendente", createdAt: new Date().toISOString() }));
    if (created.length) {
      notify("department", "Nova solicitação de inscrição", `${created.map((p) => p.name).join(", ")} ${created.length > 1 ? "solicitaram" : "solicitou"} inscrição em ${department.name}.`, "associates", { departmentId: department.id });
      toast(full ? "Departamento lotado: você entrou na lista de espera" : "Solicitação enviada ao departamento");
    }
    setEnrolling(null);
  };

  const cancelRequests = (department) => confirm({ title: "Cancelar solicitação", message: `Cancelar as solicitações de inscrição em “${department.name}”?`, confirmLabel: "Cancelar solicitação", onConfirm: () => {
    myRequests.filter((r) => r.departmentId === department.id).forEach((r) => save("enrollmentRequests", { ...r, status: "Cancelada" }));
    toast("Solicitação cancelada");
  } });

  const DeptCard = ({ d, isEnrolled, requested }) => {
    const names = people.filter((p) => p.departmentIds.includes(d.id)).map((p) => p.name.split(" ")[0]);
    const reqs = myRequests.filter((r) => r.departmentId === d.id);
    const full = isFull(state, d);
    const left = seatsLeft(state, d);
    const unrequested = requestable.filter((p) => !p.departmentIds.includes(d.id) && !openRequest(state, d.id, p.id));
    return (
      <Card className="flex flex-col overflow-hidden">
        {d.image ? <img src={d.image} alt="" className="aspect-[2/1] w-full object-cover" /> : <div className="grid aspect-[2/1] place-items-center bg-brand-soft text-brand"><Icon name="groups" size={32} /></div>}
        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between gap-4"><h2 className="text-xl font-bold">{d.name}</h2>{isEnrolled ? <Badge tone="success">Inscrição ativa</Badge> : requested ? <Badge tone={reqs.every((r) => r.status === "Lista de espera") ? "info" : "warning"}>{reqs.every((r) => r.status === "Lista de espera") ? "Lista de espera" : "Solicitação enviada"}</Badge> : null}</div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{d.description}</p>
          <div className="mt-5 space-y-2 border-t border-divider pt-5 text-sm">
            {isEnrolled && <p><strong>Familiares inscritos:</strong> {names.join(", ")}</p>}
            {reqs.length > 0 && <p><strong>Solicitações:</strong> {reqs.map((r) => `${r.personName.split(" ")[0]} (${r.status === "Pendente" ? "aguardando aprovação" : "lista de espera"})`).join(", ")}</p>}
            <p><strong>Encontros:</strong> {d.day}, {d.time}</p>
            <p><strong>Mensalidade:</strong> {d.fee ? fmtMoney(d.fee) : "Gratuito"}</p>
            <p><strong>Vagas:</strong> {capacityOf(d) ? (full ? <span className="font-semibold text-danger">Lotado — novas solicitações entram na lista de espera</span> : `${left} de ${capacityOf(d)} disponíveis`) : "Sem limite"}</p>
          </div>
          <div className="mt-5 flex flex-col gap-2">
            {unrequested.length > 0 && <Button variant={isEnrolled || requested ? "secondary" : "primary"} className="w-full" onClick={() => setEnrolling(d)}>{full ? "Entrar na lista de espera" : "Solicitar inscrição"}</Button>}
            {requested && <Button variant="ghost" className="w-full" onClick={() => cancelRequests(d)}>Cancelar solicitação</Button>}
          </div>
          {isEnrolled && <p className="mt-3 text-xs text-muted">Para sair do departamento, fale com o responsável pelo departamento.</p>}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-10">
      <section>
        <p className="mb-6 text-sm text-muted">Departamentos em que você ou seus familiares estão inscritos. A inscrição só é efetivada após a aprovação do departamento.</p>
        {enrolled.length === 0 ? <Card><EmptyState icon="groups" title="Nenhuma inscrição ainda">Solicite a inscrição em um departamento abaixo para você ou sua família.</EmptyState></Card> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{enrolled.map((d) => <DeptCard key={d.id} d={d} isEnrolled requested={myRequests.some((r) => r.departmentId === d.id)} />)}</div>}
      </section>
      {withRequest.length > 0 && (
        <section>
          <h2 className="mb-5 text-xl font-bold">Solicitações em andamento</h2>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{withRequest.map((d) => <DeptCard key={d.id} d={d} requested />)}</div>
        </section>
      )}
      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-xl font-bold">Outros departamentos</h2><SearchInput value={q} onChange={setQ} placeholder="Buscar departamento" className="sm:w-72" /></div>
        {others.length === 0 ? <p className="text-sm text-muted">Nenhum outro departamento disponível.</p> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{others.map((d) => <DeptCard key={d.id} d={d} />)}</div>}
      </section>
      {enrolling && <RequestModal department={enrolling} people={requestable.filter((p) => !p.departmentIds.includes(enrolling.id) && !openRequest(state, enrolling.id, p.id))} full={isFull(state, enrolling)} onClose={() => setEnrolling(null)} onSave={(ids) => sendRequests(enrolling, ids)} />}
    </div>
  );
}

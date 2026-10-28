import { fmtMoney } from "@/lib/data.js";
import { capacityOf, membersOf } from "@/lib/people.js";
import { useStore } from "@/store";
import { Button, Modal } from "@/components/ui";

export default function DepartmentDetails({ department, onClose }) {
  const { state } = useStore();
  if (!department) return null;
  const members = membersOf(state, department.id);
  return (
    <Modal title={department.name} onClose={onClose} footer={<Button onClick={onClose}>Fechar</Button>}>
      {department.image && <img src={department.image} alt="" className="aspect-video w-full rounded-xl object-cover" />}
      <p className="mt-4 leading-relaxed text-muted">{department.description}</p>
      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-divider pt-5 text-sm">
        <div><dt className="text-muted">Encontros</dt><dd className="font-semibold">{department.day}, {department.time}</dd></div>
        <div><dt className="text-muted">Responsável</dt><dd className="font-semibold">{department.teacher}</dd></div>
        <div><dt className="text-muted">Mensalidade</dt><dd className="font-semibold">{department.fee ? fmtMoney(department.fee) : "Gratuito"}</dd></div>
        <div><dt className="text-muted">Situação</dt><dd className="font-semibold">{department.active ? "Ativo" : "Inativo"}</dd></div>
        <div><dt className="text-muted">Vagas</dt><dd className="font-semibold">{members.length} de {capacityOf(department) || "—"} preenchidas</dd></div>
      </dl>
      <h3 className="mb-2 mt-6 font-bold">Inscritos ({members.length})</h3>
      {members.length === 0 ? <p className="text-sm text-muted">Ninguém inscrito ainda.</p> : (
        <ul className="divide-y divide-divider rounded-lg border border-divider text-sm">
          {members.map((m) => <li key={m.id} className="flex justify-between gap-3 px-4 py-2.5"><span className="font-semibold">{m.name}</span><span className="text-muted">{m.main ? "Responsável" : `${m.relation} de ${m.associateName}`}</span></li>)}
        </ul>
      )}
    </Modal>
  );
}

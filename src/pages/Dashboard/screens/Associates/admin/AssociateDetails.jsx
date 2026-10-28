import { fmtDate } from "@/lib/data.js";
import { familyLabel, familyOf, formatAddress, peopleOf } from "@/lib/people.js";
import { useStore } from "@/store";
import { Badge, Button, Icon, Modal } from "@/components/ui";
import { deptNames } from "../helpers.js";

export default function AssociateDetails({ associate, onClose, onEdit }) {
  const { state } = useStore();
  const people = peopleOf(associate);
  const family = familyOf(state, associate);
  return (
    <Modal title={associate.name} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Fechar</Button><Button onClick={onEdit}><Icon name="edit" size={18} /> Editar</Button></>}>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="text-muted">E-mail</dt><dd className="font-semibold">{associate.email}</dd></div>
        <div><dt className="text-muted">Telefone</dt><dd className="font-semibold">{associate.phone}</dd></div>
        <div className="sm:col-span-2"><dt className="text-muted">Família</dt><dd className="font-semibold">{familyLabel(family)}{family ? ` — ${formatAddress(family)}` : ""}</dd></div>
        <div><dt className="text-muted">Associado desde</dt><dd className="font-semibold">{fmtDate(associate.since)}</dd></div>
      </dl>
      <h3 className="mb-2 mt-6 font-bold">Família e inscrições</h3>
      <ul className="divide-y divide-divider rounded-lg border border-divider text-sm">
        {people.map((p) => (
          <li key={p.id} className="px-4 py-3"><div className="flex justify-between gap-3"><span className="font-semibold">{p.name}</span><Badge tone="info">{p.relation}</Badge></div><p className="mt-1 text-xs text-muted">{deptNames(state, p.departmentIds).join(", ") || "Sem inscrições"}</p></li>
        ))}
      </ul>
    </Modal>
  );
}

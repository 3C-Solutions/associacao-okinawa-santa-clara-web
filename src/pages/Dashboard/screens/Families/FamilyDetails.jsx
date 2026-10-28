import { associateOfFamily, formatAddress, peopleOf } from "@/lib/people.js";
import { useStore } from "@/store";
import { Badge, Button, Icon, Modal } from "@/components/ui";
import { deptNames } from "../Associates/helpers.js";

export default function FamilyDetails({ family, onClose, onEdit }) {
  const { state } = useStore();
  const associate = associateOfFamily(state, family.id);
  const people = associate ? peopleOf(associate) : [];
  return (
    <Modal title={`Família ${family.surname}`} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Fechar</Button><Button onClick={onEdit}><Icon name="edit" size={18} /> Editar</Button></>}>
      <dl className="grid gap-4 text-sm">
        <div><dt className="text-muted">Endereço</dt><dd className="font-semibold">{formatAddress(family) || "—"}</dd></div>
        <div><dt className="text-muted">Associado responsável</dt><dd className="font-semibold">{associate ? associate.name : "Ainda não cadastrado"}</dd></div>
      </dl>
      <h3 className="mb-2 mt-6 font-bold">Membros</h3>
      {people.length === 0 ? (
        <p className="rounded-lg border border-dashed border-divider px-4 py-5 text-sm text-muted">Nenhum membro ainda. Cadastre o associado responsável em Usuários, selecionando esta família.</p>
      ) : (
        <ul className="divide-y divide-divider rounded-lg border border-divider text-sm">
          {people.map((p) => (
            <li key={p.id} className="px-4 py-3"><div className="flex justify-between gap-3"><span className="font-semibold">{p.name}</span><Badge tone="info">{p.relation}</Badge></div><p className="mt-1 text-xs text-muted">{deptNames(state, p.departmentIds).join(", ") || "Sem inscrições"}</p></li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

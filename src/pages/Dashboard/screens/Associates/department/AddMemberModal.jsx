import { useState } from "react";
import { allPeople, capacityOf, openRequest, seatsLeft } from "@/lib/people.js";
import { useStore } from "@/store";
import { Badge, Button, Modal, SearchInput, StatusBadge } from "@/components/ui";

// Lista completa de associados e familiares, com filtro por nome
export default function AddMemberModal({ department, onClose, onAdd }) {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const left = seatsLeft(state, department);
  const list = allPeople(state)
    .filter((p) => !term || `${p.name} ${p.associateName}`.toLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Modal size="lg" title={`Adicionar a ${department.name}`} onClose={onClose} footer={<Button onClick={onClose}>Concluir</Button>}>
      <SearchInput value={q} onChange={setQ} placeholder="Filtrar por nome" />
      <p className="mb-3 mt-3 text-xs text-muted">{capacityOf(department) ? (left === 0 ? "Departamento lotado: não é possível adicionar mais inscritos." : `${left} ${left === 1 ? "vaga disponível" : "vagas disponíveis"}.`) : "Sem limite de vagas definido."}</p>
      {list.length === 0 ? <p className="py-6 text-center text-sm text-muted">Nenhum associado encontrado.</p> : (
        <ul className="divide-y divide-divider rounded-lg border border-divider text-sm">
          {list.map((p) => {
            const already = p.departmentIds.includes(department.id);
            const open = openRequest(state, department.id, p.id);
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span><span className="font-semibold">{p.name}</span><span className="block text-xs text-muted">{p.main ? "Responsável" : `${p.relation} de ${p.associateName}`}</span></span>
                {already ? <Badge tone="success">Inscrito</Badge> : (
                  <span className="flex items-center gap-2">
                    {open && <StatusBadge status={open.status} />}
                    <Button variant="secondary" className="min-h-9 px-4 text-sm" disabled={left === 0} onClick={() => onAdd(p)}>Adicionar</Button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}

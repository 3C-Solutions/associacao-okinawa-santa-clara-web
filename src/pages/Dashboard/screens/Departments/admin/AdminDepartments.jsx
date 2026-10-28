import { useState } from "react";
import { capacityOf, countInDepartment } from "@/lib/people.js";
import { useStore } from "@/store";
import { Badge, Button, Card, EmptyState, Icon, IconButton, PageHeader, SearchInput, Toggle } from "@/components/ui";
import DepartmentDetails from "./DepartmentDetails.jsx";
import DepartmentForm from "./DepartmentForm.jsx";

// ---------- Diretoria ----------
export default function AdminDepartments() {
  const { state, save, remove, toast, confirm } = useStore();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const list = state.departments.filter((d) => d.name.toLowerCase().includes(q.trim().toLowerCase()));

  const del = (d) => confirm({ title: "Excluir departamento", message: `Excluir “${d.name}”? As inscrições dos associados nesse departamento também serão removidas.`, onConfirm: () => { remove("departments", d.id); toast("Departamento excluído"); } });
  const toggleActive = (d) => { save("departments", { ...d, active: !d.active }); toast(d.active ? "Departamento desativado" : "Departamento ativado"); };

  return (
    <div>
      <PageHeader left={<SearchInput value={q} onChange={setQ} placeholder="Buscar departamento" className="max-w-md" />}>
        <Button onClick={() => setEditing({ name: "", description: "", day: "Quarta-feira", time: "19:00", teacher: "", fee: "0", capacity: "20", active: true, image: "" })}><Icon name="plus" size={18} /> Novo departamento</Button>
      </PageHeader>
      {list.length === 0 ? <Card><EmptyState icon="groups" title="Nenhum departamento encontrado" /></Card> : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {list.map((d) => (
            <Card key={d.id} className="flex flex-col overflow-hidden">
              {d.image ? <img src={d.image} alt="" className="aspect-[2/1] w-full object-cover" /> : <div className="grid aspect-[2/1] place-items-center bg-brand-soft text-brand"><Icon name="groups" size={32} /></div>}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="text-xl font-bold">{d.name}</h2><p className="mt-1 text-sm text-muted">{countInDepartment(state, d.id)}/{capacityOf(d) || "∞"} inscritos · {d.day}, {d.time}</p></div>
                  <Badge tone={d.active ? "success" : "danger"}>{d.active ? "Ativo" : "Inativo"}</Badge>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                  <Button variant="secondary" className="min-h-9 px-4 text-sm" onClick={() => setViewing(d)}>Ver detalhes</Button>
                  <div className="flex items-center gap-1">
                    <Toggle checked={d.active} onChange={() => toggleActive(d)} label={d.active ? "Desativar" : "Ativar"} />
                    <IconButton icon="edit" label="Editar" size="sm" onClick={() => setEditing({ ...d, fee: String(d.fee), capacity: String(capacityOf(d) || "") })} />
                    <IconButton icon="trash" label="Excluir" tone="danger" size="sm" onClick={() => del(d)} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {editing && <DepartmentForm department={editing} enrolled={editing.id ? countInDepartment(state, editing.id) : 0} onClose={() => setEditing(null)} onSave={(d) => { save("departments", { ...d, fee: Number(d.fee), capacity: Number(d.capacity) }); toast(d.id ? "Departamento atualizado" : "Departamento criado"); setEditing(null); }} />}
      {viewing && <DepartmentDetails department={state.departments.find((d) => d.id === viewing.id)} onClose={() => setViewing(null)} />}
    </div>
  );
}

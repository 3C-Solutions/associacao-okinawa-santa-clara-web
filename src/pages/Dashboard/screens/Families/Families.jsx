import { useMemo, useState } from "react";
import { associateOfFamily, familyLabel, formatAddress } from "@/lib/people.js";
import { useStore } from "@/store";
import { Button, DataTable, EmptyState, Icon, IconButton, SearchInput } from "@/components/ui";
import FamilyDetails from "./FamilyDetails.jsx";
import FamilyForm from "./FamilyForm.jsx";

const NEW_FAMILY = { surname: "", address: "", number: "", complement: "", district: "", city: "", uf: "", cep: "" };

// ---------- Diretoria ----------
// Primeiro passo do cadastro: a família (sobrenome + endereço). O associado responsável só pode ser cadastrado depois, escolhendo uma família.
export default function Families() {
  const { state, save, remove, toast, confirm } = useStore();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.families
      .map((f) => {
        const associate = associateOfFamily(state, f.id);
        return { ...f, label: familyLabel(f), addressText: formatAddress(f), associate, members: associate ? 1 + associate.dependents.length : 0 };
      })
      .filter((f) => !term || `${f.surname} ${f.addressText} ${f.associate?.name || ""}`.toLowerCase().includes(term))
      .sort((a, b) => a.surname.localeCompare(b.surname));
  }, [state, q]);

  const del = (f) => {
    if (f.members > 0) { toast("Esta família ainda tem membros. Exclua o associado responsável antes de excluir a família.", "error"); return; }
    confirm({ title: "Excluir família", message: `Excluir a ${f.label}? Essa ação não pode ser desfeita.`, onConfirm: () => { remove("families", f.id); toast("Família excluída"); } });
  };

  const columns = [
    { key: "label", label: "Família", render: (f) => <span className="font-semibold">{f.label}</span> },
    { key: "addressText", label: "Endereço", render: (f) => <span className="text-muted">{f.addressText || "—"}</span> },
    { key: "associate", label: "Associado responsável", render: (f) => (f.associate ? f.associate.name : <span className="text-muted">Sem responsável</span>) },
    { key: "members", label: "Membros" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por sobrenome ou endereço" className="flex-1 sm:max-w-md" />
        <Button onClick={() => setEditing(NEW_FAMILY)}><Icon name="plus" size={18} /> Nova família</Button>
      </div>
      <p className="text-sm text-muted">{rows.length} {rows.length === 1 ? "família encontrada" : "famílias encontradas"}.</p>
      <DataTable
        columns={columns}
        rows={rows}
        empty={<EmptyState icon="groups" title="Nenhuma família encontrada">Cadastre a família primeiro: depois é possível cadastrar o associado responsável nela.</EmptyState>}
        actions={(f) => (
          <>
            <IconButton icon="eye" label={`Ver ${f.label}`} size="sm" onClick={() => setViewing(f)} />
            <IconButton icon="edit" label={`Editar ${f.label}`} size="sm" onClick={() => setEditing(f)} />
            <IconButton icon="trash" label={`Excluir ${f.label}`} tone="danger" size="sm" onClick={() => del(f)} />
          </>
        )}
      />
      {editing && <FamilyForm family={editing} onClose={() => setEditing(null)} onSave={(f) => { save("families", f); toast(f.id ? "Família atualizada" : "Família cadastrada"); setEditing(null); }} />}
      {viewing && <FamilyDetails family={state.families.find((f) => f.id === viewing.id) || viewing} onClose={() => setViewing(null)} onEdit={() => { setEditing(state.families.find((f) => f.id === viewing.id)); setViewing(null); }} />}
    </div>
  );
}

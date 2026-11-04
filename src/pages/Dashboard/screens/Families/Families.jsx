import { useMemo, useState } from "react";
import { associadoDaFamilia, rotuloFamilia, formatarEndereco } from "@/lib/people.js";
import { usarArmazenamento } from "@/store";
import { Botao, TabelaDados, EstadoVazio, Icone, BotaoIcone, EntradaBusca } from "@/components/ui";
import DetalhesFamilia from "./FamilyDetails.jsx";
import FormularioFamilia, { NOVA_FAMILIA } from "./FamilyForm.jsx";

export default function Familias() {
  const { state: dadosAplicacao, save: salvar, remove: remover, toast: aviso, confirm: confirmar } = usarArmazenamento();
  const [consulta, definirConsulta] = useState("");
  const [editando, definirEditando] = useState(null);
  const [visualizando, definirVisualizando] = useState(null);

  const linhas = useMemo(() => {
    const termo = consulta.trim().toLowerCase();
    return dadosAplicacao.families
      .map((elementoF) => {
        const associado = associadoDaFamilia(dadosAplicacao, elementoF.id);
        return { ...elementoF, label: rotuloFamilia(elementoF), addressText: formatarEndereco(elementoF), associate: associado, members: associado ? 1 + associado.dependents.length : 0 };
      })
      .filter((elementoF) => !termo || `${elementoF.surname} ${elementoF.addressText} ${elementoF.associate?.name || ""}`.toLowerCase().includes(termo))
      .sort((elementoA, elementoB) => elementoA.surname.localeCompare(elementoB.surname));
  }, [dadosAplicacao, consulta]);

  const excluir = (elementoF) => {
    if (elementoF.members > 0) { aviso("Esta família ainda tem membros. Exclua o associado responsável antes de excluir a família.", "error"); return; }
    if (Object.values(dadosAplicacao.profiles).some((perfil) => perfil.familyId === elementoF.id)) { aviso("Esta família está vinculada a um usuário. Altere o vínculo antes de excluí-la.", "error"); return; }
    confirmar({ title: "Excluir família", message: `Excluir a ${elementoF.label}? Essa ação não pode ser desfeita.`, onConfirm: () => { remover("families", elementoF.id); aviso("Família excluída"); } });
  };

  const colunas = [
    { key: "label", label: "Família", render: (elementoF) => <span className="font-semibold">{elementoF.label}</span> },
    { key: "addressText", label: "Endereço", render: (elementoF) => <span className="text-muted">{elementoF.addressText || "—"}</span> },
    { key: "associate", label: "Associado responsável", render: (elementoF) => (elementoF.associate ? elementoF.associate.name : <span className="text-muted">Sem responsável</span>) },
    { key: "members", label: "Membros" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <EntradaBusca value={consulta} onChange={definirConsulta} placeholder="Buscar por sobrenome ou endereço" className="flex-1 sm:max-w-md" />
        <Botao onClick={() => definirEditando(NOVA_FAMILIA)}><Icone name="plus" size={18} /> Nova família</Botao>
      </div>
      <p className="text-sm text-muted">{linhas.length} {linhas.length === 1 ? "família encontrada" : "famílias encontradas"}.</p>
      <p className="rounded-lg bg-brand-soft px-4 py-3 text-sm text-brand">Novas famílias são cadastradas na API. A listagem, edição e exclusão ainda usam os dados locais, pois essas operações não estão disponíveis no backend.</p>
      <TabelaDados
        columns={colunas}
        rows={linhas}
        empty={<EstadoVazio icon="groups" title="Nenhuma família encontrada">Cadastre a família primeiro: depois é possível cadastrar o associado responsável nela.</EstadoVazio>}
        actions={(elementoF) => (
          <>
            <BotaoIcone icon="eye" label={`Ver ${elementoF.label}`} size="sm" onClick={() => definirVisualizando(elementoF)} />
            <BotaoIcone icon="edit" label={elementoF.apiManaged ? `Edição indisponível para ${elementoF.label}` : `Editar ${elementoF.label}`} size="sm" disabled={elementoF.apiManaged} onClick={() => definirEditando(elementoF)} />
            <BotaoIcone icon="trash" label={elementoF.apiManaged ? `Exclusão indisponível para ${elementoF.label}` : `Excluir ${elementoF.label}`} tone="danger" size="sm" disabled={elementoF.apiManaged} onClick={() => excluir(elementoF)} />
          </>
        )}
      />
      {editando && <FormularioFamilia family={editando} onClose={() => definirEditando(null)} onSave={(elementoF) => { salvar("families", elementoF); aviso(elementoF.id ? "Família atualizada" : "Família cadastrada"); definirEditando(null); }} />}
      {visualizando && <DetalhesFamilia family={dadosAplicacao.families.find((elementoF) => elementoF.id === visualizando.id) || visualizando} onClose={() => definirVisualizando(null)} onEdit={() => { definirEditando(dadosAplicacao.families.find((elementoF) => elementoF.id === visualizando.id)); definirVisualizando(null); }} />}
    </div>
  );
}

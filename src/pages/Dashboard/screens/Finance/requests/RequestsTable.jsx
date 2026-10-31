import { useState } from "react";
import { formatarData, formatarMoeda } from "@/lib/data.js";
import { Botao, TabelaDados, EstadoVazio, BotaoIcone, CampoSelecao, SeloStatus } from "@/components/ui";
import ModalRevisao from "./ReviewModal.jsx";
import { estaAberto } from "./helpers.js";

export default function TabelaSolicitacoes({ items: itens, canReview: podeRevisar, showOwner: exibirResponsavel = true }) {
  const [filtro, definirFiltro] = useState("Todos");
  const [identificadorVisualizado, definirIdentificadorVisualizado] = useState(null);
  const linhas = itens.filter((resultado) => filtro === "Todos" || (filtro === "Pendentes" ? estaAberto(resultado) : !estaAberto(resultado))).sort((elementoA, elementoB) => Number(estaAberto(elementoB)) - Number(estaAberto(elementoA)));
  const visualizando = itens.find((resultado) => resultado.id === identificadorVisualizado);
  const colunas = [
    { key: "createdAt", label: "Enviado em", render: (resultado) => formatarData(resultado.createdAt.slice(0, 10)) },
    ...(exibirResponsavel ? [{ key: "ownerName", label: "Solicitante", render: (resultado) => <span className="font-semibold">{resultado.ownerName}</span> }] : []),
    { key: "title", label: "Tipo", render: (resultado) => (resultado.type === "payment" ? `${resultado.title} · ${resultado.period}` : resultado.title) },
    { key: "amount", label: "Valor", render: (resultado) => <span className="whitespace-nowrap font-semibold">{formatarMoeda(resultado.amount)}</span> },
    { key: "status", label: "Status", render: (resultado) => <SeloStatus status={resultado.status} /> },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{itens.filter(estaAberto).length} aguardando verificação · {itens.length} no total</p>
        <CampoSelecao label="" value={filtro} onChange={definirFiltro} options={["Todos", "Pendentes", "Concluídos"]} className="w-48 [&>span:first-child]:hidden" />
      </div>
      <TabelaDados
        columns={colunas}
        rows={linhas}
        empty={<EstadoVazio icon="wallet" title="Nada por aqui">{podeRevisar ? "Nenhum envio para verificar." : "Você ainda não enviou pagamentos ou reembolsos."}</EstadoVazio>}
        actions={(resultado) => (podeRevisar && estaAberto(resultado) ? <Botao className="min-h-9 px-3 text-sm" onClick={() => definirIdentificadorVisualizado(resultado.id)}>Verificar</Botao> : <BotaoIcone icon="eye" label="Ver detalhes" size="sm" onClick={() => definirIdentificadorVisualizado(resultado.id)} />)}
      />
      {visualizando && <ModalRevisao item={visualizando} canReview={podeRevisar} onClose={() => definirIdentificadorVisualizado(null)} />}
    </div>
  );
}

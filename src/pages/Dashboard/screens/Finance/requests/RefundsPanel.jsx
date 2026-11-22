import { useCallback, useEffect, useMemo, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { Botao, CampoAreaTexto, EstadoVazio, Modal, SeloStatus, TabelaDados } from "@/components/ui";
import { formatarData, formatarMoeda } from "@/lib/data.js";
import { usarArmazenamento } from "@/store";
import VisualizacaoComprovante from "@/pages/Dashboard/components/ReceiptView.jsx";
import { criarServicoReembolsos } from "@/services/reembolsosApi.js";

function ModalAnalise({ item, aoFechar, aoRevisar, ocupado }) {
  const [recusando, definirRecusando] = useState(false);
  const [motivo, definirMotivo] = useState("");
  const [erro, definirErro] = useState("");

  const revisar = async (status) => {
    if (status === "Recusado" && motivo.trim().length < 3) {
      definirErro("Informe o motivo da recusa.");
      return;
    }
    definirErro("");
    try {
      await aoRevisar(item, status, motivo.trim());
      aoFechar();
    } catch (falha) {
      definirErro(falha.message);
    }
  };

  const rodape = item.status === "Pendente"
    ? recusando
      ? <><Botao variant="outline" disabled={ocupado} onClick={() => { definirRecusando(false); definirErro(""); }}>Voltar</Botao><Botao variant="danger" disabled={ocupado} onClick={() => revisar("Recusado")}>{ocupado ? "Salvando..." : "Confirmar recusa"}</Botao></>
      : <><Botao variant="outline" disabled={ocupado} onClick={aoFechar}>Fechar</Botao><Botao variant="danger" disabled={ocupado} onClick={() => definirRecusando(true)}>Recusar</Botao><Botao disabled={ocupado} onClick={() => revisar("Aprovado")}>{ocupado ? "Salvando..." : "Aprovar e criar despesa pendente"}</Botao></>
    : <Botao onClick={aoFechar}>Fechar</Botao>;

  return <Modal title={`Reembolso — ${item.solicitante}`} onClose={aoFechar} footer={rodape}>
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      <div><dt className="text-muted">Solicitante</dt><dd className="font-semibold">{item.solicitante}</dd></div>
      <div><dt className="text-muted">Perfil</dt><dd className="font-semibold">{item.funcaoSolicitante}</dd></div>
      <div><dt className="text-muted">Status</dt><dd className="mt-1"><SeloStatus status={item.status} /></dd></div>
      <div><dt className="text-muted">Solicitado em</dt><dd className="font-semibold">{formatarData(item.dataSolicitacao.slice(0, 10))}</dd></div>
      <div><dt className="text-muted">Valor</dt><dd className="font-semibold">{formatarMoeda(item.valor)}</dd></div>
      <div className="sm:col-span-2"><dt className="text-muted">Motivo</dt><dd className="font-semibold">{item.motivo}</dd></div>
    </dl>
    {item.motivoRecusa && <p className="mt-4 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger"><strong>Motivo da recusa:</strong> {item.motivoRecusa}</p>}
    <h3 className="mb-2 mt-6 font-bold">Comprovante</h3>
    <VisualizacaoComprovante receipt={{ name: item.comprovante.nome, type: item.comprovante.tipo, data: item.comprovante.dados }} />
    {recusando && <div className="mt-5"><CampoAreaTexto label="Motivo da recusa" rows={3} value={motivo} onChange={(valor) => { definirMotivo(valor); definirErro(""); }} error={erro} required maxLength={500} /></div>}
    {erro && !recusando && <p role="alert" className="mt-4 text-sm text-danger">{erro}</p>}
  </Modal>;
}

export default function PainelReembolsos() {
  const { requisitar } = usarAutenticacao();
  const { toast: aviso } = usarArmazenamento();
  const api = useMemo(() => criarServicoReembolsos(requisitar), [requisitar]);
  const [itens, definirItens] = useState([]);
  const [carregando, definirCarregando] = useState(true);
  const [salvando, definirSalvando] = useState(false);
  const [erro, definirErro] = useState("");
  const [idEmAnalise, definirIdEmAnalise] = useState(null);
  const [filtro, definirFiltro] = useState("Todos");

  const carregar = useCallback(async (signal) => {
    const resultado = await api.listar({ signal });
    if (!Array.isArray(resultado)) throw new Error("O serviço retornou uma lista de reembolsos inválida.");
    definirItens(resultado);
    definirErro("");
  }, [api]);

  useEffect(() => {
    const controle = new AbortController();
    definirCarregando(true);
    carregar(controle.signal)
      .catch((falha) => { if (!controle.signal.aborted) definirErro(falha.message); })
      .finally(() => { if (!controle.signal.aborted) definirCarregando(false); });
    return () => controle.abort();
  }, [carregar]);

  const revisar = async (item, status, motivo) => {
    setSalvando(true);
    definirErro("");
    try {
      if (status === "Aprovado") await api.aprovar(item.id);
      else await api.recusar(item.id, motivo);
      aviso(status === "Aprovado" ? "Reembolso aprovado; despesa pendente criada" : "Solicitação recusada");
      try {
        await carregar();
      } catch (falha) {
        definirErro(`Solicitação atualizada, mas a lista não pôde ser atualizada: ${falha.message}`);
      }
    } finally {
      setSalvando(false);
    }
  };

  const visiveis = useMemo(() => itens
    .filter((item) => filtro === "Todos" || (filtro === "Pendentes" ? item.status === "Pendente" : item.status !== "Pendente"))
    .sort((a, b) => b.dataSolicitacao.localeCompare(a.dataSolicitacao)), [itens, filtro]);
  const atual = itens.find((item) => item.id === idEmAnalise);
  const pendentes = itens.filter((item) => item.status === "Pendente").length;
  const colunas = [
    { key: "dataSolicitacao", label: "Solicitado em", render: (item) => formatarData(item.dataSolicitacao.slice(0, 10)) },
    { key: "solicitante", label: "Solicitante", render: (item) => <div><p className="font-semibold">{item.solicitante}</p><p className="text-xs text-muted">{item.funcaoSolicitante}</p></div> },
    { key: "motivo", label: "Motivo", render: (item) => <span className="font-medium">{item.motivo}</span> },
    { key: "valor", label: "Valor", render: (item) => <span className="whitespace-nowrap font-semibold">{formatarMoeda(item.valor)}</span> },
    { key: "status", label: "Status", render: (item) => <div className="space-y-1"><SeloStatus status={item.status} />{item.status === "Aprovado" && <p className="text-xs text-muted">Aguardando pagamento</p>}</div> },
  ];

  return <section className="space-y-5" aria-label="Solicitações de reembolso">
    <div>
      <h2 className="text-lg font-bold">Reembolsos</h2>
      <p className="mt-1 text-sm text-muted">{pendentes} aguardando análise. Ao aprovar, a despesa entra como pendente nos lançamentos financeiros.</p>
    </div>
    {erro && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{erro}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">{visiveis.length} {visiveis.length === 1 ? "solicitação" : "solicitações"}</p>
      <div className="flex gap-2" aria-label="Filtrar reembolsos">
        {["Todos", "Pendentes", "Concluídos"].map((opcao) => <button key={opcao} type="button" aria-pressed={filtro === opcao} onClick={() => definirFiltro(opcao)} className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${filtro === opcao ? "bg-brand text-white" : "bg-canvas text-ink hover:bg-brand-soft"}`}>{opcao}</button>)}
      </div>
    </div>
    {carregando ? <p role="status" className="text-sm text-muted">Carregando solicitações...</p> : <TabelaDados
      columns={colunas}
      rows={visiveis}
      empty={<EstadoVazio icon="wallet" title="Nenhuma solicitação encontrada">As solicitações enviadas por outros perfis aparecerão aqui.</EstadoVazio>}
      actions={(item) => item.status === "Pendente"
        ? <Botao className="min-h-9 px-3 text-sm" disabled={salvando} onClick={() => definirIdEmAnalise(item.id)}>Analisar</Botao>
        : <Botao className="min-h-9 px-3 text-sm" variant="outline" onClick={() => definirIdEmAnalise(item.id)}>Detalhes</Botao>}
    />}
    {atual && <ModalAnalise item={atual} aoFechar={() => definirIdEmAnalise(null)} aoRevisar={revisar} ocupado={salvando} />}
  </section>;
}

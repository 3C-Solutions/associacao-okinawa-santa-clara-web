import { useEffect, useMemo, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { Botao, Campo, CampoAreaTexto, EstadoVazio, Modal, SeloStatus, TabelaDados } from "@/components/ui";
import { formatarData, formatarMoeda, identificadorUnico } from "@/lib/data.js";
import { atualizarReembolsos, lerReembolsos, observarReembolsos, reembolsosVisiveis, usuarioEhFinanceiro } from "@/lib/refunds.js";
import { usarArmazenamento } from "@/store";
import CampoComprovante from "@/pages/Dashboard/components/ReceiptField.jsx";
import VisualizacaoComprovante from "@/pages/Dashboard/components/ReceiptView.jsx";
import { validarReembolso } from "./refundHelpers.js";

function ModalSolicitacao({ usuario, aoFechar, aoEnviar }) {
  const [formulario, definirFormulario] = useState({ reason: "", amount: "", receipt: null });
  const [erros, definirErros] = useState({});
  const [erro, definirErro] = useState("");
  const [salvando, definirSalvando] = useState(false);

  const definir = (campo) => (valor) => {
    definirFormulario((atual) => ({ ...atual, [campo]: valor }));
    definirErros((atual) => ({ ...atual, [campo]: undefined }));
    definirErro("");
  };
  const enviar = () => {
    const resultado = validarReembolso(formulario);
    definirErros(resultado.erros);
    if (Object.keys(resultado.erros).length) return;
    definirSalvando(true);
    try {
      aoEnviar({
        id: identificadorUnico(),
        ownerId: usuario.id,
        ownerName: usuario.nome,
        ownerRole: usuario.funcaoSistema.nome,
        reason: formulario.reason.trim(),
        amount: resultado.valor,
        receipt: formulario.receipt,
        status: "Pendente",
        createdAt: new Date().toISOString(),
      });
      aoFechar();
    } catch (falha) {
      definirErro(falha.message);
    } finally {
      definirSalvando(false);
    }
  };

  return <Modal title="Solicitar reembolso" onClose={aoFechar} footer={<><Botao variant="outline" disabled={salvando} onClick={aoFechar}>Cancelar</Botao><Botao disabled={salvando} onClick={enviar}>{salvando ? "Enviando..." : "Enviar solicitação"}</Botao></>}>
    <div className="space-y-4">
      <p className="text-sm text-muted">A solicitação será enviada ao Financeiro para análise.</p>
      <CampoAreaTexto label="Motivo" rows={3} value={formulario.reason} onChange={definir("reason")} error={erros.reason} placeholder="Descreva a despesa que deve ser reembolsada" required maxLength={500} />
      <Campo label="Valor (R$)" type="number" min="0.01" step="0.01" value={formulario.amount} onChange={definir("amount")} error={erros.amount} required />
      <CampoComprovante value={formulario.receipt} onChange={definir("receipt")} error={erros.receipt} />
      {erro && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{erro}</p>}
      <p className="text-xs text-muted">Protótipo: a solicitação e o comprovante ficam salvos apenas neste navegador.</p>
    </div>
  </Modal>;
}

function ModalAnalise({ item, aoFechar, aoRevisar }) {
  const [recusando, definirRecusando] = useState(false);
  const [motivo, definirMotivo] = useState("");
  const [erro, definirErro] = useState("");
  const revisar = (status) => {
    if (status === "Recusado" && motivo.trim().length < 3) {
      definirErro("Informe o motivo da recusa.");
      return;
    }
    try {
      aoRevisar(item, status, motivo.trim());
      aoFechar();
    } catch (falha) {
      definirErro(falha.message);
    }
  };
  return <Modal title={`Reembolso — ${item.ownerName}`} onClose={aoFechar} footer={item.status === "Pendente"
    ? recusando
      ? <><Botao variant="outline" onClick={() => { definirRecusando(false); definirErro(""); }}>Voltar</Botao><Botao variant="danger" onClick={() => revisar("Recusado")}>Confirmar recusa</Botao></>
      : <><Botao variant="outline" onClick={aoFechar}>Fechar</Botao><Botao variant="danger" onClick={() => definirRecusando(true)}>Recusar</Botao><Botao onClick={() => revisar("Pago")}>Aprovar e marcar como pago</Botao></>
    : <Botao onClick={aoFechar}>Fechar</Botao>}>
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      <div><dt className="text-muted">Solicitante</dt><dd className="font-semibold">{item.ownerName}</dd></div>
      <div><dt className="text-muted">Perfil</dt><dd className="font-semibold">{item.ownerRole}</dd></div>
      <div><dt className="text-muted">Status</dt><dd className="mt-1"><SeloStatus status={item.status} /></dd></div>
      <div><dt className="text-muted">Solicitado em</dt><dd className="font-semibold">{formatarData(item.createdAt.slice(0, 10))}</dd></div>
      <div><dt className="text-muted">Valor</dt><dd className="font-semibold">{formatarMoeda(item.amount)}</dd></div>
      <div className="sm:col-span-2"><dt className="text-muted">Motivo</dt><dd className="font-semibold">{item.reason}</dd></div>
    </dl>
    {item.rejectReason && <p className="mt-4 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger"><strong>Motivo da recusa:</strong> {item.rejectReason}</p>}
    <h3 className="mb-2 mt-6 font-bold">Comprovante</h3>
    <VisualizacaoComprovante receipt={item.receipt} />
    {recusando && <div className="mt-5"><CampoAreaTexto label="Motivo da recusa" rows={3} value={motivo} onChange={(valor) => { definirMotivo(valor); definirErro(""); }} error={erro} required maxLength={500} /></div>}
    {erro && !recusando && <p role="alert" className="mt-4 text-sm text-danger">{erro}</p>}
  </Modal>;
}

export default function PainelReembolsos() {
  const { usuario } = usarAutenticacao();
  const { toast: aviso } = usarArmazenamento();
  const podeRevisar = usuarioEhFinanceiro(usuario.funcaoSistema.nome);
  const [itens, definirItens] = useState([]);
  const [carregando, definirCarregando] = useState(true);
  const [erro, definirErro] = useState("");
  const [solicitando, definirSolicitando] = useState(false);
  const [idEmAnalise, definirIdEmAnalise] = useState(null);
  const [filtro, definirFiltro] = useState("Todos");

  const atualizar = () => {
    try {
      definirItens(lerReembolsos());
      definirErro("");
    } catch (falha) {
      definirErro(falha.message);
    } finally {
      definirCarregando(false);
    }
  };
  useEffect(() => {
    atualizar();
    return observarReembolsos(atualizar);
  }, []);

  const visiveis = useMemo(() => reembolsosVisiveis(itens, usuario.id, podeRevisar)
    .filter((item) => filtro === "Todos" || (filtro === "Pendentes" ? item.status === "Pendente" : item.status !== "Pendente"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [itens, usuario.id, podeRevisar, filtro]);
  const atual = itens.find((item) => item.id === idEmAnalise);

  const enviar = (item) => {
    atualizarReembolsos((lista) => [...lista, item]);
    aviso("Solicitação enviada ao Financeiro");
  };
  const revisar = (item, status, motivo) => {
    if (!podeRevisar || String(item.ownerId) === String(usuario.id)) throw new Error("Você não pode revisar esta solicitação.");
    const atualizados = atualizarReembolsos((lista) => {
      const encontrada = lista.find((resultado) => resultado.id === item.id);
      if (!encontrada || encontrada.status !== "Pendente") throw new Error("Esta solicitação já foi atualizada. Recarregue a lista.");
      return lista.map((resultado) => resultado.id === item.id
        ? { ...resultado, status, reviewedAt: new Date().toISOString(), ...(status === "Recusado" ? { rejectReason: motivo } : {}) }
        : resultado);
    });
    definirItens(atualizados);
    aviso(status === "Pago" ? "Reembolso aprovado e marcado como pago" : "Reembolso recusado");
  };

  const colunas = [
    { key: "createdAt", label: "Solicitado em", render: (item) => formatarData(item.createdAt.slice(0, 10)) },
    ...(podeRevisar ? [{ key: "ownerName", label: "Solicitante", render: (item) => <div><p className="font-semibold">{item.ownerName}</p><p className="text-xs text-muted">{item.ownerRole}</p></div> }] : []),
    { key: "reason", label: "Motivo", render: (item) => <span className="font-medium">{item.reason}</span> },
    { key: "amount", label: "Valor", render: (item) => <span className="whitespace-nowrap font-semibold">{formatarMoeda(item.amount)}</span> },
    { key: "status", label: "Status", render: (item) => <SeloStatus status={item.status} /> },
  ];
  const pendentes = reembolsosVisiveis(itens, usuario.id, podeRevisar).filter((item) => item.status === "Pendente").length;

  return <section className="space-y-5" aria-label="Solicitações de reembolso">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-bold">Reembolsos</h2><p className="mt-1 text-sm text-muted">{podeRevisar ? `${pendentes} aguardando análise` : "Acompanhe suas solicitações de reembolso."}</p></div>
      <Botao onClick={() => setSolicitando(true)}>Solicitar reembolso</Botao>
    </div>
    <div role="note" className="rounded-xl border border-divider bg-brand-soft/50 p-4 text-sm text-muted">Fluxo em protótipo: os pedidos são compartilhados entre contas neste navegador, mas não são enviados nem sincronizados com o servidor.</div>
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
      empty={<EstadoVazio icon="wallet" title="Nenhuma solicitação encontrada">{erro ? "Não foi possível carregar os dados locais." : podeRevisar ? "As solicitações recebidas aparecerão aqui." : "Quando você solicitar um reembolso, ele aparecerá aqui."}</EstadoVazio>}
      actions={(item) => podeRevisar && item.status === "Pendente" && String(item.ownerId) !== String(usuario.id)
        ? <Botao className="min-h-9 px-3 text-sm" onClick={() => definirIdEmAnalise(item.id)}>Analisar</Botao>
        : <Botao className="min-h-9 px-3 text-sm" variant="outline" onClick={() => definirIdEmAnalise(item.id)}>Detalhes</Botao>}
    />}
    {solicitando && <ModalSolicitacao usuario={usuario} aoFechar={() => setSolicitando(false)} aoEnviar={enviar} />}
    {atual && <ModalAnalise item={atual} aoFechar={() => definirIdEmAnalise(null)} aoRevisar={revisar} />}
  </section>;
}

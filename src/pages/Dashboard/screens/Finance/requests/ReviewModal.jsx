import { useState } from "react";
import { formatarData, formatarMoeda, hojeISO, identificadorUnico } from "@/lib/data.js";
import { usarArmazenamento } from "@/store";
import { Selo, Botao, Modal, SeloStatus, CampoAreaTexto } from "@/components/ui";
import VisualizacaoComprovante from "@/pages/Dashboard/components/ReceiptView.jsx";
import { limpar, estaAberto } from "./helpers.js";
import { alvoDe } from "@/lib/people.js";

export default function ModalRevisao({ item: item, canReview: podeRevisar, onClose: aoFechar }) {
  const { state: dadosAplicacao, save: salvar, notify: notificar, toast: aviso } = usarArmazenamento();
  const [rejeitando, definirRejeitando] = useState(false);
  const [motivo, definirMotivo] = useState("");
  const [erro, definirErro] = useState("");
  const abrir = estaAberto(item);
  const pagamento = item.type === "payment";
  const chave = pagamento ? "payments" : "refunds";
  const hoje = hojeISO();
  const diverge = pagamento && item.amount !== item.expected;

  const aprovar = () => {
    salvar(chave, { ...limpar(item), status: pagamento ? "Confirmado" : "Aprovado", reviewedAt: new Date().toISOString() });
    if (pagamento) {
      const transacao = dadosAplicacao.transactions.find((tempo) => tempo.id === item.txId);
      if (transacao) salvar("transactions", { ...transacao, status: "Pago" });
      const mensal = item.kind === "mensalidade";
      salvar("transactions", { id: identificadorUnico(), date: hoje, description: `${mensal ? "Mensalidade" : "Anuidade"} — ${item.ownerName}`, category: mensal ? "Mensalidades" : "Anuidades", type: "in", amount: item.amount, status: "Pago", scope: "assoc", method: item.method, paymentId: item.id });
    } else {
      salvar("transactions", { id: identificadorUnico(), date: hoje, description: `Reembolso — ${item.reason}`, category: "Reembolsos", type: "in", amount: item.amount, status: "Pago", scope: item.scope, refundId: item.id, paymentId: item.id });
      salvar("transactions", { id: identificadorUnico(), date: hoje, description: `Reembolso — ${item.ownerName}`, category: "Reembolsos", type: "out", amount: item.amount, status: "Pago", scope: "assoc", refundId: item.id, paymentId: item.id });
    }
    notificar(item.role, pagamento ? "Pagamento confirmado" : "Reembolso aprovado", pagamento ? `A Diretoria confirmou seu pagamento de ${formatarMoeda(item.amount)}.` : `Seu reembolso de ${formatarMoeda(item.amount)} foi aprovado.`, "finance", alvoDe(item.role, item.scope.split(":")[1]));
    aviso(pagamento ? "Pagamento confirmado" : "Reembolso aprovado");
    aoFechar();
  };

  const rejeitar = () => {
    if (motivo.trim().length < 3) { definirErro("Informe o motivo da recusa."); return; }
    salvar(chave, { ...limpar(item), status: "Recusado", rejectReason: motivo.trim(), reviewedAt: new Date().toISOString() });
    if (pagamento) {
      const transacao = dadosAplicacao.transactions.find((tempo) => tempo.id === item.txId);
      if (transacao) salvar("transactions", { ...transacao, status: "Recusado" });
    }
    notificar(item.role, pagamento ? "Pagamento recusado" : "Reembolso recusado", `${pagamento ? "Seu comprovante" : "Sua solicitação"} foi recusado. Motivo: ${motivo.trim()}`, "finance", alvoDe(item.role, item.scope.split(":")[1]));
    aviso(pagamento ? "Pagamento recusado" : "Reembolso recusado");
    aoFechar();
  };

  const rodape = podeRevisar && abrir
    ? rejeitando
      ? <><Botao variant="outline" onClick={() => definirRejeitando(false)}>Voltar</Botao><Botao variant="danger" onClick={rejeitar}>Confirmar recusa</Botao></>
      : <><Botao variant="outline" onClick={aoFechar}>Fechar</Botao><Botao variant="danger" onClick={() => definirRejeitando(true)}>Recusar</Botao><Botao onClick={aprovar}>{pagamento ? "Confirmar pagamento" : "Aprovar reembolso"}</Botao></>
    : <Botao onClick={aoFechar}>Fechar</Botao>;

  return (
    <Modal title={pagamento ? `${item.title} — ${item.ownerName}` : `Reembolso — ${item.ownerName}`} onClose={aoFechar} footer={rodape}>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="text-muted">Status</dt><dd className="mt-1"><SeloStatus status={item.status} /></dd></div>
        <div><dt className="text-muted">Enviado em</dt><dd className="font-semibold">{formatarData(item.createdAt.slice(0, 10))}</dd></div>
        <div><dt className="text-muted">Valor informado</dt><dd className="font-semibold">{formatarMoeda(item.amount)}</dd></div>
        {pagamento ? <div><dt className="text-muted">Método</dt><dd className="font-semibold">{item.method}</dd></div> : <div className="sm:col-span-2"><dt className="text-muted">Motivo</dt><dd className="font-semibold">{item.reason}</dd></div>}
        {pagamento && <div><dt className="text-muted">Referência</dt><dd className="font-semibold">{item.kind === "mensalidade" ? `Mensalidade ${item.period.slice(5)}/${item.period.slice(0, 4)}` : `Anuidade ${item.period}`}</dd></div>}
        {pagamento && <div><dt className="text-muted">Valor devido</dt><dd className="font-semibold">{formatarMoeda(item.expected)}</dd></div>}
      </dl>
      {diverge && podeRevisar && abrir && <p className="mt-4"><Selo tone="warning">O valor informado difere do valor devido</Selo></p>}
      {item.status === "Recusado" && item.rejectReason && pagamento && <p className="mt-4 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger"><strong>Motivo da recusa:</strong> {item.rejectReason}</p>}
      {item.status === "Recusado" && !pagamento && <p className="mt-4 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger"><strong>Solicitação recusada.</strong>{item.rejectReason ? ` Motivo: ${item.rejectReason}` : ""}</p>}
      <h3 className="mb-2 mt-6 font-bold">Comprovante</h3>
      <VisualizacaoComprovante receipt={item.receipt} />
      {rejeitando && <div className="mt-5"><CampoAreaTexto label="Motivo da recusa" rows={3} value={motivo} onChange={(valorAuxiliar) => { definirMotivo(valorAuxiliar); definirErro(""); }} error={erro} required /></div>}
    </Modal>
  );
}

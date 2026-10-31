import { useState } from "react";
import { METODOS_PAGAMENTO, formatarData, formatarMoeda, hojeISO, identificadorUnico } from "@/lib/data.js";
import { usarArmazenamento } from "@/store";
import { Botao, Cartao, Campo, CampoSelecao } from "@/components/ui";
import CampoComprovante from "@/pages/Dashboard/components/ReceiptField.jsx";
import { interpretarValor } from "./helpers.js";

// ---------- Página de envio de pagamento (mensalidade do departamento / anuidade do associado) ----------
// O pagamento só muda para "Pago" depois que a diretoria verificar o comprovante.
export default function PaginaPagamento({ role: papel, user: usuario, fee: taxa, onBack: aoVoltar }) {
  const { save: salvar, notify: notificar, toast: aviso } = usarArmazenamento();
  const mensal = papel === "department";
  const nomeResponsavel = mensal ? usuario.department?.name : usuario.profile.name;
  const [formulario, definirFormulario] = useState({ amount: String(taxa.amount), method: METODOS_PAGAMENTO[0], receipt: null });
  const [erros, definirErros] = useState({});
  const definir = (chave) => (valor) => { definirFormulario((elementoF) => ({ ...elementoF, [chave]: valor })); definirErros((evento) => ({ ...evento, [chave]: undefined })); };

  const enviar = () => {
    const proximo = {};
    const valor = interpretarValor(formulario.amount);
    if (!valor || valor <= 0) proximo.amount = "Informe um valor maior que zero.";
    if (!formulario.receipt) proximo.receipt = "Anexe o comprovante de pagamento.";
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    const identificador = identificadorUnico();
    const identificadorTransacao = identificadorUnico();
    const tipo = mensal ? "mensalidade" : "anuidade";
    const categoria = mensal ? "Mensalidades" : "Anuidades";
    salvar("payments", { id: identificador, kind: tipo, scope: usuario.scope, role: papel, ownerName: nomeResponsavel, period: taxa.periodKey, dueDate: taxa.dueDate, expected: taxa.amount, amount: valor, method: formulario.method, receipt: formulario.receipt, status: "Em verificação", createdAt: new Date().toISOString(), txId: identificadorTransacao });
    salvar("transactions", { id: identificadorTransacao, date: hojeISO(), description: mensal ? `Mensalidade da Associação — ${nomeResponsavel}` : "Anuidade", category: categoria, type: "out", amount: valor, status: "Em verificação", scope: usuario.scope, fee: true, method: formulario.method, paymentId: identificador });
    notificar("admin", "Pagamento aguardando verificação", `${nomeResponsavel} enviou o comprovante de ${tipo} (${formatarMoeda(valor)}).`, "finance");
    aviso("Pagamento enviado para verificação");
    aoVoltar();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button type="button" onClick={aoVoltar} className="text-sm font-semibold text-brand hover:underline">← Voltar ao financeiro</button>
      <div>
        <h2 className="text-2xl font-bold">{mensal ? "Pagar mensalidade" : "Pagar anuidade"}</h2>
        <p className="mt-1 text-sm text-muted">Envie o comprovante para a Diretoria. O status só muda para “Pago” depois da verificação.</p>
      </div>
      {taxa.rejected && (
        <Cartao className="border-danger/40 bg-danger-soft p-4 text-sm text-danger">
          <strong>Seu último envio foi recusado.</strong>{taxa.rejected.rejectReason ? ` Motivo: ${taxa.rejected.rejectReason}` : ""}
        </Cartao>
      )}
      <Cartao className="grid gap-4 p-5 text-sm sm:grid-cols-3">
        <div><p className="text-muted">Referência</p><p className="font-semibold">{mensal ? `Mensalidade ${taxa.periodKey.slice(5)}/${taxa.periodKey.slice(0, 4)}` : `Anuidade ${taxa.periodKey}`}</p></div>
        <div><p className="text-muted">Vencimento</p><p className={`font-semibold ${taxa.overdue ? "text-danger" : ""}`}>{formatarData(taxa.dueDate)}{taxa.overdue ? " (vencida)" : ""}</p></div>
        <div><p className="text-muted">Valor devido</p><p className="font-semibold">{formatarMoeda(taxa.amount)}</p></div>
      </Cartao>
      <Cartao className="space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Valor pago (R$)" type="number" min="0" step="0.01" value={formulario.amount} onChange={definir("amount")} error={erros.amount} required />
          <CampoSelecao label="Método de pagamento" value={formulario.method} onChange={definir("method")} options={METODOS_PAGAMENTO} required />
        </div>
        <CampoComprovante value={formulario.receipt} onChange={definir("receipt")} error={erros.receipt} />
        <p className="text-xs text-muted">Pagamento simulado: no protótipo nenhuma cobrança real é feita e o comprovante fica salvo apenas neste navegador.</p>
      </Cartao>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Botao variant="outline" onClick={aoVoltar}>Cancelar</Botao>
        <Botao onClick={enviar}>Enviar para verificação</Botao>
      </div>
    </div>
  );
}

import { useState } from "react";
import { formatarMoeda } from "@/lib/data.js";
import { usarArmazenamento } from "@/store";
import { Botao, Campo, Modal, CampoAreaTexto } from "@/components/ui";
import CampoComprovante from "@/pages/Dashboard/components/ReceiptField.jsx";
import { interpretarValor } from "./helpers.js";

// ---------- Solicitação de reembolso ----------
export default function ModalReembolso({ role: papel, user: usuario, onClose: aoFechar }) {
  const { save: salvar, notify: notificar, toast: aviso } = usarArmazenamento();
  const nomeResponsavel = papel === "department" ? usuario.department?.name || usuario.profile.name : usuario.profile.name;
  const [formulario, definirFormulario] = useState({ reason: "", amount: "", receipt: null });
  const [erros, definirErros] = useState({});
  const definir = (chave) => (valor) => { definirFormulario((elementoF) => ({ ...elementoF, [chave]: valor })); definirErros((evento) => ({ ...evento, [chave]: undefined })); };
  const enviar = () => {
    const proximo = {};
    const valor = interpretarValor(formulario.amount);
    if (formulario.reason.trim().length < 5) proximo.reason = "Descreva o motivo do reembolso.";
    if (!valor || valor <= 0) proximo.amount = "Informe um valor maior que zero.";
    if (!formulario.receipt) proximo.receipt = "Anexe o comprovante.";
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    salvar("refunds", { scope: usuario.scope, role: papel, ownerName: nomeResponsavel, reason: formulario.reason.trim(), amount: valor, receipt: formulario.receipt, status: "Em análise", createdAt: new Date().toISOString() });
    notificar("admin", "Reembolso solicitado", `${nomeResponsavel} solicitou reembolso de ${formatarMoeda(valor)}.`, "finance");
    aviso("Solicitação de reembolso enviada");
    aoFechar();
  };
  return (
    <Modal title="Solicitar reembolso" onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao onClick={enviar}>Enviar solicitação</Botao></>}>
      <div className="space-y-4">
        <CampoAreaTexto label="Motivo" rows={3} value={formulario.reason} onChange={definir("reason")} error={erros.reason} placeholder="Ex.: compra de materiais para o ensaio" required />
        <Campo label="Valor (R$)" type="number" min="0" step="0.01" value={formulario.amount} onChange={definir("amount")} error={erros.amount} required />
        <CampoComprovante value={formulario.receipt} onChange={definir("receipt")} error={erros.receipt} />
      </div>
    </Modal>
  );
}

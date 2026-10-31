import { useState } from "react";
import { formatarData } from "@/lib/data.js";
import { Botao, Modal, CampoAreaTexto } from "@/components/ui";

export default function ModalRejeicao({ reservation: reserva, onClose: aoFechar, onConfirm: aoConfirmar }) {
  const [motivo, definirMotivo] = useState("");
  return (
    <Modal size="sm" title="Recusar reserva" onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao variant="danger" onClick={() => aoConfirmar(motivo.trim())}>Recusar</Botao></>}>
      <p className="mb-4 text-sm text-muted">“{reserva.title}” — {reserva.ownerName}, {formatarData(reserva.date)} às {reserva.time}.</p>
      <CampoAreaTexto label="Motivo (opcional)" rows={3} value={motivo} onChange={definirMotivo} />
    </Modal>
  );
}

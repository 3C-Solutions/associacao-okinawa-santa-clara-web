import { useState } from "react";
import { formatarData } from "@/lib/data.js";
import { Botao, Modal, CampoAreaTexto } from "@/components/ui";

export default function ModalRejeicao({ reservation: reserva, onClose: aoFechar, onConfirm: aoConfirmar }) {
  const [motivo, definirMotivo] = useState("");
  const [enviando, definirEnviando] = useState(false);
  const confirmar = async () => {
    definirEnviando(true);
    try { await aoConfirmar(motivo.trim()); }
    finally { definirEnviando(false); }
  };
  return (
    <Modal size="sm" title="Recusar reserva" onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao variant="danger" disabled={enviando} onClick={confirmar}>Recusar</Botao></>}>
      <p className="mb-4 text-sm text-muted">“{reserva.titulo}” — {reserva.reservadoPara}, {formatarData(reserva.dtInicio)}.</p>
      <CampoAreaTexto label="Motivo (opcional)" rows={3} maxLength={500} value={motivo} onChange={definirMotivo} />
    </Modal>
  );
}
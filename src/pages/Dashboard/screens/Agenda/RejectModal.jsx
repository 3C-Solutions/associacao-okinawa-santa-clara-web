import { useState } from "react";
import { fmtDate } from "@/lib/data.js";
import { Button, Modal, TextAreaField } from "@/components/ui";

export default function RejectModal({ reservation, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  return (
    <Modal size="sm" title="Recusar reserva" onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button variant="danger" onClick={() => onConfirm(reason.trim())}>Recusar</Button></>}>
      <p className="mb-4 text-sm text-muted">“{reservation.title}” — {reservation.ownerName}, {fmtDate(reservation.date)} às {reservation.time}.</p>
      <TextAreaField label="Motivo (opcional)" rows={3} value={reason} onChange={setReason} />
    </Modal>
  );
}

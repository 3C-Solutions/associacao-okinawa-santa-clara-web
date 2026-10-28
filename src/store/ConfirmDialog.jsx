import { Button, Modal } from "@/components/ui";

export default function ConfirmDialog({ title = "Confirmar ação", message, confirmLabel = "Excluir", variant = "danger", onConfirm, onClose }) {
  return (
    <Modal
      size="sm"
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="leading-relaxed text-muted">{message}</p>
    </Modal>
  );
}

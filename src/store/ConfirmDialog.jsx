import { Botao, Modal } from "@/components/ui";

export default function DialogoConfirmacao({ title: titulo = "Confirmar ação", message: mensagem, confirmLabel: rotuloConfirmacao = "Excluir", variant: variante = "danger", onConfirm: aoConfirmar, onClose: aoFechar }) {
  return (
    <Modal
      size="sm"
      title={titulo}
      onClose={aoFechar}
      footer={
        <>
          <Botao variant="outline" onClick={aoFechar}>Cancelar</Botao>
          <Botao variant={variante} onClick={() => { aoConfirmar(); aoFechar(); }}>{rotuloConfirmacao}</Botao>
        </>
      }
    >
      <p className="leading-relaxed text-muted">{mensagem}</p>
    </Modal>
  );
}

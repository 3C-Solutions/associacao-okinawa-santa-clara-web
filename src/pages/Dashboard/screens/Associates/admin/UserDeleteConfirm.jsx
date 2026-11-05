import { useCallback, useEffect, useRef, useState } from "react";
import { Botao, Modal } from "@/components/ui";

// Confirmação da exclusão lógica: o usuário é inativado e perde o acesso, mas o registro é mantido.
export default function ConfirmacaoExclusaoUsuario({ user: usuario, onClose: aoFechar, onConfirm: aoConfirmar }) {
  const [excluindo, definirExcluindo] = useState(false);
  const [erro, definirErro] = useState(null);
  const envio = useRef(null);
  useEffect(() => () => envio.current?.abort(), []);
  const fechar = useCallback(() => { if (!excluindo) aoFechar(); }, [excluindo, aoFechar]);

  const confirmar = async () => {
    if (envio.current) return;
    const controle = new AbortController();
    envio.current = controle;
    definirExcluindo(true);
    definirErro(null);
    try {
      await aoConfirmar(usuario, controle.signal);
    } catch (falha) {
      if (!controle.signal.aborted && falha.name !== "AbortError") {
        definirErro(falha.status === 409 ? "Não é possível excluir a própria conta." : falha.message);
      }
    } finally {
      if (!controle.signal.aborted) definirExcluindo(false);
      if (envio.current === controle) envio.current = null;
    }
  };

  return (
    <Modal title="Excluir usuário" size="sm" onClose={fechar} footer={<><Botao variant="outline" onClick={fechar} disabled={excluindo}>Cancelar</Botao><Botao variant="danger" onClick={confirmar} disabled={excluindo}>{excluindo ? "Excluindo..." : "Excluir"}</Botao></>}>
      <div className="space-y-3 text-sm">
        <p>Deseja excluir <strong>{usuario.name}</strong> ({usuario.email})?</p>
        <p className="rounded-lg bg-warning-soft p-3 text-warning">O usuário será inativado e perderá o acesso à plataforma. O histórico é mantido e a conta pode ser reativada pela edição.</p>
        {erro && <p role="alert" className="font-semibold text-danger">{erro}</p>}
      </div>
    </Modal>
  );
}

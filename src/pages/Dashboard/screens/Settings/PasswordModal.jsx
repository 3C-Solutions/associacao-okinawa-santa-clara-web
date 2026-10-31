import { useState } from "react";
import { Botao, Campo, Modal } from "@/components/ui";

export default function ModalSenha({ current: atual, onClose: aoFechar, onSave: aoSalvar }) {
  const [formulario, definirFormulario] = useState({ current: "", next: "", confirm: "" });
  const [erros, definirErros] = useState({});
  const definir = (chave) => (valor) => { definirFormulario((elementoF) => ({ ...elementoF, [chave]: valor })); definirErros((evento) => ({ ...evento, [chave]: undefined })); };
  const enviar = () => {
    const proximo = {};
    if (formulario.current !== atual) proximo.current = "Senha atual incorreta.";
    if (formulario.next.length < 8) proximo.next = "A nova senha deve ter no mínimo 8 caracteres.";
    else if (formulario.next === formulario.current) proximo.next = "A nova senha deve ser diferente da atual.";
    if (formulario.confirm !== formulario.next) proximo.confirm = "As senhas não conferem.";
    definirErros(proximo);
    if (!Object.keys(proximo).length) aoSalvar(formulario.next);
  };
  return (
    <Modal size="sm" title="Alterar senha" onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao onClick={enviar}>Salvar senha</Botao></>}>
      <div className="space-y-4">
        <Campo label="Senha atual" type="password" value={formulario.current} onChange={definir("current")} error={erros.current} />
        <Campo label="Nova senha" type="password" value={formulario.next} onChange={definir("next")} error={erros.next} hint="Mínimo de 8 caracteres." />
        <Campo label="Confirmar nova senha" type="password" value={formulario.confirm} onChange={definir("confirm")} error={erros.confirm} />
      </div>
    </Modal>
  );
}

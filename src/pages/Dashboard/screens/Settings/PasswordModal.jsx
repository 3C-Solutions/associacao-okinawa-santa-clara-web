import { useCallback, useEffect, useRef, useState } from "react";
import { validarNovaSenha } from "@/services/minhaConta.js";
import { Botao, Campo, Modal } from "@/components/ui";

export default function ModalSenha({ service: servico, onClose: aoFechar, onSaved: aoSalvar }) {
  const [formulario, definirFormulario] = useState({ current: "", next: "", confirm: "" });
  const [erros, definirErros] = useState({});
  const [erroEnvio, definirErroEnvio] = useState(null);
  const [salvando, definirSalvando] = useState(false);
  const envio = useRef(null);
  useEffect(() => () => envio.current?.abort(), []);
  const fechar = useCallback(() => { if (!envio.current) aoFechar(); }, [aoFechar]);
  const definir = (chave) => (valor) => {
    if (envio.current) return;
    definirFormulario((atual) => ({ ...atual, [chave]: valor }));
    definirErros((atual) => ({ ...atual, [chave]: undefined }));
    definirErroEnvio(null);
  };
  const enviar = async (evento) => {
    evento?.preventDefault();
    if (envio.current) return;
    const proximo = validarNovaSenha(formulario);
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    const controle = new AbortController();
    envio.current = controle;
    definirSalvando(true);
    definirErroEnvio(null);
    try {
      await servico.alterarSenha(formulario, controle.signal);
      if (!controle.signal.aborted) {
        definirFormulario({ current: "", next: "", confirm: "" });
        aoSalvar();
      }
    } catch (erro) {
      if (!controle.signal.aborted && erro.name !== "AbortError") {
        if (erro.codigo === "SENHA_ATUAL_INCORRETA") definirErros((atual) => ({ ...atual, current: erro.message }));
        else if (["NOVA_SENHA_IGUAL", "NOVA_SENHA_LONGA"].includes(erro.codigo)) definirErros((atual) => ({ ...atual, next: erro.message }));
        else definirErroEnvio(erro.message);
      }
    } finally {
      if (!controle.signal.aborted) definirSalvando(false);
      if (envio.current === controle) envio.current = null;
    }
  };
  return (
    <Modal size="sm" title="Alterar senha" onClose={fechar} footer={<><Botao variant="outline" onClick={fechar} disabled={salvando}>Cancelar</Botao><Botao onClick={enviar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar senha"}</Botao></>}>
      <form onSubmit={enviar} noValidate aria-busy={salvando} className="space-y-4">
        <Campo label="Senha atual" type="password" autoComplete="current-password" value={formulario.current} onChange={definir("current")} error={erros.current} disabled={salvando} maxLength={255} required />
        <Campo label="Nova senha" type="password" autoComplete="new-password" value={formulario.next} onChange={definir("next")} error={erros.next} hint="Mínimo de 8 caracteres." disabled={salvando} required />
        <Campo label="Confirmar nova senha" type="password" autoComplete="new-password" value={formulario.confirm} onChange={definir("confirm")} error={erros.confirm} disabled={salvando} required />
        <p className="text-sm text-muted">Após alterar a senha, entre novamente com a nova senha.</p>
        {erroEnvio && <p role="alert" className="text-sm font-semibold text-danger">{erroEnvio}</p>}
        <button type="submit" className="sr-only" tabIndex={-1} disabled={salvando}>Salvar senha</button>
      </form>
    </Modal>
  );
}

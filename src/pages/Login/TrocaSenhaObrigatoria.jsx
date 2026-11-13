import { useEffect, useRef, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { Botao, Campo, Titulo } from "@/components/ui";
import { criarServicoMinhaConta, validarNovaSenha } from "@/services/minhaConta.js";
import LayoutAcesso from "./LayoutAcesso.jsx";

export default function TrocaSenhaObrigatoria({ onBack: voltarAoLogin }) {
  const { requisitar } = usarAutenticacao();
  const [formulario, definirFormulario] = useState({ current: "", next: "", confirm: "" });
  const [erros, definirErros] = useState({});
  const [erroEnvio, definirErroEnvio] = useState(null);
  const [salvando, definirSalvando] = useState(false);
  const envio = useRef(null);

  useEffect(() => () => envio.current?.abort(), []);

  const definirCampo = (campo) => (valor) => {
    definirFormulario((atual) => ({ ...atual, [campo]: valor }));
    definirErros((atual) => ({ ...atual, [campo]: undefined }));
    definirErroEnvio(null);
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (envio.current) return;

    const errosFormulario = validarNovaSenha(formulario);
    if (errosFormulario.current) errosFormulario.current = "Informe a senha provisória.";
    definirErros(errosFormulario);
    definirErroEnvio(null);
    if (Object.keys(errosFormulario).length) return;

    const controle = new AbortController();
    envio.current = controle;
    definirSalvando(true);
    try {
      const servico = criarServicoMinhaConta(requisitar);
      await servico.alterarSenha(formulario, controle.signal);
    } catch (erro) {
      if (controle.signal.aborted || erro.name === "AbortError" || erro.status === 401) return;
      if (erro.codigo === "SENHA_ATUAL_INCORRETA") definirErros({ current: "Senha provisória incorreta." });
      else if (["NOVA_SENHA_IGUAL", "NOVA_SENHA_LONGA"].includes(erro.codigo)) definirErros({ next: erro.message });
      else definirErroEnvio(erro.message);
    } finally {
      envio.current = null;
      if (!controle.signal.aborted) definirSalvando(false);
    }
  };

  return (
    <LayoutAcesso>
      <div className="w-full max-w-lg">
        <Titulo>Defina uma nova senha</Titulo>
        <p className="mt-2 text-muted">No primeiro acesso, você precisa trocar a senha provisória para entrar na plataforma.</p>
        <form onSubmit={enviar} noValidate aria-busy={salvando} className="mt-8 space-y-5 rounded-2xl border border-divider bg-white p-6 shadow-sm md:p-8">
          <Campo label="Senha provisória" type="password" autoComplete="current-password" value={formulario.current} onChange={definirCampo("current")} error={erros.current} disabled={salvando} maxLength={255} required />
          <Campo label="Nova senha" type="password" autoComplete="new-password" value={formulario.next} onChange={definirCampo("next")} error={erros.next} hint="Use pelo menos 8 caracteres e uma senha diferente da provisória." disabled={salvando} required />
          <Campo label="Confirmar nova senha" type="password" autoComplete="new-password" value={formulario.confirm} onChange={definirCampo("confirm")} error={erros.confirm} disabled={salvando} required />
          <p className="text-sm text-muted">Depois de salvar, entre novamente com a nova senha.</p>
          {erroEnvio && <p role="alert" className="rounded-lg bg-danger-soft p-4 text-sm font-semibold text-danger">{erroEnvio}</p>}
          <div className="flex flex-col gap-3">
            <Botao type="submit" disabled={salvando} className="min-h-13 w-full">{salvando ? "Salvando..." : "Salvar nova senha"}</Botao>
            <Botao variant="outline" onClick={voltarAoLogin} disabled={salvando}>Voltar ao login</Botao>
          </div>
        </form>
      </div>
    </LayoutAcesso>
  );
}

import { useState } from "react";
import { ehEmail } from "@/lib/data.js";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { Botao, Campo, Icone, Titulo } from "@/components/ui";

export default function Acesso({ onBack: aoVoltar }) {
  const { entrar, status, erro, aviso } = usarAutenticacao();
  const [email, definirEmail] = useState("");
  const [senha, definirSenhaConta] = useState("");
  const [exibir, definirExibicao] = useState(false);
  const [erros, definirErros] = useState({});
  const carregando = status === "autenticando";

  const enviar = async (evento) => {
    evento.preventDefault();
    if (carregando) return;
    const proximo = {};
    if (!ehEmail(email.trim())) proximo.email = "Informe um e-mail válido.";
    if (!senha) proximo.password = "Informe a senha.";
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    await entrar(email, senha);
    definirSenhaConta("");
  };

  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand lg:block">
        <img src="/associacao.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand via-brand/50 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <img src="/logo.jpg" alt="Logo da Associação Okinawa de Santa Clara" className="size-14 rounded-full object-contain" />
          <h1 className="mt-7 max-w-lg text-4xl font-bold leading-tight">Uma comunidade mais conectada começa aqui.</h1>
          <p className="mt-4 max-w-md text-white/75">Acesse informações, acompanhe eventos e cuide da sua participação na associação.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-10">
        <form onSubmit={enviar} noValidate aria-busy={carregando} className="w-full max-w-lg">
          <button type="button" onClick={aoVoltar} className="mb-10 flex min-h-11 items-center gap-2 font-semibold text-brand hover:underline"><span className="rotate-180"><Icone name="arrow" /></span> Voltar ao site</button>
          <Titulo>Boas-vindas</Titulo>
          <p className="mt-2 text-muted">Entre com seus dados para acessar a plataforma.</p>
          {aviso && <p role="status" className="mt-5 rounded-lg bg-brand-soft p-4 text-sm text-brand">{aviso}</p>}
          {erro && <p role="alert" className="mt-5 rounded-lg bg-danger-soft p-4 text-sm font-semibold text-danger">{erro}</p>}
          <div className="mt-8 rounded-2xl border border-divider bg-white p-6 shadow-sm md:p-8">
            <Campo label="E-mail" type="email" autoComplete="username" disabled={carregando} placeholder="Digite o seu e-mail" value={email} onChange={(valorAuxiliar) => { definirEmail(valorAuxiliar); definirErros((evento) => ({ ...evento, email: undefined })); }} error={erros.email} />
            <Campo
              className="mt-5"
              label="Senha"
              type={exibir ? "text" : "password"}
              autoComplete="current-password"
              disabled={carregando}
              placeholder="Digite a sua senha"
              value={senha}
              onChange={(valorAuxiliar) => { definirSenhaConta(valorAuxiliar); definirErros((evento) => ({ ...evento, password: undefined })); }}
              error={erros.password}
              suffix={<button type="button" aria-label={exibir ? "Ocultar senha" : "Mostrar senha"} onClick={() => definirExibicao(!exibir)} className="ml-2 text-muted hover:text-brand"><Icone name={exibir ? "eyeOff" : "eye"} size={18} /></button>}
            />
            <p className="mt-3 text-sm text-muted">Precisa recuperar seu acesso? Entre em contato com a administração.</p>
            <Botao type="submit" disabled={carregando} className="mt-5 min-h-13 w-full">{carregando ? "Entrando..." : "Entrar"} {!carregando && <Icone name="arrow" />}</Botao>
          </div>
        </form>
      </div>
    </div>
  );
}

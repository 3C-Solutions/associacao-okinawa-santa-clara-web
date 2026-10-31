import { useState } from "react";
import { ehEmail, fotos, rotulosPapeis } from "@/lib/data.js";
import { usarArmazenamento } from "@/store";
import { Botao, Campo, Icone, Modal, Titulo } from "@/components/ui";

export default function Acesso({ onBack: aoVoltar, onEnter: aoEntrar }) {
  const { state: dadosAplicacao, toast: aviso } = usarArmazenamento();
  const [email, definirEmail] = useState("");
  const [senha, definirSenhaConta] = useState("");
  const [exibir, definirExibicao] = useState(false);
  const [erros, definirErros] = useState({});
  const [carregando, definirCarregamento] = useState(false);
  const [esqueceu, definirRecuperacao] = useState(false);
  const [emailRecuperacao, definirEmailRecuperacao] = useState("");
  const [erroRecuperacao, definirErroRecuperacao] = useState("");

  // contas de demonstração: um e-mail por usuário (o perfil é definido pela conta, não escolhido na tela)
  // todas as contas ativas: o perfil (Diretoria, Departamento, Associado ou Dependente) vem da própria conta
  const estaAtivo = (parametro) => (parametro.role === "member"
    ? dadosAplicacao.associates.some((elementoA) => elementoA.id === parametro.associateId)
    : parametro.role === "dependent" ? dadosAplicacao.associates.some((elementoA) => elementoA.id === parametro.associateId && elementoA.dependents.some((dataValor) => dataValor.id === parametro.personId)) : true);
  const contas = Object.entries(dadosAplicacao.profiles).filter(([, parametro]) => estaAtivo(parametro)).map(([chave, parametro]) => ({ key: chave, role: parametro.role, name: parametro.name, email: parametro.email }));
  const contasDemonstracao = contas.filter((elementoA) => elementoA.key === elementoA.role);
  const preencherConta = (conta) => { definirEmail(conta.email); definirSenhaConta("prototipo"); definirErros({}); };

  const enviar = (evento) => {
    evento.preventDefault();
    const proximo = {};
    const conta = contas.find((elementoA) => elementoA.email.toLowerCase() === email.trim().toLowerCase());
    if (!ehEmail(email)) proximo.email = "Informe um e-mail válido.";
    else if (!conta) proximo.email = "Nenhuma conta encontrada com este e-mail.";
    if (!senha) proximo.password = "Informe a senha.";
    else if (conta && senha !== dadosAplicacao.passwords[conta.key]) proximo.password = "Senha incorreta.";
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    definirCarregamento(true);
    window.setTimeout(() => aoEntrar(conta.key), 500);
  };

  const enviarRedefinicao = () => {
    if (!ehEmail(emailRecuperacao)) { definirErroRecuperacao("Informe um e-mail válido."); return; }
    definirRecuperacao(false);
    definirEmailRecuperacao("");
    aviso("Se o e-mail estiver cadastrado, enviaremos as instruções.");
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
        <form onSubmit={enviar} noValidate className="w-full max-w-lg">
          <button type="button" onClick={aoVoltar} className="mb-10 flex min-h-11 items-center gap-2 font-semibold text-brand hover:underline"><span className="rotate-180"><Icone name="arrow" /></span> Voltar ao site</button>
          <Titulo>Boas-vindas</Titulo>
          <p className="mt-2 text-muted">Entre com seus dados para acessar a plataforma.</p>
          <div className="mt-8 rounded-2xl border border-divider bg-white p-6 shadow-sm md:p-8">
            <Campo label="E-mail" type="email" placeholder="Digite o seu e-mail" value={email} onChange={(valorAuxiliar) => { definirEmail(valorAuxiliar); definirErros((evento) => ({ ...evento, email: undefined })); }} error={erros.email} />
            <Campo
              className="mt-5"
              label="Senha"
              type={exibir ? "text" : "password"}
              placeholder="Digite a sua senha"
              value={senha}
              onChange={(valorAuxiliar) => { definirSenhaConta(valorAuxiliar); definirErros((evento) => ({ ...evento, password: undefined })); }}
              error={erros.password}
              suffix={<button type="button" aria-label={exibir ? "Ocultar senha" : "Mostrar senha"} onClick={() => definirExibicao(!exibir)} className="ml-2 text-muted hover:text-brand"><Icone name={exibir ? "eyeOff" : "eye"} size={18} /></button>}
            />
            <div className="mt-3 text-right"><button type="button" onClick={() => definirRecuperacao(true)} className="text-sm font-semibold text-brand hover:underline">Esqueci minha senha</button></div>
            <Botao type="submit" disabled={carregando} className="mt-5 min-h-13 w-full">{carregando ? "Entrando..." : "Entrar"} {!carregando && <Icone name="arrow" />}</Botao>
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-divider bg-white/60 p-4">
            <p className="text-sm font-semibold">Contas de demonstração</p>
            <p className="mt-1 text-xs text-muted">Ambiente de protótipo. Senha de todas as contas: <strong>prototipo</strong>.</p>
            <ul className="mt-3 space-y-2">
              {contasDemonstracao.map((elementoA) => (
                <li key={elementoA.key}>
                  <button type="button" onClick={() => preencherConta(elementoA)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-divider bg-white px-4 py-2 text-left transition hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand">
                    <span className="min-w-0"><span className="block truncate text-sm font-bold">{elementoA.name}</span><span className="block truncate text-xs text-muted">{elementoA.email}</span></span>
                    <span className="shrink-0 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">{rotulosPapeis[elementoA.role]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </form>
      </div>
      {esqueceu && (
        <Modal size="sm" title="Recuperar senha" onClose={() => definirRecuperacao(false)} footer={<><Botao variant="outline" onClick={() => definirRecuperacao(false)}>Cancelar</Botao><Botao onClick={enviarRedefinicao}>Enviar instruções</Botao></>}>
          <p className="mb-4 text-sm text-muted">Informe o e-mail da sua conta para receber o link de redefinição.</p>
          <Campo label="E-mail" type="email" value={emailRecuperacao} onChange={(valorAuxiliar) => { definirEmailRecuperacao(valorAuxiliar); definirErroRecuperacao(""); }} error={erroRecuperacao} />
        </Modal>
      )}
    </div>
  );
}

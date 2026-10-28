import { useState } from "react";
import { isEmail, photos, roleLabels } from "@/lib/data.js";
import { useStore } from "@/store";
import { Button, Field, Icon, Modal, Title } from "@/components/ui";

export default function Login({ onBack, onEnter }) {
  const { state, toast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");

  // contas de demonstração: um e-mail por usuário (o perfil é definido pela conta, não escolhido na tela)
  // todas as contas ativas: o perfil (Diretoria, Departamento, Associado ou Dependente) vem da própria conta
  const isActive = (p) => (p.role === "member"
    ? state.associates.some((a) => a.id === p.associateId)
    : p.role === "dependent" ? state.associates.some((a) => a.id === p.associateId && a.dependents.some((d) => d.id === p.personId)) : true);
  const accounts = Object.entries(state.profiles).filter(([, p]) => isActive(p)).map(([key, p]) => ({ key, role: p.role, name: p.name, email: p.email }));
  const demoAccounts = accounts.filter((a) => a.key === a.role);
  const fillAccount = (account) => { setEmail(account.email); setPassword("prototipo"); setErrors({}); };

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    const account = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!isEmail(email)) next.email = "Informe um e-mail válido.";
    else if (!account) next.email = "Nenhuma conta encontrada com este e-mail.";
    if (!password) next.password = "Informe a senha.";
    else if (account && password !== state.passwords[account.key]) next.password = "Senha incorreta.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    window.setTimeout(() => onEnter(account.key), 500);
  };

  const sendReset = () => {
    if (!isEmail(forgotEmail)) { setForgotError("Informe um e-mail válido."); return; }
    setForgot(false);
    setForgotEmail("");
    toast("Se o e-mail estiver cadastrado, enviaremos as instruções.");
  };

  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand lg:block">
        <img src={photos.culture} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand via-brand/50 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <span className="grid size-14 place-items-center rounded-full bg-accent text-xl font-black text-brand">沖</span>
          <h1 className="mt-7 max-w-lg text-4xl font-bold leading-tight">Uma comunidade mais conectada começa aqui.</h1>
          <p className="mt-4 max-w-md text-white/75">Acesse informações, acompanhe eventos e cuide da sua participação na associação.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-10">
        <form onSubmit={submit} noValidate className="w-full max-w-lg">
          <button type="button" onClick={onBack} className="mb-10 flex min-h-11 items-center gap-2 font-semibold text-brand hover:underline"><span className="rotate-180"><Icon name="arrow" /></span> Voltar ao site</button>
          <Title>Boas-vindas</Title>
          <p className="mt-2 text-muted">Entre com seus dados para acessar a plataforma.</p>
          <div className="mt-8 rounded-2xl border border-divider bg-white p-6 shadow-sm md:p-8">
            <Field label="E-mail" type="email" placeholder="Digite o seu e-mail" value={email} onChange={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })); }} error={errors.email} />
            <Field
              className="mt-5"
              label="Senha"
              type={show ? "text" : "password"}
              placeholder="Digite a sua senha"
              value={password}
              onChange={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
              error={errors.password}
              suffix={<button type="button" aria-label={show ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShow(!show)} className="ml-2 text-muted hover:text-brand"><Icon name={show ? "eyeOff" : "eye"} size={18} /></button>}
            />
            <div className="mt-3 text-right"><button type="button" onClick={() => setForgot(true)} className="text-sm font-semibold text-brand hover:underline">Esqueci minha senha</button></div>
            <Button type="submit" disabled={loading} className="mt-5 min-h-13 w-full">{loading ? "Entrando..." : "Entrar"} {!loading && <Icon name="arrow" />}</Button>
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-divider bg-white/60 p-4">
            <p className="text-sm font-semibold">Contas de demonstração</p>
            <p className="mt-1 text-xs text-muted">Ambiente de protótipo. Senha de todas as contas: <strong>prototipo</strong>.</p>
            <ul className="mt-3 space-y-2">
              {demoAccounts.map((a) => (
                <li key={a.key}>
                  <button type="button" onClick={() => fillAccount(a)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-divider bg-white px-4 py-2 text-left transition hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand">
                    <span className="min-w-0"><span className="block truncate text-sm font-bold">{a.name}</span><span className="block truncate text-xs text-muted">{a.email}</span></span>
                    <span className="shrink-0 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">{roleLabels[a.role]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </form>
      </div>
      {forgot && (
        <Modal size="sm" title="Recuperar senha" onClose={() => setForgot(false)} footer={<><Button variant="outline" onClick={() => setForgot(false)}>Cancelar</Button><Button onClick={sendReset}>Enviar instruções</Button></>}>
          <p className="mb-4 text-sm text-muted">Informe o e-mail da sua conta para receber o link de redefinição.</p>
          <Field label="E-mail" type="email" value={forgotEmail} onChange={(v) => { setForgotEmail(v); setForgotError(""); }} error={forgotError} />
        </Modal>
      )}
    </div>
  );
}

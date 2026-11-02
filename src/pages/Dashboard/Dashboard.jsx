import { useEffect, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { Botao, Icone, Titulo } from "@/components/ui";
import GrupoNavegacao from "./components/NavGroup.jsx";
import { NAVEGACAO_PAINEL, filtrarNavegacao, listarTelas, resolverTela } from "./navigation.js";

export default function Painel({ onLogout: aoSair }) {
  const { usuario, status, podeAcessar, atualizando } = usarAutenticacao();
  const [tela, definirTela] = useState("home");
  const [menuAberto, definirMenuAberto] = useState(false);
  const navegacao = filtrarNavegacao(NAVEGACAO_PAINEL, podeAcessar);
  const telas = listarTelas(navegacao);
  // A resolução ocorre antes da renderização, inclusive no primeiro quadro após uma revogação.
  const atual = resolverTela(tela, telas);
  const telaAtiva = atual?.id || "home";

  useEffect(() => {
    if (tela !== telaAtiva) definirTela(telaAtiva);
  }, [tela, telaAtiva]);

  useEffect(() => {
    if (!menuAberto) return undefined;
    const fechar = (evento) => { if (evento.key === "Escape") definirMenuAberto(false); };
    document.addEventListener("keydown", fechar);
    return () => document.removeEventListener("keydown", fechar);
  }, [menuAberto]);

  if (status !== "autenticado" || !usuario || !atual) return null;

  const navegar = (identificador) => {
    if (!telas.some((item) => item.id === identificador)) return;
    definirTela(identificador);
    definirMenuAberto(false);
    window.scrollTo({ top: 0 });
  };

  const CartaoUsuario = (
    <div className="flex items-center gap-3 rounded-xl bg-brand-soft p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white" aria-hidden="true">{usuario.nome.trim().charAt(0)}</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-brand">{usuario.nome}</p>
        <p className="truncate text-xs text-muted">{usuario.email}</p>
      </div>
    </div>
  );
  const Tela = atual.componente;
  const primeiroNome = usuario.nome.trim().split(/\s+/)[0] || usuario.nome;
  const avisoAtualizacao = (
    <p role="status" className="mb-3 flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">
      <span aria-hidden="true" className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
      Atualizando seus acessos...
    </p>
  );

  return (
    <div className="min-h-dvh bg-canvas text-ink lg:flex">
      <a href="#conteudo-painel" className="sr-only z-50 rounded-lg bg-white p-3 text-brand focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Ir para o conteúdo</a>
      <aside className="border-b border-divider bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-sidebar lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex w-full items-center justify-between px-5 py-4 lg:block lg:px-6 lg:py-7">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo da Associação Okinawa de Santa Clara" className="size-11 shrink-0 rounded-full object-contain" />
            <div><p className="text-sm font-bold text-brand">Okinawa Santa Clara</p><p className="text-xs text-muted">Portal da Associação</p></div>
          </div>
          <button type="button" onClick={() => definirMenuAberto(!menuAberto)} aria-label={menuAberto ? "Fechar menu" : "Abrir menu"} aria-expanded={menuAberto} aria-controls="menu-movel" className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand focus:outline-none focus:ring-2 focus:ring-brand lg:hidden">
            <Icone name={menuAberto ? "close" : "menu"} />
          </button>
        </div>
        {menuAberto && (
          <div id="menu-movel" className="space-y-3 border-t border-divider p-4 lg:hidden">
            {CartaoUsuario}
            <Botao variant="outline" onClick={aoSair} className="w-full"><Icone name="logout" /> Sair</Botao>
          </div>
        )}
        <div className="hidden overflow-y-auto px-4 lg:block">
          <div className="mb-5">{CartaoUsuario}</div>
          {atualizando && avisoAtualizacao}
          <nav className="space-y-1" aria-label="Área logada" aria-busy={atualizando}>
            {navegacao.map((item) => item.children ? (
              <GrupoNavegacao key={item.id} item={item} screen={telaAtiva} onNavigate={navegar} />
            ) : (
              <button key={item.id} type="button" onClick={() => navegar(item.id)} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand ${telaAtiva === item.id ? "bg-brand-soft text-brand" : "text-ink hover:bg-canvas"}`} aria-current={telaAtiva === item.id ? "page" : undefined}><Icone name={item.icon} />{item.label}</button>
            ))}
          </nav>
        </div>
        <div className="mt-auto hidden border-t border-divider p-4 lg:block">
          <button type="button" onClick={aoSair} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-semibold text-muted hover:bg-danger-soft hover:text-danger"><Icone name="logout" />Sair</button>
        </div>
      </aside>
      <div className="min-w-0 flex-1 lg:ml-sidebar">
        {atualizando && <div className="px-4 pt-3 lg:hidden">{avisoAtualizacao}</div>}
        <nav aria-label="Navegação mobile" aria-busy={atualizando} className="flex gap-2 overflow-x-auto border-b border-divider bg-white px-4 py-2 lg:hidden">
          {telas.map((item) => <button key={item.id} type="button" onClick={() => navegar(item.id)} aria-current={telaAtiva === item.id ? "page" : undefined} className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand ${telaAtiva === item.id ? "bg-brand text-white" : "bg-brand-soft text-brand"}`}>{item.label}</button>)}
        </nav>
        <main id="conteudo-painel" tabIndex={-1} className="mx-auto max-w-dashboard p-4 focus:outline-none md:p-8">
          <div className="mb-8">
            <p className="mb-1 text-sm font-semibold text-brand">{usuario.funcaoSistema.nome}</p>
            <Titulo>{telaAtiva === "home" ? `Bem-vindo, ${primeiroNome}` : atual.label}</Titulo>
          </div>
          <Tela key={`${usuario.id}-${telaAtiva}`} screen={atual} screens={telas} navigate={navegar} />
        </main>
      </div>
    </div>
  );
}

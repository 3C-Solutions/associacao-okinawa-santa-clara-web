import { useEffect, useRef, useState } from "react";
import { primeiroNome, achatarNavegacao, navegacaoPorPapel, tempoRelativo, rotulosPapeis } from "@/lib/data.js";
import { usarArmazenamento, usarUsuario } from "@/store";
import { Selo, Botao, Cartao, Icone, BotaoIcone, Titulo } from "@/components/ui";
import GrupoNavegacao from "./components/NavGroup.jsx";
import Agenda from "./screens/Agenda/Agenda.jsx";
import Associados from "./screens/Associates/Associates.jsx";
import Departamentos from "./screens/Departments/Departments.jsx";
import Familias from "./screens/Families/Families.jsx";
import Financas from "./screens/Finance/Finance.jsx";
import Inicio from "./screens/Home/Home.jsx";
import Noticias from "./screens/News/News.jsx";
import Configuracoes from "./screens/Settings/Settings.jsx";

export default function Painel({ account: conta, onLogout: aoSair }) {
  const { state: dadosAplicacao, markRead: marcarComoLido } = usarArmazenamento();
  const [tela, definirTela] = useState("home");
  const [notificacaoAberta, definirNotificacaoAberta] = useState(false);
  const [menuAberto, definirMenuAberto] = useState(false);
  const referenciaNotificacao = useRef(null);
  const { profile: perfil, role: papel } = usarUsuario(conta);

  // notificações do tipo de perfil; as direcionadas a um departamento/família só aparecem para quem pertence a ele
  const itens = dadosAplicacao.notifications.filter((quantidadeN) => quantidadeN.role === papel && (!quantidadeN.associateId || quantidadeN.associateId === perfil.associateId) && (!quantidadeN.departmentId || quantidadeN.departmentId === perfil.departmentId)).sort((elementoA, elementoB) => elementoB.time.localeCompare(elementoA.time));
  const naoLido = itens.filter((quantidadeN) => !quantidadeN.read).length;
  const navegacao = navegacaoPorPapel[papel];
  const telas = achatarNavegacao(navegacao);
  const atual = telas.find((quantidadeN) => quantidadeN.id === tela);

  const navegar = (identificador) => { definirTela(identificador); definirNotificacaoAberta(false); definirMenuAberto(false); window.scrollTo({ top: 0 }); };

  useEffect(() => {
    if (!notificacaoAberta) return undefined;
    const aoPressionar = (evento) => { if (referenciaNotificacao.current && !referenciaNotificacao.current.contains(evento.target)) definirNotificacaoAberta(false); };
    const aoTeclar = (evento) => evento.key === "Escape" && definirNotificacaoAberta(false);
    document.addEventListener("mousedown", aoPressionar);
    document.addEventListener("keydown", aoTeclar);
    return () => { document.removeEventListener("mousedown", aoPressionar); document.removeEventListener("keydown", aoTeclar); };
  }, [notificacaoAberta]);

  const abrirNotificacao = (quantidadeN) => {
    marcarComoLido([quantidadeN.id]);
    if (quantidadeN.screen && telas.some((indice) => indice.id === quantidadeN.screen)) navegar(quantidadeN.screen);
  };

  const CartaoUsuario = (
    <div className="flex items-center gap-3 rounded-xl bg-brand-soft p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white" aria-hidden="true">{perfil.name.charAt(0)}</span>
      <div className="min-w-0"><p className="truncate text-sm font-bold text-brand">{perfil.name}</p><p className="truncate text-xs text-muted">{perfil.email}</p></div>
    </div>
  );

  const conteudo = { home: Inicio, finance: Financas, agenda: Agenda, departments: Departamentos, department: Departamentos, associates: Associados, users: Associados, families: Familias, news: Noticias, settings: Configuracoes }[tela] || Inicio;
  const Tela = conteudo;

  return (
    <div className="min-h-dvh bg-canvas text-ink lg:flex">
      <aside className="border-b border-divider bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-sidebar lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex w-full items-center justify-between px-5 py-4 lg:block lg:px-6 lg:py-7">
          <div className="flex items-center gap-3"><img src="/logo.jpg" alt="Logo da Associação Okinawa de Santa Clara" className="size-11 shrink-0 rounded-full object-contain" /><div><p className="text-sm font-bold text-brand">Okinawa Santa Clara</p><p className="text-xs text-muted">Portal da Associação</p></div></div>
          <div className="lg:hidden"><BotaoIcone icon={menuAberto ? "close" : "menu"} label={menuAberto ? "Fechar menu" : "Abrir menu"} onClick={() => definirMenuAberto(!menuAberto)} /></div>
        </div>
        {menuAberto && (
          <div className="space-y-3 border-t border-divider p-4 lg:hidden">
            {CartaoUsuario}
            <Botao variant="outline" onClick={aoSair} className="w-full"><Icone name="logout" /> Sair</Botao>
          </div>
        )}
        <div className="hidden px-4 lg:block">
          <div className="mb-5">{CartaoUsuario}</div>
          <nav className="space-y-1" aria-label="Área logada">
            {navegacao.map((item) => (item.children ? <GrupoNavegacao key={item.id} item={item} screen={tela} onNavigate={navegar} /> : (
              <button key={item.id} type="button" onClick={() => navegar(item.id)} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand ${tela === item.id ? "bg-brand-soft text-brand" : "text-ink hover:bg-canvas"}`} aria-current={tela === item.id ? "page" : undefined}><Icone name={item.icon} />{item.label}</button>
            )))}
          </nav>
        </div>
        <div className="mt-auto hidden border-t border-divider p-4 lg:block"><button type="button" onClick={aoSair} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-semibold text-muted hover:bg-danger-soft hover:text-danger"><Icone name="logout" />Sair</button></div>
      </aside>

      <div className="min-w-0 flex-1 lg:ml-sidebar">
        <div className="flex gap-2 overflow-x-auto border-b border-divider bg-white px-4 py-2 lg:hidden">
          {telas.map((item) => <button key={item.id} type="button" onClick={() => navegar(item.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tela === item.id ? "bg-brand text-white" : "bg-brand-soft text-brand"}`}>{item.label}</button>)}
        </div>
        <main className="mx-auto max-w-dashboard p-4 md:p-8">
          <div className="relative mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="mb-1 text-sm font-semibold text-brand">{rotulosPapeis[papel]}</p>
              <Titulo>{tela === "home" ? `Bem-vindo, ${primeiroNome(perfil.name)}` : atual?.label}</Titulo>
            </div>
            <div className="flex items-center gap-2" ref={referenciaNotificacao}>
              {naoLido > 0 && <span className="hidden rounded-full bg-danger-soft px-3 py-1.5 text-xs font-bold text-danger sm:inline-flex">{naoLido} {naoLido === 1 ? "nova notificação" : "novas notificações"}</span>}
              <BotaoIcone icon="bell" label={naoLido ? `${naoLido} novas notificações` : "Notificações"} onClick={() => definirNotificacaoAberta(!notificacaoAberta)} active={notificacaoAberta} count={naoLido} />
              {notificacaoAberta && (
                <Cartao className="absolute right-0 top-full z-20 mt-3 w-[min(24rem,100%)] p-5 shadow-xl">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-bold">Notificações</h2>
                    {naoLido > 0 ? <button type="button" onClick={() => marcarComoLido(itens.map((quantidadeN) => quantidadeN.id))} className="text-xs font-semibold text-brand hover:underline">Marcar todas como lidas</button> : <Selo tone="info">Tudo em dia</Selo>}
                  </div>
                  {itens.length === 0 ? <p className="py-6 text-center text-sm text-muted">Nenhuma notificação.</p> : (
                    <ul className="mt-3 max-h-96 divide-y divide-divider overflow-auto">
                      {itens.map((quantidadeN) => (
                        <li key={quantidadeN.id}>
                          <button type="button" onClick={() => abrirNotificacao(quantidadeN)} className="flex w-full gap-3 py-3 text-left hover:bg-canvas">
                            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${quantidadeN.read ? "bg-transparent" : "bg-danger"}`} />
                            <span><span className={`block text-sm ${quantidadeN.read ? "font-medium" : "font-bold"}`}>{quantidadeN.title}</span><span className="mt-1 block text-sm leading-relaxed text-muted">{quantidadeN.detail}</span><span className="mt-1.5 block text-xs font-medium text-brand">{tempoRelativo(quantidadeN.time)}</span></span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Cartao>
              )}
            </div>
          </div>
          <Tela key={`${conta}-${tela}`} role={papel} account={conta} screen={tela} navigate={navegar} />
        </main>
      </div>
    </div>
  );
}

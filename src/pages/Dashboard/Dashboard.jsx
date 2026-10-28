import { useEffect, useRef, useState } from "react";
import { firstName, flattenNav, navByRole, relTime, roleLabels } from "@/lib/data.js";
import { useStore, useUser } from "@/store";
import { Badge, Button, Card, Icon, IconButton, Title } from "@/components/ui";
import NavGroup from "./components/NavGroup.jsx";
import Agenda from "./screens/Agenda/Agenda.jsx";
import Associates from "./screens/Associates/Associates.jsx";
import Departments from "./screens/Departments/Departments.jsx";
import Families from "./screens/Families/Families.jsx";
import Finance from "./screens/Finance/Finance.jsx";
import Home from "./screens/Home/Home.jsx";
import News from "./screens/News/News.jsx";
import Settings from "./screens/Settings/Settings.jsx";

export default function Dashboard({ account, onLogout }) {
  const { state, markRead } = useStore();
  const [screen, setScreen] = useState("home");
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const { profile, role } = useUser(account);

  // notificações do tipo de perfil; as direcionadas a um departamento/família só aparecem para quem pertence a ele
  const items = state.notifications.filter((n) => n.role === role && (!n.associateId || n.associateId === profile.associateId) && (!n.departmentId || n.departmentId === profile.departmentId)).sort((a, b) => b.time.localeCompare(a.time));
  const unread = items.filter((n) => !n.read).length;
  const nav = navByRole[role];
  const screens = flattenNav(nav);
  const current = screens.find((n) => n.id === screen);

  const navigate = (id) => { setScreen(id); setNotifOpen(false); setMenuOpen(false); window.scrollTo({ top: 0 }); };

  useEffect(() => {
    if (!notifOpen) return undefined;
    const onDown = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    const onKey = (e) => e.key === "Escape" && setNotifOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [notifOpen]);

  const openNotification = (n) => {
    markRead([n.id]);
    if (n.screen && screens.some((i) => i.id === n.screen)) navigate(n.screen);
  };

  const UserCard = (
    <div className="flex items-center gap-3 rounded-xl bg-brand-soft p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white" aria-hidden="true">{profile.name.charAt(0)}</span>
      <div className="min-w-0"><p className="truncate text-sm font-bold text-brand">{profile.name}</p><p className="truncate text-xs text-muted">{profile.email}</p></div>
    </div>
  );

  const content = { home: Home, finance: Finance, agenda: Agenda, departments: Departments, department: Departments, associates: Associates, users: Associates, families: Families, news: News, settings: Settings }[screen] || Home;
  const Screen = content;

  return (
    <div className="min-h-dvh bg-canvas text-ink lg:flex">
      <aside className="border-b border-divider bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-sidebar lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex w-full items-center justify-between px-5 py-4 lg:block lg:px-6 lg:py-7">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-brand text-lg font-black text-accent">沖</span><div><p className="text-sm font-bold text-brand">Okinawa Santa Clara</p><p className="text-xs text-muted">Portal da Associação</p></div></div>
          <div className="lg:hidden"><IconButton icon={menuOpen ? "close" : "menu"} label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen(!menuOpen)} /></div>
        </div>
        {menuOpen && (
          <div className="space-y-3 border-t border-divider p-4 lg:hidden">
            {UserCard}
            <Button variant="outline" onClick={onLogout} className="w-full"><Icon name="logout" /> Sair</Button>
          </div>
        )}
        <div className="hidden px-4 lg:block">
          <div className="mb-5">{UserCard}</div>
          <nav className="space-y-1" aria-label="Área logada">
            {nav.map((item) => (item.children ? <NavGroup key={item.id} item={item} screen={screen} onNavigate={navigate} /> : (
              <button key={item.id} type="button" onClick={() => navigate(item.id)} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand ${screen === item.id ? "bg-brand-soft text-brand" : "text-ink hover:bg-canvas"}`} aria-current={screen === item.id ? "page" : undefined}><Icon name={item.icon} />{item.label}</button>
            )))}
          </nav>
        </div>
        <div className="mt-auto hidden border-t border-divider p-4 lg:block"><button type="button" onClick={onLogout} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-semibold text-muted hover:bg-danger-soft hover:text-danger"><Icon name="logout" />Sair</button></div>
      </aside>

      <div className="min-w-0 flex-1 lg:ml-sidebar">
        <div className="flex gap-2 overflow-x-auto border-b border-divider bg-white px-4 py-2 lg:hidden">
          {screens.map((item) => <button key={item.id} type="button" onClick={() => navigate(item.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${screen === item.id ? "bg-brand text-white" : "bg-brand-soft text-brand"}`}>{item.label}</button>)}
        </div>
        <main className="mx-auto max-w-dashboard p-4 md:p-8">
          <div className="relative mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="mb-1 text-sm font-semibold text-brand">{roleLabels[role]}</p>
              <Title>{screen === "home" ? `Bem-vindo, ${firstName(profile.name)}` : current?.label}</Title>
            </div>
            <div className="flex items-center gap-2" ref={notifRef}>
              {unread > 0 && <span className="hidden rounded-full bg-danger-soft px-3 py-1.5 text-xs font-bold text-danger sm:inline-flex">{unread} {unread === 1 ? "nova notificação" : "novas notificações"}</span>}
              <IconButton icon="bell" label={unread ? `${unread} novas notificações` : "Notificações"} onClick={() => setNotifOpen(!notifOpen)} active={notifOpen} count={unread} />
              {notifOpen && (
                <Card className="absolute right-0 top-full z-20 mt-3 w-[min(24rem,100%)] p-5 shadow-xl">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-bold">Notificações</h2>
                    {unread > 0 ? <button type="button" onClick={() => markRead(items.map((n) => n.id))} className="text-xs font-semibold text-brand hover:underline">Marcar todas como lidas</button> : <Badge tone="info">Tudo em dia</Badge>}
                  </div>
                  {items.length === 0 ? <p className="py-6 text-center text-sm text-muted">Nenhuma notificação.</p> : (
                    <ul className="mt-3 max-h-96 divide-y divide-divider overflow-auto">
                      {items.map((n) => (
                        <li key={n.id}>
                          <button type="button" onClick={() => openNotification(n)} className="flex w-full gap-3 py-3 text-left hover:bg-canvas">
                            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-danger"}`} />
                            <span><span className={`block text-sm ${n.read ? "font-medium" : "font-bold"}`}>{n.title}</span><span className="mt-1 block text-sm leading-relaxed text-muted">{n.detail}</span><span className="mt-1.5 block text-xs font-medium text-brand">{relTime(n.time)}</span></span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              )}
            </div>
          </div>
          <Screen key={`${account}-${screen}`} role={role} account={account} screen={screen} navigate={navigate} />
        </main>
      </div>
    </div>
  );
}

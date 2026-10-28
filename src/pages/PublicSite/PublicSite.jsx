import { useEffect, useMemo, useState } from "react";
import { fmtDate, isEmail, maskPhone, photos } from "@/lib/data.js";
import { useStore } from "@/store";
import { Badge, Button, Field, Icon, IconButton, Modal, SectionTitle, SelectField, TextAreaField } from "@/components/ui";

const NAV = [
  ["Início", "inicio"],
  ["Sobre nós", "sobre"],
  ["Departamentos", "departamentos"],
  ["Notícias", "noticias"],
  ["Contato", "contato"],
];

const MAPS_URL = "https://maps.google.com/?q=R.+Miranda+Jordão,+233,+São+Paulo";

export default function PublicSite({ onLogin }) {
  const { state, notify, toast } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [department, setDepartment] = useState(null);
  const [article, setArticle] = useState(null);
  const [carouselStart, setCarouselStart] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cookies, setCookies] = useState(() => {
    try { return localStorage.getItem("okinawa-cookies") === "ok"; } catch { return false; }
  });

  const departments = useMemo(() => state.departments.filter((d) => d.active), [state.departments]);
  const publicNews = useMemo(() => state.news.filter((n) => n.status === "Publicado" && n.audience === "Todos").sort((a, b) => b.date.localeCompare(a.date)), [state.news]);
  const total = departments.length;
  const visibleCount = Math.min(3, total);
  const visible = Array.from({ length: visibleCount }, (_, i) => departments[(carouselStart + i) % total]);
  const members = state.associates.reduce((sum, a) => sum + 1 + a.dependents.length, 0);

  useEffect(() => {
    if (paused || total <= 3) return undefined;
    const timer = window.setInterval(() => setCarouselStart((c) => (c + 1) % total), 5000);
    return () => window.clearInterval(timer);
  }, [paused, total]);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const go = (id) => { scrollTo(id); setMenuOpen(false); };
  const copy = async (value, message) => {
    try { await navigator.clipboard?.writeText(value); toast(message); } catch { toast("Não foi possível copiar", "error"); }
  };
  const acceptCookies = () => {
    try { localStorage.setItem("okinawa-cookies", "ok"); } catch { /* ignora */ }
    setCookies(true);
  };

  // formulário "Associe-se"
  const emptyForm = { name: "", email: "", phone: "", departmentId: "", message: "" };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: key === "phone" ? maskPhone(value) : value })); setErrors((e) => ({ ...e, [key]: undefined })); };
  const submitForm = (event) => {
    event.preventDefault();
    const next = {};
    if (form.name.trim().length < 3) next.name = "Informe seu nome completo.";
    if (!isEmail(form.email)) next.email = "Informe um e-mail válido.";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Informe um telefone com DDD.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const dep = state.departments.find((d) => d.id === form.departmentId);
    notify("admin", "Nova solicitação de associação", `${form.name} (${form.phone})${dep ? ` tem interesse em ${dep.name}` : " quer se associar"}.`, "users");
    toast("Solicitação enviada! Entraremos em contato.");
    setForm(emptyForm);
  };
  const joinDepartment = (dep) => {
    setForm((f) => ({ ...f, departmentId: dep.id }));
    setDepartment(null);
    window.setTimeout(() => scrollTo("associe-se"), 50);
  };

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="sticky top-0 z-30 border-b border-divider bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-content items-center justify-between px-4 md:px-8">
          <button type="button" onClick={() => go("inicio")} className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-brand">
            <span className="grid size-10 place-items-center rounded-full bg-brand text-lg font-black text-accent">沖</span>
            <span className="max-w-52 text-sm font-bold leading-tight text-brand md:text-base">Associação Okinawa<br />de Santa Clara</span>
          </button>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
            {NAV.map(([label, id]) => (
              <button key={id} type="button" onClick={() => go(id)} className="border-b-2 border-transparent py-2 text-sm font-semibold hover:border-accent hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand">{label}</button>
            ))}
            <Button onClick={onLogin} className="min-h-10 px-5">Login</Button>
          </nav>
          <div className="lg:hidden"><IconButton icon={menuOpen ? "close" : "menu"} label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen(!menuOpen)} /></div>
        </div>
        {menuOpen && (
          <nav className="border-t border-divider bg-white p-4 lg:hidden" aria-label="Menu móvel">
            {NAV.map(([label, id]) => <button key={id} type="button" onClick={() => go(id)} className="block min-h-11 w-full rounded-lg px-4 text-left font-semibold hover:bg-brand-soft">{label}</button>)}
            <Button onClick={onLogin} className="mt-2 w-full">Login</Button>
          </nav>
        )}
      </header>

      <main>
        <section id="inicio" className="relative min-h-hero overflow-hidden bg-brand">
          <img src={photos.hero} alt="Celebração cultural japonesa em comunidade" className="absolute inset-0 h-full w-full object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand/95 via-brand/75 to-brand/20" />
          <div className="relative mx-auto flex min-h-hero max-w-content items-center px-4 py-20 md:px-8">
            <div className="max-w-2xl text-white">
              <p className="mb-5 inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">Cultura, comunidade e tradição</p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">Raízes que nos unem.<br /><span className="text-accent">Histórias que continuam.</span></h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">Conheça a cultura de Okinawa e faça parte de uma comunidade que celebra suas origens olhando para o futuro.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={() => scrollTo("departamentos")} className="min-h-13 px-7">Conheça nossas atividades <Icon name="arrow" /></Button>
                <Button onClick={() => scrollTo("associe-se")} variant="outline" className="min-h-13 px-7">Quero me associar</Button>
              </div>
            </div>
          </div>
        </section>

        <section id="sobre" className="mx-auto grid max-w-content gap-12 px-4 py-20 md:grid-cols-2 md:px-8 md:py-28">
          <div className="flex flex-col justify-center">
            <SectionTitle eyebrow="Nossa história">Sobre a Associação</SectionTitle>
            <p className="mt-6 text-lg leading-relaxed text-muted">A proposta central da Associação Okinawa de Santa Clara é promover e divulgar a cultura de Okinawa. Criamos um espaço acolhedor para preservar tradições, fortalecer vínculos e compartilhar conhecimentos entre gerações.</p>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-divider pt-8">
              {[[`${total}`, "departamentos ativos"], [`${state.associates.length}`, "famílias associadas"], [`${members}`, "pessoas na comunidade"]].map(([value, label]) => (
                <div key={label}><p className="text-2xl font-bold text-brand">{value}</p><p className="mt-1 text-sm text-muted">{label}</p></div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -bottom-4 -left-4 h-full w-full rounded-2xl bg-accent" />
            <img src={photos.culture} alt="Pessoa com traje tradicional japonês" className="relative aspect-[4/3] w-full rounded-2xl object-cover shadow-xl" />
          </div>
        </section>

        <section id="departamentos" className="bg-brand-soft/60 py-20 md:py-24" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="mx-auto max-w-content px-4 md:px-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <SectionTitle eyebrow="Faça parte">Nossos departamentos</SectionTitle>
              <div className="flex items-end justify-between gap-6">
                <p className="max-w-lg text-muted">Encontre uma atividade para se conectar com a nossa cultura e com novas pessoas.</p>
                {total > 3 && (
                  <div className="flex shrink-0 gap-2">
                    <button type="button" aria-label="Ver departamentos anteriores" onClick={() => setCarouselStart((c) => (c - 1 + total) % total)} className="grid size-11 place-items-center rounded-full border border-brand text-brand transition hover:bg-brand hover:text-white focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"><span className="rotate-180"><Icon name="arrow" /></span></button>
                    <button type="button" aria-label="Ver próximos departamentos" onClick={() => setCarouselStart((c) => (c + 1) % total)} className="grid size-11 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"><Icon name="arrow" /></button>
                  </div>
                )}
              </div>
            </div>
            <div key={carouselStart} className="carousel-slide mt-10 grid gap-5 md:grid-cols-3">
              {visible.map((item) => (
                <button key={item.id} type="button" onClick={() => setDepartment(item)} className="group overflow-hidden rounded-2xl bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand">
                  <div className="overflow-hidden"><img src={item.image} alt="" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" /></div>
                  <div className="flex items-center justify-between p-6">
                    <div><h3 className="text-xl font-bold text-brand">{item.name}</h3><p className="mt-1 text-sm text-muted">{item.day}, {item.time}</p></div>
                    <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand"><Icon name="arrow" /></span>
                  </div>
                </button>
              ))}
            </div>
            {total > 3 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                {departments.map((item, index) => <button key={item.id} type="button" aria-label={`Exibir grupo iniciado por ${item.name}`} onClick={() => setCarouselStart(index)} className={`h-2 rounded-full transition-all ${index === carouselStart ? "w-7 bg-brand" : "w-2 bg-brand/25 hover:bg-brand/50"}`} />)}
              </div>
            )}
          </div>
        </section>

        <section id="associe-se" className="bg-brand py-20 md:py-24">
          <div className="mx-auto grid max-w-content gap-10 px-4 md:grid-cols-2 md:px-8">
            <div className="text-white">
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent">Associe-se</p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Venha fazer parte da nossa família.</h2>
              <p className="mt-5 max-w-md leading-relaxed text-white/80">Deixe seus dados e a Diretoria entrará em contato para apresentar a associação, os departamentos e como participar.</p>
            </div>
            <form onSubmit={submitForm} noValidate className="space-y-4 rounded-2xl bg-white p-6 shadow-xl md:p-8">
              <Field label="Nome completo" value={form.name} onChange={set("name")} error={errors.name} placeholder="Digite o seu nome" required />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="E-mail" type="email" value={form.email} onChange={set("email")} error={errors.email} placeholder="voce@email.com" required />
                <Field label="Telefone" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} placeholder="(11) 99999-9999" required />
              </div>
              <SelectField label="Departamento de interesse" value={form.departmentId} onChange={set("departmentId")} placeholder="Ainda não sei" options={departments.map((d) => ({ value: d.id, label: d.name }))} />
              <TextAreaField label="Mensagem (opcional)" rows={3} value={form.message} onChange={set("message")} />
              <Button type="submit" className="w-full">Enviar solicitação <Icon name="arrow" /></Button>
            </form>
          </div>
        </section>

        <section className="mx-auto grid max-w-content gap-8 px-4 py-20 md:grid-cols-12 md:px-8">
          <div className="md:col-span-4">
            <SectionTitle eyebrow="Venha nos visitar">Localização</SectionTitle>
            <div className="mt-7 flex gap-3 text-muted"><span className="text-brand"><Icon name="location" /></span><p>R. Miranda Jordão, 233<br />Chácara Mafalda, São Paulo - SP<br />03372-010</p></div>
            <Button variant="secondary" className="mt-7" onClick={() => window.open(MAPS_URL, "_blank", "noopener")}>Abrir no Google Maps <Icon name="arrow" /></Button>
          </div>
          <button type="button" onClick={() => window.open(MAPS_URL, "_blank", "noopener")} className="relative min-h-map overflow-hidden rounded-2xl bg-brand-soft text-left focus:outline-none focus:ring-2 focus:ring-brand md:col-span-8" aria-label="Abrir localização no Google Maps">
            <div className="absolute inset-0 map-pattern opacity-70" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-brand"><span className="grid size-16 place-items-center rounded-full bg-white shadow-xl"><Icon name="location" size={30} /></span></div>
            <div className="absolute bottom-4 left-4 rounded-lg bg-white px-4 py-3 text-sm font-semibold shadow-lg">Associação Okinawa de Santa Clara</div>
          </button>
        </section>
      </main>

      <footer id="contato" className="bg-brand text-white">
        <div className="mx-auto grid max-w-content gap-10 px-4 py-14 md:grid-cols-3 md:px-8">
          <div>
            <h3 className="text-lg font-bold text-accent">Contato</h3>
            <button type="button" onClick={() => copy("(11) 99872-9105", "Telefone copiado!")} className="mt-5 flex min-h-11 items-center gap-3 text-left text-white/80 hover:text-white"><Icon name="phone" /> (11) 99872-9105</button>
            <button type="button" onClick={() => copy("okinawa.santaclara@gmail.com", "E-mail copiado!")} className="flex min-h-11 items-center gap-3 text-left text-white/80 hover:text-white"><Icon name="mail" /> okinawa.santaclara@gmail.com</button>
          </div>
          <div>
            <h3 className="text-lg font-bold text-accent">Redes sociais</h3>
            <div className="mt-5 flex flex-col items-start gap-2">
              {[["facebook", "https://www.facebook.com/okinawasantaclara", "Okinawa Santa Clara", "Facebook"], ["instagram", "https://www.instagram.com/okinawa.santaclara/", "@okinawa.santaclara", "Instagram"]].map(([icon, href, label, network]) => (
                <a key={icon} href={href} target="_blank" rel="noreferrer" aria-label={`Visitar o ${network} da Associação Okinawa de Santa Clara`} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-brand">
                  <span className="grid size-9 place-items-center rounded-full bg-white/10 text-white"><Icon name={icon} /></span>
                  <span className="text-sm font-semibold">{label}</span>
                </a>
              ))}
            </div>
          </div>
          <div><h3 className="text-lg font-bold text-accent">Respeitamos a sua privacidade.</h3><p className="mt-5 text-sm leading-relaxed text-white/70">Utilizamos cookies essenciais de acordo com a nossa Política de Privacidade e, ao continuar navegando, você concorda com estas condições.</p></div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-white/60">© {new Date().getFullYear()} Associação Okinawa de Santa Clara</div>
      </footer>

      {department && (
        <Modal title={department.name} onClose={() => setDepartment(null)} footer={<><Button variant="outline" onClick={() => setDepartment(null)}>Fechar</Button><Button onClick={() => joinDepartment(department)}>Quero participar</Button></>}>
          <img src={department.image} alt="" className="aspect-video w-full rounded-xl object-cover" />
          <p className="mt-5 leading-relaxed text-muted">{department.description}</p>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-divider pt-5 text-sm">
            <div><dt className="text-muted">Encontros</dt><dd className="font-semibold">{department.day}, {department.time}</dd></div>
            <div><dt className="text-muted">Responsável</dt><dd className="font-semibold">{department.teacher}</dd></div>
          </dl>
        </Modal>
      )}
      {article && (
        <Modal title={article.title} onClose={() => setArticle(null)} footer={<Button onClick={() => setArticle(null)}>Fechar</Button>}>
          <img src={article.image} alt="" className="aspect-video w-full rounded-xl object-cover" />
          <div className="mt-4 flex items-center gap-3"><Badge tone="info">{article.category}</Badge><span className="text-sm text-muted">{fmtDate(article.date)}</span></div>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-muted">{article.body}</p>
        </Modal>
      )}
      {!cookies && (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-divider bg-white p-4 shadow-2xl sm:flex-row sm:items-center" role="dialog" aria-label="Aviso de cookies">
          <p className="flex-1 text-sm text-muted">Usamos cookies essenciais para o funcionamento do site, conforme a nossa Política de Privacidade.</p>
          <Button onClick={acceptCookies} className="min-h-10">Entendi</Button>
        </div>
      )}
    </div>
  );
}

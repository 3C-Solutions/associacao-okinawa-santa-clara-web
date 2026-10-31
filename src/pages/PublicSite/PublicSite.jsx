import { useEffect, useMemo, useState } from "react";
import { formatarData, ehEmail, mascararTelefone, fotos } from "@/lib/data.js";
import { usarArmazenamento } from "@/store";
import { Selo, Botao, Campo, Icone, BotaoIcone, Modal, TituloSecao, CampoSelecao, CampoAreaTexto } from "@/components/ui";

const NAVEGACAO = [
  ["Início", "inicio"],
  ["Sobre nós", "sobre"],
  ["Departamentos", "departamentos"],
  ["Contato", "contato"],
];

const URL_MAPAS = "https://maps.google.com/?q=R.+Miranda+Jordão,+233,+São+Paulo";

export default function SitePublico({ onLogin: aoEntrar }) {
  const { state: dadosAplicacao, notify: notificar, toast: aviso } = usarArmazenamento();
  const [menuAberto, definirMenuAberto] = useState(false);
  const [departamento, definirDepartamento] = useState(null);
  const [artigo, definirArtigo] = useState(null);
  const [inicioCarrossel, definirInicioCarrossel] = useState(0);
  const [pausado, definirPausado] = useState(false);
  const [cookies, definirCookies] = useState(() => {
    try { return localStorage.getItem("okinawa-cookies") === "ok"; } catch { return false; }
  });

  const departamentos = useMemo(() => dadosAplicacao.departments.filter((dataValor) => dataValor.active), [dadosAplicacao.departments]);
  const total = departamentos.length;
  const quantidadeVisivel = Math.min(3, total);
  const visivel = Array.from({ length: quantidadeVisivel }, (ignorado, indice) => departamentos[(inicioCarrossel + indice) % total]);
  const membros = dadosAplicacao.associates.reduce((somar, elementoA) => somar + 1 + elementoA.dependents.length, 0);

  useEffect(() => {
    if (pausado || total <= 3) return undefined;
    const temporizador = window.setInterval(() => definirInicioCarrossel((elementoC) => (elementoC + 1) % total), 5000);
    return () => window.clearInterval(temporizador);
  }, [pausado, total]);

  const rolarPara = (identificador) => document.getElementById(identificador)?.scrollIntoView({ behavior: "smooth" });
  const ir = (identificador) => { rolarPara(identificador); definirMenuAberto(false); };
  const copiar = async (valor, mensagem) => {
    try { await navigator.clipboard?.writeText(valor); aviso(mensagem); } catch { aviso("Não foi possível copiar", "error"); }
  };
  const aceitarCookies = () => {
    try { localStorage.setItem("okinawa-cookies", "ok"); } catch { /* ignora */ }
    definirCookies(true);
  };

  const formularioVazio = { name: "", email: "", phone: "", departmentId: "", message: "" };
  const [formulario, definirFormulario] = useState(formularioVazio);
  const [erros, definirErros] = useState({});
  const definir = (chave) => (valor) => { definirFormulario((elementoF) => ({ ...elementoF, [chave]: chave === "phone" ? mascararTelefone(valor) : valor })); definirErros((evento) => ({ ...evento, [chave]: undefined })); };
  const enviarFormulario = (evento) => {
    evento.preventDefault();
    const proximo = {};
    if (formulario.name.trim().length < 3) proximo.name = "Informe seu nome completo.";
    if (!ehEmail(formulario.email)) proximo.email = "Informe um e-mail válido.";
    if (formulario.phone.replace(/\D/g, "").length < 10) proximo.phone = "Informe um telefone com DDD.";
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    const departamento = dadosAplicacao.departments.find((dataValor) => dataValor.id === formulario.departmentId);
    notificar("admin", "Nova solicitação de associação", `${formulario.name} (${formulario.phone})${departamento ? ` tem interesse em ${departamento.name}` : " quer se associar"}.`, "users");
    aviso("Solicitação enviada! Entraremos em contato.");
    definirFormulario(formularioVazio);
  };
  const associarDepartamento = (departamento) => {
    definirFormulario((elementoF) => ({ ...elementoF, departmentId: departamento.id }));
    definirDepartamento(null);
    window.setTimeout(() => rolarPara("associe-se"), 50);
  };

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="sticky top-0 z-30 border-b border-divider bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-content items-center justify-between px-4 md:px-8">
          <button type="button" onClick={() => ir("inicio")} className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-brand">
            <img src="/logo.jpg" alt="Logo da Associação Okinawa de Santa Clara" className="size-10 rounded-full object-contain" />
            <span className="max-w-52 text-sm font-bold leading-tight text-brand md:text-base">Associação Okinawa<br />de Santa Clara</span>
          </button>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
            {NAVEGACAO.map(([rotulo, identificador]) => (
              <button key={identificador} type="button" onClick={() => ir(identificador)} className="border-b-2 border-transparent py-2 text-sm font-semibold hover:border-accent hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand">{rotulo}</button>
            ))}
            <Botao onClick={aoEntrar} className="min-h-10 px-5">Login</Botao>
          </nav>
          <div className="lg:hidden"><BotaoIcone icon={menuAberto ? "close" : "menu"} label={menuAberto ? "Fechar menu" : "Abrir menu"} onClick={() => definirMenuAberto(!menuAberto)} /></div>
        </div>
        {menuAberto && (
          <nav className="border-t border-divider bg-white p-4 lg:hidden" aria-label="Menu móvel">
            {NAVEGACAO.map(([rotulo, identificador]) => <button key={identificador} type="button" onClick={() => ir(identificador)} className="block min-h-11 w-full rounded-lg px-4 text-left font-semibold hover:bg-brand-soft">{rotulo}</button>)}
            <Botao onClick={aoEntrar} className="mt-2 w-full">Login</Botao>
          </nav>
        )}
      </header>

      <main>
        <section id="inicio" className="relative min-h-hero overflow-hidden bg-brand">
          <img src={fotos.hero} alt="Celebração cultural japonesa em comunidade" className="absolute inset-0 h-full w-full object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand/95 via-brand/75 to-brand/20" />
          <div className="relative mx-auto flex min-h-hero max-w-content items-center px-4 py-20 md:px-8">
            <div className="max-w-2xl text-white">
              <p className="mb-5 inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">Cultura, comunidade e tradição</p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">Raízes que nos unem.<br /><span className="text-accent">Histórias que continuam.</span></h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">Conheça a cultura de Okinawa e faça parte de uma comunidade que celebra suas origens olhando para o futuro.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Botao onClick={() => rolarPara("departamentos")} className="min-h-13 px-7">Conheça nossas atividades <Icone name="arrow" /></Botao>
                <Botao onClick={() => rolarPara("associe-se")} variant="outline" className="min-h-13 px-7">Quero me associar</Botao>
              </div>
            </div>
          </div>
        </section>

        <section id="sobre" className="mx-auto grid max-w-content gap-12 px-4 py-20 md:grid-cols-2 md:px-8 md:py-28">
          <div className="flex flex-col justify-center">
            <TituloSecao eyebrow="Nossa história">Sobre a Associação</TituloSecao>
            <p className="mt-6 text-lg leading-relaxed text-muted">A proposta central da Associação Okinawa de Santa Clara é promover e divulgar a cultura de Okinawa. Criamos um espaço acolhedor para preservar tradições, fortalecer vínculos e compartilhar conhecimentos entre gerações.</p>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-divider pt-8">
              {[[`${total}`, "departamentos ativos"], [`${dadosAplicacao.associates.length}`, "famílias associadas"], [`${membros}`, "pessoas na comunidade"]].map(([valor, rotulo]) => (
                <div key={rotulo}><p className="text-2xl font-bold text-brand">{valor}</p><p className="mt-1 text-sm text-muted">{rotulo}</p></div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -bottom-4 -left-4 h-full w-full rounded-2xl bg-accent" />
            <img src="/associacao.jpg" alt="Apresentação cultural no Shinnenkai 2024 da Associação Okinawa de Santa Clara" className="relative aspect-[4/3] w-full rounded-2xl object-cover shadow-xl" />
          </div>
        </section>

        <section id="departamentos" className="bg-brand-soft/60 py-20 md:py-24" onMouseEnter={() => definirPausado(true)} onMouseLeave={() => definirPausado(false)}>
          <div className="mx-auto max-w-content px-4 md:px-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <TituloSecao eyebrow="Faça parte">Nossos departamentos</TituloSecao>
              <div className="flex items-end justify-between gap-6">
                <p className="max-w-lg text-muted">Encontre uma atividade para se conectar com a nossa cultura e com novas pessoas.</p>
                {total > 3 && (
                  <div className="flex shrink-0 gap-2">
                    <button type="button" aria-label="Ver departamentos anteriores" onClick={() => definirInicioCarrossel((elementoC) => (elementoC - 1 + total) % total)} className="grid size-11 place-items-center rounded-full border border-brand text-brand transition hover:bg-brand hover:text-white focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"><span className="rotate-180"><Icone name="arrow" /></span></button>
                    <button type="button" aria-label="Ver próximos departamentos" onClick={() => definirInicioCarrossel((elementoC) => (elementoC + 1) % total)} className="grid size-11 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"><Icone name="arrow" /></button>
                  </div>
                )}
              </div>
            </div>
            <div key={inicioCarrossel} className="carousel-slide mt-10 grid gap-5 md:grid-cols-3">
              {visivel.map((item) => (
                <button key={item.id} type="button" onClick={() => definirDepartamento(item)} className="group overflow-hidden rounded-2xl bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand">
                  <div className="overflow-hidden"><img src={item.image} alt="" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" /></div>
                  <div className="flex items-center justify-between p-6">
                    <div><h3 className="text-xl font-bold text-brand">{item.name}</h3><p className="mt-1 text-sm text-muted">{item.day}, {item.time}</p></div>
                    <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand"><Icone name="arrow" /></span>
                  </div>
                </button>
              ))}
            </div>
            {total > 3 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                {departamentos.map((item, indice) => <button key={item.id} type="button" aria-label={`Exibir grupo iniciado por ${item.name}`} onClick={() => definirInicioCarrossel(indice)} className={`h-2 rounded-full transition-all ${indice === inicioCarrossel ? "w-7 bg-brand" : "w-2 bg-brand/25 hover:bg-brand/50"}`} />)}
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
            <form onSubmit={enviarFormulario} noValidate className="space-y-4 rounded-2xl bg-white p-6 shadow-xl md:p-8">
              <Campo label="Nome completo" value={formulario.name} onChange={definir("name")} error={erros.name} placeholder="Digite o seu nome" required />
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="E-mail" type="email" value={formulario.email} onChange={definir("email")} error={erros.email} placeholder="email@email.com" required />
                <Campo label="Telefone" type="tel" value={formulario.phone} onChange={definir("phone")} error={erros.phone} placeholder="(11) 99999-9999" required />
              </div>
              <CampoSelecao label="Departamento de interesse" value={formulario.departmentId} onChange={definir("departmentId")} placeholder="À definir" options={departamentos.map((dataValor) => ({ value: dataValor.id, label: dataValor.name }))} />
              <CampoAreaTexto label="Mensagem (opcional)" rows={3} value={formulario.message} onChange={definir("message")} />
              <Botao type="submit" className="w-full">Enviar mensagem <Icone name="arrow" /></Botao>
            </form>
          </div>
        </section>

        <section className="mx-auto grid max-w-content gap-8 px-4 py-20 md:grid-cols-12 md:px-8">
          <div className="md:col-span-4">
            <TituloSecao eyebrow="Venha nos visitar">Localização</TituloSecao>
            <div className="mt-7 flex gap-3 text-muted"><span className="text-brand"><Icone name="location" /></span><p>R. Miranda Jordão, 233<br />Chácara Mafalda, São Paulo - SP<br />03372-010</p></div>
            <Botao variant="secondary" className="mt-7" onClick={() => window.open(URL_MAPAS, "_blank", "noopener")}>Abrir no Google Maps <Icone name="arrow" /></Botao>
          </div>
          <button type="button" onClick={() => window.open(URL_MAPAS, "_blank", "noopener")} className="relative min-h-map overflow-hidden rounded-2xl bg-brand-soft text-left focus:outline-none focus:ring-2 focus:ring-brand md:col-span-8" aria-label="Abrir localização no Google Maps">
            <div className="absolute inset-0 map-pattern opacity-70" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-brand"><span className="grid size-16 place-items-center rounded-full bg-white shadow-xl"><Icone name="location" size={30} /></span></div>
            <div className="absolute bottom-4 left-4 rounded-lg bg-white px-4 py-3 text-sm font-semibold shadow-lg">Associação Okinawa de Santa Clara</div>
          </button>
        </section>
      </main>

      <footer id="contato" className="bg-brand text-white">
        <div className="mx-auto grid max-w-content gap-10 px-4 py-14 md:grid-cols-3 md:px-8">
          <div>
            <h3 className="text-lg font-bold text-accent">Contato</h3>
            <button type="button" onClick={() => copiar("(11) 99872-9105", "Telefone copiado!")} className="mt-5 flex min-h-11 items-center gap-3 text-left text-white/80 hover:text-white"><Icone name="phone" /> (11) 99872-9105</button>
            <button type="button" onClick={() => copiar("okinawa.santaclara@gmail.com", "E-mail copiado!")} className="flex min-h-11 items-center gap-3 text-left text-white/80 hover:text-white"><Icone name="mail" /> okinawa.santaclara@gmail.com</button>
          </div>
          <div>
            <h3 className="text-lg font-bold text-accent">Redes sociais</h3>
            <div className="mt-5 flex flex-col items-start gap-2">
              {[["facebook", "https://www.facebook.com/okinawasantaclara", "Okinawa Santa Clara", "Facebook"], ["instagram", "https://www.instagram.com/okinawa.santaclara/", "@okinawa.santaclara", "Instagram"]].map(([icone, enderecoHref, rotulo, rede]) => (
                <a key={icone} href={enderecoHref} target="_blank" rel="noreferrer" aria-label={`Visitar o ${rede} da Associação Okinawa de Santa Clara`} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-brand">
                  <span className="grid size-9 place-items-center rounded-full bg-white/10 text-white"><Icone name={icone} /></span>
                  <span className="text-sm font-semibold">{rotulo}</span>
                </a>
              ))}
            </div>
          </div>
          <div><h3 className="text-lg font-bold text-accent">Respeitamos a sua privacidade.</h3><p className="mt-5 text-sm leading-relaxed text-white/70">Utilizamos cookies essenciais de acordo com a nossa Política de Privacidade e, ao continuar navegando, você concorda com estas condições.</p></div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-white/60">© {new Date().getFullYear()} Associação Okinawa de Santa Clara</div>
      </footer>

      {departamento && (
        <Modal title={departamento.name} onClose={() => definirDepartamento(null)} footer={<><Botao variant="outline" onClick={() => definirDepartamento(null)}>Fechar</Botao><Botao onClick={() => associarDepartamento(departamento)}>Quero participar</Botao></>}>
          <img src={departamento.image} alt="" className="aspect-video w-full rounded-xl object-cover" />
          <p className="mt-5 leading-relaxed text-muted">{departamento.description}</p>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-divider pt-5 text-sm">
            <div><dt className="text-muted">Encontros</dt><dd className="font-semibold">{departamento.day}, {departamento.time}</dd></div>
            <div><dt className="text-muted">Responsável</dt><dd className="font-semibold">{departamento.teacher}</dd></div>
          </dl>
        </Modal>
      )}
      {artigo && (
        <Modal title={artigo.title} onClose={() => definirArtigo(null)} footer={<Botao onClick={() => definirArtigo(null)}>Fechar</Botao>}>
          <img src={artigo.image} alt="" className="aspect-video w-full rounded-xl object-cover" />
          <div className="mt-4 flex items-center gap-3"><Selo tone="info">{artigo.category}</Selo><span className="text-sm text-muted">{formatarData(artigo.date)}</span></div>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-muted">{artigo.body}</p>
        </Modal>
      )}
      {!cookies && (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-divider bg-white p-4 shadow-2xl sm:flex-row sm:items-center" role="dialog" aria-label="Aviso de cookies">
          <p className="flex-1 text-sm text-muted">Usamos cookies essenciais para o funcionamento do site, conforme a nossa Política de Privacidade.</p>
          <Botao onClick={aceitarCookies} className="min-h-10">Entendi</Botao>
        </div>
      )}
    </div>
  );
}

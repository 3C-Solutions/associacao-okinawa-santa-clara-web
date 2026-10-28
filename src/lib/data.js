// Dados de exemplo, constantes e funções utilitárias.

export const photos = {
  hero: "https://images.unsplash.com/photo-1721208813573-20ec1df0b2fd?auto=format&fit=crop&w=1800&q=85",
  culture: "https://images.unsplash.com/photo-1610934385863-3fa53e2944e6?auto=format&fit=crop&w=1200&q=85",
  dance: "https://images.unsplash.com/photo-1596253818975-c86f296ae87a?auto=format&fit=crop&w=900&q=80",
  festival: "https://images.unsplash.com/photo-1725399635252-8cbb5b7562b7?auto=format&fit=crop&w=900&q=80",
  community: "https://images.unsplash.com/photo-1568222115029-c93fd44cbd32?auto=format&fit=crop&w=900&q=80",
  karaoke: "https://images.unsplash.com/photo-1731184833083-e5420526cc60?auto=format&fit=crop&w=900&q=80",
  tableTennis: "https://images.unsplash.com/photo-1646978567314-32cfd5a8854e?auto=format&fit=crop&w=900&q=80",
  calligraphy: "https://images.unsplash.com/photo-1546638008-efbe0b62c730?auto=format&fit=crop&w=900&q=80",
  music: "https://images.unsplash.com/photo-1575405965126-db9ae94eb438?auto=format&fit=crop&w=900&q=80",
  class: "https://images.unsplash.com/photo-1557199868-02a704b27808?auto=format&fit=crop&w=900&q=80",
  games: "https://images.unsplash.com/photo-1763697038874-c982e9246764?auto=format&fit=crop&w=900&q=80",
  rhythms: "https://images.unsplash.com/photo-1759299983106-f022b704b62a?auto=format&fit=crop&w=900&q=80",
  volleyball: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=900&q=80",
  acupuncture: "https://images.unsplash.com/photo-1700882304335-34d47c682a4c?auto=format&fit=crop&w=900&q=80",
};

export const roleLabels = { admin: "Diretoria", department: "Departamento", member: "Associado", dependent: "Dependente" };

// Associado responsável e dependentes compartilham as mesmas telas e o mesmo escopo de dados (a família).
// A diferença: o dependente não cadastra, edita nem remove membros da família.
export const isFamilyRole = (role) => role === "member" || role === "dependent";

export const navByRole = {
  admin: [
    { id: "home", label: "Homepage", icon: "home" },
    { id: "finance", label: "Financeiro", icon: "wallet" },
    { id: "agenda", label: "Agenda", icon: "calendar" },
    { id: "departments", label: "Departamentos", icon: "groups" },
    {
      id: "users-group",
      label: "Usuários",
      icon: "person",
      children: [
        { id: "families", label: "Famílias", icon: "groups" },
        { id: "users", label: "Usuários", icon: "person" },
      ],
    },
    { id: "news", label: "Notícias", icon: "news" },
    { id: "settings", label: "Configurações", icon: "settings" },
  ],
  department: [
    { id: "home", label: "Homepage", icon: "home" },
    { id: "finance", label: "Financeiro", icon: "wallet" },
    { id: "agenda", label: "Agenda", icon: "calendar" },
    { id: "department", label: "Departamento", icon: "groups" },
    { id: "associates", label: "Associados", icon: "person" },
    { id: "news", label: "Notícias", icon: "news" },
    { id: "settings", label: "Configurações", icon: "settings" },
  ],
  member: [
    { id: "home", label: "Homepage", icon: "home" },
    { id: "finance", label: "Financeiro", icon: "wallet" },
    { id: "agenda", label: "Agenda", icon: "calendar" },
    { id: "department", label: "Departamentos", icon: "groups" },
    { id: "associates", label: "Família", icon: "person" },
    { id: "news", label: "Notícias", icon: "news" },
    { id: "settings", label: "Configurações", icon: "settings" },
  ],
  dependent: [
    { id: "home", label: "Homepage", icon: "home" },
    { id: "finance", label: "Financeiro", icon: "wallet" },
    { id: "agenda", label: "Agenda", icon: "calendar" },
    { id: "department", label: "Departamentos", icon: "groups" },
    { id: "associates", label: "Família", icon: "person" },
    { id: "news", label: "Notícias", icon: "news" },
    { id: "settings", label: "Configurações", icon: "settings" },
  ],
};

// Lista plana das telas (expande os itens que são "pastas" com filhos)
export const flattenNav = (nav) => nav.flatMap((item) => (item.children ? item.children : [item]));

// Senha inicial de todo usuário cadastrado pela diretoria (o próprio usuário pode trocá-la em Configurações)
export const INITIAL_PASSWORD = "prototipo";

// Tipos de perfil que a diretoria pode cadastrar (um usuário por vez)
export const USER_TYPES = [
  { value: "admin", label: "Diretoria" },
  { value: "department", label: "Departamento" },
  { value: "member", label: "Associado responsável" },
  { value: "dependent", label: "Dependente" },
];

// A diretoria só cadastra novos perfis de Diretoria e Associado responsável.
// Perfil Departamento é cadastrado por um usuário do próprio departamento; Dependente, pelo associado responsável.
export const ADMIN_CREATABLE_TYPES = USER_TYPES.filter((t) => t.value === "admin" || t.value === "member");

export const FINANCE_CATEGORIES = ["Mensalidades", "Anuidades", "Kifu (doações)", "Eventos", "Aluguel do salão", "Infraestrutura", "Materiais", "Reembolsos", "Outros"];
export const EVENT_CATEGORIES = ["Cultural", "Ensaio", "Comunidade", "Reunião", "Esporte", "Aula"];
export const NEWS_CATEGORIES = ["Evento", "Departamento", "Comunicado", "Cultura"];
export const NEWS_AUDIENCES = ["Todos", "Associados", "Diretoria"];
export const RELATIONS = ["Cônjuge", "Filho(a)", "Pai", "Mãe", "Irmão(ã)", "Outro"];
export const WEEKDAYS = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
export const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export const MEMBER_FEE = 120; // anuidade do associado (tabela anuidade: ano, valor, data_vencimento)
export const DEPT_FEE = 120; // mensalidade do departamento para a associação (tabela mensalidade: data_vencimento, valor)
export const MEMBER_FEE_DUE = "03-31"; // vencimento da anuidade (MM-DD)
export const DEPT_FEE_DUE_DAY = 10; // vencimento da mensalidade (dia do mês)
export const PAYMENT_METHODS = ["Pix", "Transferência bancária", "Boleto", "Dinheiro (depósito)"];
export const RECEIPT_MAX_BYTES = 1024 * 1024; // comprovantes de até 1 MB (o protótipo guarda tudo no navegador)

// Situação de uma solicitação de inscrição (relação "matrícula" do banco)
export const REQUEST_STATUS = { pending: "Pendente", waitlist: "Lista de espera", approved: "Aprovada", rejected: "Recusada" };

// ---------- utilitários ----------
export const uid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10));

const pad = (n) => String(n).padStart(2, "0");
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());
export const fromISO = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (iso, n) => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const fmtDate = (iso) => (iso ? iso.split("-").reverse().join("/") : "");
export const fmtDay = (iso) => `${pad(fromISO(iso).getDate())} ${MONTHS[fromISO(iso).getMonth()].slice(0, 3)}`;
export const fmtMoney = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
export const monthKey = (iso) => iso.slice(0, 7);
export const firstName = (name) => (name || "").split(" ")[0];

export function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Agora";
  if (min < 60) return `Há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Há ${h} ${h === 1 ? "hora" : "horas"}`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Ontem";
  return `Há ${d} dias`;
}

export const maskPhone = (value) => {
  const n = value.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
};
export const maskCep = (value) => {
  const n = value.replace(/\D/g, "").slice(0, 8);
  return n.length > 5 ? `${n.slice(0, 5)}-${n.slice(5)}` : n;
};
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");

export function downloadCSV(filename, header, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(esc).join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- dados iniciais (datas relativas a hoje) ----------
export function createSeed() {
  const today = todayISO();
  const now = new Date();
  const year = now.getFullYear();
  const curMonth = now.getMonth();
  const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();

  const departments = [
    { id: "d-eisa", name: "Eisa Taiko", image: photos.dance, description: "Dança e tambores tradicionais de Okinawa que unem ritmo, movimento e a energia da nossa comunidade.", day: "Quarta-feira", time: "19:30", teacher: "Akira Nakamura", fee: 80, capacity: 8, active: true },
    { id: "d-odori", name: "Odori", image: photos.culture, description: "Danças tradicionais japonesas que preservam gestos, histórias e celebrações entre gerações.", day: "Sábado", time: "14:00", teacher: "Keiko Shimabukuro", fee: 70, capacity: 2, active: true },
    { id: "d-karaoke", name: "Karaokê", image: photos.karaoke, description: "Encontros descontraídos para cantar, compartilhar repertórios e fortalecer amizades.", day: "Sexta-feira", time: "20:00", teacher: "Equipe do departamento", fee: 30, capacity: 20, active: true },
    { id: "d-tenis", name: "Tênis de Mesa", image: photos.tableTennis, description: "Treinos e partidas para praticantes iniciantes e experientes de todas as idades.", day: "Terça-feira", time: "19:00", teacher: "Paulo Oshiro", fee: 60, capacity: 10, active: true },
    { id: "d-japones", name: "Aula de Japonês", image: photos.class, description: "Aulas de idioma japonês com atividades de conversação, leitura e cultura.", day: "Terça-feira", time: "19:00", teacher: "Sayuri Tamashiro", fee: 120, capacity: 15, active: true },
    { id: "d-shodo", name: "Shodo", image: photos.calligraphy, description: "Prática da caligrafia japonesa com atenção à forma, ao movimento e à expressão.", day: "Quinta-feira", time: "18:30", teacher: "Hiroshi Kinjo", fee: 90, capacity: 10, active: true },
    { id: "d-sanshin", name: "Sanshin", image: photos.music, description: "Aprendizado do instrumento tradicional de Okinawa e de seu repertório cultural.", day: "Segunda-feira", time: "19:30", teacher: "Masao Gushiken", fee: 90, capacity: 10, active: true },
    { id: "d-seinenkai", name: "Seinenkai", image: photos.community, description: "Grupo de jovens que promove integração, voluntariado e continuidade das tradições.", day: "Domingo", time: "10:00", teacher: "Diretoria jovem", fee: 0, capacity: 30, active: true },
    { id: "d-ritmos", name: "Aula de Ritmos", image: photos.rhythms, description: "Aulas coletivas com música, movimento e muita energia para cuidar do bem-estar.", day: "Segunda-feira", time: "08:00", teacher: "Fernanda Arakaki", fee: 70, capacity: 20, active: true },
    { id: "d-sextou", name: "Sextou", image: photos.games, description: "Jogos livres de tênis de mesa para reunir amigos e começar bem o fim de semana.", day: "Sexta-feira", time: "19:00", teacher: "Equipe do departamento", fee: 20, capacity: 1, active: true },
    { id: "d-volei", name: "Vôlei", image: photos.volleyball, description: "Treinos coletivos e partidas de vôlei com foco em integração e espírito de equipe.", day: "Quinta-feira", time: "20:00", teacher: "Rogério Higa", fee: 50, capacity: 14, active: true },
    { id: "d-acupuntura", name: "Acupuntura", image: photos.acupuncture, description: "Atendimentos voltados ao equilíbrio, ao cuidado e à promoção da qualidade de vida.", day: "Sábado", time: "09:00", teacher: "Dra. Mitsue Yamada", fee: 0, capacity: 6, active: true },
  ];

  const associates = [
    { id: "a-ana", familyId: "f-higa", name: "Ana Higa", email: "ana.higa@email.com", phone: "(11) 99821-4478", since: "2018-03-12", departmentIds: ["d-eisa"], dependents: [{ id: "p-ana1", name: "Lucas Higa", relation: "Filho(a)", departmentIds: ["d-eisa"] }, { id: "p-ana2", name: "Mayumi Higa", relation: "Filho(a)", departmentIds: [] }] },
    { id: "a-carlos", familyId: "f-uehara", name: "Carlos Uehara", email: "carlos.uehara@email.com", phone: "(11) 98745-2190", since: "2020-06-05", departmentIds: ["d-japones", "d-shodo"], dependents: [{ id: "p-car1", name: "Emi Uehara", relation: "Cônjuge", departmentIds: ["d-shodo"] }] },
    { id: "a-joana", familyId: "f-takara", name: "Joana Takara", email: "joana@okinawasc.org.br", phone: "(11) 99872-9105", since: "2022-01-18", departmentIds: ["d-eisa", "d-japones"], dependents: [{ id: "p-joa1", name: "Roberto Takara", relation: "Cônjuge", email: "roberto@okinawasc.org.br", phone: "(11) 99731-2250", departmentIds: ["d-eisa", "d-japones"] }, { id: "p-joa2", name: "Kenji Takara", relation: "Filho(a)", departmentIds: ["d-eisa"] }] },
    { id: "a-paulo", familyId: "f-oshiro", name: "Paulo Oshiro", email: "paulo.oshiro@email.com", phone: "(11) 97766-1203", since: "2016-09-30", departmentIds: ["d-tenis", "d-sextou"], dependents: [] },
    { id: "a-sayuri", familyId: "f-tamashiro", name: "Sayuri Tamashiro", email: "sayuri.t@email.com", phone: "(11) 96655-8821", since: "2019-02-14", departmentIds: ["d-odori"], dependents: [{ id: "p-say1", name: "Hana Tamashiro", relation: "Filho(a)", departmentIds: ["d-odori"] }] },
  ];

  // Famílias: sobrenome + endereço. Cada família reúne o associado responsável e seus dependentes.
  const families = [
    { id: "f-higa", surname: "Higa", address: "R. Vergueiro", number: "1520", complement: "Casa 2", district: "Liberdade", city: "São Paulo", uf: "SP", cep: "01504-001" },
    { id: "f-uehara", surname: "Uehara", address: "R. Galvão Bueno", number: "98", complement: "", district: "Liberdade", city: "São Paulo", uf: "SP", cep: "01506-000" },
    { id: "f-takara", surname: "Takara", address: "R. das Flores", number: "245", complement: "Apto. 32", district: "Chácara Mafalda", city: "São Paulo", uf: "SP", cep: "03372-010" },
    { id: "f-oshiro", surname: "Oshiro", address: "Av. Lins de Vasconcelos", number: "710", complement: "", district: "Cambuci", city: "São Paulo", uf: "SP", cep: "01538-001" },
    { id: "f-tamashiro", surname: "Tamashiro", address: "R. Miranda Jordão", number: "233", complement: "Bloco B", district: "Vila Mariana", city: "São Paulo", uf: "SP", cep: "04105-000" },
  ];

  const events = [
    { id: "e1", date: addDays(today, 3), time: "19:30", title: "Ensaio de Eisa Taiko", category: "Ensaio", owner: "Departamento Eisa Taiko" },
    { id: "e2", date: addDays(today, 8), time: "11:00", title: "Almoço comunitário", category: "Comunidade", owner: "Diretoria" },
    { id: "e3", date: addDays(today, 15), time: "14:00", title: "Festival Okinawa", category: "Cultural", owner: "Diretoria" },
    { id: "e4", date: addDays(today, 22), time: "10:00", title: "Assembleia mensal", category: "Reunião", owner: "Diretoria" },
    { id: "e5", date: addDays(today, 29), time: "19:00", title: "Torneio de tênis de mesa", category: "Esporte", owner: "Departamento Tênis de Mesa" },
  ];

  const reservations = [
    { id: "r1", date: addDays(today, 12), time: "19:00", title: "Ensaio extra para o festival", requester: "Marina Nakamura", role: "department", ownerId: "d-eisa", ownerName: "Departamento Eisa Taiko", status: "Pendente", createdAt: hoursAgo(1) },
    { id: "r2", date: addDays(today, 18), time: "15:00", title: "Aniversário em família", requester: "Joana Takara", role: "member", ownerId: "a-joana", ownerName: "Joana Takara", status: "Pendente", createdAt: hoursAgo(26) },
  ];

  const transactions = [];
  const push = (t) => transactions.push({ id: uid(), status: "Pago", scope: "assoc", ...t });
  for (let m = 0; m <= curMonth; m++) {
    const key = `${year}-${pad(m + 1)}`;
    const current = m === curMonth;
    push({ date: `${key}-05`, description: "Mensalidades dos associados", category: "Mensalidades", type: "in", amount: 4000 + ((m * 370) % 900) });
    push({ date: `${key}-10`, description: "Aluguel do salão", category: "Aluguel do salão", type: "in", amount: 2400 });
    if (m % 2 === 0) push({ date: `${key}-12`, description: "Doações (Kifu)", category: "Kifu (doações)", type: "in", amount: 900 + m * 40 });
    push({ date: `${key}-15`, description: "Conta de energia", category: "Infraestrutura", type: "out", amount: 580 + ((m * 53) % 120), status: current ? "Pendente" : "Pago" });
    push({ date: `${key}-20`, description: "Materiais e limpeza", category: "Materiais", type: "out", amount: 350 + ((m * 71) % 260) });
  }
  // departamento Eisa Taiko
  for (let m = Math.max(0, curMonth - 2); m <= curMonth; m++) {
    const key = `${year}-${pad(m + 1)}`;
    transactions.push({ id: uid(), date: `${key}-06`, description: "Mensalidades dos alunos", category: "Mensalidades", type: "in", amount: 1600, status: "Pago", scope: "dept:d-eisa" });
    transactions.push({ id: uid(), date: `${key}-14`, description: "Materiais (baquetas e tambores)", category: "Materiais", type: "out", amount: 420, status: m === curMonth ? "Pendente" : "Pago", scope: "dept:d-eisa" });
    if (m < curMonth) transactions.push({ id: uid(), date: `${key}-08`, description: "Mensalidade da Associação", category: "Mensalidades", type: "out", amount: DEPT_FEE, status: "Pago", scope: "dept:d-eisa", fee: true });
  }
  // anuidade da Joana (associada)
  transactions.push({ id: uid(), date: `${year}-02-10`, description: "Anuidade", category: "Anuidades", type: "out", amount: MEMBER_FEE, status: "Pago", scope: "member:a-joana", fee: true });
  transactions.push({ id: uid(), date: `${year}-02-10`, description: "Anuidade — Joana Takara", category: "Anuidades", type: "in", amount: MEMBER_FEE, status: "Pago", scope: "assoc" });

  // solicitações de inscrição (o associado solicita; o departamento aprova, coloca em espera ou recusa)
  const enrollmentRequests = [
    { id: "sr1", departmentId: "d-eisa", associateId: "a-ana", associateName: "Ana Higa", personId: "p-ana2", personName: "Mayumi Higa", relation: "Filho(a)", status: "Pendente", createdAt: hoursAgo(5) },
    { id: "sr2", departmentId: "d-eisa", associateId: "a-carlos", associateName: "Carlos Uehara", personId: "a-carlos", personName: "Carlos Uehara", relation: "Responsável", status: "Pendente", createdAt: hoursAgo(20) },
    { id: "sr3", departmentId: "d-sextou", associateId: "a-joana", associateName: "Joana Takara", personId: "p-joa2", personName: "Kenji Takara", relation: "Filho(a)", status: "Lista de espera", createdAt: hoursAgo(50) },
    { id: "sr4", departmentId: "d-karaoke", associateId: "a-joana", associateName: "Joana Takara", personId: "a-joana", personName: "Joana Takara", relation: "Responsável", status: "Pendente", createdAt: hoursAgo(8) },
  ];

  // pagamentos de mensalidade/anuidade enviados para verificação da diretoria (tabelas pagamento e pagamento_departamento)
  const payments = [];
  // solicitações de reembolso
  const refunds = [
    { id: "rb1", scope: "dept:d-eisa", role: "department", ownerName: "Departamento Eisa Taiko", reason: "Compra de baquetas para o ensaio do festival", amount: 185, receipt: null, status: "Em análise", createdAt: hoursAgo(30) },
  ];

  const news = [
    { id: "n1", title: "Festival Okinawa", category: "Evento", date: addDays(today, -5), audience: "Todos", status: "Publicado", image: photos.festival, body: "Um dia para celebrar nossa cultura, culinária e comunidade. Teremos apresentações de Eisa, Odori e Sanshin, barracas de comidas típicas e atividades para toda a família. Venha prestigiar!" },
    { id: "n2", title: "Novas turmas de Eisa Taiko", category: "Departamento", date: addDays(today, -8), audience: "Associados", status: "Publicado", image: photos.dance, body: "Estão abertas as inscrições para novas turmas de iniciantes de todas as idades. Os ensaios acontecem às quartas-feiras, às 19h30. Procure o departamento para mais informações." },
    { id: "n3", title: "Assembleia mensal", category: "Comunicado", date: addDays(today, -12), audience: "Diretoria", status: "Rascunho", image: photos.community, body: "Pauta: prestação de contas do mês, calendário de eventos do próximo trimestre e eleição de representantes dos departamentos." },
    { id: "n4", title: "Aulas de japonês com vagas abertas", category: "Cultura", date: addDays(today, -15), audience: "Todos", status: "Publicado", image: photos.class, body: "As turmas de conversação e leitura têm vagas para o segundo semestre. Não é necessário conhecimento prévio do idioma." },
  ];

  const notifications = [
    { id: "nt1", role: "admin", title: "Nova solicitação de reserva", detail: "Departamento Eisa Taiko solicitou uma data.", time: hoursAgo(1), read: false, screen: "agenda" },
    { id: "nt2", role: "admin", title: "Prestação de contas enviada", detail: "O Departamento de Eisa Taiko enviou um novo documento.", time: hoursAgo(3), read: false, screen: "finance" },
    { id: "nt3", role: "admin", title: "Cadastro atualizado", detail: "Um associado atualizou seus dados cadastrais.", time: hoursAgo(26), read: true, screen: "users" },
    { id: "nt4", role: "department", departmentId: "d-eisa", title: "Mensalidade confirmada", detail: "O pagamento do departamento foi identificado.", time: hoursAgo(4), read: false, screen: "finance" },
    { id: "nt8", role: "department", departmentId: "d-eisa", title: "Novas solicitações de inscrição", detail: "2 associados aguardam sua aprovação em Eisa Taiko.", time: hoursAgo(5), read: false, screen: "associates" },
    { id: "nt9", role: "admin", title: "Reembolso solicitado", detail: "Departamento Eisa Taiko solicitou reembolso de R$ 185,00.", time: hoursAgo(30), read: false, screen: "finance" },
    { id: "nt5", role: "department", departmentId: "d-eisa", title: "Novo associado inscrito", detail: "Joana Takara foi adicionada ao departamento.", time: hoursAgo(27), read: true, screen: "associates" },
    { id: "nt6", role: "member", associateId: "a-joana", title: "Novo informativo", detail: "O Departamento de Eisa Taiko publicou uma nova notícia.", time: hoursAgo(5), read: false, screen: "news" },
    { id: "nt10", role: "dependent", associateId: "a-joana", title: "Novo informativo", detail: "O Departamento de Eisa Taiko publicou uma nova notícia.", time: hoursAgo(5), read: false, screen: "news" },
    { id: "nt7", role: "member", associateId: "a-joana", title: "Anuidade confirmada", detail: "Recebemos o pagamento da sua anuidade.", time: hoursAgo(80), read: true, screen: "finance" },
  ];

  const profiles = {
    admin: { role: "admin", name: "Joaquim Kinjo", email: "diretoria@okinawasc.org.br", phone: "(11) 3333-4400", emailNotifications: true },
    department: { role: "department", name: "Marina Nakamura", email: "departamento@okinawasc.org.br", phone: "(11) 98877-1020", departmentId: "d-eisa", emailNotifications: true },
    dependent: { role: "dependent", name: "Roberto Takara", email: "roberto@okinawasc.org.br", phone: "(11) 99731-2250", associateId: "a-joana", personId: "p-joa1", emailNotifications: true },
    acupuntura: { role: "department", name: "Mitsue Yamada", email: "acupuntura@okinawasc.org.br", phone: "(11) 97788-3045", departmentId: "d-acupuntura", emailNotifications: true },
    member: { role: "member", name: "Joana Takara", email: "joana@okinawasc.org.br", phone: "(11) 99872-9105", associateId: "a-joana", emailNotifications: true },
  };

  const passwords = { admin: "prototipo", department: "prototipo", acupuntura: "prototipo", member: "prototipo", dependent: "prototipo" };

  // todo associado responsável cadastrado também tem uma conta de acesso (e-mail + senha)
  associates.forEach((a) => {
    if (Object.values(profiles).some((p) => p.role === "member" && p.associateId === a.id)) return;
    profiles[`u-${a.id}`] = { role: "member", name: a.name, email: a.email, phone: a.phone, associateId: a.id, emailNotifications: true };
    passwords[`u-${a.id}`] = "prototipo";
  });

  return { v: 3, departments, families, associates, events, reservations, transactions, enrollmentRequests, payments, refunds, news, notifications, profiles, passwords };
}

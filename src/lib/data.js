// Dados de exemplo, constantes e funções utilitárias.

export const fotos = {
  hero: "/okinawa-banner.png",
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

export const rotulosPapeis = { admin: "Diretoria", department: "Departamento", member: "Associado", dependent: "Dependente" };

// Associado responsável e dependentes compartilham as mesmas telas e o mesmo escopo de dados (a família).
// A diferença: o dependente não cadastra, edita nem remove membros da família.
export const ehPapelFamiliar = (papel) => papel === "member" || papel === "dependent";

export const navegacaoPorPapel = {
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
export const achatarNavegacao = (navegacao) => navegacao.flatMap((item) => (item.children ? item.children : [item]));

// Senha inicial de todo usuário cadastrado pela diretoria (o próprio usuário pode trocá-la em Configurações)
export const SENHA_INICIAL = "prototipo";

// Tipos de perfil que a diretoria pode cadastrar (um usuário por vez)
export const TIPOS_USUARIOS = [
  { value: "admin", label: "Diretoria" },
  { value: "department", label: "Departamento" },
  { value: "member", label: "Associado responsável" },
  { value: "dependent", label: "Dependente" },
];

// A diretoria só cadastra novos perfis de Diretoria e Associado responsável.
// Perfil Departamento é cadastrado por um usuário do próprio departamento; Dependente, pelo associado responsável.
export const TIPOS_CRIAVEIS_ADMIN = TIPOS_USUARIOS.filter((tempo) => tempo.value === "admin" || tempo.value === "member");

export const CATEGORIAS_FINANCEIRAS = ["Mensalidades", "Anuidades", "Kifu (doações)", "Eventos", "Aluguel do salão", "Infraestrutura", "Materiais", "Reembolsos", "Outros"];
export const CATEGORIAS_EVENTOS = ["Cultural", "Ensaio", "Comunidade", "Reunião", "Esporte", "Aula"];
export const CATEGORIAS_NOTICIAS = ["Evento", "Departamento", "Comunicado", "Cultura"];
export const PUBLICOS_NOTICIAS = ["Todos", "Associados", "Diretoria"];
export const RELACOES = ["Cônjuge", "Filho(a)", "Pai", "Mãe", "Irmão(ã)", "Outro"];
export const DIAS_SEMANA = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
export const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export const TAXA_ASSOCIADO = 120; // anuidade do associado (tabela anuidade: ano, valor, data_vencimento)
export const TAXA_DEPARTAMENTO = 120; // mensalidade do departamento para a associação (tabela mensalidade: data_vencimento, valor)
export const DIA_VENCIMENTO_TAXA_ASSOCIADO = "03-31"; // vencimento da anuidade (MM-DD)
export const DIA_VENCIMENTO_TAXA_DEPARTAMENTO = 10; // vencimento da mensalidade (dia do mês)
export const METODOS_PAGAMENTO = ["Pix", "Transferência bancária", "Boleto", "Dinheiro (depósito)"];
export const TAMANHO_MAX_COMPROVANTE_BYTES = 1024 * 1024; // comprovantes de até 1 MB (o protótipo guarda tudo no navegador)

// Situação de uma solicitação de inscrição (relação "matrícula" do banco)
export const STATUS_SOLICITACAO = { pending: "Pendente", waitlist: "Lista de espera", approved: "Aprovada", rejected: "Recusada" };

// ---------- utilitários ----------
export const identificadorUnico = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10));

const preencher = (quantidadeN) => String(quantidadeN).padStart(2, "0");
export const paraISO = (dataValor) => `${dataValor.getFullYear()}-${preencher(dataValor.getMonth() + 1)}-${preencher(dataValor.getDate())}`;
export const hojeISO = () => paraISO(new Date());
export const deISO = (iso) => {
  const [valorY, mes, dataValor] = iso.split("-").map(Number);
  return new Date(valorY, mes - 1, dataValor);
};
export const adicionarDias = (iso, quantidadeN) => {
  const dataValor = deISO(iso);
  dataValor.setDate(dataValor.getDate() + quantidadeN);
  return paraISO(dataValor);
};
export const formatarData = (iso) => (iso ? iso.split("-").reverse().join("/") : "");
export const formatarDia = (iso) => `${preencher(deISO(iso).getDate())} ${MESES[deISO(iso).getMonth()].slice(0, 3)}`;
export const formatarMoeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
export const chaveMes = (iso) => iso.slice(0, 7);
export const primeiroNome = (nome) => (nome || "").split(" ")[0];

export function tempoRelativo(iso) {
  const diferenca = Date.now() - new Date(iso).getTime();
  const minimo = Math.floor(diferenca / 60000);
  if (minimo < 1) return "Agora";
  if (minimo < 60) return `Há ${minimo} min`;
  const hora = Math.floor(minimo / 60);
  if (hora < 24) return `Há ${hora} ${hora === 1 ? "hora" : "horas"}`;
  const dataValor = Math.floor(hora / 24);
  if (dataValor === 1) return "Ontem";
  return `Há ${dataValor} dias`;
}

export const mascararTelefone = (valor) => {
  const quantidadeN = valor.replace(/\D/g, "").slice(0, 11);
  if (quantidadeN.length <= 2) return quantidadeN;
  if (quantidadeN.length <= 6) return `(${quantidadeN.slice(0, 2)}) ${quantidadeN.slice(2)}`;
  if (quantidadeN.length <= 10) return `(${quantidadeN.slice(0, 2)}) ${quantidadeN.slice(2, 6)}-${quantidadeN.slice(6)}`;
  return `(${quantidadeN.slice(0, 2)}) ${quantidadeN.slice(2, 7)}-${quantidadeN.slice(7)}`;
};
export const mascararCep = (valor) => {
  const quantidadeN = valor.replace(/\D/g, "").slice(0, 8);
  return quantidadeN.length > 5 ? `${quantidadeN.slice(0, 5)}-${quantidadeN.slice(5)}` : quantidadeN;
};
export const ehEmail = (valorAuxiliar) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valorAuxiliar || "");

export function baixarCsv(nomeArquivo, cabecalho, linhas) {
  const escaparHtml = (valorAuxiliar) => `"${String(valorAuxiliar ?? "").replace(/"/g, '""')}"`;
  const arquivoCsv = [cabecalho, ...linhas].map((resultado) => resultado.map(escaparHtml).join(";")).join("\n");
  const arquivoBinario = new Blob(["﻿" + arquivoCsv], { type: "text/csv;charset=utf-8" });
  const enderecoUrl = URL.createObjectURL(arquivoBinario);
  const elementoA = document.createElement("a");
  elementoA.href = enderecoUrl;
  elementoA.download = nomeArquivo;
  elementoA.click();
  URL.revokeObjectURL(enderecoUrl);
}

// ---------- dados iniciais (datas relativas a hoje) ----------
export function criarDadosIniciais() {
  const hoje = hojeISO();
  const agora = new Date();
  const ano = agora.getFullYear();
  const mesAtual = agora.getMonth();
  const horasAtras = (hora) => new Date(Date.now() - hora * 3600 * 1000).toISOString();

  const departamentos = [
    { id: "d-eisa", name: "Eisa Taiko", image: "/departamentos/danca.jpeg", description: "Dança e tambores tradicionais de Okinawa que unem ritmo, movimento e a energia da nossa comunidade.", day: "Quarta-feira", time: "19:30", teacher: "Akira Nakamura", fee: 80, capacity: 8, active: true },
    { id: "d-odori", name: "Odori", image: "/departamentos/odori.jpeg", description: "Danças tradicionais japonesas que preservam gestos, histórias e celebrações entre gerações.", day: "Sábado", time: "14:00", teacher: "Keiko Shimabukuro", fee: 70, capacity: 2, active: true },
    { id: "d-karaoke", name: "Karaokê", image: "/departamentos/karaoke.png", description: "Encontros descontraídos para cantar, compartilhar repertórios e fortalecer amizades.", day: "Sexta-feira", time: "20:00", teacher: "Equipe do departamento", fee: 30, capacity: 20, active: true },
    { id: "d-tenis", name: "Tênis de Mesa", image: "/departamentos/tenis-de-mesa.jpeg", description: "Treinos e partidas para praticantes iniciantes e experientes de todas as idades.", day: "Terça-feira", time: "19:00", teacher: "Paulo Oshiro", fee: 60, capacity: 10, active: true },
    { id: "d-japones", name: "Aula de Japonês", image: fotos.class, description: "Aulas de idioma japonês com atividades de conversação, leitura e cultura.", day: "Terça-feira", time: "19:00", teacher: "Sayuri Tamashiro", fee: 120, capacity: 15, active: true },
    { id: "d-shodo", name: "Shodo", image: "/departamentos/shodo.png", description: "Prática da caligrafia japonesa com atenção à forma, ao movimento e à expressão.", day: "Quinta-feira", time: "18:30", teacher: "Hiroshi Kinjo", fee: 90, capacity: 10, active: true },
    { id: "d-sanshin", name: "Sanshin", image: "/departamentos/sanshin.jpeg", description: "Aprendizado do instrumento tradicional de Okinawa e de seu repertório cultural.", day: "Segunda-feira", time: "19:30", teacher: "Masao Gushiken", fee: 90, capacity: 10, active: true },
    { id: "d-seinenkai", name: "Seinenkai", image: "/departamentos/seinenkai.jpeg", description: "Grupo de jovens que promove integração, voluntariado e continuidade das tradições.", day: "Domingo", time: "10:00", teacher: "Diretoria jovem", fee: 0, capacity: 30, active: true },
    { id: "d-ritmos", name: "Aula de Ritmos", image: fotos.rhythms, description: "Aulas coletivas com música, movimento e muita energia para cuidar do bem-estar.", day: "Segunda-feira", time: "08:00", teacher: "Fernanda Arakaki", fee: 70, capacity: 20, active: true },
    { id: "d-sextou", name: "Sextou", image: "/departamentos/sextou.jpg", description: "Jogos livres de tênis de mesa para reunir amigos e começar bem o fim de semana.", day: "Sexta-feira", time: "19:00", teacher: "Equipe do departamento", fee: 20, capacity: 1, active: true },
    { id: "d-volei", name: "Vôlei", image: "/departamentos/volei.jpeg", description: "Treinos coletivos e partidas de vôlei com foco em integração e espírito de equipe.", day: "Quinta-feira", time: "20:00", teacher: "Rogério Higa", fee: 50, capacity: 14, active: true },
    { id: "d-acupuntura", name: "Acupuntura", image: fotos.acupuncture, description: "Atendimentos voltados ao equilíbrio, ao cuidado e à promoção da qualidade de vida.", day: "Sábado", time: "09:00", teacher: "Dra. Mitsue Yamada", fee: 0, capacity: 6, active: true },
  ];

  const associados = [
    { id: "a-ana", familyId: "f-higa", name: "Ana Higa", email: "ana.higa@email.com", phone: "(11) 99821-4478", since: "2018-03-12", departmentIds: ["d-eisa"], dependents: [{ id: "p-ana1", name: "Lucas Higa", relation: "Filho(a)", departmentIds: ["d-eisa"] }, { id: "p-ana2", name: "Mayumi Higa", relation: "Filho(a)", departmentIds: [] }] },
    { id: "a-carlos", familyId: "f-uehara", name: "Carlos Uehara", email: "carlos.uehara@email.com", phone: "(11) 98745-2190", since: "2020-06-05", departmentIds: ["d-japones", "d-shodo"], dependents: [{ id: "p-car1", name: "Emi Uehara", relation: "Cônjuge", departmentIds: ["d-shodo"] }] },
    { id: "a-joana", familyId: "f-takara", name: "Joana Takara", email: "joana@okinawasc.org.br", phone: "(11) 99872-9105", since: "2022-01-18", departmentIds: ["d-eisa", "d-japones"], dependents: [{ id: "p-joa1", name: "Roberto Takara", relation: "Cônjuge", email: "roberto@okinawasc.org.br", phone: "(11) 99731-2250", departmentIds: ["d-eisa", "d-japones"] }, { id: "p-joa2", name: "Kenji Takara", relation: "Filho(a)", departmentIds: ["d-eisa"] }] },
    { id: "a-paulo", familyId: "f-oshiro", name: "Paulo Oshiro", email: "paulo.oshiro@email.com", phone: "(11) 97766-1203", since: "2016-09-30", departmentIds: ["d-tenis", "d-sextou"], dependents: [] },
    { id: "a-sayuri", familyId: "f-tamashiro", name: "Sayuri Tamashiro", email: "sayuri.t@email.com", phone: "(11) 96655-8821", since: "2019-02-14", departmentIds: ["d-odori"], dependents: [{ id: "p-say1", name: "Hana Tamashiro", relation: "Filho(a)", departmentIds: ["d-odori"] }] },
  ];

  // Famílias: sobrenome + endereço. Cada família reúne o associado responsável e seus dependentes.
  const familias = [
    { id: "f-higa", surname: "Higa", address: "R. Vergueiro", number: "1520", complement: "Casa 2", district: "Liberdade", city: "São Paulo", uf: "SP", cep: "01504-001" },
    { id: "f-uehara", surname: "Uehara", address: "R. Galvão Bueno", number: "98", complement: "", district: "Liberdade", city: "São Paulo", uf: "SP", cep: "01506-000" },
    { id: "f-takara", surname: "Takara", address: "R. das Flores", number: "245", complement: "Apto. 32", district: "Chácara Mafalda", city: "São Paulo", uf: "SP", cep: "03372-010" },
    { id: "f-oshiro", surname: "Oshiro", address: "Av. Lins de Vasconcelos", number: "710", complement: "", district: "Cambuci", city: "São Paulo", uf: "SP", cep: "01538-001" },
    { id: "f-tamashiro", surname: "Tamashiro", address: "R. Miranda Jordão", number: "233", complement: "Bloco B", district: "Vila Mariana", city: "São Paulo", uf: "SP", cep: "04105-000" },
  ];

  const eventos = [
    { id: "e1", date: adicionarDias(hoje, 3), time: "19:30", title: "Ensaio de Eisa Taiko", category: "Ensaio", owner: "Departamento Eisa Taiko" },
    { id: "e2", date: adicionarDias(hoje, 8), time: "11:00", title: "Almoço comunitário", category: "Comunidade", owner: "Diretoria" },
    { id: "e3", date: adicionarDias(hoje, 15), time: "14:00", title: "Festival Okinawa", category: "Cultural", owner: "Diretoria" },
    { id: "e4", date: adicionarDias(hoje, 22), time: "10:00", title: "Assembleia mensal", category: "Reunião", owner: "Diretoria" },
    { id: "e5", date: adicionarDias(hoje, 29), time: "19:00", title: "Torneio de tênis de mesa", category: "Esporte", owner: "Departamento Tênis de Mesa" },
  ];

  const reservas = [
    { id: "r1", date: adicionarDias(hoje, 12), time: "19:00", title: "Ensaio extra para o festival", requester: "Marina Nakamura", role: "department", ownerId: "d-eisa", ownerName: "Departamento Eisa Taiko", status: "Pendente", createdAt: horasAtras(1) },
    { id: "r2", date: adicionarDias(hoje, 18), time: "15:00", title: "Aniversário em família", requester: "Joana Takara", role: "member", ownerId: "a-joana", ownerName: "Joana Takara", status: "Pendente", createdAt: horasAtras(26) },
  ];

  const transacoes = [];
  const adicionarAoFim = (tempo) => transacoes.push({ id: identificadorUnico(), status: "Pago", scope: "assoc", ...tempo });
  for (let mes = 0; mes <= mesAtual; mes++) {
    const chave = `${ano}-${preencher(mes + 1)}`;
    const atual = mes === mesAtual;
    adicionarAoFim({ date: `${chave}-05`, description: "Mensalidades dos associados", category: "Mensalidades", type: "in", amount: 4000 + ((mes * 370) % 900) });
    adicionarAoFim({ date: `${chave}-10`, description: "Aluguel do salão", category: "Aluguel do salão", type: "in", amount: 2400 });
    if (mes % 2 === 0) adicionarAoFim({ date: `${chave}-12`, description: "Doações (Kifu)", category: "Kifu (doações)", type: "in", amount: 900 + mes * 40 });
    adicionarAoFim({ date: `${chave}-15`, description: "Conta de energia", category: "Infraestrutura", type: "out", amount: 580 + ((mes * 53) % 120), status: atual ? "Pendente" : "Pago" });
    adicionarAoFim({ date: `${chave}-20`, description: "Materiais e limpeza", category: "Materiais", type: "out", amount: 350 + ((mes * 71) % 260) });
  }
  // departamento Eisa Taiko
  for (let mes = Math.max(0, mesAtual - 2); mes <= mesAtual; mes++) {
    const chave = `${ano}-${preencher(mes + 1)}`;
    transacoes.push({ id: identificadorUnico(), date: `${chave}-06`, description: "Mensalidades dos alunos", category: "Mensalidades", type: "in", amount: 1600, status: "Pago", scope: "dept:d-eisa" });
    transacoes.push({ id: identificadorUnico(), date: `${chave}-14`, description: "Materiais (baquetas e tambores)", category: "Materiais", type: "out", amount: 420, status: mes === mesAtual ? "Pendente" : "Pago", scope: "dept:d-eisa" });
    if (mes < mesAtual) transacoes.push({ id: identificadorUnico(), date: `${chave}-08`, description: "Mensalidade da Associação", category: "Mensalidades", type: "out", amount: TAXA_DEPARTAMENTO, status: "Pago", scope: "dept:d-eisa", fee: true });
  }
  // anuidade da Joana (associada)
  transacoes.push({ id: identificadorUnico(), date: `${ano}-02-10`, description: "Anuidade", category: "Anuidades", type: "out", amount: TAXA_ASSOCIADO, status: "Pago", scope: "member:a-joana", fee: true });
  transacoes.push({ id: identificadorUnico(), date: `${ano}-02-10`, description: "Anuidade — Joana Takara", category: "Anuidades", type: "in", amount: TAXA_ASSOCIADO, status: "Pago", scope: "assoc" });

  // solicitações de inscrição (o associado solicita; o departamento aprova, coloca em espera ou recusa)
  const solicitacoesMatricula = [
    { id: "sr1", departmentId: "d-eisa", associateId: "a-ana", associateName: "Ana Higa", personId: "p-ana2", personName: "Mayumi Higa", relation: "Filho(a)", status: "Pendente", createdAt: horasAtras(5) },
    { id: "sr2", departmentId: "d-eisa", associateId: "a-carlos", associateName: "Carlos Uehara", personId: "a-carlos", personName: "Carlos Uehara", relation: "Responsável", status: "Pendente", createdAt: horasAtras(20) },
    { id: "sr3", departmentId: "d-sextou", associateId: "a-joana", associateName: "Joana Takara", personId: "p-joa2", personName: "Kenji Takara", relation: "Filho(a)", status: "Lista de espera", createdAt: horasAtras(50) },
    { id: "sr4", departmentId: "d-karaoke", associateId: "a-joana", associateName: "Joana Takara", personId: "a-joana", personName: "Joana Takara", relation: "Responsável", status: "Pendente", createdAt: horasAtras(8) },
  ];

  // pagamentos de mensalidade/anuidade enviados para verificação da diretoria (tabelas pagamento e pagamento_departamento)
  const pagamentos = [];
  // solicitações de reembolso
  const reembolsos = [
    { id: "rb1", scope: "dept:d-eisa", role: "department", ownerName: "Departamento Eisa Taiko", reason: "Compra de baquetas para o ensaio do festival", amount: 185, receipt: null, status: "Em análise", createdAt: horasAtras(30) },
  ];

  const noticias = [
    { id: "n1", title: "Festival Okinawa", category: "Evento", date: adicionarDias(hoje, -5), audience: "Todos", status: "Publicado", image: fotos.festival, body: "Um dia para celebrar nossa cultura, culinária e comunidade. Teremos apresentações de Eisa, Odori e Sanshin, barracas de comidas típicas e atividades para toda a família. Venha prestigiar!" },
    { id: "n2", title: "Novas turmas de Eisa Taiko", category: "Departamento", date: adicionarDias(hoje, -8), audience: "Associados", status: "Publicado", image: fotos.dance, body: "Estão abertas as inscrições para novas turmas de iniciantes de todas as idades. Os ensaios acontecem às quartas-feiras, às 19h30. Procure o departamento para mais informações." },
    { id: "n3", title: "Assembleia mensal", category: "Comunicado", date: adicionarDias(hoje, -12), audience: "Diretoria", status: "Rascunho", image: fotos.community, body: "Pauta: prestação de contas do mês, calendário de eventos do próximo trimestre e eleição de representantes dos departamentos." },
    { id: "n4", title: "Aulas de japonês com vagas abertas", category: "Cultura", date: adicionarDias(hoje, -15), audience: "Todos", status: "Publicado", image: fotos.class, body: "As turmas de conversação e leitura têm vagas para o segundo semestre. Não é necessário conhecimento prévio do idioma." },
  ];

  const notificacoes = [
    { id: "nt1", role: "admin", title: "Nova solicitação de reserva", detail: "Departamento Eisa Taiko solicitou uma data.", time: horasAtras(1), read: false, screen: "agenda" },
    { id: "nt2", role: "admin", title: "Prestação de contas enviada", detail: "O Departamento de Eisa Taiko enviou um novo documento.", time: horasAtras(3), read: false, screen: "finance" },
    { id: "nt3", role: "admin", title: "Cadastro atualizado", detail: "Um associado atualizou seus dados cadastrais.", time: horasAtras(26), read: true, screen: "users" },
    { id: "nt4", role: "department", departmentId: "d-eisa", title: "Mensalidade confirmada", detail: "O pagamento do departamento foi identificado.", time: horasAtras(4), read: false, screen: "finance" },
    { id: "nt8", role: "department", departmentId: "d-eisa", title: "Novas solicitações de inscrição", detail: "2 associados aguardam sua aprovação em Eisa Taiko.", time: horasAtras(5), read: false, screen: "associates" },
    { id: "nt9", role: "admin", title: "Reembolso solicitado", detail: "Departamento Eisa Taiko solicitou reembolso de R$ 185,00.", time: horasAtras(30), read: false, screen: "finance" },
    { id: "nt5", role: "department", departmentId: "d-eisa", title: "Novo associado inscrito", detail: "Joana Takara foi adicionada ao departamento.", time: horasAtras(27), read: true, screen: "associates" },
    { id: "nt6", role: "member", associateId: "a-joana", title: "Novo informativo", detail: "O Departamento de Eisa Taiko publicou uma nova notícia.", time: horasAtras(5), read: false, screen: "news" },
    { id: "nt10", role: "dependent", associateId: "a-joana", title: "Novo informativo", detail: "O Departamento de Eisa Taiko publicou uma nova notícia.", time: horasAtras(5), read: false, screen: "news" },
    { id: "nt7", role: "member", associateId: "a-joana", title: "Anuidade confirmada", detail: "Recebemos o pagamento da sua anuidade.", time: horasAtras(80), read: true, screen: "finance" },
  ];

  const perfis = {
    admin: { role: "admin", name: "Joaquim Kinjo", email: "diretoria@okinawasc.org.br", phone: "(11) 3333-4400", emailNotifications: true },
    department: { role: "department", name: "Marina Nakamura", email: "departamento@okinawasc.org.br", phone: "(11) 98877-1020", departmentId: "d-eisa", emailNotifications: true },
    dependent: { role: "dependent", name: "Roberto Takara", email: "roberto@okinawasc.org.br", phone: "(11) 99731-2250", associateId: "a-joana", personId: "p-joa1", emailNotifications: true },
    acupuntura: { role: "department", name: "Mitsue Yamada", email: "acupuntura@okinawasc.org.br", phone: "(11) 97788-3045", departmentId: "d-acupuntura", emailNotifications: true },
    member: { role: "member", name: "Joana Takara", email: "joana@okinawasc.org.br", phone: "(11) 99872-9105", associateId: "a-joana", emailNotifications: true },
  };

  const senhas = { admin: "prototipo", department: "prototipo", acupuntura: "prototipo", member: "prototipo", dependent: "prototipo" };

  // todo associado responsável cadastrado também tem uma conta de acesso (e-mail + senha)
  associados.forEach((elementoA) => {
    if (Object.values(perfis).some((parametro) => parametro.role === "member" && parametro.associateId === elementoA.id)) return;
    perfis[`u-${elementoA.id}`] = { role: "member", name: elementoA.name, email: elementoA.email, phone: elementoA.phone, associateId: elementoA.id, emailNotifications: true };
    senhas[`u-${elementoA.id}`] = "prototipo";
  });

  return { v: 5, departments: departamentos, families: familias, associates: associados, events: eventos, reservations: reservas, transactions: transacoes, enrollmentRequests: solicitacoesMatricula, payments: pagamentos, refunds: reembolsos, news: noticias, notifications: notificacoes, profiles: perfis, passwords: senhas };
}

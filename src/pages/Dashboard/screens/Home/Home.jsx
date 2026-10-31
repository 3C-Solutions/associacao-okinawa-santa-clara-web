import { useState } from "react";
import { formatarData, formatarDia, formatarMoeda, deISO, ehPapelFamiliar, chaveMes, hojeISO } from "@/lib/data.js";
import { saldoDe, estadoTaxa, transacoesDoEscopo, proximosEventos } from "@/lib/finance.js";
import { usarArmazenamento, usarUsuario } from "@/store";
import { Selo, Botao, Cartao } from "@/components/ui";
import Calendario from "@/pages/Dashboard/components/Calendar.jsx";
import Metrica from "@/pages/Dashboard/components/Metric.jsx";
import ListaResumo from "@/pages/Dashboard/components/SummaryList.jsx";
import ModalArtigo from "@/pages/Dashboard/screens/News/ArticleModal.jsx";
import { noticiasPara } from "@/pages/Dashboard/screens/News/helpers.js";

export default function Inicio({ role: papel, account: conta, navigate: navegar }) {
  const { state: dadosAplicacao } = usarArmazenamento();
  const usuario = usarUsuario(conta);
  const hoje = hojeISO();
  const [visualizacao, definirVisualizacao] = useState({ y: deISO(hoje).getFullYear(), m: deISO(hoje).getMonth() });
  const [artigo, definirArtigo] = useState(null);

  const eventos = proximosEventos(dadosAplicacao, 4);
  const linhasEventos = eventos.map((evento) => ({ key: evento.id, title: evento.title, sub: `${formatarDia(evento.date)} · ${evento.time}`, onClick: () => navegar("agenda") }));
  const marcacoes = {};
  dadosAplicacao.events.forEach((evento) => { marcacoes[evento.date] = "event"; });

  const meu = (resultado) => (papel === "admin" ? true : resultado.ownerId === usuario.ownerId);
  const reservasPendentes = dadosAplicacao.reservations.filter((resultado) => resultado.status === "Pendente" && meu(resultado));
  const limitadoAoEscopo = transacoesDoEscopo(dadosAplicacao, usuario.scope);
  const transacoesPendentes = limitadoAoEscopo.filter((tempo) => tempo.status === "Pendente");
  const taxa = papel === "admin" ? null : estadoTaxa(dadosAplicacao, papel, usuario.scope);
  const noticias = noticiasPara(dadosAplicacao, papel, usuario).slice(0, 3);

  const tarefas = [];
  if (papel === "admin") {
    reservasPendentes.forEach((resultado) => tarefas.push({ key: resultado.id, title: `Aprovar reserva: ${resultado.title}`, sub: `${resultado.ownerName} · ${formatarData(resultado.date)}`, badge: <Selo tone="warning">Pendente</Selo>, onClick: () => navegar("agenda") }));
    transacoesPendentes.forEach((tempo) => tarefas.push({ key: tempo.id, title: `Pagamento pendente: ${tempo.description}`, sub: `Financeiro · ${formatarMoeda(tempo.amount)}`, badge: <Selo tone="warning">Pendente</Selo>, onClick: () => navegar("finance") }));
    dadosAplicacao.payments.filter((parametro) => parametro.status === "Em verificação").forEach((parametro) => tarefas.push({ key: parametro.id, title: `Verificar ${parametro.kind}: ${parametro.ownerName}`, sub: `Financeiro · ${formatarMoeda(parametro.amount)}`, badge: <Selo tone="warning">Em verificação</Selo>, onClick: () => navegar("finance") }));
    dadosAplicacao.refunds.filter((resultado) => resultado.status === "Em análise").forEach((resultado) => tarefas.push({ key: resultado.id, title: `Analisar reembolso: ${resultado.ownerName}`, sub: `Financeiro · ${formatarMoeda(resultado.amount)}`, badge: <Selo tone="warning">Em análise</Selo>, onClick: () => navegar("finance") }));
    dadosAplicacao.news.filter((quantidadeN) => quantidadeN.status === "Rascunho").forEach((quantidadeN) => tarefas.push({ key: quantidadeN.id, title: `Publicar: ${quantidadeN.title}`, sub: "Notícias · rascunho", badge: <Selo tone="info">Rascunho</Selo>, onClick: () => navegar("news") }));
  } else {
    reservasPendentes.forEach((resultado) => tarefas.push({ key: resultado.id, title: `Reserva aguardando análise: ${resultado.title}`, sub: formatarData(resultado.date), badge: <Selo tone="warning">Pendente</Selo>, onClick: () => navegar("agenda") }));
    if (taxa && !taxa.paid && !taxa.pendingPayment) tarefas.push({ key: "fee", title: `${taxa.label} em aberto`, sub: `${formatarMoeda(taxa.amount)} · vence em ${formatarData(taxa.dueDate)}`, badge: <Selo tone={taxa.overdue ? "danger" : "warning"}>{taxa.overdue ? "Vencida" : "Pendente"}</Selo>, onClick: () => navegar("finance") });
    if (taxa?.pendingPayment) tarefas.push({ key: "fee-ver", title: `${taxa.label}: comprovante em verificação`, sub: `${formatarMoeda(taxa.pendingPayment.amount)} · aguardando a Diretoria`, badge: <Selo tone="warning">Em verificação</Selo>, onClick: () => navegar("finance") });
    if (papel === "department" && usuario.department) {
      const pendencia = dadosAplicacao.enrollmentRequests.filter((resultado) => resultado.departmentId === usuario.department.id && resultado.status === "Pendente").length;
      if (pendencia) tarefas.push({ key: "enr", title: `${pendencia} ${pendencia === 1 ? "solicitação de inscrição" : "solicitações de inscrição"}`, sub: "Associados · aprovar ou colocar em lista de espera", badge: <Selo tone="warning">Pendente</Selo>, onClick: () => navegar("associates") });
    }
    if (papel === "department") transacoesPendentes.forEach((tempo) => tarefas.push({ key: tempo.id, title: `Pendente: ${tempo.description}`, sub: `Financeiro · ${formatarMoeda(tempo.amount)}`, badge: <Selo tone="warning">Pendente</Selo>, onClick: () => navegar("finance") }));
  }

  const saldoMensal = saldoDe(transacoesDoEscopo(dadosAplicacao, "assoc").filter((tempo) => chaveMes(tempo.date) === chaveMes(hoje)));
  const familia = ehPapelFamiliar(papel) && usuario.associate ? 1 + usuario.associate.dependents.length : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="space-y-6 xl:col-span-7">
        {papel === "admin" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Metrica label="Saldo do mês" value={formatarMoeda(saldoMensal)} trend={saldoMensal >= 0 ? "Entradas acima das saídas" : "Saídas acima das entradas"} tone={saldoMensal >= 0 ? "success" : "danger"} onClick={() => navegar("finance")} />
            <Metrica label="Reservas pendentes" value={String(reservasPendentes.length)} trend={reservasPendentes.length ? "Aguardando autorização" : "Nenhuma pendência"} tone={reservasPendentes.length ? "danger" : "success"} onClick={() => navegar("agenda")} />
            <Metrica label="Famílias associadas" value={String(dadosAplicacao.families.length)} onClick={() => navegar("families")} trend={`${dadosAplicacao.associates.reduce((segundo, elementoA) => segundo + 1 + elementoA.dependents.length, 0)} pessoas no total`} tone="muted" />
            <Metrica label="Departamentos ativos" value={String(dadosAplicacao.departments.filter((dataValor) => dataValor.active).length)} onClick={() => navegar("departments")} trend={`${dadosAplicacao.departments.length} cadastrados`} tone="muted" />
          </div>
        )}
        {papel === "department" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Metrica label="Saldo do departamento" value={formatarMoeda(saldoDe(limitadoAoEscopo))} onClick={() => navegar("finance")} trend={`${usuario.department?.name || ""}`} tone="muted" />
            <Metrica label={taxa.label} value={taxa.paid ? "Pago" : taxa.pendingPayment ? "Em verificação" : "Em aberto"} trend={taxa.paid ? `Confirmado em ${formatarData(taxa.tx.date)}` : taxa.pendingPayment ? "Aguardando a Diretoria" : `${formatarMoeda(taxa.amount)} neste mês`} tone={taxa.paid ? "success" : taxa.pendingPayment ? "muted" : "danger"} onClick={() => navegar("finance")} />
          </div>
        )}
        {ehPapelFamiliar(papel) && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Metrica label={taxa.label} value={taxa.paid ? "Pago" : taxa.pendingPayment ? "Em verificação" : "Em aberto"} trend={taxa.paid ? `Confirmado em ${formatarData(taxa.tx.date)}` : taxa.pendingPayment ? "Aguardando a Diretoria" : `${formatarMoeda(taxa.amount)} neste ano`} tone={taxa.paid ? "success" : taxa.pendingPayment ? "muted" : "danger"} onClick={() => navegar("finance")} />
            <Metrica label="Minha família" value={`${familia} ${familia === 1 ? "pessoa" : "pessoas"}`} onClick={() => navegar("associates")} trend={papel === "dependent" ? "Ver familiares" : "Gerenciar membros"} tone="muted" />
          </div>
        )}

        <ListaResumo title="Tarefas e pendências" rows={tarefas.slice(0, 5)} empty="Tudo em dia por aqui." />

        {noticias.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Notícias</h2><Botao variant="ghost" className="min-h-9 px-3 text-sm" onClick={() => navegar("news")}>Ver todas</Botao></div>
            <div className="space-y-4">
              {noticias.slice(0, 2).map((quantidadeN) => (
                <Cartao key={quantidadeN.id} className="grid overflow-hidden sm:grid-cols-[1fr_12rem]">
                  <div className="p-5">
                    <Selo tone="info">{quantidadeN.category}</Selo>
                    <h3 className="mt-3 text-lg font-bold">{quantidadeN.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{quantidadeN.body}</p>
                    <button type="button" onClick={() => definirArtigo(quantidadeN)} className="mt-4 font-semibold text-brand hover:underline">Ler notícia</button>
                  </div>
                  <img src={quantidadeN.image} alt="" className="h-full min-h-40 w-full object-cover" />
                </Cartao>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-6 xl:col-span-5">
        <ListaResumo title="Próximos eventos" rows={linhasEventos} onSeeAll={() => navegar("agenda")} empty="Nenhum evento agendado." />
        <Calendario marks={marcacoes} view={visualizacao} onView={definirVisualizacao} onSelect={() => navegar("agenda")} />
      </div>
      {artigo && <ModalArtigo article={artigo} onClose={() => definirArtigo(null)} />}
    </div>
  );
}

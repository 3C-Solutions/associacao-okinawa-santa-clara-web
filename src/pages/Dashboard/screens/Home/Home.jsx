import { useCallback, useMemo, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { criarDadosIniciais, formatarDia, formatarMoeda, deISO, hojeISO } from "@/lib/data.js";
import { Selo, Botao, Cartao } from "@/components/ui";
import Calendario from "@/pages/Dashboard/components/Calendar.jsx";
import Metrica from "@/pages/Dashboard/components/Metric.jsx";
import ListaResumo from "@/pages/Dashboard/components/SummaryList.jsx";
import ModalArtigo from "@/pages/Dashboard/screens/News/ArticleModal.jsx";
import CartaoNoticia from "@/pages/Dashboard/screens/News/NewsCards.jsx";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { GERENCIAR_NOTICIAS, criarServicoNoticias } from "@/services/noticias.js";
import { criarModeloHome } from "./homeModel.js";

export default function Inicio({ screens: telas = [], navigate: navegar }) {
  const { usuario, podeAcessar } = usarAutenticacao();
  const hoje = hojeISO();
  const [visualizacao, definirVisualizacao] = useState(() => ({ y: deISO(hoje).getFullYear(), m: deISO(hoje).getMonth() }));
  const [dadosDemonstracao] = useState(criarDadosIniciais);
  const modelo = criarModeloHome(dadosDemonstracao, hoje);
  const escopoNoticias = JSON.stringify([usuario.id, usuario.funcaoSistema.id, usuario.funcaoSistema.nome, podeAcessar(GERENCIAR_NOTICIAS)]);
  const acao = (destino) => destino && telas.some((item) => item.id === destino && (item.comum || podeAcessar(item.permissao)))
    ? () => navegar(destino) : undefined;
  const tarefas = modelo.tarefas.map((item) => ({
    ...item, badge: <Selo tone={item.tone}>{item.status}</Selo>, onClick: acao(item.destino),
  }));
  const linhasEventos = modelo.eventos.map((evento) => ({
    key: evento.id, title: evento.title, sub: `${formatarDia(evento.date)} · ${evento.time}`, onClick: acao("agenda"),
  }));

  return (
    <div className="space-y-6">
      <p role="note" className="text-sm text-muted">Os indicadores, as tarefas e os eventos abaixo são exemplos.</p>
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="min-w-0 space-y-6 xl:col-span-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <Metrica label="Saldo do mês" value={formatarMoeda(modelo.saldoMensal)} trend={modelo.saldoMensal >= 0 ? "Entradas acima das saídas" : "Saídas acima das entradas"} tone={modelo.saldoMensal >= 0 ? "success" : "danger"} onClick={acao("finance")} actionLabel="Abrir Financeiro (dados reais)" />
            <Metrica label="Reservas pendentes" value={String(modelo.reservasPendentes)} trend={modelo.reservasPendentes ? "Aguardando autorização" : "Nenhuma pendência"} tone={modelo.reservasPendentes ? "danger" : "success"} onClick={acao("agenda")} />
            <Metrica label="Famílias associadas" value={String(modelo.familias)} trend={`${modelo.pessoas} pessoas no total`} tone="muted" onClick={acao("families")} actionLabel="Abrir Famílias (dados reais)" />
            <Metrica label="Departamentos ativos" value={String(modelo.departamentosAtivos)} trend={`${modelo.departamentosTotal} cadastrados`} tone="muted" onClick={acao("departments")} />
          </div>
          <ListaResumo title="Tarefas e pendências" rows={tarefas} empty="Tudo em dia por aqui." />
          <NoticiasRecentes key={escopoNoticias} aoVerTodas={acao("news")} />
        </div>
        <div className="min-w-0 space-y-6 xl:col-span-5">
          <ListaResumo title="Próximos eventos" rows={linhasEventos} onSeeAll={acao("agenda")} empty="Nenhum evento agendado." />
          <Calendario marks={modelo.marcacoes} view={visualizacao} onView={definirVisualizacao} onSelect={acao("agenda")} />
        </div>
      </div>
    </div>
  );
}

function NoticiasRecentes({ aoVerTodas }) {
  const { requisitar } = usarAutenticacao();
  const servico = useMemo(() => criarServicoNoticias(requisitar), [requisitar]);
  const carregar = useCallback((signal) => servico.listar({ status: "PUBLICADO", tamanho: 2 }, signal), [servico]);
  const { dados, carregando, erro, recarregar } = usarRecursoApi(carregar);
  const [artigoId, definirArtigoId] = useState(null);

  return (
    <section aria-label="Notícias" aria-busy={carregando}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Notícias</h2>
        {aoVerTodas && <Botao variant="ghost" className="min-h-9 px-3 text-sm" onClick={aoVerTodas}>Ver todas</Botao>}
      </div>
      {carregando && <Cartao className="p-6"><p role="status" className="text-muted">Carregando notícias...</p></Cartao>}
      {erro && <Cartao className="space-y-3 p-6">
        <p role="alert" className="text-danger">{erro}</p>
        <Botao variant="outline" onClick={recarregar}>Tentar novamente</Botao>
      </Cartao>}
      {dados?.itens.length === 0 && <Cartao className="p-6 text-sm text-muted">Nenhuma notícia publicada.</Cartao>}
      <div className="space-y-4">
        {dados?.itens.map((noticia) => (
          <CartaoNoticia key={noticia.id} noticia={noticia} servico={servico} aoLer={definirArtigoId} />
        ))}
      </div>
      {artigoId && <ModalArtigo id={artigoId} servico={servico} onClose={() => definirArtigoId(null)} />}
    </section>
  );
}

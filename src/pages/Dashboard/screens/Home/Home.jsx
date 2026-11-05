import { useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { criarDadosIniciais, formatarDia, formatarMoeda, deISO, hojeISO } from "@/lib/data.js";
import { Selo, Botao, Cartao } from "@/components/ui";
import Calendario from "@/pages/Dashboard/components/Calendar.jsx";
import Metrica from "@/pages/Dashboard/components/Metric.jsx";
import ListaResumo from "@/pages/Dashboard/components/SummaryList.jsx";
import ModalArtigo from "@/pages/Dashboard/screens/News/ArticleModal.jsx";
import { criarModeloHome } from "./homeModel.js";

export default function Inicio({ screens: telas = [], navigate: navegar }) {
  const { podeAcessar } = usarAutenticacao();
  const hoje = hojeISO();
  const [visualizacao, definirVisualizacao] = useState(() => ({ y: deISO(hoje).getFullYear(), m: deISO(hoje).getMonth() }));
  const [artigoId, definirArtigoId] = useState(null);
  const [dadosDemonstracao] = useState(criarDadosIniciais);
  const modelo = criarModeloHome(dadosDemonstracao, hoje);
  const { noticias } = modelo;
  const artigo = noticias.find((item) => item.id === artigoId);

  const acao = (destino) => destino && telas.some((item) => item.id === destino && podeAcessar(item.permissao))
    ? () => navegar(destino) : undefined;
  const tarefas = modelo.tarefas.map((item) => ({
    ...item, badge: <Selo tone={item.tone}>{item.status}</Selo>, onClick: acao(item.destino),
  }));
  const linhasEventos = modelo.eventos.map((evento) => ({
    key: evento.id, title: evento.title, sub: `${formatarDia(evento.date)} · ${evento.time}`, onClick: acao("agenda"),
  }));

  return (
    <div className="space-y-6">
      <p role="note" className="text-sm text-muted">Dados de demonstração. Todos os valores e conteúdos desta Home são exemplos.</p>
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="min-w-0 space-y-6 xl:col-span-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <Metrica label="Saldo do mês" value={formatarMoeda(modelo.saldoMensal)} trend={modelo.saldoMensal >= 0 ? "Entradas acima das saídas" : "Saídas acima das entradas"} tone={modelo.saldoMensal >= 0 ? "success" : "danger"} onClick={acao("finance")} actionLabel="Abrir Financeiro (dados reais)" />
            <Metrica label="Reservas pendentes" value={String(modelo.reservasPendentes)} trend={modelo.reservasPendentes ? "Aguardando autorização" : "Nenhuma pendência"} tone={modelo.reservasPendentes ? "danger" : "success"} onClick={acao("agenda")} />
            <Metrica label="Famílias associadas" value={String(modelo.familias)} trend={`${modelo.pessoas} pessoas no total`} tone="muted" onClick={acao("families")} actionLabel="Abrir Famílias (dados reais)" />
            <Metrica label="Departamentos ativos" value={String(modelo.departamentosAtivos)} trend={`${modelo.departamentosTotal} cadastrados`} tone="muted" onClick={acao("departments")} />
          </div>
          <ListaResumo title="Tarefas e pendências" rows={tarefas} empty="Tudo em dia por aqui." />
          <section aria-label="Notícias">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Notícias</h2>{acao("news") && <Botao variant="ghost" className="min-h-9 px-3 text-sm" onClick={acao("news")}>Ver todas</Botao>}</div>
            {noticias.length === 0 ? <Cartao className="p-6 text-sm text-muted">Nenhuma notícia publicada.</Cartao> : (
              <div className="space-y-4">
                {noticias.map((item) => (
                  <Cartao key={item.id} className="grid overflow-hidden sm:grid-cols-[1fr_12rem]">
                    <div className="min-w-0 p-5">
                      <Selo tone="info">{item.category}</Selo>
                      <h3 className="mt-3 break-words text-lg font-bold">{item.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{item.body}</p>
                      <button type="button" onClick={() => definirArtigoId(item.id)} className="mt-4 min-h-11 font-semibold text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-brand">Ler notícia</button>
                    </div>
                    {item.image && <img src={item.image} alt="" className="h-full min-h-40 w-full object-cover" />}
                  </Cartao>
                ))}
              </div>
            )}
          </section>
        </div>
        <div className="min-w-0 space-y-6 xl:col-span-5">
          <ListaResumo title="Próximos eventos" rows={linhasEventos} onSeeAll={acao("agenda")} empty="Nenhum evento agendado." />
          <Calendario marks={modelo.marcacoes} view={visualizacao} onView={definirVisualizacao} onSelect={acao("agenda")} />
        </div>
      </div>
      {artigo && <ModalArtigo article={artigo} onClose={() => definirArtigoId(null)} />}
    </div>
  );
}

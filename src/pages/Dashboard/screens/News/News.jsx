import { useMemo, useState } from "react";
import { PUBLICOS_NOTICIAS, formatarData, ehPapelFamiliar, fotos, hojeISO } from "@/lib/data.js";
import { usarArmazenamento, usarUsuario } from "@/store";
import { Selo, Botao, Cartao, TabelaDados, EstadoVazio, Icone, BotaoIcone, EntradaBusca, CampoSelecao, SeloStatus } from "@/components/ui";
import ModalArtigo from "./ArticleModal.jsx";
import FormularioNoticia from "./NewsForm.jsx";
import { noticiasPara } from "./helpers.js";

export default function Noticias({ role: papel, account: conta }) {
  const { state: dadosAplicacao, save: salvar, remove: remover, notify: notificar, toast: aviso, confirm: confirmar } = usarArmazenamento();
  const usuario = usarUsuario(conta);
  const podePublicar = !ehPapelFamiliar(papel);
  const [consulta, definirConsulta] = useState("");
  const [situacao, definirEstado] = useState("Todos");
  const [editando, definirEditando] = useState(null);
  const [lendo, definirLendo] = useState(null);

  const meuIdentificador = papel === "department" ? usuario.ownerId : "admin";
  const possui = (quantidadeN) => papel === "admin" || quantidadeN.authorId === meuIdentificador;
  const linhas = useMemo(() => {
    const termo = consulta.trim().toLowerCase();
    const base = ehPapelFamiliar(papel) ? noticiasPara(dadosAplicacao, papel) : papel === "admin" ? [...dadosAplicacao.news] : dadosAplicacao.news.filter((quantidadeN) => (quantidadeN.status === "Publicado" && quantidadeN.audience !== "Diretoria") || possui(quantidadeN));
    return base
      .filter((quantidadeN) => ehPapelFamiliar(papel) || situacao === "Todos" || quantidadeN.status === situacao)
      .filter((quantidadeN) => !termo || `${quantidadeN.title} ${quantidadeN.category} ${quantidadeN.body}`.toLowerCase().includes(termo))
      .sort((elementoA, elementoB) => elementoB.date.localeCompare(elementoA.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosAplicacao.news, consulta, situacao, papel]);

  const publicarAviso = (quantidadeN) => {
    if (quantidadeN.audience !== "Diretoria") ["member", "dependent"].forEach((resultado) => notificar(resultado, "Novo informativo", `${quantidadeN.title} foi publicada.`, "news"));
    if (quantidadeN.audience !== "Diretoria" && papel === "department") notificar("admin", "Notícia publicada por departamento", `${usuario.department?.name} publicou “${quantidadeN.title}”.`, "news");
  };
  const salvarNoticia = (quantidadeN) => {
    const anterior = dadosAplicacao.news.find((valorX) => valorX.id === quantidadeN.id);
    salvar("news", { ...quantidadeN, image: quantidadeN.image || fotos.community });
    if (quantidadeN.status === "Publicado" && anterior?.status !== "Publicado") publicarAviso(quantidadeN);
    aviso(quantidadeN.id ? "Notícia atualizada" : quantidadeN.status === "Publicado" ? "Notícia publicada" : "Rascunho salvo");
    definirEditando(null);
  };
  const alternarPublicacao = (quantidadeN) => {
    const proximo = quantidadeN.status === "Publicado" ? "Rascunho" : "Publicado";
    salvar("news", { ...quantidadeN, status: proximo });
    if (proximo === "Publicado") publicarAviso(quantidadeN);
    aviso(proximo === "Publicado" ? "Notícia publicada" : "Notícia despublicada");
  };
  const excluir = (quantidadeN) => confirmar({ title: "Excluir notícia", message: `Excluir “${quantidadeN.title}”?`, onConfirm: () => { remover("news", quantidadeN.id); aviso("Notícia excluída"); } });

  if (ehPapelFamiliar(papel)) {
    return (
      <div className="space-y-6">
        <EntradaBusca value={consulta} onChange={definirConsulta} placeholder="Buscar notícia" className="max-w-md" />
        {linhas.length === 0 ? <Cartao><EstadoVazio icon="news" title="Nenhuma notícia encontrada" /></Cartao> : (
          <div className="grid gap-5 md:grid-cols-2">
            {linhas.map((quantidadeN) => (
              <Cartao key={quantidadeN.id} className="grid overflow-hidden sm:grid-cols-[1fr_11rem]">
                <div className="p-5">
                  <div className="flex items-center gap-2"><Selo tone="info">{quantidadeN.category}</Selo><span className="text-xs text-muted">{formatarData(quantidadeN.date)}</span></div>
                  <h2 className="mt-3 text-lg font-bold">{quantidadeN.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{quantidadeN.body}</p>
                  <button type="button" onClick={() => definirLendo(quantidadeN)} className="mt-4 font-semibold text-brand hover:underline">Ler notícia</button>
                </div>
                <img src={quantidadeN.image} alt="" className="h-full min-h-40 w-full object-cover" />
              </Cartao>
            ))}
          </div>
        )}
        {lendo && <ModalArtigo article={lendo} onClose={() => definirLendo(null)} />}
      </div>
    );
  }

  const colunas = [
    { key: "title", label: "Título", render: (quantidadeN) => <span className="font-semibold">{quantidadeN.title}</span> },
    { key: "category", label: "Classificação" },
    { key: "date", label: "Publicação", render: (quantidadeN) => formatarData(quantidadeN.date) },
    { key: "audience", label: "Destinado à" },
    { key: "status", label: "Status", render: (quantidadeN) => <SeloStatus status={quantidadeN.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <EntradaBusca value={consulta} onChange={definirConsulta} placeholder="Buscar notícia" className="flex-1 sm:max-w-md" />
          <CampoSelecao label="" value={situacao} onChange={definirEstado} options={["Todos", "Publicado", "Rascunho"]} className="sm:w-48 [&>span:first-child]:hidden" />
        </div>
        <Botao onClick={() => definirEditando({ title: "", category: "Comunicado", audience: "Todos", status: "Publicado", body: "", image: "", date: hojeISO(), authorId: meuIdentificador })}><Icone name="plus" size={18} /> Nova notícia</Botao>
      </div>
      <TabelaDados
        columns={colunas}
        rows={linhas}
        empty={<EstadoVazio icon="news" title="Nenhuma notícia encontrada">Ajuste os filtros ou crie uma nova notícia.</EstadoVazio>}
        actions={(quantidadeN) => (
          <>
            <BotaoIcone icon="eye" label="Ler" size="sm" onClick={() => definirLendo(quantidadeN)} />
            {possui(quantidadeN) && (
              <>
                <BotaoIcone icon={quantidadeN.status === "Publicado" ? "close" : "check"} label={quantidadeN.status === "Publicado" ? "Despublicar" : "Publicar"} size="sm" onClick={() => alternarPublicacao(quantidadeN)} />
                <BotaoIcone icon="edit" label="Editar" size="sm" onClick={() => definirEditando(quantidadeN)} />
                <BotaoIcone icon="trash" label="Excluir" tone="danger" size="sm" onClick={() => excluir(quantidadeN)} />
              </>
            )}
          </>
        )}
      />
      {editando && <FormularioNoticia news={editando} audiences={papel === "admin" ? PUBLICOS_NOTICIAS : PUBLICOS_NOTICIAS.filter((elementoA) => elementoA !== "Diretoria")} onClose={() => definirEditando(null)} onSave={salvarNoticia} />}
      {lendo && <ModalArtigo article={lendo} onClose={() => definirLendo(null)} />}
    </div>
  );
}

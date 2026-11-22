import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { Botao, BotaoIcone, CampoSelecao, Cartao, EntradaBusca, EstadoVazio, Icone, SeloStatus, TabelaDados } from "@/components/ui";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { formatarData } from "@/lib/data.js";
import { GERENCIAR_NOTICIAS, STATUS_NOTICIAS, criarServicoNoticias, rotuloPublico } from "@/services/noticias.js";
import { usarArmazenamento } from "@/store";
import DialogoConfirmacao from "@/store/ConfirmDialog.jsx";
import ModalArtigo, { DetalheNoticia } from "./ArticleModal.jsx";
import CartaoNoticia from "./NewsCards.jsx";
import FormularioNoticia from "./NewsForm.jsx";

const estados = [{ value: "", label: "Todos" },
  ...Object.entries(STATUS_NOTICIAS).map(([value, label]) => ({ value, label }))];
const colunas = [
  { key: "titulo", label: "Título", render: (noticia) => <span className="font-semibold">{noticia.titulo}</span> },
  { key: "classificacao", label: "Classificação" },
  { key: "dataCriacao", label: "Criação", render: (noticia) => formatarData(noticia.dataCriacao) },
  { key: "publico", label: "Destinado à", render: (noticia) => rotuloPublico(noticia.publico) },
  { key: "status", label: "Status", render: (noticia) => <SeloStatus status={STATUS_NOTICIAS[noticia.status]} /> },
];

export default function Noticias() {
  const { usuario, requisitar, podeAcessar } = usarAutenticacao();
  const servico = useMemo(() => criarServicoNoticias(requisitar), [requisitar]);
  const gestor = podeAcessar(GERENCIAR_NOTICIAS);
  const escopo = JSON.stringify([usuario.id, usuario.funcaoSistema.id, usuario.funcaoSistema.nome, gestor]);
  return <ListaNoticias key={escopo} servico={servico} gestor={gestor} />;
}

function ListaNoticias({ servico, gestor }) {
  const { toast } = usarArmazenamento();
  const [busca, definirBusca] = useState("");
  const [filtros, definirFiltros] = useState({ busca: "", status: "", pagina: 0 });
  const [modal, definirModal] = useState(null);
  const [ocupado, definirOcupado] = useState(false);
  const [erroEnvio, definirErroEnvio] = useState(null);
  const envio = useRef(null);

  useEffect(() => () => envio.current?.abort(), []);
  useEffect(() => {
    if (busca === filtros.busca) return undefined;
    const atraso = setTimeout(() => definirFiltros((atual) => ({ ...atual, busca, pagina: 0 })), 250);
    return () => clearTimeout(atraso);
  }, [busca, filtros.busca]);

  const carregar = useCallback((signal) => servico.listar(filtros, signal), [servico, filtros]);
  const recurso = usarRecursoApi(carregar);
  const dados = recurso.dados;
  const mudarPagina = (pagina) => definirFiltros((atual) => ({ ...atual, pagina }));
  useEffect(() => {
    if (dados?.pagina === filtros.pagina && filtros.pagina > 0 && filtros.pagina >= dados.totalPaginas) {
      definirFiltros((atual) => ({ ...atual, pagina: Math.max(0, dados.totalPaginas - 1) }));
    }
  }, [dados, filtros.pagina]);

  const abrir = (tipo, noticia) => {
    definirErroEnvio(null);
    definirModal({ tipo, noticia });
  };
  const fechar = () => {
    if (!envio.current) definirModal(null);
  };
  const executar = async (operacao, mensagem, erroNoFormulario = false) => {
    if (envio.current) return;
    const controle = new AbortController();
    envio.current = controle;
    definirOcupado(true);
    definirErroEnvio(null);
    try {
      await operacao(controle.signal);
      if (controle.signal.aborted) return;
      definirModal(null);
      toast(mensagem);
      recurso.recarregar();
    } catch (erro) {
      if (controle.signal.aborted || erro.name === "AbortError") return;
      if (erroNoFormulario) definirErroEnvio(erro.message);
      else toast(erro.message, "error");
      if (erro.status === 404) recurso.recarregar();
    } finally {
      envio.current = null;
      if (!controle.signal.aborted) definirOcupado(false);
    }
  };

  const formulario = (noticia) => (
    <FormularioNoticia noticia={noticia} servico={servico} onClose={fechar} salvando={ocupado} erroEnvio={erroEnvio}
      onSave={(dados, imagem, removerImagem) => executar(
        (signal) => servico.salvar(noticia?.id, dados, imagem, removerImagem, signal),
        noticia ? "Notícia atualizada." : dados.status === "PUBLICADO" ? "Notícia publicada." : "Rascunho salvo.",
        true,
      )} />
  );
  const acoes = (noticia) => {
    const publicada = noticia.status === "PUBLICADO";
    return <>
      <BotaoIcone icon="eye" label="Ler" size="sm" disabled={ocupado} onClick={() => abrir("ler", noticia.id)} />
      <BotaoIcone icon={publicada ? "close" : "check"} label={publicada ? "Despublicar" : "Publicar"} size="sm" disabled={ocupado}
        onClick={() => executar((signal) => servico.alterarStatus(noticia.id, publicada ? "RASCUNHO" : "PUBLICADO", signal),
          publicada ? "Notícia despublicada." : "Notícia publicada.")} />
      <BotaoIcone icon="edit" label="Editar" size="sm" disabled={ocupado} onClick={() => abrir("editar", noticia.id)} />
      <BotaoIcone icon="trash" label="Excluir" size="sm" tone="danger" disabled={ocupado} onClick={() => abrir("excluir", noticia)} />
    </>;
  };

  const vazio = <EstadoVazio icon="news" title="Nenhuma notícia encontrada" />;
  const paginaAtual = dados?.pagina === filtros.pagina ? dados : null;
  return (
    <div className="space-y-6" aria-busy={recurso.carregando || ocupado}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-3">
          <EntradaBusca value={busca} onChange={(valor) => definirBusca(valor.slice(0, 200))}
            placeholder="Buscar notícia" className="min-w-48 flex-1 sm:max-w-md" />
          {gestor && <CampoSelecao label="Status" value={filtros.status} options={estados}
            onChange={(status) => definirFiltros((atual) => ({ ...atual, status, busca, pagina: 0 }))}
            className="w-48 [&>span:first-child]:sr-only" />}
        </div>
        {gestor && <Botao disabled={ocupado} onClick={() => abrir("nova")}><Icone name="plus" size={18} /> Nova notícia</Botao>}
      </div>

      {recurso.carregando && <Cartao className="p-6"><p role="status" className="text-muted">Carregando notícias...</p></Cartao>}
      {recurso.erro && <Cartao className="space-y-4 p-6">
        <p role="alert" className="text-danger">{recurso.erro}</p>
        <Botao variant="outline" onClick={recurso.recarregar}>Tentar novamente</Botao>
      </Cartao>}
      {paginaAtual && (gestor
        ? <TabelaDados columns={colunas} rows={paginaAtual.itens} empty={vazio} actions={acoes} />
        : paginaAtual.itens.length === 0 ? <Cartao>{vazio}</Cartao> : (
          <div className="grid gap-5 md:grid-cols-2">
            {paginaAtual.itens.map((noticia) => (
              <CartaoNoticia key={noticia.id} noticia={noticia} servico={servico} aoLer={(id) => abrir("ler", id)} />
            ))}
          </div>
        ))}
      {paginaAtual?.totalPaginas > 1 && paginaAtual.pagina < paginaAtual.totalPaginas && (
        <nav className="flex items-center justify-between gap-3" aria-label="Paginação de notícias">
          <Botao variant="outline" disabled={filtros.pagina === 0 || ocupado} onClick={() => mudarPagina(filtros.pagina - 1)}>Anterior</Botao>
          <span className="text-sm text-muted">Página {filtros.pagina + 1} de {paginaAtual.totalPaginas}</span>
          <Botao variant="outline" disabled={filtros.pagina + 1 >= paginaAtual.totalPaginas || ocupado} onClick={() => mudarPagina(filtros.pagina + 1)}>Próxima</Botao>
        </nav>
      )}
      {modal?.tipo === "nova" && formulario()}
      {modal?.tipo === "editar" && (
        <DetalheNoticia id={modal.noticia} servico={servico} onClose={fechar}>{formulario}</DetalheNoticia>
      )}
      {modal?.tipo === "ler" && <ModalArtigo id={modal.noticia} servico={servico} onClose={fechar} />}
      {modal?.tipo === "excluir" && (
        <DialogoConfirmacao title="Excluir notícia" message={`Excluir “${modal.noticia.titulo}”?`}
          onClose={() => definirModal(null)}
          onConfirm={() => executar((signal) => servico.excluir(modal.noticia.id, signal), "Notícia excluída.")} />
      )}
    </div>
  );
}

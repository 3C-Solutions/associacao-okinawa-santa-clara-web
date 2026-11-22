import { useCallback, useState } from "react";
import { CATEGORIAS_NOTICIAS } from "@/lib/data.js";
import { Botao, Campo, Modal, CampoSelecao, CampoAreaTexto } from "@/components/ui";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { STATUS_NOTICIAS, rotuloPublico } from "@/services/noticias.js";
import SeletorImagem from "@/pages/Dashboard/components/ImagePicker.jsx";
import { usarCapaNoticia } from "./useCapaNoticia.js";

const inicial = { titulo: "", classificacao: "Comunicado", conteudo: "", status: "PUBLICADO", publico: "TODOS" };
const status = Object.entries(STATUS_NOTICIAS).map(([value, label]) => ({ value, label }));

export default function FormularioNoticia({ noticia = inicial, servico, onClose: aoFechar, onSave: aoSalvar, salvando, erroEnvio }) {
  const [formulario, definirFormulario] = useState(noticia);
  const [imagem, definirImagem] = useState(null);
  const [removerImagem, definirRemocao] = useState(false);
  const [erros, definirErros] = useState({});
  const capaAtual = usarCapaNoticia(servico, noticia);
  const carregar = useCallback((signal) => servico.publicos(signal), [servico]);
  const catalogo = usarRecursoApi(carregar);
  const publicos = (catalogo.dados ?? []).map((value) => ({ value, label: rotuloPublico(value) }));
  const classificacoes = [...new Set([...CATEGORIAS_NOTICIAS, noticia.classificacao])];

  const definir = (chave) => (valor) => {
    definirFormulario((atual) => ({ ...atual, [chave]: valor }));
    definirErros((atual) => ({ ...atual, [chave]: undefined }));
  };
  const escolherImagem = (previa, arquivo) => {
    definirImagem(arquivo ? { previa, arquivo } : null);
    definirRemocao(!arquivo && Boolean(noticia.imagemUrl));
  };
  const enviar = () => {
    const falhas = {};
    if (!formulario.titulo.trim()) falhas.titulo = "Informe o título.";
    if (!formulario.conteudo.trim()) falhas.conteudo = "Informe o conteúdo da notícia.";
    if (!catalogo.dados?.includes(formulario.publico)) falhas.publico = "Selecione um público disponível.";
    definirErros(falhas);
    if (Object.keys(falhas).length === 0) aoSalvar(formulario, imagem?.arquivo, removerImagem);
  };
  const acao = noticia.id ? "Salvar alterações" : formulario.status === "RASCUNHO" ? "Salvar rascunho" : "Publicar";

  return (
    <Modal size="lg" title={noticia.id ? "Editar notícia" : "Nova notícia"} onClose={aoFechar}
      footer={<>
        <Botao variant="outline" onClick={aoFechar} disabled={salvando}>Cancelar</Botao>
        <Botao onClick={enviar} disabled={salvando || !catalogo.dados}>{salvando ? "Salvando..." : acao}</Botao>
      </>}>
      <fieldset className="grid min-w-0 gap-5 md:grid-cols-[1fr_16rem]" disabled={salvando}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo className="sm:col-span-2" label="Título" value={formulario.titulo} onChange={definir("titulo")} error={erros.titulo} maxLength={200} required />
          <CampoSelecao label="Classificação" value={formulario.classificacao} onChange={definir("classificacao")} options={classificacoes} />
          <CampoSelecao label="Destinado à" value={formulario.publico} onChange={definir("publico")} options={publicos}
            placeholder={catalogo.carregando ? "Carregando públicos..." : "Selecione o público"} disabled={catalogo.carregando || Boolean(catalogo.erro)} error={erros.publico} />
          {catalogo.erro && <div className="space-y-2 sm:col-span-2">
            <p role="alert" className="text-danger">{catalogo.erro}</p>
            <Botao variant="outline" onClick={catalogo.recarregar}>Recarregar públicos</Botao>
          </div>}
          <CampoSelecao className="sm:col-span-2" label="Status" value={formulario.status} onChange={definir("status")} options={status} />
          <CampoAreaTexto className="sm:col-span-2" label="Conteúdo" rows={6} value={formulario.conteudo} onChange={definir("conteudo")} error={erros.conteudo} maxLength={500} required />
        </div>
        <div>
          <SeletorImagem label="Imagem da notícia" value={imagem?.previa ?? (removerImagem ? "" : capaAtual)} onChange={escolherImagem} />
          {removerImagem && <Botao variant="ghost" onClick={() => definirRemocao(false)}>Manter capa atual</Botao>}
          {!capaAtual && noticia.imagemUrl && !imagem && !removerImagem &&
            <Botao variant="ghost" onClick={() => definirRemocao(true)}>Remover capa salva</Botao>}
        </div>
        {erroEnvio && <p role="alert" className="text-sm font-semibold text-danger md:col-span-2">{erroEnvio}</p>}
      </fieldset>
    </Modal>
  );
}

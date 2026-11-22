import { useCallback } from "react";
import { formatarData } from "@/lib/data.js";
import { Selo, Botao, Modal } from "@/components/ui";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { rotuloPublico } from "@/services/noticias.js";
import { usarCapaNoticia } from "./useCapaNoticia.js";

export function DetalheNoticia({ id, servico, onClose: aoFechar, children }) {
  const carregar = useCallback((signal) => servico.consultar(id, signal), [id, servico]);
  const recurso = usarRecursoApi(carregar);
  if (recurso.dados) return children(recurso.dados);

  return (
    <Modal title="Notícia" onClose={aoFechar} footer={<Botao onClick={aoFechar}>Fechar</Botao>}>
      {recurso.carregando && <p role="status" className="text-muted">Carregando notícia...</p>}
      {recurso.erro && <div className="space-y-4">
        <p role="alert" className="text-danger">{recurso.erro}</p>
        <Botao variant="outline" onClick={recurso.recarregar}>Tentar novamente</Botao>
      </div>}
    </Modal>
  );
}

function Artigo({ noticia, servico, aoFechar }) {
  const capa = usarCapaNoticia(servico, noticia);
  return (
    <Modal title={noticia.titulo} onClose={aoFechar} footer={<Botao onClick={aoFechar}>Fechar</Botao>}>
      {capa && <img src={capa} alt="" className="aspect-video w-full rounded-xl object-cover" />}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Selo tone="info">{noticia.classificacao}</Selo>
        <span className="text-sm text-muted">{formatarData(noticia.dataCriacao)} · {rotuloPublico(noticia.publico)}</span>
      </div>
      <p className="mt-4 whitespace-pre-line break-words leading-relaxed text-muted">{noticia.conteudo}</p>
    </Modal>
  );
}

export default function ModalArtigo({ id, servico, onClose: aoFechar }) {
  return (
    <DetalheNoticia key={id} id={id} servico={servico} onClose={aoFechar}>
      {(noticia) => <Artigo noticia={noticia} servico={servico} aoFechar={aoFechar} />}
    </DetalheNoticia>
  );
}

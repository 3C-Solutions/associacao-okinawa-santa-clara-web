import { Cartao, Botao, Selo } from "@/components/ui";
import { formatarData } from "@/lib/data.js";
import { usarCapaNoticia } from "./useCapaNoticia.js";

export default function CartaoNoticia({ noticia, servico, aoLer }) {
  const capa = usarCapaNoticia(servico, noticia);
  return (
    <Cartao className={`grid overflow-hidden ${capa ? "sm:grid-cols-[1fr_11rem]" : ""}`}>
      <div className="min-w-0 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Selo tone="info">{noticia.classificacao}</Selo>
          <span className="text-xs text-muted">{formatarData(noticia.dataCriacao)}</span>
        </div>
        <h3 className="mt-3 break-words text-lg font-bold">{noticia.titulo}</h3>
        <p className="mt-2 line-clamp-3 break-words text-sm leading-relaxed text-muted">{noticia.conteudo}</p>
        <Botao variant="ghost" className="mt-2 px-0" onClick={() => aoLer(noticia.id)}>Ler notícia</Botao>
      </div>
      {capa && <img src={capa} alt="" className="h-full min-h-40 w-full object-cover" />}
    </Cartao>
  );
}

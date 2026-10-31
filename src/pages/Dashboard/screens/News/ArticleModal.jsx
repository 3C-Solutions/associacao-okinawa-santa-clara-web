import { formatarData } from "@/lib/data.js";
import { Selo, Botao, Modal } from "@/components/ui";

export default function ModalArtigo({ article: artigo, onClose: aoFechar }) {
  return (
    <Modal title={artigo.title} onClose={aoFechar} footer={<Botao onClick={aoFechar}>Fechar</Botao>}>
      {artigo.image && <img src={artigo.image} alt="" className="aspect-video w-full rounded-xl object-cover" />}
      <div className="mt-4 flex flex-wrap items-center gap-3"><Selo tone="info">{artigo.category}</Selo><span className="text-sm text-muted">{formatarData(artigo.date)} · Para: {artigo.audience}</span></div>
      <p className="mt-4 whitespace-pre-line leading-relaxed text-muted">{artigo.body}</p>
    </Modal>
  );
}

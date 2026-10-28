import { fmtDate } from "@/lib/data.js";
import { Badge, Button, Modal } from "@/components/ui";

export default function ArticleModal({ article, onClose }) {
  return (
    <Modal title={article.title} onClose={onClose} footer={<Button onClick={onClose}>Fechar</Button>}>
      {article.image && <img src={article.image} alt="" className="aspect-video w-full rounded-xl object-cover" />}
      <div className="mt-4 flex flex-wrap items-center gap-3"><Badge tone="info">{article.category}</Badge><span className="text-sm text-muted">{fmtDate(article.date)} · Para: {article.audience}</span></div>
      <p className="mt-4 whitespace-pre-line leading-relaxed text-muted">{article.body}</p>
    </Modal>
  );
}

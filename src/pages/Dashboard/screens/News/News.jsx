import { useMemo, useState } from "react";
import { NEWS_AUDIENCES, fmtDate, isFamilyRole, photos, todayISO } from "@/lib/data.js";
import { useStore, useUser } from "@/store";
import { Badge, Button, Card, DataTable, EmptyState, Icon, IconButton, SearchInput, SelectField, StatusBadge } from "@/components/ui";
import ArticleModal from "./ArticleModal.jsx";
import NewsForm from "./NewsForm.jsx";
import { newsFor } from "./helpers.js";

export default function News({ role, account }) {
  const { state, save, remove, notify, toast, confirm } = useStore();
  const user = useUser(account);
  const canPublish = !isFamilyRole(role);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Todos");
  const [editing, setEditing] = useState(null);
  const [reading, setReading] = useState(null);

  const mineId = role === "department" ? user.ownerId : "admin";
  const owns = (n) => role === "admin" || n.authorId === mineId;
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = isFamilyRole(role) ? newsFor(state, role) : role === "admin" ? [...state.news] : state.news.filter((n) => (n.status === "Publicado" && n.audience !== "Diretoria") || owns(n));
    return base
      .filter((n) => isFamilyRole(role) || status === "Todos" || n.status === status)
      .filter((n) => !term || `${n.title} ${n.category} ${n.body}`.toLowerCase().includes(term))
      .sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.news, q, status, role]);

  const publishNotice = (n) => {
    if (n.audience !== "Diretoria") ["member", "dependent"].forEach((r) => notify(r, "Novo informativo", `${n.title} foi publicada.`, "news"));
    if (n.audience !== "Diretoria" && role === "department") notify("admin", "Notícia publicada por departamento", `${user.department?.name} publicou “${n.title}”.`, "news");
  };
  const saveNews = (n) => {
    const previous = state.news.find((x) => x.id === n.id);
    save("news", { ...n, image: n.image || photos.community });
    if (n.status === "Publicado" && previous?.status !== "Publicado") publishNotice(n);
    toast(n.id ? "Notícia atualizada" : n.status === "Publicado" ? "Notícia publicada" : "Rascunho salvo");
    setEditing(null);
  };
  const togglePublish = (n) => {
    const next = n.status === "Publicado" ? "Rascunho" : "Publicado";
    save("news", { ...n, status: next });
    if (next === "Publicado") publishNotice(n);
    toast(next === "Publicado" ? "Notícia publicada" : "Notícia despublicada");
  };
  const del = (n) => confirm({ title: "Excluir notícia", message: `Excluir “${n.title}”?`, onConfirm: () => { remove("news", n.id); toast("Notícia excluída"); } });

  if (isFamilyRole(role)) {
    return (
      <div className="space-y-6">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar notícia" className="max-w-md" />
        {rows.length === 0 ? <Card><EmptyState icon="news" title="Nenhuma notícia encontrada" /></Card> : (
          <div className="grid gap-5 md:grid-cols-2">
            {rows.map((n) => (
              <Card key={n.id} className="grid overflow-hidden sm:grid-cols-[1fr_11rem]">
                <div className="p-5">
                  <div className="flex items-center gap-2"><Badge tone="info">{n.category}</Badge><span className="text-xs text-muted">{fmtDate(n.date)}</span></div>
                  <h2 className="mt-3 text-lg font-bold">{n.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{n.body}</p>
                  <button type="button" onClick={() => setReading(n)} className="mt-4 font-semibold text-brand hover:underline">Ler notícia</button>
                </div>
                <img src={n.image} alt="" className="h-full min-h-40 w-full object-cover" />
              </Card>
            ))}
          </div>
        )}
        {reading && <ArticleModal article={reading} onClose={() => setReading(null)} />}
      </div>
    );
  }

  const columns = [
    { key: "title", label: "Título", render: (n) => <span className="font-semibold">{n.title}</span> },
    { key: "category", label: "Classificação" },
    { key: "date", label: "Publicação", render: (n) => fmtDate(n.date) },
    { key: "audience", label: "Destinado à" },
    { key: "status", label: "Status", render: (n) => <StatusBadge status={n.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar notícia" className="flex-1 sm:max-w-md" />
          <SelectField label="" value={status} onChange={setStatus} options={["Todos", "Publicado", "Rascunho"]} className="sm:w-48 [&>span:first-child]:hidden" />
        </div>
        <Button onClick={() => setEditing({ title: "", category: "Comunicado", audience: "Todos", status: "Publicado", body: "", image: "", date: todayISO(), authorId: mineId })}><Icon name="plus" size={18} /> Nova notícia</Button>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        empty={<EmptyState icon="news" title="Nenhuma notícia encontrada">Ajuste os filtros ou crie uma nova notícia.</EmptyState>}
        actions={(n) => (
          <>
            <IconButton icon="eye" label="Ler" size="sm" onClick={() => setReading(n)} />
            {owns(n) && (
              <>
                <IconButton icon={n.status === "Publicado" ? "close" : "check"} label={n.status === "Publicado" ? "Despublicar" : "Publicar"} size="sm" onClick={() => togglePublish(n)} />
                <IconButton icon="edit" label="Editar" size="sm" onClick={() => setEditing(n)} />
                <IconButton icon="trash" label="Excluir" tone="danger" size="sm" onClick={() => del(n)} />
              </>
            )}
          </>
        )}
      />
      {editing && <NewsForm news={editing} audiences={role === "admin" ? NEWS_AUDIENCES : NEWS_AUDIENCES.filter((a) => a !== "Diretoria")} onClose={() => setEditing(null)} onSave={saveNews} />}
      {reading && <ArticleModal article={reading} onClose={() => setReading(null)} />}
    </div>
  );
}

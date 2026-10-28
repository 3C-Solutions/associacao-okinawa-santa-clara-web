import { useState } from "react";
import { NEWS_CATEGORIES } from "@/lib/data.js";
import { Button, Field, Modal, SelectField, TextAreaField } from "@/components/ui";
import ImagePicker from "@/pages/Dashboard/components/ImagePicker.jsx";

export default function NewsForm({ news, audiences, onClose, onSave }) {
  const [form, setForm] = useState(news);
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined })); };
  const submit = () => {
    const next = {};
    if (form.title.trim().length < 3) next.title = "Informe o título.";
    if (form.body.trim().length < 10) next.body = "Escreva o conteúdo da notícia (mínimo de 10 caracteres).";
    setErrors(next);
    if (!Object.keys(next).length) onSave({ ...form, title: form.title.trim(), body: form.body.trim() });
  };
  return (
    <Modal size="lg" title={news.id ? "Editar notícia" : "Nova notícia"} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={submit}>{form.status === "Publicado" ? "Publicar" : "Salvar rascunho"}</Button></>}>
      <div className="grid gap-5 md:grid-cols-[1fr_16rem]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="sm:col-span-2" label="Título" value={form.title} onChange={set("title")} error={errors.title} required />
          <SelectField label="Classificação" value={form.category} onChange={set("category")} options={NEWS_CATEGORIES} />
          <SelectField label="Destinado à" value={form.audience} onChange={set("audience")} options={audiences} />
          <SelectField className="sm:col-span-2" label="Status" value={form.status} onChange={set("status")} options={["Publicado", "Rascunho"]} />
          <TextAreaField className="sm:col-span-2" label="Conteúdo" rows={6} value={form.body} onChange={set("body")} error={errors.body} required />
        </div>
        <ImagePicker label="Imagem da notícia" value={form.image} onChange={set("image")} />
      </div>
    </Modal>
  );
}

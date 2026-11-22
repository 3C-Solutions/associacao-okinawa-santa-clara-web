import { useEffect, useRef } from "react";
import { usarArmazenamento } from "@/store";
import { Botao, Icone } from "@/components/ui";

// ---------- imagem ----------
// onChange(urlDePrevia, arquivo). O 2º argumento é o File que será enviado ao back.
export default function SeletorImagem({ value: valor, onChange: aoAlterar, label: rotulo = "Imagem do departamento", error: erro, removable: removivel = true }) {
  const { toast: aviso } = usarArmazenamento();
  const entrada = useRef(null);
  const previa = useRef("");
  useEffect(() => () => { if (previa.current) URL.revokeObjectURL(previa.current); }, []);

  const trocar = (url, arquivo) => {
    if (previa.current) URL.revokeObjectURL(previa.current);
    previa.current = url;
    aoAlterar(url, arquivo);
  };
  const selecionar = (evento) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    if (!/^image\/(png|jpeg|webp)$/.test(arquivo.type)) { aviso("Use uma imagem PNG, JPG ou WebP.", "error"); return; }
    if (arquivo.size > 1024 * 1024) { aviso("A imagem deve ter até 1 MB.", "error"); return; }
    trocar(URL.createObjectURL(arquivo), arquivo);
  };
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold">{rotulo}</span>
      <div className="overflow-hidden rounded-xl border border-dashed border-field">
        {valor ? <img src={valor} alt="" className="aspect-video w-full object-cover" /> : <div className="grid aspect-video place-items-center bg-brand-soft text-brand"><Icone name="upload" size={28} /></div>}
      </div>
      <p className="mt-2 text-xs text-muted">PNG, JPG ou WebP, até 1 MB.</p>
      {erro && <p role="alert" className="mt-1 text-xs text-danger">{erro}</p>}
      <div className="mt-2 flex gap-2">
        <Botao variant="secondary" className="min-h-9 px-4 text-sm" onClick={() => entrada.current?.click()}><Icone name="upload" size={16} /> {valor ? "Trocar imagem" : "Enviar imagem"}</Botao>
        {removivel && valor && <Botao variant="ghost" className="min-h-9 px-4 text-sm" onClick={() => trocar("", null)}>Remover</Botao>}
      </div>
      <input ref={entrada} type="file" accept="image/png,image/jpeg,image/webp" onChange={selecionar} className="hidden" />
    </div>
  );
}

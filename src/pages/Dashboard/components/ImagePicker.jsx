import { useRef } from "react";
import { usarArmazenamento } from "@/store";
import { Botao, Icone } from "@/components/ui";

// ---------- imagem ----------
export default function SeletorImagem({ value: valor, onChange: aoAlterar, label: rotulo = "Imagem do departamento" }) {
  const { toast: aviso } = usarArmazenamento();
  const entrada = useRef(null);
  const selecionar = (evento) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(arquivo.type)) { aviso("Use uma imagem PNG, JPG ou WebP.", "error"); return; }
    if (arquivo.size > 1024 * 1024) { aviso("A imagem deve ter até 1 MB.", "error"); return; }
    const leitor = new FileReader();
    leitor.onload = () => aoAlterar(leitor.result);
    leitor.readAsDataURL(arquivo);
  };
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold">{rotulo}</span>
      <div className="overflow-hidden rounded-xl border border-dashed border-field">
        {valor ? <img src={valor} alt="" className="aspect-video w-full object-cover" /> : <div className="grid aspect-video place-items-center bg-brand-soft text-brand"><Icone name="upload" size={28} /></div>}
      </div>
      <p className="mt-2 text-xs text-muted">PNG, JPG ou WebP, até 1 MB.</p>
      <div className="mt-2 flex gap-2">
        <Botao variant="secondary" className="min-h-9 px-4 text-sm" onClick={() => entrada.current?.click()}><Icone name="upload" size={16} /> {valor ? "Trocar imagem" : "Enviar imagem"}</Botao>
        {valor && <Botao variant="ghost" className="min-h-9 px-4 text-sm" onClick={() => aoAlterar("")}>Remover</Botao>}
      </div>
      <input ref={entrada} type="file" accept="image/png,image/jpeg,image/webp" onChange={selecionar} className="hidden" />
    </div>
  );
}

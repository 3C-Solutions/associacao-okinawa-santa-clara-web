import { useRef } from "react";
import { useStore } from "@/store";
import { Button, Icon } from "@/components/ui";

// ---------- imagem ----------
export default function ImagePicker({ value, onChange, label = "Imagem do departamento" }) {
  const { toast } = useStore();
  const input = useRef(null);
  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { toast("Use uma imagem PNG, JPG ou WebP.", "error"); return; }
    if (file.size > 1024 * 1024) { toast("A imagem deve ter até 1 MB.", "error"); return; }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <div className="overflow-hidden rounded-xl border border-dashed border-field">
        {value ? <img src={value} alt="" className="aspect-video w-full object-cover" /> : <div className="grid aspect-video place-items-center bg-brand-soft text-brand"><Icon name="upload" size={28} /></div>}
      </div>
      <p className="mt-2 text-xs text-muted">PNG, JPG ou WebP, até 1 MB.</p>
      <div className="mt-2 flex gap-2">
        <Button variant="secondary" className="min-h-9 px-4 text-sm" onClick={() => input.current?.click()}><Icon name="upload" size={16} /> {value ? "Trocar imagem" : "Enviar imagem"}</Button>
        {value && <Button variant="ghost" className="min-h-9 px-4 text-sm" onClick={() => onChange("")}>Remover</Button>}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} className="hidden" />
    </div>
  );
}

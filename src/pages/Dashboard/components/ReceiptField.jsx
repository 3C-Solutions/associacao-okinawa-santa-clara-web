import { useRef } from "react";
import { RECEIPT_MAX_BYTES } from "@/lib/data.js";
import { useStore } from "@/store";
import { Button, Icon } from "@/components/ui";

// Envio de comprovante (imagem ou PDF). value: { name, type, data } | null
export default function ReceiptField({ value, onChange, error, label = "Comprovante" }) {
  const { toast } = useStore();
  const input = useRef(null);
  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^(image\/(png|jpe?g|webp)|application\/pdf)$/.test(file.type)) { toast("Envie um comprovante em PNG, JPG, WebP ou PDF.", "error"); return; }
    if (file.size > RECEIPT_MAX_BYTES) { toast("O comprovante deve ter até 1 MB.", "error"); return; }
    const reader = new FileReader();
    reader.onload = () => onChange({ name: file.name, type: file.type, data: reader.result });
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold">{label}<span className="text-danger"> *</span></span>
      <div className={`flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-4 ${error ? "border-danger" : "border-field"}`}>
        {value ? (
          <>
            {value.type.startsWith("image/") ? <img src={value.data} alt="" className="size-16 rounded-lg object-cover" /> : <span className="grid size-16 place-items-center rounded-lg bg-brand-soft text-brand"><Icon name="news" size={26} /></span>}
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{value.name}</p><p className="text-xs text-muted">Comprovante anexado</p></div>
            <Button variant="ghost" className="min-h-9 px-4 text-sm" onClick={() => onChange(null)}>Remover</Button>
          </>
        ) : (
          <>
            <span className="grid size-12 place-items-center rounded-lg bg-brand-soft text-brand"><Icon name="upload" size={22} /></span>
            <p className="flex-1 text-sm text-muted">PNG, JPG, WebP ou PDF, até 1 MB.</p>
            <Button variant="secondary" className="min-h-9 px-4 text-sm" onClick={() => input.current?.click()}>Anexar comprovante</Button>
          </>
        )}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={pick} className="hidden" />
      {error && <span role="alert" className="mt-1.5 block text-xs font-semibold text-danger">{error}</span>}
    </div>
  );
}

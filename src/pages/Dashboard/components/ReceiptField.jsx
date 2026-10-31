import { useRef } from "react";
import { TAMANHO_MAX_COMPROVANTE_BYTES } from "@/lib/data.js";
import { usarArmazenamento } from "@/store";
import { Botao, Icone } from "@/components/ui";

// Envio de comprovante (imagem ou PDF). value: { name, type, data } | null
export default function CampoComprovante({ value: valor, onChange: aoAlterar, error: erro, label: rotulo = "Comprovante" }) {
  const { toast: aviso } = usarArmazenamento();
  const entrada = useRef(null);
  const selecionar = (evento) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    if (!/^(image\/(png|jpe?g|webp)|application\/pdf)$/.test(arquivo.type)) { aviso("Envie um comprovante em PNG, JPG, WebP ou PDF.", "error"); return; }
    if (arquivo.size > TAMANHO_MAX_COMPROVANTE_BYTES) { aviso("O comprovante deve ter até 1 MB.", "error"); return; }
    const leitor = new FileReader();
    leitor.onload = () => aoAlterar({ name: arquivo.name, type: arquivo.type, data: leitor.result });
    leitor.readAsDataURL(arquivo);
  };
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold">{rotulo}<span className="text-danger"> *</span></span>
      <div className={`flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-4 ${erro ? "border-danger" : "border-field"}`}>
        {valor ? (
          <>
            {valor.type.startsWith("image/") ? <img src={valor.data} alt="" className="size-16 rounded-lg object-cover" /> : <span className="grid size-16 place-items-center rounded-lg bg-brand-soft text-brand"><Icone name="news" size={26} /></span>}
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{valor.name}</p><p className="text-xs text-muted">Comprovante anexado</p></div>
            <Botao variant="ghost" className="min-h-9 px-4 text-sm" onClick={() => aoAlterar(null)}>Remover</Botao>
          </>
        ) : (
          <>
            <span className="grid size-12 place-items-center rounded-lg bg-brand-soft text-brand"><Icone name="upload" size={22} /></span>
            <p className="flex-1 text-sm text-muted">PNG, JPG, WebP ou PDF, até 1 MB.</p>
            <Botao variant="secondary" className="min-h-9 px-4 text-sm" onClick={() => entrada.current?.click()}>Anexar comprovante</Botao>
          </>
        )}
      </div>
      <input ref={entrada} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={selecionar} className="hidden" />
      {erro && <span role="alert" className="mt-1.5 block text-xs font-semibold text-danger">{erro}</span>}
    </div>
  );
}

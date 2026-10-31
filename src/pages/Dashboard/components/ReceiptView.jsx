import { Icone } from "@/components/ui";

export default function VisualizacaoComprovante({ receipt: comprovante }) {
  if (!comprovante) return <p className="text-sm text-muted">Sem comprovante anexado.</p>;
  return (
    <div>
      {comprovante.type.startsWith("image/") && <img src={comprovante.data} alt="Comprovante" className="max-h-80 w-full rounded-xl border border-divider object-contain" />}
      <a href={comprovante.data} download={comprovante.name} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"><Icone name="download" size={16} /> {comprovante.name}</a>
    </div>
  );
}

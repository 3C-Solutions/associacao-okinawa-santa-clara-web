import { Icon } from "@/components/ui";

export default function ReceiptView({ receipt }) {
  if (!receipt) return <p className="text-sm text-muted">Sem comprovante anexado.</p>;
  return (
    <div>
      {receipt.type.startsWith("image/") && <img src={receipt.data} alt="Comprovante" className="max-h-80 w-full rounded-xl border border-divider object-contain" />}
      <a href={receipt.data} download={receipt.name} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"><Icon name="download" size={16} /> {receipt.name}</a>
    </div>
  );
}

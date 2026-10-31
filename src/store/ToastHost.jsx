import { Icone } from "@/components/ui";

export default function HospedeiroAvisos({ toasts: avisos }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {avisos.map((tempo) => (
        <div key={tempo.id} role="status" className={`pointer-events-auto flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-xl ${tempo.tone === "error" ? "bg-danger" : "bg-ink"}`}>
          <Icone name={tempo.tone === "error" ? "alert" : "check"} size={18} />
          {tempo.message}
        </div>
      ))}
    </div>
  );
}

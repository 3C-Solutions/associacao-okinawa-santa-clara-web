import { Icon } from "@/components/ui";

export default function ToastHost({ toasts }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} role="status" className={`pointer-events-auto flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-xl ${t.tone === "error" ? "bg-danger" : "bg-ink"}`}>
          <Icon name={t.tone === "error" ? "alert" : "check"} size={18} />
          {t.message}
        </div>
      ))}
    </div>
  );
}

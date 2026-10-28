import { useEffect, useRef } from "react";
import { IconButton } from "./Button.jsx";

export function Modal({ title, children, onClose, footer, size = "md" }) {
  const ref = useRef(null);
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector("input, select, textarea, button[data-autofocus]")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/65 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={ref} className={`flex max-h-[92dvh] w-full ${widths[size]} flex-col rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between gap-4 border-b border-divider px-6 py-4">
          <h2 id="modal-title" className="text-xl font-bold">{title}</h2>
          <IconButton icon="close" label="Fechar" onClick={onClose} size="sm" />
        </div>
        <div className="overflow-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-divider px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}

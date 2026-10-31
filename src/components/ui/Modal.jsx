import { useEffect, useRef } from "react";
import { BotaoIcone } from "./Button.jsx";

export function Modal({ title: titulo, children: filhos, onClose: aoFechar, footer: rodape, size: tamanho = "md" }) {
  const referencia = useRef(null);
  const larguras = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };
  useEffect(() => {
    const aoTeclar = (evento) => evento.key === "Escape" && aoFechar();
    document.addEventListener("keydown", aoTeclar);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    referencia.current?.querySelector("input, select, textarea, button[data-autofocus]")?.focus();
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = anterior;
    };
  }, [aoFechar]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/65 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(evento) => evento.target === evento.currentTarget && aoFechar()}>
      <div ref={referencia} className={`flex max-h-[92dvh] w-full ${larguras[tamanho]} flex-col rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between gap-4 border-b border-divider px-6 py-4">
          <h2 id="modal-title" className="text-xl font-bold">{titulo}</h2>
          <BotaoIcone icon="close" label="Fechar" onClick={aoFechar} size="sm" />
        </div>
        <div className="overflow-auto px-6 py-5">{filhos}</div>
        {rodape && <div className="flex flex-col-reverse gap-2 border-t border-divider px-6 py-4 sm:flex-row sm:justify-end">{rodape}</div>}
      </div>
    </div>
  );
}

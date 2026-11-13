import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Icone } from "@/components/ui";

export default function BotaoNavegacaoIcone({ pagina, ativo, onNavigate, expandido, controls }) {
  const tooltipId = useId();
  const [posicao, definirPosicao] = useState(null);
  const fechar = () => definirPosicao(null);
  const mostrar = (evento) => {
    const limites = evento.currentTarget.getBoundingClientRect();
    definirPosicao({ left: limites.right + 12, top: limites.top + limites.height / 2 });
  };

  useEffect(() => {
    if (!posicao) return undefined;
    const aoTeclar = (evento) => { if (evento.key === "Escape") definirPosicao(null); };
    const aoMover = () => definirPosicao(null);
    document.addEventListener("keydown", aoTeclar);
    window.addEventListener("scroll", aoMover, true);
    window.addEventListener("resize", aoMover);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      window.removeEventListener("scroll", aoMover, true);
      window.removeEventListener("resize", aoMover);
    };
  }, [posicao]);

  return (
    <>
      <button
        type="button"
        aria-label={pagina.label}
        aria-describedby={posicao && !expandido ? tooltipId : undefined}
        aria-current={ativo && expandido === undefined ? "page" : undefined}
        aria-expanded={expandido}
        aria-controls={controls}
        aria-haspopup={expandido === undefined ? undefined : "dialog"}
        onMouseEnter={mostrar}
        onMouseLeave={fechar}
        onFocus={mostrar}
        onBlur={fechar}
        onClick={() => { fechar(); onNavigate(pagina.id); }}
        className={`mx-auto flex size-11 items-center justify-center rounded-lg transition focus:outline-none focus:ring-2 focus:ring-brand ${ativo ? "bg-brand-soft text-brand" : "text-ink hover:bg-canvas"}`}
      >
        <Icone name={pagina.icon} />
      </button>
      {posicao && !expandido && createPortal(
        <span id={tooltipId} role="tooltip" style={posicao} className="pointer-events-none fixed z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white shadow-lg">
          <span aria-hidden="true" className="absolute -left-1 top-1/2 size-2 -translate-y-1/2 rotate-45 bg-ink" />
          {pagina.label}
        </span>,
        document.body,
      )}
    </>
  );
}

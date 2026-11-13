import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icone } from "@/components/ui";
import BotaoNavegacaoIcone from "./IconNavButton.jsx";

// Grupo expansível que utiliza o ícone definido no catálogo de navegação.
export default function GrupoNavegacao({ item: item, screen: tela, onNavigate: aoNavegar, compacto = false, grupoFlutuante, definirGrupoFlutuante }) {
  const temFilhoAtivo = item.children.some((filho) => filho.id === tela);
  // a escolha do clique vale para a tela atual; ao mudar de tela, a pasta abre sozinha só se a tela ativa for uma das filhas
  const [preferencia, definirPreferencia] = useState({ screen: null, open: false });
  const abrir = compacto ? grupoFlutuante === item.id : (preferencia.screen === tela ? preferencia.open : temFilhoAtivo);
  const ancora = useRef(null);
  const janela = useRef(null);
  const janelaId = useId();
  const [posicao, definirPosicao] = useState({ left: 88, top: 8 });
  const fechamento = useRef(null);
  const aberturaPorMouse = useRef(false);
  const manterAberto = () => window.clearTimeout(fechamento.current);
  const abrirAoPassar = (evento) => {
    if (evento.pointerType !== "mouse") return;
    manterAberto();
    if (!abrir) {
      aberturaPorMouse.current = true;
      definirGrupoFlutuante(item.id);
    }
  };
  const fecharAoSair = (evento) => {
    if (evento.pointerType !== "mouse") return;
    manterAberto();
    fechamento.current = window.setTimeout(() => definirGrupoFlutuante((atual) => atual === item.id ? null : atual), 250);
  };

  useEffect(() => () => window.clearTimeout(fechamento.current), [tela, compacto, abrir]);

  useLayoutEffect(() => {
    if (!compacto || !abrir) return undefined;
    const fechar = () => definirGrupoFlutuante((atual) => atual === item.id ? null : atual);
    const posicionar = () => {
      const limites = ancora.current.getBoundingClientRect();
      const lateral = ancora.current.closest("aside").getBoundingClientRect();
      definirPosicao({
        left: lateral.right + 8,
        top: Math.max(8, Math.min(limites.top, window.innerHeight - janela.current.offsetHeight - 8)),
      });
    };
    const aoClicarFora = (evento) => {
      if (!ancora.current.contains(evento.target) && !janela.current.contains(evento.target)) fechar();
    };
    const aoTeclar = (evento) => {
      if (evento.key === "Escape") {
        fechar();
        ancora.current.querySelector("button").focus();
      }
    };
    const aoFocarFora = (evento) => {
      if (!ancora.current.contains(evento.target) && !janela.current.contains(evento.target)) fechar();
    };
    posicionar();
    if (!aberturaPorMouse.current) janela.current.querySelector("button")?.focus();
    document.addEventListener("pointerdown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("focusin", aoFocarFora);
    window.addEventListener("resize", posicionar);
    window.addEventListener("scroll", posicionar, true);
    return () => {
      document.removeEventListener("pointerdown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("focusin", aoFocarFora);
      window.removeEventListener("resize", posicionar);
      window.removeEventListener("scroll", posicionar, true);
    };
  }, [compacto, abrir, tela, item.id, definirGrupoFlutuante]);

  if (compacto) return (
    <div ref={ancora} onPointerEnter={abrirAoPassar} onPointerLeave={fecharAoSair}>
      <BotaoNavegacaoIcone
        pagina={{ ...item, icon: item.icon === "folder" && abrir ? "folderOpen" : item.icon }}
        ativo={temFilhoAtivo && !abrir}
        expandido={abrir}
        controls={abrir ? janelaId : undefined}
        onNavigate={() => {
          manterAberto();
          aberturaPorMouse.current = false;
          definirGrupoFlutuante(item.id);
          janela.current?.querySelector("button")?.focus();
        }}
      />
      {abrir && createPortal(
        <div ref={janela} id={janelaId} role="dialog" aria-label={item.label} style={posicao} onPointerEnter={manterAberto} onPointerLeave={fecharAoSair} className="fixed z-50 max-h-[calc(100dvh-16px)] w-56 max-w-[calc(100vw-96px)] overflow-y-auto overscroll-contain rounded-xl border border-divider bg-white p-2 text-ink shadow-xl">
          <p className="px-3 py-2 text-xs font-bold text-muted">{item.label}</p>
          <ul className="space-y-1">
          {item.children.map((filho) => (
            <li key={filho.id}>
              <button type="button" aria-current={tela === filho.id ? "page" : undefined} onClick={() => {
                definirGrupoFlutuante(null);
                aoNavegar(filho.id);
              }} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand ${tela === filho.id ? "bg-brand-soft text-brand" : "hover:bg-canvas"}`}>
                <Icone name={filho.icon} size={18} />
                <span className="min-w-0 break-words">{filho.label}</span>
              </button>
            </li>
          ))}
          </ul>
        </div>, document.body,
      )}
    </div>
  );

  return (
    <div>
      <button
        type="button"
        aria-expanded={abrir}
        onClick={() => definirPreferencia({ screen: tela, open: !abrir })}
        className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand ${temFilhoAtivo ? "bg-brand-soft text-brand" : "text-ink hover:bg-canvas"}`}
      >
        <Icone name={item.icon === "folder" && abrir ? "folderOpen" : item.icon} />
        <span className="flex-1 text-left">{item.label}</span>
        <span className={`transition-transform ${abrir ? "rotate-90" : ""}`}><Icone name="arrow" size={16} /></span>
      </button>
      {abrir && (
        <ul className="ml-6 mt-1 space-y-1 border-l-2 border-divider pl-3" aria-label={item.label}>
          {item.children.map((filho) => (
            <li key={filho.id}>
              <button
                type="button"
                onClick={() => aoNavegar(filho.id)}
                aria-current={tela === filho.id ? "page" : undefined}
                className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand ${tela === filho.id ? "bg-brand-soft text-brand" : "text-ink hover:bg-canvas"}`}
              >
                <Icone name={filho.icon} size={18} />{filho.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { useState } from "react";
import { Icone } from "@/components/ui";
import BotaoNavegacaoIcone from "./IconNavButton.jsx";

// Grupo expansível que utiliza o ícone definido no catálogo de navegação.
export default function GrupoNavegacao({ item: item, screen: tela, onNavigate: aoNavegar, compacto = false }) {
  const temFilhoAtivo = item.children.some((filho) => filho.id === tela);
  // a escolha do clique vale para a tela atual; ao mudar de tela, a pasta abre sozinha só se a tela ativa for uma das filhas
  const [preferencia, definirPreferencia] = useState({ screen: null, open: false });
  const abrir = preferencia.screen === tela ? preferencia.open : temFilhoAtivo;

  if (compacto) return (
    <div>
      <BotaoNavegacaoIcone
        pagina={{ ...item, icon: item.icon === "folder" && abrir ? "folderOpen" : item.icon }}
        ativo={temFilhoAtivo && !abrir}
        expandido={abrir}
        onNavigate={() => definirPreferencia({ screen: tela, open: !abrir })}
      />
      {abrir && (
        <ul className="mt-1 space-y-1 rounded-lg bg-canvas py-1" aria-label={item.label}>
          {item.children.map((filho) => (
            <li key={filho.id}>
              <BotaoNavegacaoIcone pagina={filho} ativo={tela === filho.id} onNavigate={aoNavegar} />
            </li>
          ))}
        </ul>
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

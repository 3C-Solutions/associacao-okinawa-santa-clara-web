import { useState } from "react";
import { Icone } from "@/components/ui";

// Item de menu em forma de pasta: abre e fecha ao clicar, mostrando a hierarquia de telas abaixo dele.
export default function GrupoNavegacao({ item: item, screen: tela, onNavigate: aoNavegar }) {
  const temFilhoAtivo = item.children.some((filho) => filho.id === tela);
  // a escolha do clique vale para a tela atual; ao mudar de tela, a pasta abre sozinha só se a tela ativa for uma das filhas
  const [preferencia, definirPreferencia] = useState({ screen: null, open: false });
  const abrir = preferencia.screen === tela ? preferencia.open : temFilhoAtivo;

  return (
    <div>
      <button
        type="button"
        aria-expanded={abrir}
        onClick={() => definirPreferencia({ screen: tela, open: !abrir })}
        className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand ${temFilhoAtivo ? "bg-brand-soft text-brand" : "text-ink hover:bg-canvas"}`}
      >
        <Icone name={abrir ? "folderOpen" : "folder"} />
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

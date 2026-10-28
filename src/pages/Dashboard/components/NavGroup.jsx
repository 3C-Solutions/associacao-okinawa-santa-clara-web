import { useState } from "react";
import { Icon } from "@/components/ui";

// Item de menu em forma de pasta: abre e fecha ao clicar, mostrando a hierarquia de telas abaixo dele.
export default function NavGroup({ item, screen, onNavigate }) {
  const hasActiveChild = item.children.some((child) => child.id === screen);
  // a escolha do clique vale para a tela atual; ao mudar de tela, a pasta abre sozinha só se a tela ativa for uma das filhas
  const [pref, setPref] = useState({ screen: null, open: false });
  const open = pref.screen === screen ? pref.open : hasActiveChild;

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setPref({ screen, open: !open })}
        className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand ${hasActiveChild ? "bg-brand-soft text-brand" : "text-ink hover:bg-canvas"}`}
      >
        <Icon name={open ? "folderOpen" : "folder"} />
        <span className="flex-1 text-left">{item.label}</span>
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}><Icon name="arrow" size={16} /></span>
      </button>
      {open && (
        <ul className="ml-6 mt-1 space-y-1 border-l-2 border-divider pl-3" aria-label={item.label}>
          {item.children.map((child) => (
            <li key={child.id}>
              <button
                type="button"
                onClick={() => onNavigate(child.id)}
                aria-current={screen === child.id ? "page" : undefined}
                className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand ${screen === child.id ? "bg-brand-soft text-brand" : "text-ink hover:bg-canvas"}`}
              >
                <Icon name={child.icon} size={18} />{child.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

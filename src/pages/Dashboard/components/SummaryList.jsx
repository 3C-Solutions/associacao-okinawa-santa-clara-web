import { Botao, Cartao, Icone } from "@/components/ui";

// rows: [{ key, title, sub, badge, onClick }]
export default function ListaResumo({ title: titulo, rows: linhas, onSeeAll: aoVerTudo, empty: vazio = "Nada por aqui." }) {
  return (
    <Cartao className="p-5 md:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{titulo}</h2>
        {aoVerTudo && <Botao variant="ghost" onClick={aoVerTudo} className="min-h-9 px-3 text-sm">Ver todos</Botao>}
      </div>
      {linhas.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{vazio}</p>
      ) : (
        <ul className="divide-y divide-divider">
          {linhas.map((linha) => (
            <li key={linha.key}>
              <button type="button" onClick={linha.onClick} disabled={!linha.onClick} className="grid w-full grid-cols-[1fr_auto] items-center gap-4 py-3.5 text-left enabled:hover:bg-canvas">
                <span><span className="block text-sm font-semibold">{linha.title}</span><span className="mt-1 block text-xs text-muted">{linha.sub}</span></span>
                {linha.badge || <span className="text-brand"><Icone name="arrow" size={18} /></span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Cartao>
  );
}

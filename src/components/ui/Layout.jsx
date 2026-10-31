import { Icone } from "./Icon.jsx";

export function Titulo({ children: filhos, className: nomeClasse = "" }) {
  return <h1 className={`text-3xl font-bold tracking-tight text-ink ${nomeClasse}`}>{filhos}</h1>;
}

export function TituloSecao({ children: filhos, eyebrow: sobretitulo }) {
  return (
    <div>
      {sobretitulo && <p className="mb-2 text-sm font-bold uppercase tracking-widest text-brand">{sobretitulo}</p>}
      <h2 className="text-2xl font-bold tracking-tight text-ink">{filhos}</h2>
    </div>
  );
}

export function Cartao({ children: filhos, className: nomeClasse = "" }) {
  return <div className={`rounded-xl border border-divider bg-white ${nomeClasse}`}>{filhos}</div>;
}

export function EstadoVazio({ icon: icone = "info", title: titulo, children: filhos, action: acao }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-brand-soft text-brand"><Icone name={icone} size={26} /></span>
      <h3 className="mt-4 font-bold">{titulo}</h3>
      {filhos && <p className="mt-1 max-w-sm text-sm text-muted">{filhos}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}

export function CabecalhoPagina({ children: filhos, left: restante }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">{restante}</div>
      <div className="flex flex-wrap gap-2">{filhos}</div>
    </div>
  );
}

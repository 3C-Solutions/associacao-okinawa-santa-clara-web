import { Icone } from "./Icon.jsx";

export function Botao({ children: filhos, onClick: aoClicar, variant: variante = "primary", type: tipo = "button", className: nomeClasse = "", disabled: desabilitado = false }) {
  const variantes = {
    primary: "bg-brand text-white hover:bg-brand-dark shadow-sm",
    secondary: "bg-brand-soft text-brand hover:bg-brand-soft-strong",
    ghost: "bg-transparent text-brand hover:bg-brand-soft",
    danger: "bg-danger text-white hover:brightness-90",
    outline: "border border-divider bg-white text-ink hover:bg-canvas",
  };
  return (
    <button type={tipo} onClick={aoClicar} disabled={desabilitado} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantes[variante]} ${nomeClasse}`}>
      {filhos}
    </button>
  );
}

export function BotaoIcone({ icon: icone, label: rotulo, onClick: aoClicar, active: ativo = false, count: quantidade, tone: tom = "brand", size: tamanho = "md" }) {
  const tons = {
    brand: ativo ? "bg-brand text-white" : "bg-brand-soft text-brand hover:bg-brand-soft-strong",
    danger: "bg-danger-soft text-danger hover:brightness-95",
  };
  const tamanhos = { md: "size-11", sm: "size-9" };
  return (
    <button type="button" aria-label={rotulo} title={rotulo} onClick={aoClicar} className={`relative flex ${tamanhos[tamanho]} shrink-0 items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${tons[tom]}`}>
      <Icone name={icone} size={tamanho === "sm" ? 17 : 20} />
      {quantidade !== undefined && quantidade > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-danger px-1.5 py-0.5 text-xs font-bold leading-none text-white ring-2 ring-canvas">{quantidade}</span>}
    </button>
  );
}

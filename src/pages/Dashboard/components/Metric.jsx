import { Cartao } from "@/components/ui";

export default function Metrica({ label: rotulo, value: valor, trend: tendencia, tone: tom = "success", onClick: aoClicar, actionLabel: rotuloAcao }) {
  const tons = { success: "text-success", danger: "text-danger", muted: "text-muted" };
  const Contenedor = aoClicar ? "button" : "div";
  return (
    <Cartao className="overflow-hidden">
      <Contenedor type={aoClicar ? "button" : undefined} onClick={aoClicar} className="block w-full border-l-4 border-accent p-6 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand">
        <p className="text-sm font-semibold text-muted">{rotulo}</p>
        <p className="mt-2 text-3xl font-bold text-brand">{valor}</p>
        {tendencia && <p className={`mt-2 text-xs font-semibold ${tons[tom]}`}>{tendencia}</p>}
        {aoClicar && rotuloAcao && <span className="mt-3 block text-xs font-semibold text-brand">{rotuloAcao}</span>}
      </Contenedor>
    </Cartao>
  );
}

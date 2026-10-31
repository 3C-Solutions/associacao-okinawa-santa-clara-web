import { MESES, formatarMoeda, chaveMes } from "@/lib/data.js";
import { somar } from "@/lib/finance.js";
import { Cartao } from "@/components/ui";

export default function Graficos({ all: todos, year: ano }) {
  const pago = todos.filter((tempo) => tempo.status === "Pago" && tempo.date.startsWith(ano));
  const insercoes = pago.filter((tempo) => tempo.type === "in");
  const totalEntradas = somar(insercoes);
  const totalSaidas = somar(pago.filter((tempo) => tempo.type === "out"));
  const porCategoria = Object.entries(insercoes.reduce((acumulador, tempo) => ({ ...acumulador, [tempo.category]: (acumulador[tempo.category] || 0) + tempo.amount }), {})).sort((elementoA, elementoB) => elementoB[1] - elementoA[1]).slice(0, 5);
  const meses = MESES.map((ignorado, indice) => {
    const chave = `${ano}-${String(indice + 1).padStart(2, "0")}`;
    const lista = pago.filter((tempo) => chaveMes(tempo.date) === chave);
    return { label: MESES[indice].slice(0, 3), in: somar(lista.filter((tempo) => tempo.type === "in")), out: somar(lista.filter((tempo) => tempo.type === "out")) };
  });
  const maximo = Math.max(1, ...meses.flatMap((mes) => [mes.in, mes.out]));
  const percentualSaida = totalEntradas + totalSaidas > 0 ? (totalSaidas / (totalEntradas + totalSaidas)) * 100 : 0;
  const percentualSaldo = totalEntradas > 0 ? Math.max(0, Math.round(((totalEntradas - totalSaidas) / totalEntradas) * 100)) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Cartao className="p-6">
        <h2 className="font-bold">Entradas por categoria</h2>
        <p className="text-xs text-muted">Pagamentos confirmados em {ano}</p>
        {porCategoria.length === 0 ? <p className="mt-6 text-sm text-muted">Sem entradas no período.</p> : (
          <div className="mt-5 space-y-4">
            {porCategoria.map(([rotulo, valor]) => {
              const percentual = Math.round((valor / totalEntradas) * 100);
              return (
                <div key={rotulo}>
                  <div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold">{rotulo}</span><span className="text-muted">{formatarMoeda(valor)} · {percentual}%</span></div>
                  <div className="h-2.5 rounded-full bg-brand-soft"><div className="h-full rounded-full bg-brand" style={{ width: `${percentual}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
      </Cartao>
      <Cartao className="flex items-center justify-between gap-6 p-6">
        <div>
          <h2 className="font-bold">Entradas x Saídas</h2>
          <div className="mt-5 space-y-3 text-sm">
            <p className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-brand" />Entradas <strong>{formatarMoeda(totalEntradas)}</strong></p>
            <p className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-accent" />Saídas <strong>{formatarMoeda(totalSaidas)}</strong></p>
          </div>
        </div>
        <div className="grid size-36 shrink-0 place-items-center rounded-full" style={{ background: totalEntradas + totalSaidas === 0 ? "var(--color-brand-soft)" : `conic-gradient(var(--color-accent) 0 ${percentualSaida}%, var(--color-brand) ${percentualSaida}% 100%)` }} role="img" aria-label={`Saldo de ${percentualSaldo}% das entradas`}>
          <div className="grid size-20 place-items-center rounded-full bg-white text-center"><span className="text-xs text-muted">Saldo<br /><strong className="text-brand">{percentualSaldo}%</strong></span></div>
        </div>
      </Cartao>
      <Cartao className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between"><h2 className="font-bold">Fluxo mensal</h2><div className="flex gap-4 text-xs text-muted"><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-brand" />Entradas</span><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-accent" />Saídas</span></div></div>
        <div className="mt-5 grid h-44 grid-cols-12 items-end gap-2">
          {meses.map((mes) => (
            <div key={mes.label} className="flex h-full flex-col justify-end gap-1" title={`${mes.label}: entradas ${formatarMoeda(mes.in)} · saídas ${formatarMoeda(mes.out)}`}>
              <div className="flex flex-1 items-end justify-center gap-0.5">
                <div className="w-full max-w-4 rounded-t bg-brand" style={{ height: `${(mes.in / maximo) * 100}%` }} />
                <div className="w-full max-w-4 rounded-t bg-accent" style={{ height: `${(mes.out / maximo) * 100}%` }} />
              </div>
              <span className="text-center text-[10px] font-semibold text-muted">{mes.label}</span>
            </div>
          ))}
        </div>
      </Cartao>
    </div>
  );
}

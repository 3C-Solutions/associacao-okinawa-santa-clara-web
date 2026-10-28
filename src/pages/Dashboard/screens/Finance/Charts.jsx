import { MONTHS, fmtMoney, monthKey } from "@/lib/data.js";
import { sum } from "@/lib/finance.js";
import { Card } from "@/components/ui";

export default function Charts({ all, year }) {
  const paid = all.filter((t) => t.status === "Pago" && t.date.startsWith(year));
  const ins = paid.filter((t) => t.type === "in");
  const totalIn = sum(ins);
  const totalOut = sum(paid.filter((t) => t.type === "out"));
  const byCat = Object.entries(ins.reduce((acc, t) => ({ ...acc, [t.category]: (acc[t.category] || 0) + t.amount }), {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const months = MONTHS.map((_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    const list = paid.filter((t) => monthKey(t.date) === key);
    return { label: MONTHS[i].slice(0, 3), in: sum(list.filter((t) => t.type === "in")), out: sum(list.filter((t) => t.type === "out")) };
  });
  const max = Math.max(1, ...months.flatMap((m) => [m.in, m.out]));
  const outPct = totalIn + totalOut > 0 ? (totalOut / (totalIn + totalOut)) * 100 : 0;
  const saldoPct = totalIn > 0 ? Math.max(0, Math.round(((totalIn - totalOut) / totalIn) * 100)) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h2 className="font-bold">Entradas por categoria</h2>
        <p className="text-xs text-muted">Pagamentos confirmados em {year}</p>
        {byCat.length === 0 ? <p className="mt-6 text-sm text-muted">Sem entradas no período.</p> : (
          <div className="mt-5 space-y-4">
            {byCat.map(([label, value]) => {
              const pct = Math.round((value / totalIn) * 100);
              return (
                <div key={label}>
                  <div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold">{label}</span><span className="text-muted">{fmtMoney(value)} · {pct}%</span></div>
                  <div className="h-2.5 rounded-full bg-brand-soft"><div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <Card className="flex items-center justify-between gap-6 p-6">
        <div>
          <h2 className="font-bold">Entradas x Saídas</h2>
          <div className="mt-5 space-y-3 text-sm">
            <p className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-brand" />Entradas <strong>{fmtMoney(totalIn)}</strong></p>
            <p className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-accent" />Saídas <strong>{fmtMoney(totalOut)}</strong></p>
          </div>
        </div>
        <div className="grid size-36 shrink-0 place-items-center rounded-full" style={{ background: totalIn + totalOut === 0 ? "var(--color-brand-soft)" : `conic-gradient(var(--color-accent) 0 ${outPct}%, var(--color-brand) ${outPct}% 100%)` }} role="img" aria-label={`Saldo de ${saldoPct}% das entradas`}>
          <div className="grid size-20 place-items-center rounded-full bg-white text-center"><span className="text-xs text-muted">Saldo<br /><strong className="text-brand">{saldoPct}%</strong></span></div>
        </div>
      </Card>
      <Card className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between"><h2 className="font-bold">Fluxo mensal</h2><div className="flex gap-4 text-xs text-muted"><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-brand" />Entradas</span><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-accent" />Saídas</span></div></div>
        <div className="mt-5 grid h-44 grid-cols-12 items-end gap-2">
          {months.map((m) => (
            <div key={m.label} className="flex h-full flex-col justify-end gap-1" title={`${m.label}: entradas ${fmtMoney(m.in)} · saídas ${fmtMoney(m.out)}`}>
              <div className="flex flex-1 items-end justify-center gap-0.5">
                <div className="w-full max-w-4 rounded-t bg-brand" style={{ height: `${(m.in / max) * 100}%` }} />
                <div className="w-full max-w-4 rounded-t bg-accent" style={{ height: `${(m.out / max) * 100}%` }} />
              </div>
              <span className="text-center text-[10px] font-semibold text-muted">{m.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

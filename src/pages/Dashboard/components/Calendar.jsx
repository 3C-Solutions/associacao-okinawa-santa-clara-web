import { MONTHS, fromISO, todayISO } from "@/lib/data.js";
import { Card, Icon } from "@/components/ui";

const pad = (n) => String(n).padStart(2, "0");

// marks: { "YYYY-MM-DD": "event" | "pending" }; view: { y, m } (m = 0..11)
export default function Calendar({ marks = {}, selected, onSelect, view, onView, className = "" }) {
  const today = todayISO();
  const first = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((first + daysInMonth) / 7) * 7 }, (_, i) => {
    const day = i - first + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
  const shift = (delta) => {
    const d = new Date(view.y, view.m + delta, 1);
    onView({ y: d.getFullYear(), m: d.getMonth() });
  };
  const isCurrent = view.y === fromISO(today).getFullYear() && view.m === fromISO(today).getMonth();

  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-5 flex items-center justify-between">
        <button type="button" aria-label="Mês anterior" onClick={() => shift(-1)} className="grid size-9 rotate-180 place-items-center rounded-full text-brand hover:bg-brand-soft"><Icon name="arrow" /></button>
        <div className="text-center">
          <h2 className="font-bold">{MONTHS[view.m]} {view.y}</h2>
          {!isCurrent && <button type="button" onClick={() => onView({ y: fromISO(today).getFullYear(), m: fromISO(today).getMonth() })} className="text-xs font-semibold text-brand hover:underline">Ir para hoje</button>}
        </div>
        <button type="button" aria-label="Próximo mês" onClick={() => shift(1)} className="grid size-9 place-items-center rounded-full text-brand hover:bg-brand-soft"><Icon name="arrow" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <span key={i} className="py-2 text-xs font-bold text-brand">{d}</span>)}
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const iso = `${view.y}-${pad(view.m + 1)}-${pad(day)}`;
          const mark = marks[iso];
          const isSel = selected === iso;
          const isToday = iso === today;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect?.(iso)}
              aria-label={`${day} de ${MONTHS[view.m]}${mark ? (mark === "pending" ? ", reserva pendente" : ", com evento") : ""}`}
              aria-pressed={isSel}
              className={`relative h-11 rounded-lg text-sm sm:h-12 transition ${isSel ? "bg-brand font-bold text-white" : isToday ? "bg-accent/60 font-bold text-brand hover:bg-accent" : mark ? "font-bold text-brand hover:bg-brand-soft" : "hover:bg-brand-soft"}`}
            >
              {day}
              {mark && <span className={`absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full ${mark === "pending" ? "border border-brand bg-white" : isSel ? "bg-accent" : "bg-brand"}`} />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand" />Evento</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full border border-brand bg-white" />Reserva pendente</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent" />Hoje</span>
      </div>
    </Card>
  );
}

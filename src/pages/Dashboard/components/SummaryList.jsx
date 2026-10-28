import { Button, Card, Icon } from "@/components/ui";

// rows: [{ key, title, sub, badge, onClick }]
export default function SummaryList({ title, rows, onSeeAll, empty = "Nada por aqui." }) {
  return (
    <Card className="p-5 md:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        {onSeeAll && <Button variant="ghost" onClick={onSeeAll} className="min-h-9 px-3 text-sm">Ver todos</Button>}
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-divider">
          {rows.map((row) => (
            <li key={row.key}>
              <button type="button" onClick={row.onClick} disabled={!row.onClick} className="grid w-full grid-cols-[1fr_auto] items-center gap-4 py-3.5 text-left enabled:hover:bg-canvas">
                <span><span className="block text-sm font-semibold">{row.title}</span><span className="mt-1 block text-xs text-muted">{row.sub}</span></span>
                {row.badge || <span className="text-brand"><Icon name="arrow" size={18} /></span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

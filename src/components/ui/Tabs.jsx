export function Tabs({ value, onChange, options }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-brand-soft p-1">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} className={`min-h-9 rounded-md px-4 text-sm font-semibold transition ${value === o.value ? "bg-white text-brand shadow-sm" : "text-brand/70 hover:text-brand"}`}>{o.label}</button>
      ))}
    </div>
  );
}

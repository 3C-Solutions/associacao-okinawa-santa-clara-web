export function Abas({ value: valor, onChange: aoAlterar, options: opcoes }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-brand-soft p-1">
      {opcoes.map((objeto) => (
        <button key={objeto.value} type="button" onClick={() => aoAlterar(objeto.value)} className={`min-h-9 rounded-md px-4 text-sm font-semibold transition ${valor === objeto.value ? "bg-white text-brand shadow-sm" : "text-brand/70 hover:text-brand"}`}>{objeto.label}</button>
      ))}
    </div>
  );
}

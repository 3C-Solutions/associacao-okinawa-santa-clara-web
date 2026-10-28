import { Icon } from "./Icon.jsx";

const inputBase = "w-full bg-transparent outline-none placeholder:text-muted disabled:text-muted";

const boxBase = (error) => `flex min-h-11 items-center rounded-lg border bg-white px-4 focus-within:ring-2 ${error ? "border-danger focus-within:ring-danger/20" : "border-field focus-within:border-brand focus-within:ring-brand/20"}`;

function FieldShell({ label, error, hint, required, className, children }) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="mb-2 block text-sm font-semibold text-ink">{label}{required && <span className="text-danger"> *</span>}</span>
      {children}
      {error ? <span role="alert" className="mt-1.5 block text-xs font-semibold text-danger">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Field({ label, value, onChange, type = "text", placeholder, error, hint, required, readOnly = false, disabled = false, className = "", min, max, step, suffix }) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={required} className={className}>
      <span className={`${boxBase(error)} ${readOnly ? "bg-canvas" : ""}`}>
        <input type={type} value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} readOnly={readOnly} disabled={disabled} min={min} max={max} step={step} className={inputBase} />
        {suffix}
      </span>
    </FieldShell>
  );
}

export function SelectField({ label, value, onChange, options, error, required, className = "", placeholder }) {
  return (
    <FieldShell label={label} error={error} required={required} className={className}>
      <span className={boxBase(error)}>
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={`${inputBase} bg-white py-2`}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
      </span>
    </FieldShell>
  );
}

export function TextAreaField({ label, value, onChange, error, required, rows = 5, className = "", placeholder }) {
  return (
    <FieldShell label={label} error={error} required={required} className={className}>
      <span className={`${boxBase(error)} items-start py-2.5`}>
        <textarea rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputBase} resize-y`} />
      </span>
    </FieldShell>
  );
}

export function SearchInput({ value, onChange, placeholder = "Buscar", className = "" }) {
  return (
    <div className={`flex min-h-11 items-center gap-3 rounded-lg border border-field bg-white px-4 text-muted focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 ${className}`}>
      <Icon name="search" />
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-ink outline-none" placeholder={placeholder} aria-label={placeholder} />
      {value && <button type="button" aria-label="Limpar busca" onClick={() => onChange("")} className="text-muted hover:text-ink"><Icon name="close" size={16} /></button>}
    </div>
  );
}

export function Checkbox({ checked, onChange, children }) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border border-divider px-3 text-sm font-medium hover:bg-canvas">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-brand" />
      {children}
    </label>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${checked ? "bg-brand" : "bg-field"}`}>
      <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${checked ? "left-[1.375rem]" : "left-0.5"}`} />
    </button>
  );
}

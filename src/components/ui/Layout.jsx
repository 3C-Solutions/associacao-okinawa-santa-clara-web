import { Icon } from "./Icon.jsx";

export function Title({ children, className = "" }) {
  return <h1 className={`text-3xl font-bold tracking-tight text-ink ${className}`}>{children}</h1>;
}

export function SectionTitle({ children, eyebrow }) {
  return (
    <div>
      {eyebrow && <p className="mb-2 text-sm font-bold uppercase tracking-widest text-brand">{eyebrow}</p>}
      <h2 className="text-2xl font-bold tracking-tight text-ink">{children}</h2>
    </div>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`rounded-xl border border-divider bg-white ${className}`}>{children}</div>;
}

export function EmptyState({ icon = "info", title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-brand-soft text-brand"><Icon name={icon} size={26} /></span>
      <h3 className="mt-4 font-bold">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ children, left }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">{left}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

import { Icon } from "./Icon.jsx";

export function Button({ children, onClick, variant = "primary", type = "button", className = "", disabled = false }) {
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-dark shadow-sm",
    secondary: "bg-brand-soft text-brand hover:bg-brand-soft-strong",
    ghost: "bg-transparent text-brand hover:bg-brand-soft",
    danger: "bg-danger text-white hover:brightness-90",
    outline: "border border-divider bg-white text-ink hover:bg-canvas",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function IconButton({ icon, label, onClick, active = false, count, tone = "brand", size = "md" }) {
  const tones = {
    brand: active ? "bg-brand text-white" : "bg-brand-soft text-brand hover:bg-brand-soft-strong",
    danger: "bg-danger-soft text-danger hover:brightness-95",
  };
  const sizes = { md: "size-11", sm: "size-9" };
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={`relative flex ${sizes[size]} shrink-0 items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${tones[tone]}`}>
      <Icon name={icon} size={size === "sm" ? 17 : 20} />
      {count !== undefined && count > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-danger px-1.5 py-0.5 text-xs font-bold leading-none text-white ring-2 ring-canvas">{count}</span>}
    </button>
  );
}

import { Card } from "@/components/ui";

export default function Metric({ label, value, trend, tone = "success", onClick }) {
  const tones = { success: "text-success", danger: "text-danger", muted: "text-muted" };
  const Wrapper = onClick ? "button" : "div";
  return (
    <Card className="overflow-hidden">
      <Wrapper type={onClick ? "button" : undefined} onClick={onClick} className="block w-full border-l-4 border-accent p-6 text-left">
        <p className="text-sm font-semibold text-muted">{label}</p>
        <p className="mt-2 text-3xl font-bold text-brand">{value}</p>
        {trend && <p className={`mt-2 text-xs font-semibold ${tones[tone]}`}>{trend}</p>}
      </Wrapper>
    </Card>
  );
}

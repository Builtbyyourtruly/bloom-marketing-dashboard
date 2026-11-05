import type { TooltipProps } from "recharts";

export function CuteTooltip({
  active,
  payload,
  label,
  format,
  labelFormat,
}: TooltipProps<number, string> & { format: (v: number) => string; labelFormat?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tip">
      <b>{labelFormat ? labelFormat(String(label)) : label}</b>
      {payload.map((p) => (
        <span key={String(p.dataKey)}>
          <i style={{ background: p.color }} /> {p.name}: {p.value == null ? "–" : format(Number(p.value))}
        </span>
      ))}
    </div>
  );
}

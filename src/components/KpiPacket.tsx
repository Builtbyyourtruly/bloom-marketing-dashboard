/** A KPI card shaped like a little seed packet. */
export function KpiPacket({
  emoji,
  label,
  value,
  whisper,
  tone = 0,
}: {
  emoji: string;
  label: string;
  value: string;
  whisper: string;
  tone?: number;
}) {
  return (
    <div className={`packet tone-${tone % 4}`}>
      <div className="packet-top" aria-hidden="true" />
      <div className="packet-body">
        <span className="packet-emoji" aria-hidden="true">{emoji}</span>
        <span className="packet-label">{label}</span>
        <b className="packet-value">{value}</b>
        <span className="packet-whisper">{whisper}</span>
      </div>
    </div>
  );
}

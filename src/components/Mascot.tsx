import type { Mood } from "../lib/types";

/** Bloom, the little flower who keeps an eye on your campaigns. */
export function Mascot({ mood = "happy", size = 96, className = "" }: { mood?: Mood; size?: number; className?: string }) {
  const droop = mood === "sad" ? 10 : 0;
  const petals = Array.from({ length: 6 }, (_, i) => i * 60);
  return (
    <svg
      className={`mascot mood-${mood} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Bloom the flower, feeling ${mood === "joy" ? "overjoyed" : mood === "happy" ? "happy" : mood === "meh" ? "so-so" : "a bit droopy"}`}
    >
      <path d="M60 86 C60 98 58 106 56 116" stroke="#7E9A6E" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M58 104 C48 98 40 100 36 106 C44 110 52 109 58 104 Z" fill="#9DB58C" />
      <g className="petals" transform={`translate(60 54) rotate(${droop})`}>
        {petals.map((a) => (
          <ellipse key={a} cx="0" cy="-27" rx="15" ry="21" fill={a % 120 === 0 ? "#F2B8C3" : "#EBA5B3"} transform={`rotate(${a}) translate(0 ${droop / 2})`} />
        ))}
      </g>
      <circle cx="60" cy="54" r="24" fill="#FFF6E6" stroke="#F0D9B5" strokeWidth="2" />
      {mood === "joy" ? (
        <>
          <path d="M48 52 q4 -6 8 0" stroke="#4A433D" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M64 52 q4 -6 8 0" stroke="#4A433D" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="52" cy={mood === "sad" ? 54 : 51} r="3.4" fill="#4A433D" />
          <circle cx="68" cy={mood === "sad" ? 54 : 51} r="3.4" fill="#4A433D" />
          <circle cx="53.2" cy={mood === "sad" ? 52.8 : 49.8} r="1.1" fill="#fff" />
          <circle cx="69.2" cy={mood === "sad" ? 52.8 : 49.8} r="1.1" fill="#fff" />
        </>
      )}
      <ellipse cx="45" cy="60" rx="4.5" ry="2.6" fill="#F4A9B8" opacity={mood === "sad" ? 0.35 : 0.8} />
      <ellipse cx="75" cy="60" rx="4.5" ry="2.6" fill="#F4A9B8" opacity={mood === "sad" ? 0.35 : 0.8} />
      {mood === "joy" && <path d="M51 60 q9 11 18 0 z" fill="#C9677A" stroke="#4A433D" strokeWidth="2.4" strokeLinejoin="round" />}
      {mood === "happy" && <path d="M53 61 q7 7 14 0" stroke="#4A433D" strokeWidth="3" fill="none" strokeLinecap="round" />}
      {mood === "meh" && <path d="M54 63 h12" stroke="#4A433D" strokeWidth="3" strokeLinecap="round" />}
      {mood === "sad" && (
        <>
          <path d="M53 66 q7 -6 14 0" stroke="#4A433D" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M80 40 q4 6 0 9 q-4 -3 0 -9z" fill="#9FC7DB" />
        </>
      )}
      {mood === "joy" && (
        <g fill="#E3B84F">
          <path d="M100 18 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z" />
          <path d="M18 30 l1.8 4.2 4.2 1.8 -4.2 1.8 -1.8 4.2 -1.8 -4.2 -4.2 -1.8 4.2 -1.8z" />
        </g>
      )}
    </svg>
  );
}

export function Speech({ mood, children }: { mood: Mood; children: React.ReactNode }) {
  return (
    <div className="speech">
      <Mascot mood={mood} size={84} />
      <p className="bubble">{children}</p>
    </div>
  );
}

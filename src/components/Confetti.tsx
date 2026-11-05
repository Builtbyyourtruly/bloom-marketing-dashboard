import { useEffect, useState } from "react";

const BITS = ["🌸", "✿", "🌷", "✨", "🍃", "♡"];

/** A tiny one-off shower of petals. Change `burst` to trigger it. Skipped when reduced motion is on. */
export function Confetti({ burst }: { burst: number }) {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; delay: number; ch: string; dur: number }>>([]);
  useEffect(() => {
    if (!burst || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPieces(
      Array.from({ length: 26 }, (_, i) => ({
        id: burst * 100 + i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        dur: 1.6 + Math.random() * 1.2,
        ch: BITS[i % BITS.length],
      })),
    );
    const t = setTimeout(() => setPieces([]), 3200);
    return () => clearTimeout(t);
  }, [burst]);
  if (!pieces.length) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span key={p.id} style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }}>
          {p.ch}
        </span>
      ))}
    </div>
  );
}

import { useState } from "react";
import { fmtMoneyCents, fmtPct } from "../lib/format";
import { metricsOf, moodFor } from "../lib/metrics";
import type { Mood, Row } from "../lib/types";
import { Mascot } from "./Mascot";

function NumIn({ label, value, onChange, prefix }: { label: string; value: string; onChange: (v: string) => void; prefix?: string }) {
  return (
    <label className="calc-in">
      <span>{label}</span>
      <span className="in-wrap">
        {prefix && <em>{prefix}</em>}
        <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0" />
      </span>
    </label>
  );
}
const n = (s: string) => {
  const v = parseFloat(s.replace(/[,$\s]/g, ""));
  return isFinite(v) ? v : 0;
};

function compareLine(value: number | null, avg: number | null, what: string): { mood: Mood; text: string } {
  if (value == null) return { mood: "meh", text: "Pop some numbers in and I’ll work it out!" };
  if (avg == null || avg === 0) return { mood: "happy", text: `Lovely! Load some campaign data and I’ll compare this with your average ${what}.` };
  const ratio = value / avg;
  if (ratio >= 1.25) return { mood: "joy", text: `Ooh! That’s ${ratio.toFixed(1)}× your average ${what}. Show-off. 💅` };
  if (ratio >= 0.95) return { mood: "happy", text: `Right in line with your average ${what} (${fmtPct(avg)}). Steady and sweet.` };
  if (ratio >= 0.6) return { mood: "meh", text: `A little under your average ${what} of ${fmtPct(avg)}. Worth a tweak?` };
  return { mood: "sad", text: `Well below your average ${what} (${fmtPct(avg)}). Let’s give this one some extra love.` };
}

export function Calculators({ rows, onCelebrate }: { rows: Row[]; onCelebrate: () => void }) {
  const avg = rows.length ? metricsOf(rows) : null;
  const [imp, setImp] = useState("12000");
  const [clk, setClk] = useState("240");
  const [clk2, setClk2] = useState("240");
  const [conv, setConv] = useState("12");
  const [spend, setSpend] = useState("500");
  const [rev, setRev] = useState("1350");

  const ctr = n(imp) > 0 ? n(clk) / n(imp) : null;
  const cr = n(clk2) > 0 ? n(conv) / n(clk2) : null;
  const roi = n(spend) > 0 ? (n(rev) - n(spend)) / n(spend) : null;
  const profit = n(rev) - n(spend);

  const ctrSay = compareLine(ctr, avg?.ctr ?? null, "click-through rate");
  const crSay = compareLine(cr, avg?.convRate ?? null, "conversion rate");
  const roiMood = moodFor(roi);
  const roiText =
    roi == null
      ? "Tell me what you spent and earned!"
      : roi >= 1
        ? `Every $1 planted grew into $${(1 + roi).toFixed(2)}. That’s a bumper harvest! 🌻`
        : roi > 0.05
          ? `You made ${fmtMoneyCents(profit)} profit. Things are growing nicely.`
          : roi >= -0.05
            ? "Pretty much breaking even. A little pruning could tip it into profit."
            : `This one cost ${fmtMoneyCents(-profit)} more than it earned. Time for some water and sunshine.`;

  return (
    <div className="calcs">
      <section className="card calc">
        <h2>🎯 Click-through rate</h2>
        <p className="muted small">How often a hello turns into a tap. Clicks ÷ impressions.</p>
        <NumIn label="Clicks" value={clk} onChange={setClk} />
        <NumIn label="Impressions" value={imp} onChange={setImp} />
        <div className="calc-out"><span>CTR</span><b>{fmtPct(ctr)}</b></div>
        <div className="calc-say"><Mascot mood={ctrSay.mood} size={56} /><p>{ctrSay.text}</p></div>
      </section>

      <section className="card calc">
        <h2>🎀 Conversion rate</h2>
        <p className="muted small">How often a tap turns into a yes. Conversions ÷ clicks.</p>
        <NumIn label="Conversions" value={conv} onChange={setConv} />
        <NumIn label="Clicks" value={clk2} onChange={setClk2} />
        <div className="calc-out"><span>Conversion rate</span><b>{fmtPct(cr)}</b></div>
        <div className="calc-say"><Mascot mood={crSay.mood} size={56} /><p>{crSay.text}</p></div>
      </section>

      <section className="card calc">
        <h2>🌻 Return on investment</h2>
        <p className="muted small">What your garden gave back. (Revenue − spend) ÷ spend.</p>
        <NumIn label="Revenue" value={rev} onChange={setRev} prefix="$" />
        <NumIn label="Spend" value={spend} onChange={setSpend} prefix="$" />
        <div className="calc-out">
          <span>ROI</span>
          <b className={roi != null && roi < 0 ? "bad" : ""}>{fmtPct(roi, 1)}</b>
        </div>
        <div className="calc-extra">
          <span>Profit <b>{fmtMoneyCents(profit)}</b></span>
          <span>ROAS <b>{n(spend) > 0 ? (n(rev) / n(spend)).toFixed(2) + "×" : "–"}</b></span>
        </div>
        <div className="calc-say"><Mascot mood={roiMood} size={56} /><p>{roiText}</p></div>
        {roi != null && roi >= 1 && (
          <button type="button" className="btn soft sm" onClick={onCelebrate}>Celebrate 🎉</button>
        )}
      </section>
    </div>
  );
}

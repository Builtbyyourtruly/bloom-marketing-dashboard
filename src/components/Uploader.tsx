import { useRef, useState } from "react";
import { FIELD_LABELS, parseCampaignCsv } from "../lib/csv";
import { saveFile } from "../lib/files";
import type { Row } from "../lib/types";

export const TEMPLATE =
  "Campaign,Channel,Date,Impressions,Reach,Clicks,Engagement,Conversions,Spend,Revenue\n" +
  "Spring Bloom Sale,Instagram,01/09/2026,9200,5400,130,310,6,82.80,510\n" +
  "Newsletter Nest,Email,01/09/2026,2600,2550,160,52,11,7.80,770\n";

export function Uploader({
  onRows,
  onSample,
  compact = false,
}: {
  onRows: (rows: Row[], replace: boolean) => void;
  onSample: () => void;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; detail?: string } | null>(null);
  const [replace, setReplace] = useState(false);

  async function readFiles(files: FileList | null) {
    if (!files?.length) return;
    let all: Row[] = [];
    const notes: string[] = [];
    for (const f of Array.from(files)) {
      const res = parseCampaignCsv(await f.text(), f.name);
      if (res.error) {
        setMsg({ ok: false, text: `${f.name}: ${res.error}` });
        return;
      }
      all = all.concat(res.rows);
      const found = Object.entries(res.matched).map(([k, v]) => `${FIELD_LABELS[k as keyof typeof FIELD_LABELS]} ← “${v}”`);
      notes.push(`${f.name}: ${found.join(", ")}${res.skipped ? `. Skipped ${res.skipped} empty or total rows` : ""}.`);
    }
    onRows(all, replace);
    setMsg({ ok: true, text: `Planted ${all.length.toLocaleString("en-AU")} rows! 🌱`, detail: notes.join(" ") });
    if (input.current) input.current.value = "";
  }

  return (
    <div className={compact ? "uploader compact" : "uploader"}>
      <label
        className={`dropzone ${drag ? "drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); readFiles(e.dataTransfer.files); }}
      >
        <input ref={input} type="file" accept=".csv,text/csv" multiple className="sr-only" onChange={(e) => readFiles(e.target.files)} />
        <span className="drop-icon" aria-hidden="true">🧺</span>
        <span className="drop-title">Drop your campaign CSVs here</span>
        <span className="drop-sub">or click to choose files. Exports from Meta, Google Ads, TikTok and email tools all work.</span>
      </label>
      <div className="uploader-row">
        <label className="check">
          <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} /> Replace existing data
        </label>
        <span className="spacer" />
        <button type="button" className="btn ghost" onClick={() => saveFile("bloom-template.csv", new Blob([TEMPLATE], { type: "text/csv" }))}>
          Download template
        </button>
        <button type="button" className="btn soft" onClick={onSample}>
          🌱 Plant sample seeds
        </button>
      </div>
      {msg && (
        <div className={`toast ${msg.ok ? "ok" : "bad"}`} role="status">
          <b>{msg.text}</b>
          {msg.detail && <span>{msg.detail}</span>}
        </div>
      )}
    </div>
  );
}

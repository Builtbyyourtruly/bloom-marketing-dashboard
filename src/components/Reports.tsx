import { useMemo, useState } from "react";
import { rowsToCsv } from "../lib/csv";
import { saveFile } from "../lib/files";
import { buildReportHtml, buildSummaryCsv, type ReportOptions } from "../lib/report";
import type { Row } from "../lib/types";

export function Reports({ rows, filtered }: { rows: Row[]; filtered: boolean }) {
  const [o, setO] = useState<ReportOptions>({ title: "Campaign Performance Report", kpis: true, notes: true, chart: true, campaigns: true, channels: true });
  const html = useMemo(() => buildReportHtml(rows, o), [rows, o]);
  const slug = o.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "bloom-report";
  const toggle = (k: keyof Omit<ReportOptions, "title">) => setO({ ...o, [k]: !o[k] });
  const parts: Array<[keyof Omit<ReportOptions, "title">, string]> = [
    ["kpis", "The big numbers"],
    ["notes", "Garden notes"],
    ["chart", "Spend vs revenue chart"],
    ["campaigns", "Campaign table"],
    ["channels", "Channel table"],
  ];

  return (
    <div className="reports">
      <section className="card report-side">
        <h2>Bundle up a report 🎁</h2>
        {filtered && <p className="note">Your filters are on, so the report covers only the filtered data.</p>}
        <label className="calc-in">
          <span>Report title</span>
          <input value={o.title} onChange={(e) => setO({ ...o, title: e.target.value })} />
        </label>
        <fieldset className="fieldset">
          <legend>Include</legend>
          {parts.map(([k, label]) => (
            <label key={k} className="check">
              <input type="checkbox" checked={o[k]} onChange={() => toggle(k)} /> {label}
            </label>
          ))}
        </fieldset>
        <div className="btn-stack">
          <button type="button" className="btn primary" onClick={() => saveFile(`${slug}.html`, new Blob([html], { type: "text/html" }))}>
            Download report (HTML)
          </button>
          <button type="button" className="btn soft" onClick={() => saveFile(`${slug}-summary.csv`, new Blob([buildSummaryCsv(rows)], { type: "text/csv" }))}>
            Download summary (CSV)
          </button>
          <button type="button" className="btn ghost" onClick={() => saveFile("bloom-cleaned-data.csv", new Blob([rowsToCsv(rows)], { type: "text/csv" }))}>
            Download cleaned data (CSV)
          </button>
        </div>
        <p className="muted small">Tip: open the HTML report in your browser and print it to save a PDF.</p>
      </section>
      <section className="card report-preview">
        <h2 className="sr-only">Report preview</h2>
        <iframe title="Report preview" srcDoc={html} />
      </section>
    </div>
  );
}

import { fmtFull, fmtMoney, fmtMoneyCents, fmtPct } from "./format";
import { gardenNotes, moodLine } from "./insights";
import { dateRange, groupBy, metricsOf } from "./metrics";
import { colorFor } from "./palette";
import type { Row } from "./types";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export interface ReportOptions {
  title: string;
  kpis: boolean;
  notes: boolean;
  campaigns: boolean;
  channels: boolean;
  chart: boolean;
}

function spendRevenueSvg(rows: Row[]) {
  const camps = groupBy(rows, "campaign").sort((a, b) => b.m.spend - a.m.spend).slice(0, 10);
  const max = Math.max(1, ...camps.map((c) => Math.max(c.m.spend, c.m.revenue)));
  const rowH = 46, labelW = 190, barW = 420, h = camps.length * rowH + 30;
  const bars = camps
    .map((c, i) => {
      const y = i * rowH + 10;
      const s = (c.m.spend / max) * barW, r = (c.m.revenue / max) * barW;
      return `<text x="0" y="${y + 20}" font-size="13" fill="#4A433D">${esc(c.name.length > 24 ? c.name.slice(0, 23) + "…" : c.name)}</text>
      <rect x="${labelW}" y="${y + 4}" width="${Math.max(2, s)}" height="14" rx="7" fill="#D98FA0"/>
      <rect x="${labelW}" y="${y + 21}" width="${Math.max(2, r)}" height="14" rx="7" fill="#7E9A6E"/>
      <text x="${labelW + Math.max(s, r) + 8}" y="${y + 24}" font-size="12" fill="#756F68">${fmtMoney(c.m.spend)} → ${fmtMoney(c.m.revenue)}</text>`;
    })
    .join("");
  return `<svg viewBox="0 0 760 ${h}" width="100%" role="img" aria-label="Spend and revenue by campaign">${bars}
    <rect x="${labelW}" y="${h - 14}" width="12" height="10" rx="5" fill="#D98FA0"/><text x="${labelW + 18}" y="${h - 5}" font-size="12" fill="#756F68">Spend</text>
    <rect x="${labelW + 80}" y="${h - 14}" width="12" height="10" rx="5" fill="#7E9A6E"/><text x="${labelW + 98}" y="${h - 5}" font-size="12" fill="#756F68">Revenue</text></svg>`;
}

export function buildReportHtml(rows: Row[], o: ReportOptions) {
  const m = metricsOf(rows);
  const range = dateRange(rows);
  const when = range ? `${range.min} to ${range.max}` : "All data";
  const kpi = (label: string, value: string) => `<div class="kpi"><span>${label}</span><b>${value}</b></div>`;
  const camps = groupBy(rows, "campaign").sort((a, b) => b.m.spend - a.m.spend);
  const chans = groupBy(rows, "channel").sort((a, b) => b.m.spend - a.m.spend);
  const table = (groups: typeof camps, label: string) => `<table><thead><tr><th>${label}</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>Conv. rate</th><th>Spend</th><th>Revenue</th><th>ROI</th></tr></thead><tbody>
    ${groups.map((g, i) => `<tr><td><i style="background:${colorFor(i)}"></i>${esc(g.name)}</td><td>${fmtFull(g.m.impressions)}</td><td>${fmtFull(g.m.clicks)}</td><td>${fmtPct(g.m.ctr)}</td><td>${fmtPct(g.m.convRate)}</td><td>${fmtMoneyCents(g.m.spend)}</td><td>${fmtMoneyCents(g.m.revenue)}</td><td>${fmtPct(g.m.roi, 0)}</td></tr>`).join("")}
    </tbody></table>`;
  const notes = gardenNotes(rows);
  return `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(o.title)}</title>
<style>
body{font:15px/1.6 Nunito,system-ui,-apple-system,"Segoe UI",sans-serif;color:#4A433D;background:#F8F5EE;margin:0;padding:40px 20px}
main{max-width:920px;margin:0 auto;background:#fff;border-radius:28px;padding:40px;box-shadow:0 2px 0 #EADFD3}
h1{font-family:Fredoka,Nunito,system-ui,sans-serif;font-size:32px;margin:0 0 4px;color:#4A433D}h2{font-family:Fredoka,Nunito,system-ui,sans-serif;font-size:20px;margin:32px 0 12px}
.sub{color:#756F68;margin:0 0 24px}.mood{background:#FBEFF1;border-radius:18px;padding:14px 18px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.kpi{background:#F1F5EC;border-radius:16px;padding:12px 14px}.kpi span{display:block;font-size:12px;color:#756F68}.kpi b{font-family:Fredoka,Nunito,sans-serif;font-size:22px}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:8px 6px;border-bottom:1px dashed #E3D9CF}th{color:#756F68;font-weight:600}td i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px}
ul{padding-left:4px;list-style:none}li{margin-bottom:6px}.foot{text-align:center;color:#A39A92;font-size:12px;margin-top:32px}
@media(max-width:640px){.kpis{grid-template-columns:repeat(2,1fr)}main{padding:24px}}
</style></head><body><main>
<h1>🌸 ${esc(o.title)}</h1><p class="sub">${esc(when)} · ${rows.length} rows · ${camps.length} campaigns</p>
<p class="mood">${esc(moodLine(m).line)}</p>
${o.kpis ? `<h2>The big numbers</h2><div class="kpis">${kpi("Impressions", fmtFull(m.impressions))}${kpi("Reach", fmtFull(m.reach))}${kpi("Clicks", fmtFull(m.clicks))}${kpi("Engagement", fmtFull(m.engagements))}${kpi("CTR", fmtPct(m.ctr))}${kpi("Conversion rate", fmtPct(m.convRate))}${kpi("Spend", fmtMoney(m.spend))}${kpi("ROI", fmtPct(m.roi, 0))}</div>` : ""}
${o.notes && notes.length ? `<h2>Garden notes</h2><ul>${notes.map((n) => `<li>${n.emoji} ${esc(n.text)}</li>`).join("")}</ul>` : ""}
${o.chart ? `<h2>Spend vs revenue</h2>${spendRevenueSvg(rows)}` : ""}
${o.campaigns ? `<h2>Campaigns</h2>${table(camps, "Campaign")}` : ""}
${o.channels ? `<h2>Channels</h2>${table(chans, "Channel")}` : ""}
<p class="foot">Grown with Bloom ✿ ${new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</p>
</main></body></html>`;
}

export function buildSummaryCsv(rows: Row[]) {
  const head = "Campaign,Channels,Impressions,Reach,Clicks,Engagement,Conversions,Spend,Revenue,CTR,Conversion rate,ROI,CPC,CPA";
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const n = (x: number | null, dp = 4) => (x == null ? "" : x.toFixed(dp));
  const lines = groupBy(rows, "campaign").map((g) =>
    [q(g.name), q(g.channels.join(" / ")), g.m.impressions, g.m.reach, g.m.clicks, g.m.engagements, g.m.conversions, g.m.spend.toFixed(2), g.m.revenue.toFixed(2), n(g.m.ctr), n(g.m.convRate), n(g.m.roi), n(g.m.cpc, 2), n(g.m.cpa, 2)].join(","),
  );
  return [head, ...lines].join("\n");
}

import { useRef, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDate, fmtMoney } from "../lib/format";
import { saveFile, svgToPng } from "../lib/files";
import { gardenNotes, moodLine } from "../lib/insights";
import { METRICS, metricDef } from "../lib/metricDefs";
import { groupBy, metricsOf, timeBuckets } from "../lib/metrics";
import { AXIS, GRID, colorFor } from "../lib/palette";
import type { Metrics, Row } from "../lib/types";
import { CuteTooltip } from "./ChartTooltip";
import { KpiPacket } from "./KpiPacket";
import { Speech } from "./Mascot";

const TREND_KEYS: Array<keyof Metrics> = ["impressions", "reach", "clicks", "engagements", "conversions", "ctr", "convRate", "spend", "revenue"];
const KPI_KEYS: Array<keyof Metrics> = ["impressions", "reach", "clicks", "engagements", "ctr", "convRate", "roi", "revenue"];

export function Overview({ rows }: { rows: Row[] }) {
  const m = metricsOf(rows);
  const { mood, line } = moodLine(m);
  const notes = gardenNotes(rows);
  const [trendKey, setTrendKey] = useState<keyof Metrics>("clicks");
  const [chanKey, setChanKey] = useState<keyof Metrics>("clicks");
  const trendRef = useRef<HTMLDivElement>(null);
  const { weekly, points } = timeBuckets(rows);
  const chans = groupBy(rows, "channel").sort((a, b) => (Number(b.m[chanKey]) || 0) - (Number(a.m[chanKey]) || 0));
  const spendShare = chans.filter((c) => c.m.spend > 0);
  const td = metricDef(trendKey);
  const cd = metricDef(chanKey);

  return (
    <div className="stack">
      <Speech mood={mood}>{line}</Speech>

      <div className="packets">
        {KPI_KEYS.map((k, i) => {
          const d = metricDef(k);
          return <KpiPacket key={k} emoji={d.emoji} label={d.label} value={d.fmt(m[k] as number | null)} whisper={d.whisper} tone={i} />;
        })}
      </div>

      <section className="card">
        <div className="card-head">
          <h2>{weekly ? "Week by week" : "Day by day"} 🌤️</h2>
          <div className="row">
            <label className="sr-only" htmlFor="trendKey">Metric</label>
            <select id="trendKey" value={trendKey} onChange={(e) => setTrendKey(e.target.value as keyof Metrics)}>
              {TREND_KEYS.map((k) => <option key={k} value={k}>{metricDef(k).label}</option>)}
            </select>
            <button
              type="button"
              className="btn ghost sm"
              onClick={async () => {
                const png = await svgToPng(trendRef.current, "#FFFDF8");
                if (png) saveFile(`bloom-${td.label.toLowerCase().replace(/\s+/g, "-")}-trend.png`, png);
              }}
            >
              Save chart as PNG
            </button>
          </div>
        </div>
        {points.length ? (
          <div ref={trendRef} className="chart">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={points} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D98FA0" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#D98FA0" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tickFormatter={(v) => td.fmt(v)} tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} width={64} />
                <Tooltip content={<CuteTooltip format={(v) => td.fmt(v)} labelFormat={(l) => (weekly ? "Week of " : "") + fmtDate(l)} />} />
                <Area type="monotone" dataKey={trendKey} name={td.label} stroke="#C77089" strokeWidth={3} fill="url(#trendFill)" dot={false} activeDot={{ r: 6, fill: "#C77089", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="muted">Add a Date column to see how things grow over time.</p>
        )}
      </section>

      <div className="two">
        <section className="card">
          <div className="card-head">
            <h2>Channel patch 🪴</h2>
            <select value={chanKey} onChange={(e) => setChanKey(e.target.value as keyof Metrics)} aria-label="Channel metric">
              {METRICS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height={Math.max(180, chans.length * 44)}>
              <BarChart data={chans.map((c) => ({ name: c.name, value: c.m[chanKey] }))} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 6" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => cd.fmt(v)} tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={96} tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(217,143,160,0.12)" }} content={<CuteTooltip format={(v) => cd.fmt(v)} />} />
                <Bar dataKey="value" name={cd.label} radius={[0, 12, 12, 0]} barSize={22}>
                  {chans.map((_, i) => <Cell key={i} fill={colorFor(i)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Where the seeds went 🌱</h2></div>
          {spendShare.length ? (
            <div className="donut-wrap">
              <div className="chart donut">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={spendShare.map((c) => ({ name: c.name, value: c.m.spend }))} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3} cornerRadius={8} stroke="none">
                      {spendShare.map((_, i) => <Cell key={i} fill={colorFor(i)} />)}
                    </Pie>
                    <Tooltip content={<CuteTooltip format={fmtMoney} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-mid"><b>{fmtMoney(m.spend)}</b><span>spent</span></div>
              </div>
              <ul className="legend">
                {spendShare.map((c, i) => (
                  <li key={c.name}><i style={{ background: colorFor(i) }} />{c.name}<span>{Math.round((c.m.spend / m.spend) * 100)}%</span></li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="muted">Add a Spend column to see how your budget is split.</p>
          )}
        </section>
      </div>

      {notes.length > 0 && (
        <section className="card notes">
          <h2>Garden notes 📝</h2>
          <ul>{notes.map((n) => <li key={n.text}><span aria-hidden="true">{n.emoji}</span>{n.text}</li>)}</ul>
        </section>
      )}
    </div>
  );
}

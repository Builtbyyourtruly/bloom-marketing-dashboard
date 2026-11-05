import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDate } from "../lib/format";
import { METRICS, metricDef } from "../lib/metricDefs";
import { groupBy, seriesByCampaign } from "../lib/metrics";
import { AXIS, GRID, colorFor } from "../lib/palette";
import type { Metrics, Row } from "../lib/types";
import { CuteTooltip } from "./ChartTooltip";

const COLS: Array<keyof Metrics> = ["impressions", "reach", "clicks", "engagements", "ctr", "convRate", "spend", "revenue", "roi"];
const VIBES: Array<{ key: keyof Metrics; label: string }> = [
  { key: "reach", label: "Reach" },
  { key: "ctr", label: "CTR" },
  { key: "engRate", label: "Engagement" },
  { key: "convRate", label: "Conversion" },
  { key: "roas", label: "Return" },
];
const MAX_PICK = 4;

export function Compare({ rows }: { rows: Row[] }) {
  const camps = useMemo(() => groupBy(rows, "campaign"), [rows]);
  const [sort, setSort] = useState<{ key: keyof Metrics | "name"; dir: 1 | -1 }>({ key: "spend", dir: -1 });
  const [picked, setPicked] = useState<string[]>(() => [...camps].sort((a, b) => b.m.spend - a.m.spend).slice(0, 3).map((c) => c.name));
  const [barKey, setBarKey] = useState<keyof Metrics>("roi");
  const [lineKey, setLineKey] = useState<keyof Metrics>("clicks");

  const live = picked.filter((p) => camps.some((c) => c.name === p));
  const sorted = [...camps].sort((a, b) => {
    if (sort.key === "name") return a.name.localeCompare(b.name) * sort.dir;
    return ((Number(a.m[sort.key]) || 0) - (Number(b.m[sort.key]) || 0)) * sort.dir;
  });
  const chosen = camps.filter((c) => live.includes(c.name));
  const colorOf = (name: string) => colorFor(Math.max(0, live.indexOf(name)));
  const bd = metricDef(barKey);
  const ld = metricDef(lineKey);
  const series = seriesByCampaign(rows, live, lineKey);

  const vibe = VIBES.map((v) => {
    const max = Math.max(...chosen.map((c) => Number(c.m[v.key]) || 0), 0);
    const p: Record<string, string | number> = { axis: v.label };
    for (const c of chosen) p[c.name] = max > 0 ? Math.round(((Number(c.m[v.key]) || 0) / max) * 100) : 0;
    return p;
  });

  const togglePick = (name: string) =>
    setPicked((cur) => (cur.includes(name) ? cur.filter((x) => x !== name) : cur.length >= MAX_PICK ? cur : [...cur, name]));
  const sortBy = (key: keyof Metrics | "name") => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }));
  const arrow = (key: keyof Metrics | "name") => (sort.key === key ? (sort.dir === 1 ? " ↑" : " ↓") : "");

  return (
    <div className="stack">
      <section className="card">
        <div className="card-head">
          <h2>All your campaigns 🌼</h2>
          <span className="muted small">Tick up to {MAX_PICK} to compare them below.</span>
        </div>
        <div className="table-scroll">
          <table className="cute-table">
            <thead>
              <tr>
                <th><span className="sr-only">Compare</span></th>
                <th><button type="button" onClick={() => sortBy("name")}>Campaign{arrow("name")}</button></th>
                {COLS.map((k) => (
                  <th key={k} className="num"><button type="button" onClick={() => sortBy(k)}>{metricDef(k).label}{arrow(k)}</button></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const on = live.includes(c.name);
                return (
                  <tr key={c.name} className={on ? "picked" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={!on && live.length >= MAX_PICK}
                        onChange={() => togglePick(c.name)}
                        aria-label={`Compare ${c.name}`}
                        style={{ accentColor: on ? colorOf(c.name) : undefined }}
                      />
                    </td>
                    <td>
                      <span className="camp-name">{on && <i style={{ background: colorOf(c.name) }} />}{c.name}</span>
                      <span className="muted small">{c.channels.join(", ")}</span>
                    </td>
                    {COLS.map((k) => (
                      <td key={k} className={`num ${k === "roi" ? (Number(c.m.roi) >= 0 ? "good" : "bad") : ""}`}>{metricDef(k).fmt(c.m[k] as number | null)}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {chosen.length < 2 ? (
        <section className="card empty-mini">
          <span aria-hidden="true">🌷🌷</span>
          <p>Pick at least two campaigns in the table to compare them side by side.</p>
        </section>
      ) : (
        <>
          <div className="two">
            <section className="card">
              <div className="card-head">
                <h2>Head to head 🥊</h2>
                <select value={barKey} onChange={(e) => setBarKey(e.target.value as keyof Metrics)} aria-label="Comparison metric">
                  {METRICS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                </select>
              </div>
              <div className="chart">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chosen.map((c) => ({ name: c.name, value: c.m[barKey] }))} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} tickFormatter={(v: string) => (v.length > 14 ? v.slice(0, 13) + "…" : v)} />
                    <YAxis tickFormatter={(v) => bd.fmt(v)} tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} width={64} />
                    <Tooltip cursor={{ fill: "rgba(217,143,160,0.12)" }} content={<CuteTooltip format={(v) => bd.fmt(v)} />} />
                    <Bar dataKey="value" name={bd.label} radius={[12, 12, 4, 4]} maxBarSize={64}>
                      {chosen.map((c) => <Cell key={c.name} fill={colorOf(c.name)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="card">
              <div className="card-head"><h2>Vibe check ✨</h2></div>
              <p className="muted small">Each campaign scored against the best of the group (100 = the best).</p>
              <div className="chart">
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={vibe} outerRadius="72%">
                    <PolarGrid stroke={GRID} />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: AXIS, fontSize: 12 }} />
                    {chosen.map((c) => (
                      <Radar key={c.name} name={c.name} dataKey={c.name} stroke={colorOf(c.name)} fill={colorOf(c.name)} fillOpacity={0.18} strokeWidth={2.5} />
                    ))}
                    <Tooltip content={<CuteTooltip format={(v) => `${v} / 100`} />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
          {series.points.length > 0 && (
            <section className="card">
              <div className="card-head">
                <h2>Growing side by side 🌿</h2>
                <select value={lineKey} onChange={(e) => setLineKey(e.target.value as keyof Metrics)} aria-label="Trend metric">
                  {METRICS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                </select>
              </div>
              <div className="chart">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={series.points} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis tickFormatter={(v) => ld.fmt(v)} tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} width={64} />
                    <Tooltip content={<CuteTooltip format={(v) => ld.fmt(v)} labelFormat={(l) => (series.weekly ? "Week of " : "") + fmtDate(l)} />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                    {chosen.map((c) => (
                      <Line key={c.name} type="monotone" dataKey={c.name} name={c.name} stroke={colorOf(c.name)} strokeWidth={2.5} dot={false} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

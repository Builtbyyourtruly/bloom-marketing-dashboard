import type { Filters, Metrics, Mood, NumField, Row, Totals } from "./types";

export const NUM_FIELDS: NumField[] = ["impressions", "reach", "clicks", "engagements", "conversions", "spend", "revenue"];

const div = (a: number, b: number) => (b > 0 ? a / b : null);

export function totals(rows: Row[]): Totals {
  const t = { impressions: 0, reach: 0, clicks: 0, engagements: 0, conversions: 0, spend: 0, revenue: 0 };
  for (const r of rows) for (const f of NUM_FIELDS) t[f] += r[f];
  return t;
}

export function derive(t: Totals): Metrics {
  return {
    ...t,
    ctr: div(t.clicks, t.impressions),
    convRate: div(t.conversions, t.clicks),
    roi: t.spend > 0 && t.revenue > 0 ? (t.revenue - t.spend) / t.spend : t.spend > 0 ? -1 : null,
    roas: div(t.revenue, t.spend),
    cpc: div(t.spend, t.clicks),
    cpa: div(t.spend, t.conversions),
    engRate: div(t.engagements, t.reach > 0 ? t.reach : t.impressions),
  };
}

export const metricsOf = (rows: Row[]) => derive(totals(rows));

export function groupBy(rows: Row[], key: "campaign" | "channel") {
  const m = new Map<string, Row[]>();
  for (const r of rows) {
    const k = r[key] || "Unnamed";
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(r);
  }
  return [...m.entries()].map(([name, rs]) => ({
    name,
    rows: rs,
    channels: [...new Set(rs.map((r) => r.channel))],
    m: metricsOf(rs),
  }));
}

export function applyFilters(rows: Row[], f: Filters) {
  return rows.filter(
    (r) =>
      (!f.channels.length || f.channels.includes(r.channel)) &&
      (!f.campaigns.length || f.campaigns.includes(r.campaign)) &&
      (!f.from || !r.date || r.date >= f.from) &&
      (!f.to || !r.date || r.date <= f.to),
  );
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Buckets rows by day, or by week (starting Monday) when the range is longer than ~2 months. */
export function timeBuckets(rows: Row[]) {
  const dated = rows.filter((r) => r.date);
  if (!dated.length)
    return {
      weekly: false,
      points: [] as Array<Record<string, number | string | null>>,
      keyOf: (x: string) => x,
      buckets: new Map<string, Row[]>(),
    };
  const dates = dated.map((r) => r.date!).sort();
  const span = (parseIso(dates[dates.length - 1]).getTime() - parseIso(dates[0]).getTime()) / 864e5;
  const weekly = span > 62;
  const keyOf = (s: string) => {
    if (!weekly) return s;
    const d = parseIso(s);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return iso(d);
  };
  const buckets = new Map<string, Row[]>();
  for (const r of dated) {
    const k = keyOf(r.date!);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(r);
  }
  const points = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rs]) => {
      const m = metricsOf(rs);
      return { date, ...m } as Record<string, number | string | null>;
    });
  return { weekly, points, keyOf, buckets };
}

/** One point per time bucket with a value for each named campaign, for multi-line charts. */
export function seriesByCampaign(rows: Row[], names: string[], metric: keyof Metrics) {
  const { weekly, keyOf } = timeBuckets(rows);
  const map = new Map<string, Map<string, Row[]>>();
  for (const r of rows) {
    if (!r.date || !names.includes(r.campaign)) continue;
    const k = keyOf(r.date);
    if (!map.has(k)) map.set(k, new Map());
    const inner = map.get(k)!;
    if (!inner.has(r.campaign)) inner.set(r.campaign, []);
    inner.get(r.campaign)!.push(r);
  }
  const points = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, inner]) => {
      const p: Record<string, number | string | null> = { date };
      for (const n of names) {
        const rs = inner.get(n);
        p[n] = rs ? (metricsOf(rs)[metric] as number | null) : null;
      }
      return p;
    });
  return { weekly, points };
}

export function moodFor(roi: number | null): Mood {
  if (roi == null) return "happy";
  if (roi >= 1) return "joy";
  if (roi > 0.05) return "happy";
  if (roi >= -0.05) return "meh";
  return "sad";
}

export function dateRange(rows: Row[]) {
  const d = rows.map((r) => r.date).filter(Boolean).sort() as string[];
  return d.length ? { min: d[0], max: d[d.length - 1] } : null;
}

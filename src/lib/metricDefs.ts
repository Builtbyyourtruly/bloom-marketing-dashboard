import { fmtMoney, fmtNum, fmtPct } from "./format";
import type { Metrics } from "./types";

export interface MetricDef {
  key: keyof Metrics;
  label: string;
  emoji: string;
  whisper: string;
  fmt: (n: number | null) => string;
  /** true when higher is better */
  up: boolean;
}

export const METRICS: MetricDef[] = [
  { key: "impressions", label: "Impressions", emoji: "👀", whisper: "times you said hello", fmt: fmtNum, up: true },
  { key: "reach", label: "Reach", emoji: "🫶", whisper: "unique people who saw you", fmt: fmtNum, up: true },
  { key: "clicks", label: "Clicks", emoji: "👆", whisper: "curious little taps", fmt: fmtNum, up: true },
  { key: "engagements", label: "Engagement", emoji: "💌", whisper: "likes, comments & shares", fmt: fmtNum, up: true },
  { key: "ctr", label: "Click-through rate", emoji: "🎯", whisper: "hellos that became taps", fmt: (n) => fmtPct(n), up: true },
  { key: "convRate", label: "Conversion rate", emoji: "🎀", whisper: "taps that became yeses", fmt: (n) => fmtPct(n), up: true },
  { key: "roi", label: "ROI", emoji: "🌻", whisper: "what your garden gave back", fmt: (n) => fmtPct(n, 0), up: true },
  { key: "conversions", label: "Conversions", emoji: "🛍️", whisper: "sales, sign-ups & leads", fmt: fmtNum, up: true },
  { key: "spend", label: "Spend", emoji: "🌱", whisper: "seeds you planted", fmt: fmtMoney, up: false },
  { key: "revenue", label: "Revenue", emoji: "🧺", whisper: "your harvest", fmt: fmtMoney, up: true },
  { key: "engRate", label: "Engagement rate", emoji: "💞", whisper: "engagement ÷ reach", fmt: (n) => fmtPct(n), up: true },
  { key: "cpc", label: "Cost per click", emoji: "🪙", whisper: "price of each tap", fmt: (n) => (n == null ? "–" : "$" + n.toFixed(2)), up: false },
  { key: "cpa", label: "Cost per conversion", emoji: "🏷️", whisper: "price of each yes", fmt: fmtMoney, up: false },
];

export const metricDef = (k: keyof Metrics) => METRICS.find((m) => m.key === k)!;

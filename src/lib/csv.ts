import Papa from "papaparse";
import type { NumField, Row } from "./types";

type Field = "campaign" | "channel" | "date" | NumField;

/** Header names we recognise for each field, most specific first. Matched case-insensitively. */
const SYNONYMS: Record<Field, string[]> = {
  campaign: ["campaign name", "campaign", "ad set name", "ad name", "name"],
  channel: ["channel", "platform", "network", "source", "medium"],
  date: ["date", "day", "reporting starts", "start date", "week", "month"],
  impressions: ["impressions", "impr.", "impr", "views"],
  reach: ["reach", "unique reach", "people reached"],
  clicks: ["link clicks", "clicks", "all clicks", "taps"],
  engagements: ["post engagement", "engagements", "engagement", "interactions", "reactions"],
  conversions: ["conversions", "results", "purchases", "leads", "sign ups", "signups"],
  spend: ["amount spent (aud)", "amount spent", "spend", "cost", "budget spent"],
  revenue: ["revenue", "conversion value", "purchase value", "sales", "income"],
};

export const FIELD_LABELS: Record<Field, string> = {
  campaign: "Campaign",
  channel: "Channel",
  date: "Date",
  impressions: "Impressions",
  reach: "Reach",
  clicks: "Clicks",
  engagements: "Engagement",
  conversions: "Conversions",
  spend: "Spend",
  revenue: "Revenue",
};

export function detectColumns(headers: string[]) {
  const h = headers.map((x) => x.trim().toLowerCase());
  const map: Partial<Record<Field, string>> = {};
  const used = new Set<number>();
  // exact matches first, then "contains" matches
  for (const pass of ["exact", "contains"] as const) {
    for (const field of Object.keys(SYNONYMS) as Field[]) {
      if (map[field]) continue;
      for (const syn of SYNONYMS[field]) {
        const i = h.findIndex((x, j) => !used.has(j) && (pass === "exact" ? x === syn : x.includes(syn)));
        if (i >= 0) {
          map[field] = headers[i];
          used.add(i);
          break;
        }
      }
    }
  }
  return map;
}

export function toNumber(v: unknown): number {
  if (v == null) return 0;
  let s = String(v).trim().toLowerCase().replace(/[$,\s]|aud/g, "");
  let mult = 1;
  if (s.endsWith("k")) { mult = 1e3; s = s.slice(0, -1); }
  else if (s.endsWith("m")) { mult = 1e6; s = s.slice(0, -1); }
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ""));
  return isFinite(n) ? n * mult : 0;
}

/** Reads dd/mm/yyyy as an Australian date; also accepts ISO and anything Date can parse. */
export function toIsoDate(v: unknown): string | null {
  if (v == null || String(v).trim() === "") return null;
  const s = String(v).trim();
  const pad = (n: number) => String(n).padStart(2, "0");
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) {
    let y = +m[3];
    if (y < 100) y += 2000;
    return `${y}-${pad(+m[2])}-${pad(+m[1])}`;
  }
  const t = new Date(s);
  return isNaN(t.getTime()) ? null : `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

export interface ParseResult {
  rows: Row[];
  matched: Partial<Record<Field, string>>;
  missing: Field[];
  skipped: number;
  error?: string;
}

export function parseCampaignCsv(text: string, fileName = "Upload"): ParseResult {
  const res = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  const headers = res.meta.fields ?? [];
  const matched = detectColumns(headers);
  const missing = (["impressions", "clicks", "spend"] as Field[]).filter((f) => !matched[f]);
  if (!headers.length || !res.data.length)
    return { rows: [], matched, missing, skipped: 0, error: "That file looks empty. Check it has a header row and at least one row of data." };
  if (!matched.impressions && !matched.clicks && !matched.spend)
    return {
      rows: [],
      matched,
      missing,
      skipped: 0,
      error: "Couldn’t find impressions, clicks or spend columns. Check the header row, or start from the template in the README.",
    };

  const fallbackName = fileName.replace(/\.[^.]+$/, "");
  const get = (r: Record<string, string>, f: Field) => (matched[f] ? r[matched[f]!] : undefined);
  let skipped = 0;
  const rows: Row[] = [];
  for (const r of res.data) {
    const campaign = String(get(r, "campaign") ?? "").trim() || fallbackName;
    if (/^(total|totals|grand total)$/i.test(campaign)) { skipped++; continue; }
    const row: Row = {
      campaign,
      channel: String(get(r, "channel") ?? "").trim() || "Other",
      date: toIsoDate(get(r, "date")),
      impressions: toNumber(get(r, "impressions")),
      reach: toNumber(get(r, "reach")),
      clicks: toNumber(get(r, "clicks")),
      engagements: toNumber(get(r, "engagements")),
      conversions: toNumber(get(r, "conversions")),
      spend: toNumber(get(r, "spend")),
      revenue: toNumber(get(r, "revenue")),
    };
    if (!row.impressions && !row.clicks && !row.spend && !row.reach) { skipped++; continue; }
    rows.push(row);
  }
  return { rows, matched, missing, skipped };
}

export function rowsToCsv(rows: Row[]) {
  return Papa.unparse(
    rows.map((r) => ({
      Campaign: r.campaign,
      Channel: r.channel,
      Date: r.date ?? "",
      Impressions: r.impressions,
      Reach: r.reach,
      Clicks: r.clicks,
      Engagement: r.engagements,
      Conversions: r.conversions,
      Spend: r.spend,
      Revenue: r.revenue,
    })),
  );
}

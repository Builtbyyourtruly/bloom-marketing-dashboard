export interface Row {
  campaign: string;
  channel: string;
  /** ISO date (yyyy-mm-dd) or null when the file has no dates */
  date: string | null;
  impressions: number;
  reach: number;
  clicks: number;
  engagements: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export type NumField =
  | "impressions"
  | "reach"
  | "clicks"
  | "engagements"
  | "conversions"
  | "spend"
  | "revenue";

export type Totals = Record<NumField, number>;

export interface Metrics extends Totals {
  ctr: number | null;
  convRate: number | null;
  roi: number | null;
  roas: number | null;
  cpc: number | null;
  cpa: number | null;
  engRate: number | null;
}

export interface Filters {
  channels: string[]; // empty = all
  campaigns: string[]; // empty = all
  from: string; // yyyy-mm-dd or ""
  to: string;
}

export type Mood = "joy" | "happy" | "meh" | "sad";

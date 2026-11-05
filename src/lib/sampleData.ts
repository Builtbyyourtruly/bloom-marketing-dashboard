import type { Row } from "./types";

/** A small, made-up garden of campaigns so the dashboard has something to show. */
export function makeSampleData(): Row[] {
  let seed = 42;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const campaigns = [
    { campaign: "Spring Bloom Sale", channel: "Instagram", imp: 9000, ctr: 0.014, conv: 0.05, cpm: 27, aov: 85 },
    { campaign: "Newsletter Nest", channel: "Email", imp: 2600, ctr: 0.06, conv: 0.04, cpm: 42, aov: 70 },
    { campaign: "Tiny Tips on TikTok", channel: "TikTok", imp: 15000, ctr: 0.009, conv: 0.025, cpm: 10, aov: 60 },
    { campaign: "Search Sprouts", channel: "Google Ads", imp: 4200, ctr: 0.045, conv: 0.06, cpm: 100, aov: 95 },
    { campaign: "Cosy Autumn Launch", channel: "Facebook", imp: 7000, ctr: 0.011, conv: 0.03, cpm: 31, aov: 75 },
    { campaign: "Founder Stories", channel: "LinkedIn", imp: 2100, ctr: 0.008, conv: 0.02, cpm: 56, aov: 140 },
  ];
  const rows: Row[] = [];
  const start = new Date(2026, 8, 1); // 1 September 2026
  for (let day = 0; day < 56; day++) {
    const d = new Date(start);
    d.setDate(d.getDate() + day);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    for (const c of campaigns) {
      const growth = 1 + day / 120;
      const wiggle = 0.65 + rnd() * 0.7;
      const impressions = Math.round(c.imp * growth * wiggle * (weekend && c.channel === "LinkedIn" ? 0.4 : 1));
      const reach = Math.round(impressions * (0.55 + rnd() * 0.25));
      const clicks = Math.round(impressions * c.ctr * (0.75 + rnd() * 0.5));
      const engagements = Math.round(reach * (c.channel === "Email" ? 0.02 : 0.03 + rnd() * 0.04));
      const conversions = Math.round(clicks * c.conv * (0.6 + rnd() * 0.8));
      const spend = Math.round((impressions / 1000) * c.cpm * 100) / 100;
      const revenue = Math.round(conversions * c.aov * (0.8 + rnd() * 0.4));
      rows.push({ campaign: c.campaign, channel: c.channel, date, impressions, reach, clicks, engagements, conversions, spend, revenue });
    }
  }
  return rows;
}

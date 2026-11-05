const compact = new Intl.NumberFormat("en-AU", { notation: "compact", maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });
const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
const moneyCents = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 2 });

export const fmtNum = (n: number | null | undefined) =>
  n == null || !isFinite(n) ? "–" : Math.abs(n) >= 10000 ? compact.format(n) : whole.format(n);
export const fmtFull = (n: number | null | undefined) => (n == null || !isFinite(n) ? "–" : whole.format(n));
export const fmtPct = (n: number | null | undefined, dp = 2) =>
  n == null || !isFinite(n) ? "–" : `${(n * 100).toFixed(dp)}%`;
export const fmtMoney = (n: number | null | undefined) =>
  n == null || !isFinite(n) ? "–" : Math.abs(n) >= 100000 ? "$" + compact.format(n) : money.format(n);
export const fmtMoneyCents = (n: number | null | undefined) =>
  n == null || !isFinite(n) ? "–" : moneyCents.format(n);
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
};

"""
Bloom data toolkit 🌸

Little helpers for getting campaign data ready for the Bloom dashboard.
Uses only the Python standard library, so there's nothing to install.

    python python/bloom_tools.py sample  sample-data/campaigns.csv
    python python/bloom_tools.py clean   messy-export.csv  clean.csv
    python python/bloom_tools.py summary clean.csv  --markdown report.md
"""

from __future__ import annotations

import argparse
import csv
import random
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field, fields
from datetime import date, datetime, timedelta
from pathlib import Path

NUMERIC = ["impressions", "reach", "clicks", "engagements", "conversions", "spend", "revenue"]

# Header names we recognise for each column, most specific first (matched case-insensitively).
SYNONYMS: dict[str, list[str]] = {
    "campaign": ["campaign name", "campaign", "ad set name", "ad name", "name"],
    "channel": ["channel", "platform", "network", "source", "medium"],
    "date": ["date", "day", "reporting starts", "start date", "week", "month"],
    "impressions": ["impressions", "impr.", "impr", "views"],
    "reach": ["reach", "unique reach", "people reached"],
    "clicks": ["link clicks", "clicks", "all clicks", "taps"],
    "engagements": ["post engagement", "engagements", "engagement", "interactions", "reactions"],
    "conversions": ["conversions", "results", "purchases", "leads", "sign ups", "signups"],
    "spend": ["amount spent (aud)", "amount spent", "spend", "cost", "budget spent"],
    "revenue": ["revenue", "conversion value", "purchase value", "sales", "income"],
}

OUTPUT_HEADERS = ["Campaign", "Channel", "Date", "Impressions", "Reach", "Clicks", "Engagement", "Conversions", "Spend", "Revenue"]


@dataclass
class Row:
    campaign: str
    channel: str = "Other"
    date: str | None = None
    impressions: float = 0
    reach: float = 0
    clicks: float = 0
    engagements: float = 0
    conversions: float = 0
    spend: float = 0
    revenue: float = 0


@dataclass
class Totals:
    impressions: float = 0
    reach: float = 0
    clicks: float = 0
    engagements: float = 0
    conversions: float = 0
    spend: float = 0
    revenue: float = 0
    channels: set[str] = field(default_factory=set)

    def add(self, row: Row) -> None:
        for f in NUMERIC:
            setattr(self, f, getattr(self, f) + getattr(row, f))
        self.channels.add(row.channel)

    @property
    def ctr(self) -> float | None:
        return self.clicks / self.impressions if self.impressions else None

    @property
    def conv_rate(self) -> float | None:
        return self.conversions / self.clicks if self.clicks else None

    @property
    def roi(self) -> float | None:
        return (self.revenue - self.spend) / self.spend if self.spend else None


# ---------- parsing helpers ----------

def to_number(value: object) -> float:
    """'$1,234.50' -> 1234.5, '3.2k' -> 3200, '' -> 0."""
    if value is None:
        return 0.0
    s = re.sub(r"[$,\s]|aud", "", str(value).strip().lower())
    mult = 1.0
    if s.endswith("k"):
        mult, s = 1e3, s[:-1]
    elif s.endswith("m"):
        mult, s = 1e6, s[:-1]
    s = re.sub(r"[^0-9.\-]", "", s)
    try:
        return float(s) * mult
    except ValueError:
        return 0.0


def to_iso_date(value: object) -> str | None:
    """Reads dd/mm/yyyy as an Australian date, plus ISO yyyy-mm-dd."""
    if value is None or str(value).strip() == "":
        return None
    s = str(value).strip()
    m = re.match(r"^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})", s)
    if m:
        y, mo, d = map(int, m.groups())
        return date(y, mo, d).isoformat()
    m = re.match(r"^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})", s)
    if m:
        d, mo, y = map(int, m.groups())
        if y < 100:
            y += 2000
        return date(y, mo, d).isoformat()
    for fmt in ("%d %b %Y", "%d %B %Y", "%b %d, %Y", "%B %d, %Y"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            pass
    return None


def detect_columns(headers: list[str]) -> dict[str, str]:
    lower = [h.strip().lower() for h in headers]
    found: dict[str, str] = {}
    used: set[int] = set()
    for exact in (True, False):
        for col, options in SYNONYMS.items():
            if col in found:
                continue
            for option in options:
                for i, h in enumerate(lower):
                    if i in used:
                        continue
                    if (h == option) if exact else (option in h):
                        found[col] = headers[i]
                        used.add(i)
                        break
                if col in found:
                    break
    return found


def read_rows(path: Path) -> tuple[list[Row], dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        headers = [h.strip() for h in (reader.fieldnames or [])]
        reader.fieldnames = headers
        cols = detect_columns(headers)
        if not any(k in cols for k in ("impressions", "clicks", "spend")):
            raise SystemExit(f"🥀 Couldn't find impressions, clicks or spend columns in {path.name}.")
        rows: list[Row] = []
        for raw in reader:
            get = lambda c: raw.get(cols[c]) if c in cols else None  # noqa: E731
            campaign = (get("campaign") or "").strip() or path.stem
            if campaign.lower() in {"total", "totals", "grand total"}:
                continue
            row = Row(
                campaign=campaign,
                channel=(get("channel") or "").strip() or "Other",
                date=to_iso_date(get("date")),
                **{f: to_number(get(f)) for f in NUMERIC},
            )
            if row.impressions or row.clicks or row.spend or row.reach:
                rows.append(row)
    return rows, cols


def write_rows(rows: list[Row], path: Path) -> None:
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(OUTPUT_HEADERS)
        for r in rows:
            w.writerow([r.campaign, r.channel, r.date or "", *[round(getattr(r, f), 2) for f in NUMERIC]])


def group(rows: list[Row], key: str = "campaign") -> dict[str, Totals]:
    out: dict[str, Totals] = defaultdict(Totals)
    for r in rows:
        out[getattr(r, key)].add(r)
    return dict(out)


def pct(x: float | None, dp: int = 2) -> str:
    return "–" if x is None else f"{x * 100:.{dp}f}%"


# ---------- commands ----------

def cmd_sample(args: argparse.Namespace) -> None:
    rnd = random.Random(42)
    campaigns = [
        ("Spring Bloom Sale", "Instagram", 9000, 0.014, 0.05, 27, 85),
        ("Newsletter Nest", "Email", 2600, 0.06, 0.04, 42, 70),
        ("Tiny Tips on TikTok", "TikTok", 15000, 0.009, 0.025, 10, 60),
        ("Search Sprouts", "Google Ads", 4200, 0.045, 0.06, 100, 95),
        ("Cosy Autumn Launch", "Facebook", 7000, 0.011, 0.03, 31, 75),
        ("Founder Stories", "LinkedIn", 2100, 0.008, 0.02, 56, 140),
    ]
    start = date(2026, 9, 1)
    rows: list[Row] = []
    for day in range(args.days):
        d = start + timedelta(days=day)
        for name, channel, imp, ctr, conv, cpm, aov in campaigns:
            impressions = round(imp * (1 + day / 120) * (0.65 + rnd.random() * 0.7))
            clicks = round(impressions * ctr * (0.75 + rnd.random() * 0.5))
            conversions = round(clicks * conv * (0.6 + rnd.random() * 0.8))
            reach = round(impressions * (0.55 + rnd.random() * 0.25))
            rows.append(Row(
                campaign=name, channel=channel, date=d.isoformat(), impressions=impressions, reach=reach,
                clicks=clicks, engagements=round(reach * (0.02 + rnd.random() * 0.05)), conversions=conversions,
                spend=round(impressions / 1000 * cpm, 2), revenue=round(conversions * aov * (0.8 + rnd.random() * 0.4)),
            ))
    write_rows(rows, Path(args.out))
    print(f"🌱 Planted {len(rows)} rows of sample data in {args.out}")


def cmd_clean(args: argparse.Namespace) -> None:
    rows: list[Row] = []
    for p in args.inputs:
        got, cols = read_rows(Path(p))
        rows += got
        print(f"🧺 {p}: {len(got)} rows. Matched " + ", ".join(f"{k} ← '{v}'" for k, v in cols.items()))
    rows.sort(key=lambda r: (r.date or "", r.campaign))
    write_rows(rows, Path(args.out))
    print(f"✨ Wrote {len(rows)} tidy rows to {args.out}")


def cmd_summary(args: argparse.Namespace) -> None:
    rows, _ = read_rows(Path(args.input))
    total = Totals()
    for r in rows:
        total.add(r)
    camps = sorted(group(rows).items(), key=lambda kv: kv[1].spend, reverse=True)

    line = f"{'Campaign':<28}{'Clicks':>10}{'CTR':>9}{'Conv.':>9}{'Spend':>12}{'Revenue':>12}{'ROI':>9}"
    print("\n🌸 Bloom summary\n")
    print(line)
    print("─" * len(line))
    for name, t in camps:
        print(f"{name[:27]:<28}{t.clicks:>10,.0f}{pct(t.ctr):>9}{pct(t.conv_rate):>9}{t.spend:>12,.2f}{t.revenue:>12,.2f}{pct(t.roi, 0):>9}")
    print("─" * len(line))
    print(f"{'Everything':<28}{total.clicks:>10,.0f}{pct(total.ctr):>9}{pct(total.conv_rate):>9}{total.spend:>12,.2f}{total.revenue:>12,.2f}{pct(total.roi, 0):>9}\n")

    if args.markdown:
        md = [
            "# 🌸 Campaign summary", "",
            f"- Impressions: {total.impressions:,.0f}",
            f"- Clicks: {total.clicks:,.0f} (CTR {pct(total.ctr)})",
            f"- Conversions: {total.conversions:,.0f} (conversion rate {pct(total.conv_rate)})",
            f"- Spend: ${total.spend:,.2f} · Revenue: ${total.revenue:,.2f} · ROI {pct(total.roi, 0)}", "",
            "| Campaign | Channels | Clicks | CTR | Conv. rate | Spend | Revenue | ROI |",
            "|---|---|---:|---:|---:|---:|---:|---:|",
        ]
        for name, t in camps:
            md.append(f"| {name} | {', '.join(sorted(t.channels))} | {t.clicks:,.0f} | {pct(t.ctr)} | {pct(t.conv_rate)} | ${t.spend:,.2f} | ${t.revenue:,.2f} | {pct(t.roi, 0)} |")
        Path(args.markdown).write_text("\n".join(md) + "\n", encoding="utf-8")
        print(f"📝 Saved a Markdown summary to {args.markdown}")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Bloom data toolkit 🌸")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("sample", help="generate a sample campaign CSV")
    p.add_argument("out", nargs="?", default="sample-data/campaigns.csv")
    p.add_argument("--days", type=int, default=56)
    p.set_defaults(func=cmd_sample)

    p = sub.add_parser("clean", help="turn messy ad-platform exports into one tidy CSV")
    p.add_argument("inputs", nargs="+")
    p.add_argument("-o", "--out", default="clean.csv")
    p.set_defaults(func=cmd_clean)

    p = sub.add_parser("summary", help="print campaign metrics and optionally save Markdown")
    p.add_argument("input")
    p.add_argument("--markdown", metavar="FILE")
    p.set_defaults(func=cmd_summary)

    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main(sys.argv[1:])

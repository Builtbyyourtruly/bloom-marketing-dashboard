import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "python"))

import bloom_tools as bt  # noqa: E402


def test_to_number_handles_money_and_suffixes():
    assert bt.to_number("$1,234.50") == 1234.5
    assert bt.to_number("3.2k") == 3200
    assert bt.to_number("") == 0


def test_dates_are_read_the_australian_way():
    assert bt.to_iso_date("03/10/2026") == "2026-10-03"
    assert bt.to_iso_date("2026-10-03") == "2026-10-03"
    assert bt.to_iso_date("") is None


def test_detects_meta_style_headers():
    cols = bt.detect_columns(["Campaign name", "Reporting starts", "Impressions", "Link clicks", "Amount spent (AUD)"])
    assert cols["campaign"] == "Campaign name"
    assert cols["date"] == "Reporting starts"
    assert cols["clicks"] == "Link clicks"
    assert cols["spend"] == "Amount spent (AUD)"


def test_clean_and_summarise(tmp_path):
    messy = tmp_path / "export.csv"
    messy.write_text(
        "Campaign name,Platform,Date,Impressions,Link clicks,Results,Amount spent (AUD),Purchase value\n"
        "Petal Push,Instagram,01/09/2026,\"10,000\",200,10,$100.00,$300\n"
        "Total,,,10000,200,10,100,300\n",
        encoding="utf-8",
    )
    rows, _ = bt.read_rows(messy)
    assert len(rows) == 1  # the totals row is skipped
    t = bt.group(rows)["Petal Push"]
    assert round(t.ctr, 4) == 0.02
    assert round(t.conv_rate, 4) == 0.05
    assert round(t.roi, 4) == 2.0

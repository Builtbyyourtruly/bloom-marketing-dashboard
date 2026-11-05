import { useEffect, useMemo, useState } from "react";
import { Calculators } from "./components/Calculators";
import { Compare } from "./components/Compare";
import { Confetti } from "./components/Confetti";
import { FilterBar } from "./components/FilterBar";
import { Mascot } from "./components/Mascot";
import { Overview } from "./components/Overview";
import { Reports } from "./components/Reports";
import { Uploader } from "./components/Uploader";
import { applyFilters, dateRange } from "./lib/metrics";
import { makeSampleData } from "./lib/sampleData";
import type { Filters, Row } from "./lib/types";

const TABS = [
  { id: "overview", label: "Overview", emoji: "🌸" },
  { id: "compare", label: "Compare campaigns", emoji: "🌼" },
  { id: "calculators", label: "Calculators", emoji: "🧮" },
  { id: "reports", label: "Reports", emoji: "🎁" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const STORE_KEY = "bloom:rows";
const loadRows = (): Row[] => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
  } catch {
    return [];
  }
};
const NO_FILTERS: Filters = { channels: [], campaigns: [], from: "", to: "" };

export default function App() {
  const [rows, setRows] = useState<Row[]>(loadRows);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [tab, setTab] = useState<Tab>("overview");
  const [showData, setShowData] = useState(false);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(rows));
    } catch {
      /* storage full or unavailable: the dashboard still works for this visit */
    }
  }, [rows]);

  const channels = useMemo(() => [...new Set(rows.map((r) => r.channel))].sort(), [rows]);
  const campaigns = useMemo(() => [...new Set(rows.map((r) => r.campaign))].sort(), [rows]);
  const range = useMemo(() => dateRange(rows), [rows]);
  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const isFiltered = filtered.length !== rows.length;

  const addRows = (incoming: Row[], replace: boolean) => {
    setRows((cur) => (replace ? incoming : [...cur, ...incoming]));
    setFilters(NO_FILTERS);
    setBurst((b) => b + 1);
    setShowData(false);
  };
  const plantSample = () => addRows(makeSampleData(), true);
  const clearAll = () => {
    if (confirm("Clear all your campaign data? This can’t be undone.")) {
      setRows([]);
      setFilters(NO_FILTERS);
    }
  };

  return (
    <div className="app">
      <Confetti burst={burst} />
      <header className="topbar">
        <div className="brand">
          <Mascot mood="happy" size={44} className="brand-mascot" />
          <div>
            <h1>Bloom</h1>
            <p>your little marketing analytics garden</p>
          </div>
        </div>
        {rows.length > 0 && (
          <div className="top-actions">
            <span className="pill">{rows.length.toLocaleString("en-AU")} rows · {campaigns.length} campaigns</span>
            <button type="button" className="btn soft" onClick={() => setShowData((s) => !s)} aria-expanded={showData}>
              {showData ? "Close" : "Add data"}
            </button>
            <button type="button" className="btn ghost" onClick={clearAll}>Clear garden</button>
          </div>
        )}
      </header>

      {rows.length === 0 ? (
        <main className="welcome">
          <Mascot mood="joy" size={150} className="hello-mascot" />
          <h2>Hi, I’m Bloom! 🌸</h2>
          <p>Give me your campaign data and I’ll help you see what’s growing, what’s blooming and what needs a little water.</p>
          <Uploader onRows={addRows} onSample={plantSample} />
          <div className="doodles" aria-hidden="true">✿ ⋆｡°✩ ୨୧ ✧ ♡ ✿</div>
        </main>
      ) : (
        <main className="main">
          {showData && (
            <section className="card data-panel">
              <h2>Add more data 🧺</h2>
              <Uploader onRows={addRows} onSample={plantSample} compact />
            </section>
          )}
          <nav className="tabs" role="tablist" aria-label="Dashboard sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className="tab"
                onClick={() => setTab(t.id)}
              >
                <span aria-hidden="true">{t.emoji}</span> {t.label}
              </button>
            ))}
          </nav>
          {tab !== "calculators" && (
            <FilterBar filters={filters} setFilters={setFilters} channels={channels} campaigns={campaigns} range={range} />
          )}
          <div role="tabpanel">
            {filtered.length === 0 && tab !== "calculators" ? (
              <section className="card empty-mini">
                <span aria-hidden="true">🍂</span>
                <p>Nothing matches these filters. Try loosening them a little.</p>
                <button type="button" className="btn soft" onClick={() => setFilters(NO_FILTERS)}>Clear filters</button>
              </section>
            ) : tab === "overview" ? (
              <Overview rows={filtered} />
            ) : tab === "compare" ? (
              <Compare key={campaigns.join("|")} rows={filtered} />
            ) : tab === "calculators" ? (
              <Calculators rows={rows} onCelebrate={() => setBurst((b) => b + 1)} />
            ) : (
              <Reports rows={filtered} filtered={isFiltered} />
            )}
          </div>
        </main>
      )}
      <footer className="foot">made with 🌸 and an unreasonable number of side quests</footer>
    </div>
  );
}

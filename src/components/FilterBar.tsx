import type { Filters } from "../lib/types";

export function FilterBar({
  filters,
  setFilters,
  channels,
  campaigns,
  range,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  channels: string[];
  campaigns: string[];
  range: { min: string; max: string } | null;
}) {
  const toggle = (key: "channels" | "campaigns", v: string) => {
    const cur = filters[key];
    setFilters({ ...filters, [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  };
  const active = filters.channels.length || filters.campaigns.length || filters.from || filters.to;
  return (
    <section className="filters" aria-label="Filters">
      <div className="filter-group">
        <span className="filter-label">Channels</span>
        <div className="chips">
          <button type="button" className="chip" aria-pressed={!filters.channels.length} onClick={() => setFilters({ ...filters, channels: [] })}>
            All
          </button>
          {channels.map((c) => (
            <button type="button" key={c} className="chip" aria-pressed={filters.channels.includes(c)} onClick={() => toggle("channels", c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <span className="filter-label">Campaigns</span>
        <div className="chips">
          <button type="button" className="chip" aria-pressed={!filters.campaigns.length} onClick={() => setFilters({ ...filters, campaigns: [] })}>
            All
          </button>
          {campaigns.map((c) => (
            <button type="button" key={c} className="chip" aria-pressed={filters.campaigns.includes(c)} onClick={() => toggle("campaigns", c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {range && (
        <div className="filter-group dates">
          <label>
            <span className="filter-label">From</span>
            <input type="date" value={filters.from} min={range.min} max={range.max} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </label>
          <label>
            <span className="filter-label">To</span>
            <input type="date" value={filters.to} min={range.min} max={range.max} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </label>
          {active ? (
            <button type="button" className="btn link" onClick={() => setFilters({ channels: [], campaigns: [], from: "", to: "" })}>
              Clear filters
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

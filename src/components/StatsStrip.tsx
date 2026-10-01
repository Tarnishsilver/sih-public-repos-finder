import { useMemo } from "react";

import type { SearchResponse } from "../lib/api";
import { freshnessLabel } from "../lib/freshness";

function distribution(items: SearchResponse["items"]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = item.language ?? "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

const BAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
];

export function StatsStrip({ data }: { data: SearchResponse }) {
  const stats = useMemo(() => {
    const orgs = new Set(data.items.map((i) => i.full_name.split("/")[0]));
    const langs = distribution(data.items);
    return { orgs: orgs.size, langs, total: data.items.length || 1 };
  }, [data]);

  return (
    <section className="stats-strip" style={{ flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", fontSize: "0.85rem", width: "100%" }}>
        <span className="stat-item">
          <strong>{data.total_count}</strong> matching
        </span>
        <span className="stat-item">
          <strong>{data.items.length}</strong> repositories
        </span>
        <span className="stat-item">
          <strong>{stats.orgs}</strong> owners
        </span>
        <span style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
          {freshnessLabel(data.served_from, data.cache_age_seconds)}
        </span>
      </div>

      {stats.langs.length > 0 ? (
        <div style={{
          display: "flex",
          height: "6px",
          width: "100%",
          overflow: "hidden",
          borderRadius: "100px",
          background: "#e2e8f0",
        }}>
          {stats.langs.map(([language, count], index) => (
            <div
              key={language}
              style={{
                width: `${(count / stats.total) * 100}%`,
                height: "100%",
                background: BAR_COLORS[index % BAR_COLORS.length],
                transition: "width 0.5s ease",
              }}
            />
          ))}
        </div>
      ) : null}

      {stats.langs.length > 0 ? (
        <ul style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
          listStyle: "none",
          padding: 0,
          margin: 0,
        }}>
          {stats.langs.map(([language, count], index) => (
            <li key={language} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: BAR_COLORS[index % BAR_COLORS.length],
                display: "inline-block",
              }} />
              {language} <span style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>{count}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

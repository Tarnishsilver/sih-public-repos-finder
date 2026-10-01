import { SearchX } from "lucide-react";

export function EmptyState({
  query,
  onWiden,
  onClearFilters,
  hasActiveFilters,
}: {
  query: string;
  onWiden: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}) {
  return (
    <div className="empty-state">
      <SearchX size={48} style={{ color: "var(--color-text-muted)", marginBottom: "16px" }} />
      <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "8px" }}>
        No repositories matched{" "}
        <span style={{ fontFamily: "monospace", color: "var(--color-accent)" }}>{query}</span>
      </p>
      <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "20px" }}>
        The search ran successfully and returned nothing. Try a broader scope or
        fewer words.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
        <button
          onClick={onWiden}
          style={{
            background: "var(--color-accent)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 20px",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-accent-dark)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-accent)")}
        >
          Search everywhere
        </button>
        {hasActiveFilters ? (
          <button
            onClick={onClearFilters}
            style={{
              background: "transparent",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-edge)",
              borderRadius: "10px",
              padding: "10px 20px",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "border-color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent-light)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-edge)")}
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}

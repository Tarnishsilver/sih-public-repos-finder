import { Search } from "lucide-react";

const DEMO_SEARCHES = [
  { label: "SIH26161", query: "SIH26161" },
  { label: "SIH26011", query: "SIH26011" },
  { label: "SIH26024", query: "SIH26024" },
  { label: "3D ULPIN", query: "3D-ULPIN" },
  { label: "Smart Attendance", query: "smart attendance SIH" },
  { label: "Disaster Management", query: "disaster management SIH" },
  { label: "Healthcare AI", query: "healthcare AI SIH" },
  { label: "Blockchain Voting", query: "blockchain voting SIH" },
  { label: "Crop Disease Detection", query: "crop disease detection SIH" },
  { label: "Women Safety", query: "women safety SIH" },
];

export function StarterSearches({
  onPick,
  disabled,
}: {
  onPick: (query: string) => void;
  disabled?: boolean;
}) {
  return (
    <section style={{
      textAlign: "center",
      maxWidth: "680px",
      margin: "0 auto",
    }}>
      {/* Section Title */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "8px",
      }}>
        <h2 style={{
          fontSize: "1.15rem",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          margin: 0,
          letterSpacing: "-0.01em",
        }}>
          SIH Public Repos
        </h2>
      </div>
      <p style={{
        fontSize: "0.85rem",
        color: "var(--color-text-muted)",
        marginBottom: "24px",
        lineHeight: 1.5,
      }}>
        Try searching for a problem statement or keyword
      </p>

      {/* Demo Chips */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "10px",
      }}>
        {DEMO_SEARCHES.map((demo) => (
          <button
            key={demo.query}
            type="button"
            disabled={disabled}
            onClick={() => onPick(demo.query)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid var(--color-edge)",
              borderRadius: "100px",
              padding: "8px 18px",
              background: "var(--color-panel)",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.4 : 1,
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              transition: "all 0.25s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = "var(--color-accent)";
                e.currentTarget.style.background = "rgba(37,99,235,0.06)";
                e.currentTarget.style.color = "var(--color-accent)";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(37,99,235,0.12)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-edge)";
              e.currentTarget.style.background = "var(--color-panel)";
              e.currentTarget.style.color = "var(--color-text-secondary)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Search size={13} style={{ opacity: 0.5 }} />
            {demo.label}
          </button>
        ))}
      </div>
    </section>
  );
}
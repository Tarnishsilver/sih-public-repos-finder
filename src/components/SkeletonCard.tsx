export function SkeletonCard() {
  return (
    <div aria-hidden className="repo-tile-card skeleton-tile">
      {/* Header */}
      <div className="repo-tile-header">
        <div
          className="skeleton-bar"
          style={{ width: "42px", height: "42px", borderRadius: "10px", flexShrink: 0 }}
        />
        <div
          className="skeleton-bar"
          style={{ width: "24px", height: "24px", borderRadius: "50%" }}
        />
      </div>

      {/* Body */}
      <div style={{ marginTop: "16px", marginBottom: "20px" }}>
        <div
          className="skeleton-bar"
          style={{ height: "16px", width: "70%", borderRadius: "4px", marginBottom: "10px" }}
        />
        <div
          className="skeleton-bar"
          style={{ height: "12px", width: "95%", borderRadius: "4px", marginBottom: "6px" }}
        />
        <div
          className="skeleton-bar"
          style={{ height: "12px", width: "60%", borderRadius: "4px" }}
        />
      </div>

      {/* Progress */}
      <div style={{ marginTop: "auto", marginBottom: "16px" }}>
        <div
          className="skeleton-bar"
          style={{ height: "10px", width: "30px", marginLeft: "auto", marginBottom: "6px", borderRadius: "3px" }}
        />
        <div
          className="skeleton-bar"
          style={{ height: "4px", width: "100%", borderRadius: "2px" }}
        />
      </div>

      {/* Footer */}
      <div className="repo-tile-footer">
        <div style={{ display: "flex", gap: "4px" }}>
          <div className="skeleton-bar" style={{ width: "26px", height: "26px", borderRadius: "50%" }} />
          <div className="skeleton-bar" style={{ width: "26px", height: "26px", borderRadius: "50%" }} />
          <div className="skeleton-bar" style={{ width: "26px", height: "26px", borderRadius: "50%" }} />
        </div>
        <div
          className="skeleton-bar"
          style={{ width: "64px", height: "26px", borderRadius: "9999px" }}
        />
      </div>
    </div>
  );
}

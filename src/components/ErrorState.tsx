import { SearchApiError } from "../lib/api";
import { NoticeBanner } from "./NoticeBanner";

export function ErrorState({
  error,
  onRetry,
}: {
  error: SearchApiError;
  onRetry: () => void;
}) {
  const retryable = error.status === 0 || error.status >= 500;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <NoticeBanner tone="error">{error.message}</NoticeBanner>
      {error.retryAfter ? (
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          You can search again in about {error.retryAfter} seconds.
        </p>
      ) : null}
      {retryable ? (
        <button
          onClick={onRetry}
          style={{
            width: "fit-content",
            background: "var(--color-accent)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 20px",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

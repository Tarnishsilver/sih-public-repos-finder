import type { ServedFrom } from "./api";

export function formatAge(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  if (total < 60) return `${total} second${total === 1 ? "" : "s"}`;
  if (total < 3600) {
    const m = Math.floor(total / 60);
    return `${m} minute${m === 1 ? "" : "s"}`;
  }
  if (total < 86400) {
    const h = Math.floor(total / 3600);
    return `${h} hour${h === 1 ? "" : "s"}`;
  }
  const d = Math.floor(total / 86400);
  return `${d} day${d === 1 ? "" : "s"}`;
}

export function freshnessLabel(servedFrom: ServedFrom, ageSeconds: number): string {
  const age = formatAge(ageSeconds);
  if (servedFrom === "github") return "Live from GitHub";
  if (servedFrom === "stale_cache")
    return `Rate limited — showing results from ${age} ago`;
  return `Cached ${age} ago`;
}

export function isStale(servedFrom: ServedFrom): boolean {
  return servedFrom === "stale_cache";
}

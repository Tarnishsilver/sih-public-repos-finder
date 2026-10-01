import type { Scope } from "./api";

export interface Filters {
  category: string;
  language: string;
  minStars: number;
  sort: "updated" | "stars";
}

export const DEFAULT_FILTERS: Filters = {
  category: "all",
  language: "all",
  minStars: 0,
  sort: "updated",
};

/** Code search returns files, and the backend hard-codes stars=0 for them. */
export function supportsStars(scope: Scope): boolean {
  return scope !== "code";
}

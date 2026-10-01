/**
 * Shared types for the search UI.
 *
 * This app has no server. Searches go from the browser straight to GitHub's
 * public search API, so the request and response handling lives in
 * `githubDirect.ts`; what lives here is the shape every component reads.
 */

/**
 * `any` appends no qualifier, which is what the search box uses when the query
 * does not name a field of its own. `githubDirect` maps it to an empty
 * qualifier, so a bare search covers name, description, README and topics.
 */
export type Scope = "any" | "readme" | "name_description" | "code";

/**
 * Always "github" here: there is no server-side cache in a frontend-only app,
 * so there is nothing else to report. Kept so the freshness banner and the
 * response shape stay stable if a cache is ever added.
 */
export type ServedFrom = "github" | "cache" | "stale_cache";

export interface RepoItem {
  full_name: string;
  url: string;
  description: string | null;
  stars: number;
  language: string | null;
  topics: string[];
  pushed: string | null;
  matched_in: string;
  matched_queries: string[];
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset_epoch: number;
}

export interface SearchResponse {
  query: string;
  scope: string;
  total_count: number;
  incomplete_results: boolean;
  served_from: ServedFrom;
  cache_age_seconds: number;
  rate_limit: RateLimitInfo;
  items: RepoItem[];
  warning: string | null;
}

export class SearchApiError extends Error {
  status: number;
  retryAfter: number | null;

  constructor(message: string, status: number, retryAfter: number | null) {
    super(message);
    this.name = "SearchApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}
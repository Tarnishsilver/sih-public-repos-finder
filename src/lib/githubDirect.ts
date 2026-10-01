import type {
  RepoItem,
  Scope,
  SearchResponse,
  ServedFrom,
} from "./api";

/** Where the results came from. Two very different trust levels. */
export type Source = "backend" | "github-direct";

export const GITHUB_API = "https://api.github.com";

/**
 * Anonymous GitHub search allows 10 requests/minute. That is shared by every
 * visitor of a publicly hosted copy, so this mode is for local or small-group
 * use only -- it is why the backend exists.
 */
export const ANONYMOUS_RATE_LIMIT = 10;

export interface DirectResult {
  items: RepoItem[];
  total_count: number;
  incomplete_results: boolean;
  limit: number;
  remaining: number;
  reset_epoch: number;
}

export class GitHubDirectError extends Error {
  status: number;
  retryAfter: number | null;
  /** True when the failure is the anonymous rate limit rather than a bad query. */
  isRateLimit: boolean;

  constructor(
    message: string,
    status: number,
    retryAfter: number | null,
    isRateLimit = false,
  ) {
    super(message);
    this.name = "GitHubDirectError";
    this.status = status;
    this.retryAfter = retryAfter;
    this.isRateLimit = isRateLimit;
  }
}

function scopeQualifier(scope: Scope): string {
  switch (scope) {
    case "any":
      return "";
    case "readme":
      return " in:readme";
    case "name_description":
      return " in:name,description";
    case "code":
      return "";
  }
}

/**
 * True when the query already names a field, e.g. `SIH26011 in:readme`.
 * Appending a second `in:` would be a GitHub syntax error, so the scope select
 * hides itself in that case and the query is sent verbatim.
 */
export function queryPinsField(query: string): boolean {
  return /\bin:(name|description|readme|topics|file|path)\b/i.test(query);
}

/**
 * What to report as the field a match was found in.
 *
 * The scope alone is not the whole story: when the query names its own field,
 * that is the honest answer even though the scope is "any". The backend's
 * `dedupe` only sees the scope, so it reports "" here -- a small divergence
 * that costs nothing and is better than reporting the wrong field.
 */
function describeField(scope: Scope, query: string): string {
  if (queryPinsField(query)) {
    const named = /\bin:(name|description|readme|topics|file|path)\b/i.exec(query);
    const field = named?.[1]?.toLowerCase() ?? "";
    if (field === "file" || field === "path") return "file path";
    return field;
  }
  if (scope === "readme") return "README";
  if (scope === "name_description") return "name/description";
  return "";
}

function scopeEndpoint(scope: Scope): string {
  return scope === "code" ? "/search/code" : "/search/repositories";
}

function toRepoItem(raw: Record<string, unknown>, scope: Scope, query: string): RepoItem {
  if (scope === "code") {
    const repository = (raw.repository ?? {}) as Record<string, unknown>;
    return {
      full_name: String(repository.full_name ?? ""),
      url: String(repository.html_url ?? ""),
      description: (repository.description as string | null) ?? null,
      // A code hit is a file, not a repository. The backend sends the same
      // zeros for this scope, and RepoCard suppresses the star cell for them.
      stars: 0,
      language: null,
      topics: [],
      pushed: null,
      matched_in: String(raw.path ?? ""),
      matched_queries: [query],
    };
  }
  return {
    full_name: String(raw.full_name ?? ""),
    url: String(raw.html_url ?? ""),
    description: (raw.description as string | null) ?? null,
    stars: Number(raw.stargazers_count ?? 0),
    language: (raw.language as string | null) ?? null,
    topics: Array.isArray(raw.topics) ? (raw.topics as string[]) : [],
    pushed: (raw.pushed_at as string | null) ?? null,
    // `any` searches name, description, README and topics together, so there
    // is no single field to name. Leaving it blank is honest; guessing one
    // would misreport where the match was actually found.
    matched_in: describeField(scope, query),
    matched_queries: [query],
  };
}

/**
 * First-wins de-duplication, mirroring backend/services.py. A repository
 * matching a code search in several files appears once, keyed to the first
 * file path -- same rule as the server, so both modes agree.
 */
function dedupe(items: RepoItem[]): RepoItem[] {
  const merged = new Map<string, RepoItem>();
  for (const item of items) {
    if (!item.full_name) continue;
    const existing = merged.get(item.full_name);
    if (!existing) merged.set(item.full_name, item);
    else {
      for (const q of item.matched_queries) {
        if (!existing.matched_queries.includes(q)) existing.matched_queries.push(q);
      }
    }
  }
  return [...merged.values()];
}

/**
 * Pages through GitHub and shapes the result into the same `SearchResponse`
 * the backend returns, so every component above this layer works unchanged in
 * either mode. There is no server-side cache here, so `served_from` is always
 * "github" -- claiming otherwise would misreport where the data came from.
 */
export async function searchDirect(params: {
  q: string;
  scope: Scope;
  maxPages: number;
  signal?: AbortSignal;
}): Promise<SearchResponse> {
  const perPage = 100;
  const collected: RepoItem[] = [];
  let total = 0;
  let incomplete = false;
  let limit = ANONYMOUS_RATE_LIMIT;
  let remaining = 0;
  let reset = 0;

  for (let page = 1; page <= params.maxPages; page += 1) {
    const result = await searchGitHubDirect({
      q: params.q,
      scope: params.scope,
      page,
      perPage,
      signal: params.signal,
    });

    if (page === 1) {
      total = result.total_count;
      incomplete = result.incomplete_results;
    }
    limit = result.limit;
    remaining = result.remaining;
    reset = result.reset_epoch;
    collected.push(...result.items);

    // A short page is the last page. GitHub caps search at 1000 results, so
    // requesting more than 10 pages would earn a 422 rather than more rows.
    if (result.items.length < perPage || page === params.maxPages) break;
  }

  return {
    query: params.q,
    scope: params.scope,
    total_count: total,
    incomplete_results: incomplete,
    served_from: "github" as ServedFrom,
    cache_age_seconds: 0,
    rate_limit: { limit, remaining, reset_epoch: reset },
    items: dedupe(collected),
    warning: null,
  };
}

/**
 * Fetch one page from GitHub's public search API.
 *
 * Anonymous by design: no Authorization header is ever sent. A token placed in
 * browser JavaScript is readable by every visitor, so this mode must never
 * gain one.
 */
export async function searchGitHubDirect(params: {
  q: string;
  scope: Scope;
  page: number;
  perPage: number;
  signal?: AbortSignal;
}): Promise<DirectResult> {
  const url = new URL(`${GITHUB_API}${scopeEndpoint(params.scope)}`);
  url.searchParams.set("q", `${params.q}${scopeQualifier(params.scope)}`);
  url.searchParams.set("per_page", String(Math.min(100, params.perPage)));
  url.searchParams.set("page", String(params.page));

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: params.signal,
      headers: {
        // CORS preflight is avoided by keeping the request "simple". No
        // custom header, so no Authorization, so no OPTIONS round trip.
        Accept: "application/vnd.github+json",
      },
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new GitHubDirectError(
      "Could not reach GitHub. Check your connection.",
      0,
      null,
    );
  }

  const remaining = Number(response.headers.get("X-RateLimit-Remaining"));
  const reset = Number(response.headers.get("X-RateLimit-Reset"));
  const limitHeader = Number(response.headers.get("X-RateLimit-Limit"));

  if (!response.ok) {
    const retryAfter = Number(response.headers.get("Retry-After"));
    const retry = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null;
    // 403 is GitHub's rate-limit answer; 429 is the explicit form. Both mean
    // "slow down", not "your query is wrong".
    const isRateLimit = response.status === 403 || response.status === 429;

    if (isRateLimit) {
      const seconds =
        retry ??
        (Number.isFinite(reset) ? Math.max(1, reset - Math.floor(Date.now() / 1000)) : 60);
      throw new GitHubDirectError(
        `GitHub's anonymous search limit is ${ANONYMOUS_RATE_LIMIT} requests per ` +
          `minute and is shared by everyone using this page. Try again in ` +
          `${seconds} seconds, or run the backend for a token-backed 30/min.`,
        response.status,
        seconds,
        true,
      );
    }

    let detail = `GitHub returned ${response.status}.`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) detail = body.message;
    } catch {
      // Non-JSON body; the status-based message stands.
    }

    // Code search is authenticated-only on GitHub: /search/code returns 401
    // for an anonymous caller, no matter how few requests have been made.
    // Saying so is more useful than passing along "Requires authentication",
    // which reads as a problem with the user's own setup.
    if (response.status === 401 && params.scope === "code") {
      throw new GitHubDirectError(
        "GitHub's code search requires a token, so it is not available in " +
          "direct mode. Switch to the Backend source, or search READMEs and " +
          "descriptions instead.",
        response.status,
        null,
        false,
      );
    }

    throw new GitHubDirectError(detail, response.status, retry, false);
  }

  const body = (await response.json()) as {
    total_count?: number;
    incomplete_results?: boolean;
    items?: Array<Record<string, unknown>>;
  };

  const raw = Array.isArray(body.items) ? body.items : [];
  return {
    items: dedupe(raw.map((r) => toRepoItem(r, params.scope, params.q))),
    total_count: Number(body.total_count ?? 0),
    incomplete_results: Boolean(body.incomplete_results),
    limit: Number.isFinite(limitHeader) && limitHeader > 0 ? limitHeader : ANONYMOUS_RATE_LIMIT,
    remaining: Number.isFinite(remaining) ? Math.max(0, remaining) : 0,
    reset_epoch: Number.isFinite(reset) ? reset : 0,
  };
}

/** Best-effort read of the remaining anonymous budget, for a status widget. */
export async function fetchRateLimit(
  signal?: AbortSignal,
): Promise<{ limit: number; remaining: number; reset_epoch: number }> {
  const response = await fetch(`${GITHUB_API}/rate_limit`, {
    signal,
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) {
    throw new GitHubDirectError("Could not read the rate limit.", response.status, null);
  }
  const body = (await response.json()) as {
    resources?: { search?: { limit?: number; remaining?: number; reset?: number } };
  };
  const search = body.resources?.search ?? {};
  return {
    limit: Number(search.limit ?? ANONYMOUS_RATE_LIMIT),
    remaining: Number(search.remaining ?? 0),
    reset_epoch: Number(search.reset ?? 0),
  };
}

export type { RepoItem, Scope };
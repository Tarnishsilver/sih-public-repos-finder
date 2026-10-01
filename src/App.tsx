import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trophy, Search as SearchIcon, SlidersHorizontal } from "lucide-react";

function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

import { EmptyState } from "./components/EmptyState";
import { ErrorState } from "./components/ErrorState";
import { FilterBar } from "./components/FilterBar";
import { NoticeBanner } from "./components/NoticeBanner";
import { Pagination } from "./components/Pagination";
import { RepoCard } from "./components/RepoCard";
import { SearchBar } from "./components/SearchBar";
import { SkeletonCard } from "./components/SkeletonCard";
import { StarterSearches } from "./components/StarterSearches";
import { StatsStrip } from "./components/StatsStrip";
import { useSearch } from "./hooks/useSearch";
import type { Scope, RepoItem } from "./lib/api";
import { DEFAULT_FILTERS, supportsStars, type Filters } from "./lib/filters";
import { isStale } from "./lib/freshness";
import { queryPinsField } from "./lib/githubDirect";

const MAX_PAGES = 3;
const ITEMS_PER_PAGE = 9;

function matchesCategory(item: RepoItem, category: string): boolean {
  if (!category || category === "all") return true;

  const text = `${item.full_name} ${item.description ?? ""} ${item.topics.join(" ")}`.toLowerCase();

  switch (category) {
    case "ai_ml":
      return /ai\b|ml\b|machine[\s-_]*learning|deep[\s-_]*learning|neural|vision|nlp|llm|model|dataset|detection|opencv|pytorch|tensorflow/i.test(text);

    case "web_app":
      return /web|app|frontend|fullstack|react|flutter|vue|next|angular|node|django|fastapi|flask|android|ios|mobile|website|ui|dashboard/i.test(text);

    case "iot_hardware":
      return /iot|hardware|arduino|raspberry|sensor|embedded|robot|drone|lidar|esp32|cadastre|3d|gis/i.test(text);

    case "blockchain":
      return /blockchain|web3|crypto|solidity|smart[\s-_]*contract|ethereum|polygon|decentralized|nft|dapp/i.test(text);

    case "starred":
      return item.stars > 0;

    case "active": {
      if (!item.pushed) return false;
      const pushedMs = new Date(item.pushed).getTime();
      return !Number.isNaN(pushedMs) && Date.now() - pushedMs < 365 * 24 * 60 * 60 * 1000;
    }

    default:
      return true;
  }
}

export default function App() {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("readme");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const mainContentRef = useRef<HTMLElement>(null);
  const { state, run, reset } = useSearch();

  const effectiveScope = queryPinsField(query) ? "any" : scope;

  const submit = useCallback(
    (q = query, s: Scope = scope) => {
      if (!q.trim()) return;
      const next = queryPinsField(q) ? "any" : s;
      run(q, next, MAX_PAGES);
    },
    [query, scope, run],
  );

  const visible = useMemo(() => {
    if (!state.data) return [];
    const items = state.data.items.filter(
      (item) =>
        matchesCategory(item, filters.category) &&
        (filters.language === "all" ||
          (item.language ?? "Unknown") === filters.language) &&
        (!supportsStars(effectiveScope) ||
          filters.minStars === 0 ||
          item.stars >= filters.minStars),
    );
    return [...items].sort((a, b) =>
      filters.sort === "stars"
        ? b.stars - a.stars
        : (b.pushed ?? "").localeCompare(a.pushed ?? ""),
    );
  }, [state.data, filters, effectiveScope]);

  // Reset to first page when search data or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, filters, effectiveScope, state.data]);

  const totalPages = Math.ceil(visible.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return visible.slice(start, start + ITEMS_PER_PAGE);
  }, [visible, currentPage]);

  const languages = useMemo(
    () =>
      [
        ...new Set((state.data?.items ?? []).map((i) => i.language ?? "Unknown")),
      ].sort(),
    [state.data],
  );

  const loading = state.status === "loading";
  const hasActiveFilters =
    (filters.category && filters.category !== "all") ||
    filters.language !== "all" ||
    filters.minStars > 0 ||
    filters.sort !== "updated";
  const hasResults = state.data !== null;

  const onGridKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable]")) return;
    const links = Array.from(
      event.currentTarget.querySelectorAll<HTMLAnchorElement>("article a[href]"),
    );
    if (links.length === 0) return;
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (index === -1) return;
    event.preventDefault();
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    links[Math.max(0, Math.min(links.length - 1, next))]?.focus();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── Hero Section ── */}
      <div className="hero-section">
        {/* Navbar */}
        <nav className="navbar">
          <a href="/" className="nav-brand">
            <Trophy size={24} />
            SIH Prototype Finder
          </a>
          <div className="nav-links">
            <a href="https://www.sih.gov.in/" target="_blank" rel="noopener noreferrer">SIH Portal</a>
            <a href="https://github.com/tarnishsilver" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <GithubIcon size={18} />
            </a>
          </div>
        </nav>

        {/* Hero Content */}
        <div style={{
          textAlign: "center",
          padding: "48px 24px 80px",
          position: "relative",
          zIndex: 1,
        }}>
          <h1 className="hero-title animate-fade-in">
            Find Hackathon<br />
            Prototypes
          </h1>
          <p className="hero-subtitle animate-fade-in animate-fade-in-delay-1" style={{ marginTop: "16px" }}>
            Search across thousands of Smart India Hackathon repositories on GitHub.
            Find prototypes, reference implementations, and solutions for any problem statement.
          </p>

          {/* Search Bar */}
          <div className="search-container animate-fade-in animate-fade-in-delay-2" style={{ marginTop: "32px" }}>
            <SearchBar
              value={query}
              scope={scope}
              onChange={setQuery}
              onScopeChange={(next) => {
                setScope(next);
                submit(query, next);
              }}
              placeholder="Search for hackathon projects, problem statements..."
              onSubmit={() => submit()}
              onClear={reset}
            />
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, paddingTop: "32px" }}>

        {/* Starter Searches (idle state) */}
        {state.status === "idle" ? (
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px 48px" }}>
            <StarterSearches onPick={(q) => {
              setQuery(q);
              submit(q);
            }} />
          </div>
        ) : null}

        {/* Results Area */}
        {hasResults || loading ? (
          <div className="content-layout">
            {/* Left Sidebar */}
            <aside id="sidebar-filters">
              {hasResults ? (
                <FilterBar
                  filters={filters}
                  languages={languages}
                  onChange={setFilters}
                  scope={scope}
                />
              ) : (
                <div className="sidebar">
                  <div className="sidebar-section">
                    <h3>Categories</h3>
                    <div className="skeleton-bar" style={{ height: "14px", width: "80%", marginBottom: "8px" }} />
                    <div className="skeleton-bar" style={{ height: "14px", width: "60%", marginBottom: "8px" }} />
                    <div className="skeleton-bar" style={{ height: "14px", width: "70%" }} />
                  </div>
                </div>
              )}
            </aside>

            {/* Right Content */}
            <main ref={mainContentRef}>
              {/* Stats */}
              {state.data ? (
                <>
                  {isStale(state.data.served_from) ? (
                    <div style={{ marginBottom: "16px" }}>
                      <NoticeBanner tone="warn">
                        {state.data.warning ??
                          "Search is rate limited, so these results may be out of date."}
                      </NoticeBanner>
                    </div>
                  ) : null}
                  <StatsStrip data={state.data} />
                </>
              ) : null}

              {/* Header row */}
              <div className="main-content-header">
                <span className="results-title">
                  Repositories
                  {state.data ? (
                    <span className="results-count">{visible.length}</span>
                  ) : null}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    className="mobile-filter-link"
                    onClick={() => {
                      document.getElementById("sidebar-filters")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    aria-label="Filter repositories"
                  >
                    <SlidersHorizontal size={14} />
                    <span>Filters</span>
                    {hasActiveFilters ? <span className="mobile-filter-badge" /> : null}
                  </button>
                  <div className="sort-select">
                    <span>Sort by:</span>
                    <select
                      value={filters.sort}
                      onChange={(e) =>
                        setFilters({ ...filters, sort: e.target.value as Filters["sort"] })
                      }
                    >
                      <option value="updated">Recently updated</option>
                      <option value="stars">Most stars</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Error state */}
              {state.status === "error" && state.error ? (
                <ErrorState error={state.error} onRetry={() => submit()} />
              ) : null}

              {/* Loading indicator */}
              {loading ? (
                <p role="status" style={{
                  fontSize: "0.85rem",
                  color: "var(--color-accent)",
                  marginBottom: "12px",
                  fontWeight: 500,
                }}>
                  <SearchIcon size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                  Searching…
                </p>
              ) : null}

              {/* Skeleton cards */}
              {loading && !state.data ? (
                <div className="card-grid">
                  {Array.from({ length: 6 }, (_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : null}

              {/* Empty results */}
              {state.data && visible.length === 0 && !loading ? (
                state.data.items.length === 0 ? (
                  <EmptyState
                    query={state.data.query}
                    hasActiveFilters={hasActiveFilters}
                    onWiden={() => {
                      setScope("code");
                      setQuery("");
                      reset();
                    }}
                    onClearFilters={() => setFilters(DEFAULT_FILTERS)}
                  />
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
                    <NoticeBanner tone="info">
                      {state.data.items.length} results, none matching the current
                      filters.
                    </NoticeBanner>
                    <button
                      onClick={() => setFilters(DEFAULT_FILTERS)}
                      style={{
                        background: "var(--color-accent)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "10px",
                        padding: "8px 16px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                )
              ) : null}

              {/* Card Grid */}
              {visible.length > 0 ? (
                <>
                  <div
                    className="card-grid"
                    onKeyDown={onGridKeyDown}
                    aria-busy={loading}
                  >
                    {paginatedItems.map((item, index) => (
                      <div
                        key={item.full_name}
                        className="animate-fade-in"
                        style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s`, opacity: 0 }}
                      >
                        <RepoCard item={item} />
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={visible.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      mainContentRef.current?.scrollIntoView({ behavior: "smooth" });
                    }}
                  />
                </>
              ) : null}
            </main>
          </div>
        ) : null}
      </div>
    </div>
  );
}

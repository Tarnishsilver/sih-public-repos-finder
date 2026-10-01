import { supportsStars, type Filters } from "../lib/filters";
import type { Scope } from "../lib/api";

export const CATEGORIES = [
  { value: "all", label: "All prototypes" },
  { value: "ai_ml", label: "AI & Machine Learning" },
  { value: "web_app", label: "Web & Mobile Apps" },
  { value: "iot_hardware", label: "IoT & Hardware" },
  { value: "blockchain", label: "Blockchain & Web3" },
  { value: "starred", label: "Top Starred (>0 ★)" },
  { value: "active", label: "Recently Active" },
];

export function FilterBar({
  filters,
  languages,
  onChange,
  scope,
}: {
  filters: Filters;
  languages: string[];
  onChange: (next: Filters) => void;
  scope: Scope;
}) {
  return (
    <div className="sidebar">
      {/* Categories Section */}
      <div className="sidebar-section">
        <h3>Categories</h3>
        {CATEGORIES.map((cat) => {
          const isActive = (filters.category || "all") === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              className={`sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => onChange({ ...filters, category: cat.value })}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Language Filter */}
      {languages.length > 0 && (
        <div className="sidebar-section">
          <h3>Languages</h3>
          <button
            type="button"
            className={`sidebar-link ${filters.language === "all" ? "active" : ""}`}
            onClick={() => onChange({ ...filters, language: "all" })}
          >
            All languages
          </button>
          {languages.map((language) => (
            <button
              key={language}
              type="button"
              className={`sidebar-link ${filters.language === language ? "active" : ""}`}
              onClick={() => onChange({ ...filters, language })}
            >
              {language}
            </button>
          ))}
        </div>
      )}

      {/* Sort Method */}
      <div className="sidebar-section">
        <h3>Sort method</h3>
        <label className="sidebar-checkbox">
          <input
            type="checkbox"
            checked={filters.sort === "updated"}
            onChange={() => onChange({ ...filters, sort: "updated" })}
          />
          Recently updated
        </label>
        <label className="sidebar-checkbox">
          <input
            type="checkbox"
            checked={filters.sort === "stars"}
            onChange={() => onChange({ ...filters, sort: "stars" })}
          />
          Most stars
        </label>
      </div>

      {/* Min Stars */}
      {supportsStars(scope) && (
        <div className="sidebar-section">
          <h3>Minimum Stars</h3>
          <label className="sidebar-checkbox">
            <input
              type="checkbox"
              checked={filters.minStars === 0}
              onChange={() => onChange({ ...filters, minStars: 0 })}
            />
            Any
          </label>
          <label className="sidebar-checkbox">
            <input
              type="checkbox"
              checked={filters.minStars === 5}
              onChange={() => onChange({ ...filters, minStars: 5 })}
            />
            5+ stars
          </label>
          <label className="sidebar-checkbox">
            <input
              type="checkbox"
              checked={filters.minStars === 10}
              onChange={() => onChange({ ...filters, minStars: 10 })}
            />
            10+ stars
          </label>
          <label className="sidebar-checkbox">
            <input
              type="checkbox"
              checked={filters.minStars === 50}
              onChange={() => onChange({ ...filters, minStars: 50 })}
            />
            50+ stars
          </label>
        </div>
      )}
    </div>
  );
}

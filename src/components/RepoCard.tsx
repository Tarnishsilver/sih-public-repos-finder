import { useState } from "react";
import { MoreHorizontal, ExternalLink, Star, Copy, Check } from "lucide-react";
import type { RepoItem } from "../lib/api";

// Curated avatar faces matching the style in the screenshot
const MOCK_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=64&h=64&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&fit=crop&crop=faces",
];

// Color themes matching the screenshot (Charcoal E, Blue T, Magenta/Pink A, Green, Amber)
const CARD_THEMES = [
  {
    badgeBg: "#32353e",
    badgeColor: "#ffffff",
    barColor: "#22c55e", // green progress
  },
  {
    badgeBg: "#2563eb",
    badgeColor: "#ffffff",
    barColor: "#f59e0b", // amber/orange progress
  },
  {
    badgeBg: "#ec4899",
    badgeColor: "#ffffff",
    barColor: "#ec4899", // pink progress
  },
  {
    badgeBg: "#10b981",
    badgeColor: "#ffffff",
    barColor: "#06b6d4", // cyan progress
  },
  {
    badgeBg: "#f59e0b",
    badgeColor: "#111827",
    barColor: "#3b82f6", // blue progress
  },
  {
    badgeBg: "#8b5cf6",
    badgeColor: "#ffffff",
    barColor: "#8b5cf6", // purple progress
  },
];

function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Format owner/repo-name into a clean title
function formatTitle(fullName: string): { title: string; subtitle: string; owner: string } {
  const parts = fullName.split("/");
  const owner = parts[0] || "";
  const repo = parts[parts.length - 1] || fullName;
  
  // Format slug to readable title e.g. "smart-india-hackathon" -> "Smart India Hackathon"
  const formatted = repo
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: formatted || repo,
    subtitle: fullName,
    owner,
  };
}

function cleanDescription(raw: string | null, fallbackSubtitle: string): string {
  if (!raw) return `Prototype solution and reference implementation for ${fallbackSubtitle}.`;
  
  const cleaned = raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // remove images/badges
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // link text only
    .replace(/#{1,6}\s*/g, "") // remove markdown header hashes
    .replace(/<[^>]+>/g, "") // remove html tags
    .replace(/[*_`~]/g, "") // remove bold/italic/code symbols
    .replace(/https?:\/\/\S+/g, "") // remove raw URLs
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || `Prototype solution and reference implementation for ${fallbackSubtitle}.`;
}

export function RepoCard({ item }: { item: RepoItem }) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const hash = getHash(item.full_name);
  const theme = CARD_THEMES[hash % CARD_THEMES.length];
  const { title, subtitle, owner } = formatTitle(item.full_name);
  const description = cleanDescription(item.description, subtitle);

  // Initial letter for badge (e.g. "E", "T", "A")
  const initial = title.charAt(0).toUpperCase() || "P";

  // Calculate deterministic activity percentage (35% - 95%) like "42%" in screenshot
  const progressPercent = 35 + (hash % 58);

  // Avatar list: Owner avatar + 2 mock contributor faces
  const avatar1 = `https://github.com/${owner}.png?size=64`;
  const avatar2 = MOCK_AVATARS[hash % MOCK_AVATARS.length];
  const avatar3 = MOCK_AVATARS[(hash + 1) % MOCK_AVATARS.length];
  const extraCount = 4 + (hash % 12);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setMenuOpen(false);
  };

  return (
    <article
      className="repo-tile-card"
      onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          window.open(item.url, "_blank", "noopener,noreferrer");
        }
      }}
    >
      {/* ── Top Row: Letter Badge & More Options ── */}
      <div className="repo-tile-header">
        <div
          className="repo-tile-badge"
          style={{
            backgroundColor: theme.badgeBg,
            color: theme.badgeColor,
          }}
        >
          {initial}
        </div>

        <div className="repo-tile-menu-wrapper" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="repo-tile-more-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="More options"
            title="Options"
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen ? (
            <div className="repo-tile-dropdown">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer noopener"
                className="repo-tile-dropdown-item"
              >
                <ExternalLink size={14} />
                Open Repository
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className="repo-tile-dropdown-item"
              >
                {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                {copied ? "Copied Link!" : "Copy Link"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Title & Description ── */}
      <div className="repo-tile-body">
        <h3 className="repo-tile-title" title={title}>
          {title}
        </h3>
        <p className="repo-tile-desc" title={description}>
          {description}
        </p>
      </div>

      {/* ── Progress / Activity Bar with Percentage ── */}
      <div className="repo-tile-progress-container">
        <div className="repo-tile-progress-label">
          {progressPercent}%
        </div>
        <div className="repo-tile-progress-track">
          <div
            className="repo-tile-progress-fill"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: theme.barColor,
            }}
          />
        </div>
      </div>

      {/* ── Bottom Row: Overlapping Avatars & Pill Badge ── */}
      <div className="repo-tile-footer">
        {/* Avatars stack */}
        <div className="repo-tile-avatars">
          <img
            src={avatar1}
            alt={owner}
            className="repo-tile-avatar"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = MOCK_AVATARS[0];
            }}
          />
          <img
            src={avatar2}
            alt="Contributor"
            className="repo-tile-avatar"
          />
          <img
            src={avatar3}
            alt="Contributor"
            className="repo-tile-avatar"
          />
        </div>

        {/* Pill Badge */}
        <div className="repo-tile-pill">
          {item.language ? (
            <span>{item.language}</span>
          ) : (
            <span>+{extraCount} more</span>
          )}
          {item.stars > 0 ? (
            <span className="repo-tile-stars">
              <Star size={11} fill="#eab308" color="#eab308" />
              {item.stars}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

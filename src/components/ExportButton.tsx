import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Check,
} from "lucide-react";
import type { RepoItem } from "../lib/api";
import { exportRepositories, type ExportFormat } from "../lib/exportUtils";

interface ExportButtonProps {
  items: RepoItem[];
  query?: string;
}

export function ExportButton({ items, query = "" }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastExported, setLastExported] = useState<ExportFormat | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleExport = (format: ExportFormat) => {
    if (items.length === 0) return;
    try {
      exportRepositories(items, format, query);
      setLastExported(format);
      setTimeout(() => {
        setLastExported(null);
        setIsOpen(false);
      }, 700);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const isDisabled = items.length === 0;

  return (
    <div className="export-dropdown-wrapper" ref={containerRef}>
      <button
        type="button"
        className={`export-trigger-btn ${isOpen ? "active" : ""} ${
          lastExported ? "success" : ""
        }`}
        onClick={() => !isDisabled && setIsOpen((prev) => !prev)}
        disabled={isDisabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Export repositories data"
        title={
          isDisabled
            ? "No repositories to export"
            : `Export ${items.length} repositories`
        }
      >
        {lastExported ? (
          <Check size={14} className="export-icon-spin" />
        ) : (
          <Download size={14} />
        )}
        <span className="export-btn-text">
          {lastExported ? "Downloaded!" : "Export"}
        </span>
        <span className="export-badge">{items.length}</span>
        <ChevronDown
          size={13}
          className={`export-chevron ${isOpen ? "rotate" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="export-menu animate-fade-in"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="export-menu-header">
            <span className="export-menu-title">Download Format</span>
            <span className="export-menu-subtitle">
              {items.length} {items.length === 1 ? "repo" : "repos"}
            </span>
          </div>

          <div className="export-menu-items">
            <button
              type="button"
              className={`export-menu-item ${
                lastExported === "excel" ? "selected" : ""
              }`}
              role="menuitem"
              onClick={() => handleExport("excel")}
            >
              <div className="export-item-icon excel">
                <FileSpreadsheet size={16} />
              </div>
              <div className="export-item-details">
                <div className="export-item-name">
                  <span>Excel (.csv)</span>
                  {lastExported === "excel" && (
                    <span className="export-done-tag">Saved</span>
                  )}
                </div>
                <div className="export-item-desc">
                  Spreadsheet for Excel & Sheets
                </div>
              </div>
            </button>

            <button
              type="button"
              className={`export-menu-item ${
                lastExported === "txt" ? "selected" : ""
              }`}
              role="menuitem"
              onClick={() => handleExport("txt")}
            >
              <div className="export-item-icon txt">
                <FileText size={16} />
              </div>
              <div className="export-item-details">
                <div className="export-item-name">
                  <span>Text (.txt)</span>
                  {lastExported === "txt" && (
                    <span className="export-done-tag">Saved</span>
                  )}
                </div>
                <div className="export-item-desc">
                  Clean human-readable summary
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

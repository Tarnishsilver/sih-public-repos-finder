import { useEffect, useRef } from "react";
import { Search } from "lucide-react";

import type { Scope } from "../lib/api";

export function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder,
}: {
  value: string;
  scope?: Scope;
  onChange: (next: string) => void;
  onScopeChange?: (next: Scope) => void;
  onSubmit: () => void;
  onClear: () => void;
  placeholder: string;
}) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inEditable =
        target?.closest("input, textarea, select, [contenteditable]") != null;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "/" && !inEditable) {
        event.preventDefault();
        input.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === input.current) {
        onChange("");
        onClear();
        input.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onChange, onClear]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      <div className="search-input-wrapper">
        <Search size={20} style={{ color: "#94a3b8", flexShrink: 0 }} aria-hidden />
        <input
          ref={input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) onSubmit();
          }}
          placeholder={placeholder}
          aria-label="Search query"
        />
        <button
          type="button"
          onClick={() => onSubmit()}
          className="search-btn"
        >
          Search
        </button>
      </div>
    </div>
  );
}

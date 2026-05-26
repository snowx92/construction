"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectStore, useInsightsStore } from "@/store";
import { mockTenders, mockInsights as mockInsightsData } from "@/data/mock";
import { useT } from "@/lib/i18n";
import { useLocalizedTenders, useLocalizedWorkspaces, useLocalizedInsights } from "@/lib/i18n/use-localized-data";
import type { Tender, AIInsight, ProjectWorkspace } from "@/types";

type SearchResult =
  | { type: "tender"; id: string; title: string; subtitle: string; href: string }
  | { type: "project"; id: string; title: string; subtitle: string; href: string }
  | { type: "insight"; id: string; title: string; subtitle: string; href: string };

const BADGE_STYLES: Record<SearchResult["type"], { bg: string; text: string }> = {
  tender:  { bg: "var(--color-warning-sub)", text: "var(--color-warning)" },
  project: { bg: "var(--color-accent-muted)", text: "var(--color-accent)" },
  insight: { bg: "var(--color-ai-sub)", text: "var(--color-ai)" },
};

const RECENT_SEARCHES_KEY = "global-search-recent";

interface RecentSearch {
  query: string;
  timestamp: number;
}

function useRecentSearches() {
  const [recent, setRecent] = useState<RecentSearch[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecent(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const addSearch = (query: string) => {
    if (!query.trim()) return;
    const filtered = recent.filter(s => s.query !== query);
    const updated = [{ query, timestamp: Date.now() }, ...filtered].slice(0, 5);
    setRecent(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  return { recent, addSearch };
}

function useGlobalSearch(query: string) {
  const rawWorkspaces = useProjectStore((s) => s.workspaces);
  const rawInsights   = useInsightsStore((s) => s.insights);
  const workspaces = useLocalizedWorkspaces(rawWorkspaces);
  const insights   = useLocalizedInsights(rawInsights);
  const tenders    = useLocalizedTenders(mockTenders);

  const results = useMemo(() => {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return [];

    const results: SearchResult[] = [];

    tenders.forEach((tender) => {
      if (
        tender.title.toLowerCase().includes(searchTerm) ||
        tender.client.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          type: "tender",
          id: tender.id,
          title: tender.title,
          subtitle: tender.client,
          href: `/tender/${tender.id}`,
        });
      }
    });

    workspaces.forEach((ws) => {
      if (ws.name.toLowerCase().includes(searchTerm) || ws.clientName.toLowerCase().includes(searchTerm)) {
        results.push({
          type: "project",
          id: ws.id,
          title: ws.name,
          subtitle: ws.clientName,
          href: `/projects/${ws.id}`,
        });
      }
    });

    insights.forEach((insight) => {
      if (
        insight.title.toLowerCase().includes(searchTerm) ||
        insight.body.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          type: "insight",
          id: insight.id,
          title: insight.title,
          subtitle: insight.type,
          href: `/insights?type=${insight.type}`,
        });
      }
    });

    return results.slice(0, 8);
  }, [query, workspaces, insights, tenders]);

  return results;
}

export function GlobalSearch() {
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { recent, addSearch } = useRecentSearches();
  const results = useGlobalSearch(query);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl+K to focus search
      if (cmdKey && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }

      // Escape to close
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
        setSelectedIndex(0);
      }

      // Arrow keys for navigation
      if (isOpen && (results.length > 0 || recent.length > 0)) {
        const items = query ? results : recent.map((r) => ({ query: r.query }));
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (query && results.length > 0) {
            handleSelectResult(results[selectedIndex]);
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, query, results, recent, selectedIndex]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  function handleSelectResult(result: SearchResult) {
    addSearch(query);
    router.push(result.href);
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }

  function handleRecentClick(recentQuery: string) {
    router.push(`?q=${encodeURIComponent(recentQuery)}`);
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }

  const displayResults = query ? results : [];
  const showRecent = !query && recent.length > 0;
  const items = displayResults.length > 0 || showRecent;

  return (
    <div className="relative flex-1 max-w-sm">
      {/* Search Input */}
      <div
        className="relative flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 transition-all duration-150"
        style={{
          background: "var(--color-surface)",
          border: `1px solid ${isOpen ? "var(--color-accent)" : "var(--color-border)"}`,
        }}
      >
        <Search className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-3)" }} strokeWidth={1.5} />

        <input
          ref={inputRef}
          type="text"
          placeholder={t("search.placeholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--color-text-1)" }}
        />

        {query && (
          <button
            onClick={() => {
              setQuery("");
              setSelectedIndex(0);
              inputRef.current?.focus();
            }}
            className="shrink-0 transition-opacity hover:opacity-70"
          >
            <X className="h-4 w-4" style={{ color: "var(--color-text-3)" }} strokeWidth={1.5} />
          </button>
        )}

        {!query && (
          <div className="flex items-center gap-1 text-xs shrink-0" style={{ color: "var(--color-text-3)" }}>
            <kbd className="rounded-md px-2 py-1" style={{ background: "var(--color-border)", fontSize: "0.75rem" }}>
              {/Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "⌘" : "Ctrl"}
            </kbd>
            <kbd className="rounded-md px-2 py-1" style={{ background: "var(--color-border)", fontSize: "0.75rem" }}>
              K
            </kbd>
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && items && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-2 rounded-[12px] overflow-hidden shadow-lg"
          style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)" }}
        >
          {displayResults.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {/* Results Section */}
              {query && displayResults.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium" style={{ color: "var(--color-text-3)", borderBottom: "1px solid var(--color-border-sub)" }}>
                    {t("search.results")}
                  </div>
                  <ul className="space-y-1 p-2">
                    {displayResults.map((result, idx) => (
                      <li key={result.id}>
                        <button
                          onClick={() => handleSelectResult(result)}
                          className={cn(
                            "w-full text-left rounded-lg px-3 py-2.5 transition-colors duration-150",
                            idx === selectedIndex ? "opacity-100" : "hover:opacity-70"
                          )}
                          style={{
                            background: idx === selectedIndex ? "var(--color-border)" : "transparent",
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-1)" }}>
                                {result.title}
                              </p>
                              <p className="text-xs truncate" style={{ color: "var(--color-text-3)" }}>
                                {result.subtitle}
                              </p>
                            </div>
                            <div
                              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap"
                              style={{
                                background: BADGE_STYLES[result.type].bg,
                                color: BADGE_STYLES[result.type].text,
                              }}
                            >
                              {t(`search.badge.${result.type}`)}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : showRecent ? (
            <div>
              <div className="px-3 py-2 text-xs font-medium" style={{ color: "var(--color-text-3)", borderBottom: "1px solid var(--color-border-sub)" }}>
                {t("search.recent")}
              </div>
              <ul className="space-y-1 p-2">
                {recent.map((item, idx) => (
                  <li key={item.timestamp}>
                    <button
                      onClick={() => handleRecentClick(item.query)}
                      className="w-full text-left rounded-lg px-3 py-2.5 transition-colors hover:opacity-70"
                      style={{
                        background: "transparent",
                      }}
                    >
                      <p className="text-sm" style={{ color: "var(--color-text-2)" }}>
                        {item.query}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="px-3 py-8 text-center">
              <p className="text-sm" style={{ color: "var(--color-text-3)" }}>
                {t("search.noResults")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

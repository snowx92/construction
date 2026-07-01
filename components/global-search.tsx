"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInsightsStore } from "@/store";
import { useProjects } from "@/lib/use-projects";
import { mockTenders, mockInsights as mockInsightsData } from "@/data/mock";
import { useT } from "@/lib/i18n";
import { useLocalizedTenders, useLocalizedInsights } from "@/lib/i18n/use-localized-data";
import type { Tender, AIInsight } from "@/types";

type SearchResult =
  | { type: "tender"; id: string; title: string; subtitle: string; href: string }
  | { type: "project"; id: string; title: string; subtitle: string; href: string }
  | { type: "insight"; id: string; title: string; subtitle: string; href: string };

const BADGE_STYLES: Record<SearchResult["type"], string> = {
  tender:  "bg-warning-soft text-warning",
  project: "bg-primary-soft text-primary",
  insight: "bg-primary-soft text-primary",
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
  const { projects } = useProjects();
  const rawInsights  = useInsightsStore((s) => s.insights);
  const insights = useLocalizedInsights(rawInsights);
  const tenders  = useLocalizedTenders(mockTenders);

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

    projects.forEach((p) => {
      const name   = p.name.toLowerCase();
      const client = (p.client ?? "").toLowerCase();
      const loc    = (p.location ?? "").toLowerCase();
      if (name.includes(searchTerm) || client.includes(searchTerm) || loc.includes(searchTerm)) {
        results.push({
          type: "project",
          id: p.projectId,
          title: p.name,
          subtitle: [p.client, p.location].filter(Boolean).join(" · ") || "—",
          href: `/projects/${p.projectId}`,
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
  }, [query, projects, insights, tenders]);

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
        className={cn(
          "relative flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 transition-all duration-500 ease-out",
          "bg-surface border",
          isOpen ? "border-primary" : "border-black/[0.06]",
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-foreground-subtle" strokeWidth={1.5} />

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
          className="flex-1 bg-transparent text-sm text-foreground outline-none"
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
            <X className="h-4 w-4 text-foreground-subtle" strokeWidth={1.5} />
          </button>
        )}

        {!query && (
          <div className="flex items-center gap-1 text-xs shrink-0 text-foreground-subtle">
            <kbd className="rounded-md px-2 py-1 bg-black/[0.06] text-xs">
              {/Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "⌘" : "Ctrl"}
            </kbd>
            <kbd className="rounded-md px-2 py-1 bg-black/[0.06] text-xs">
              K
            </kbd>
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && items && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-2 rounded-[var(--radius-md)] overflow-hidden glass-strong shadow-lg"
        >
          {displayResults.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {/* Results Section */}
              {query && displayResults.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-foreground-subtle border-b border-black/[0.05]">
                    {t("search.results")}
                  </div>
                  <ul className="space-y-1 p-2">
                    {displayResults.map((result, idx) => (
                      <li key={result.id}>
                        <button
                          onClick={() => handleSelectResult(result)}
                          className={cn(
                            "w-full text-left rounded-[var(--radius-sm)] px-3 py-2.5 transition-colors duration-500 ease-out",
                            idx === selectedIndex ? "bg-black/[0.04]" : "hover:bg-black/[0.025]",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate text-foreground">
                                {result.title}
                              </p>
                              <p className="text-xs truncate text-foreground-subtle">
                                {result.subtitle}
                              </p>
                            </div>
                            <div className={cn("shrink-0 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap", BADGE_STYLES[result.type])}>
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
              <div className="px-3 py-2 text-xs font-medium text-foreground-subtle border-b border-black/[0.05]">
                {t("search.recent")}
              </div>
              <ul className="space-y-1 p-2">
                {recent.map((item, idx) => (
                  <li key={item.timestamp}>
                    <button
                      onClick={() => handleRecentClick(item.query)}
                      className="w-full text-left rounded-[var(--radius-sm)] px-3 py-2.5 transition-colors hover:bg-black/[0.025]"
                    >
                      <p className="text-sm text-foreground-muted">
                        {item.query}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-foreground-subtle">
                {t("search.noResults")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

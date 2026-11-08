"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { searchOfficialsByName } from "@/app/actions/officials";
import type { OfficialSearchResult } from "@/app/actions/officials";

// ── Level badge ───────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { label: string; className: string }> = {
  federal: {
    label: "Federal",
    className:
      "bg-brand-primary/10 text-fg dark:bg-brand-primary/25",
  },
  state: {
    label: "State",
    className:
      "bg-brand-red/12 text-brand-red dark:bg-brand-red/20",
  },
  county: {
    label: "County",
    className:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  },
  city: {
    label: "City",
    className:
      "bg-fg/5 text-muted",
  },
};

function LevelBadge({ level }: { level: string }) {
  const cfg = LEVEL_CONFIG[level] ?? { label: level, className: "bg-fg/5 text-muted" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OfficialSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OfficialSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const data = await searchOfficialsByName(query);
      setResults(data);
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const hasQuery = query.trim().length >= 2;

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search officials by name..."
          autoFocus
          className="w-full rounded-2xl border border-line bg-surface text-fg placeholder:text-muted pl-11 pr-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary/40 dark:focus:ring-brand-light-blue/40 transition shadow-sm"
        />
      </div>

      {/* States */}
      {!hasQuery && (
        <div className="rounded-2xl border border-line bg-surface px-6 py-10 text-center">
          <p className="text-muted text-sm leading-relaxed">
            Search for any elected or appointed official in Washington by name.
          </p>
        </div>
      )}

      {hasQuery && loading && (
        <div className="rounded-2xl border border-line bg-surface px-6 py-10 text-center">
          <p className="text-sm text-muted">Searching…</p>
        </div>
      )}

      {hasQuery && !loading && results !== null && results.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface px-6 py-10 text-center">
          <p className="text-sm text-muted">
            No officials found matching{" "}
            <span className="font-semibold text-fg">
              &ldquo;{query.trim()}&rdquo;
            </span>
            . Try a different spelling or{" "}
            <Link
              href="/"
              className="text-brand-primary dark:text-brand-light-blue underline underline-offset-2 hover:opacity-75 transition-opacity"
            >
              search by address on the home page
            </Link>
            .
          </p>
        </div>
      )}

      {hasQuery && !loading && results && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted px-1">
            {results.length} result{results.length !== 1 ? "s" : ""}
            {results.length === 30 ? " — refine your search for more" : ""}
          </p>
          <ul className="space-y-2">
            {results.map((official) => (
              <li key={official.id}>
                <Link
                  href={`/officials/${official.id}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-5 py-4 hover:border-fg/30 hover:bg-fg/5 dark:hover:bg-brand-red/5 transition-all duration-150"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-fg truncate">
                      {official.official_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <LevelBadge level={official.level} />
                      {official.office_title && (
                        <span className="text-xs text-muted truncate">
                          {official.office_title}
                        </span>
                      )}
                      {official.jurisdiction_name && (
                        <span className="text-xs text-muted">
                          · {official.jurisdiction_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-brand-navy/25 group-hover:text-brand-primary dark:group-hover:text-brand-light-blue transition-colors">
                    <ArrowRightIcon />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

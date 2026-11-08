"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { smartSearchOfficials } from "@/app/actions/officials";
import type { OfficialSearchResult, SmartSearchResponse } from "@/app/actions/officials";

// ── Level labels ──────────────────────────────────────────────────────────────

const LEVEL_ORDER = ["federal", "state", "county", "city"] as const;
const LEVEL_LABEL: Record<string, string> = {
  federal: "Federal",
  state: "State",
  county: "County",
  city: "City",
};

// Example searches shown under the box; tapping one runs it.
const EXAMPLES = [
  "Seattle Mayor",
  "Representatives for King County",
  "Snohomish County Sheriff",
  "Washington Governor",
  "Tacoma City Council",
];

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// Same party colors used in the address lookup.
function partyClass(party: string) {
  if (party === "Democratic" || party === "Democrat") return "text-brand-primary dark:text-brand-light-blue";
  if (party === "Republican") return "text-brand-red";
  return "text-muted";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OfficialSearch() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<SmartSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResponse(null);
      setLoading(false);
      setFailed(false);
      return;
    }

    setLoading(true);
    setFailed(false);
    const id = ++requestId.current;
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await smartSearchOfficials(query);
        if (id !== requestId.current) return; // a newer search replaced this one
        setResponse(data);
      } catch {
        if (id !== requestId.current) return;
        setResponse(null);
        setFailed(true);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const hasQuery = query.trim().length >= 2;
  const results: OfficialSearchResult[] = response?.results ?? [];

  const grouped = LEVEL_ORDER.map((level) => ({
    level,
    items: results.filter((r) => r.level === level),
  })).filter((g) => g.items.length > 0);
  // Anything with an unexpected level still shows up, after the known ones.
  const other = results.filter((r) => !(LEVEL_ORDER as readonly string[]).includes(r.level));
  if (other.length) grouped.push({ level: "other" as never, items: other });

  // What we understood, e.g. "Mayor in Seattle".
  const understood = response
    ? [
        response.role,
        response.place ? `${response.role ? "in " : ""}${response.place.name}${response.place.kind === "county" ? " County" : ""}` : null,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <div className="space-y-6">
      {/* Search box */}
      <div>
        <div className="relative">
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted">
            <SearchIcon />
          </span>
          <label htmlFor="official-search" className="sr-only">
            Search officials
          </label>
          <input
            id="official-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try “Seattle Mayor” or “Representatives for King County”"
            autoFocus
            autoComplete="off"
            className="w-full rounded-full border border-line bg-surface py-4 pl-14 pr-5 text-base text-fg placeholder:text-muted transition focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 dark:focus:border-brand-light-blue/60 dark:focus:ring-brand-light-blue/30"
          />
        </div>

        {/* Example searches */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">Try</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setQuery(ex)}
              className="rounded-full border border-line px-3.5 py-1.5 text-sm text-fg transition-colors hover:bg-fg/5"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {!hasQuery && (
        <div className="rounded-[28px] border border-line bg-surface px-6 py-10">
          <p className="text-lg font-semibold tracking-tight text-fg">Search by person, office or place.</p>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
            You do not need to know anyone&rsquo;s name. Type an office and a place, like a mayor, a county sheriff,
            or everyone who represents a county, and we will list who holds those seats today.
          </p>
        </div>
      )}

      {hasQuery && loading && (
        <div className="rounded-[28px] border border-line bg-surface px-6 py-10 text-center">
          <p className="text-sm text-muted">Searching…</p>
        </div>
      )}

      {hasQuery && !loading && failed && (
        <div className="rounded-[28px] border border-brand-red/30 bg-brand-red/10 px-6 py-6">
          <p className="text-sm text-brand-red">Search is unavailable right now. Please try again in a moment.</p>
        </div>
      )}

      {hasQuery && !loading && !failed && response && results.length === 0 && (
        <div className="rounded-[28px] border border-line bg-surface px-6 py-10 text-center">
          <p className="text-sm leading-relaxed text-muted">
            No officials found for{" "}
            <span className="font-semibold text-fg">&ldquo;{query.trim()}&rdquo;</span>. Try a city or county name
            with an office, like &ldquo;Everett Mayor&rdquo;, or{" "}
            <Link
              href="/"
              className="text-brand-primary underline underline-offset-2 transition-opacity hover:opacity-75 dark:text-brand-light-blue"
            >
              look up your own address on the home page
            </Link>
            .
          </p>
        </div>
      )}

      {/* Results */}
      {hasQuery && !loading && !failed && results.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
            <p className="font-mono text-[13px] text-muted">
              {results.length}
              {results.length >= 80 ? "+" : ""} result{results.length !== 1 ? "s" : ""}
              {understood ? ` · ${understood}` : ""}
            </p>
            {results.length >= 80 && (
              <p className="text-[13px] text-muted">Add a place or office to narrow this down.</p>
            )}
          </div>

          {response?.note && <p className="px-1 text-[13px] text-muted">{response.note}</p>}

          {response?.correctedQuery && (
            <p className="px-1 text-[13px] text-muted">
              Showing results for <span className="font-semibold text-fg">&ldquo;{response.correctedQuery}&rdquo;</span>
            </p>
          )}

          {response?.countyOnly && (
            <p className="px-1 text-[13px] text-muted">
              Showing county officials only. State and federal officials are on the{" "}
              <Link href="/" className="text-brand-primary underline underline-offset-2 dark:text-brand-light-blue">
                address lookup
              </Link>
              , since they cover more than one county.
            </p>
          )}

          {grouped.map(({ level, items }) => (
            <section key={level} className="overflow-hidden rounded-[28px] border border-line bg-surface">
              <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4 font-mono text-xs uppercase tracking-[0.12em] text-muted">
                <span>{LEVEL_LABEL[level] ?? "Other"}</span>
                <span>{items.length}</span>
              </div>
              <ul className="divide-y divide-line">
                {items.map((official) => (
                  <li key={official.id}>
                    <Link
                      href={`/officials/${official.id}`}
                      className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-fg/5 focus-visible:bg-fg/5 focus-visible:outline-none"
                    >
                      <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <div className="min-w-0">
                          <p className="truncate text-lg font-semibold tracking-tight text-fg">
                            {official.official_name}
                          </p>
                          <p className="mt-0.5 text-sm text-muted">
                            {[official.office_title, official.jurisdiction_name].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        {official.party && (
                          <p className={`font-mono text-[13px] ${partyClass(official.party)}`}>{official.party}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-muted transition-colors group-hover:text-brand-primary dark:group-hover:text-brand-light-blue">
                        <ChevronRight />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

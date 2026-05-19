"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  getEntitiesByCategory,
  searchDirectory,
} from "@/app/actions/directory";
import type {
  DirectoryCategory,
  DirectoryEntity,
  DirectoryCounty,
} from "@/app/actions/directory";

// ── US states ──────────────────────────────────────────────────────────────────

const US_STATES = [
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" },
  { abbr: "AZ", name: "Arizona" }, { abbr: "AR", name: "Arkansas" },
  { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" }, { abbr: "DE", name: "Delaware" },
  { abbr: "FL", name: "Florida" }, { abbr: "GA", name: "Georgia" },
  { abbr: "HI", name: "Hawaii" }, { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" }, { abbr: "IN", name: "Indiana" },
  { abbr: "IA", name: "Iowa" }, { abbr: "KS", name: "Kansas" },
  { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" },
  { abbr: "ME", name: "Maine" }, { abbr: "MD", name: "Maryland" },
  { abbr: "MA", name: "Massachusetts" }, { abbr: "MI", name: "Michigan" },
  { abbr: "MN", name: "Minnesota" }, { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" }, { abbr: "MT", name: "Montana" },
  { abbr: "NE", name: "Nebraska" }, { abbr: "NV", name: "Nevada" },
  { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" }, { abbr: "NY", name: "New York" },
  { abbr: "NC", name: "North Carolina" }, { abbr: "ND", name: "North Dakota" },
  { abbr: "OH", name: "Ohio" }, { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" }, { abbr: "PA", name: "Pennsylvania" },
  { abbr: "RI", name: "Rhode Island" }, { abbr: "SC", name: "South Carolina" },
  { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" }, { abbr: "UT", name: "Utah" },
  { abbr: "VT", name: "Vermont" }, { abbr: "VA", name: "Virginia" },
  { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" },
  { abbr: "DC", name: "District of Columbia" },
] as const;

// ── Tab config ─────────────────────────────────────────────────────────────────

const TABS: { id: DirectoryCategory; label: string }[] = [
  { id: "school-districts",  label: "School Districts" },
  { id: "law-enforcement",   label: "Law Enforcement" },
  { id: "fire-ems",          label: "Fire & EMS" },
  { id: "hospitals",         label: "Hospitals" },
  { id: "utilities-transit", label: "Utilities & Transit" },
  { id: "state-agencies",    label: "State Agencies" },
  { id: "judiciary",         label: "Judiciary" },
  { id: "courts",            label: "Courts" },
];

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  initialCategory: DirectoryCategory;
  initialEntities: DirectoryEntity[];
  counties: DirectoryCounty[];
}

// ── Entity card ────────────────────────────────────────────────────────────────

function EntityCard({ entity }: { entity: DirectoryEntity }) {
  const href = `/directory/${entity.category}/${entity.id}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 rounded-xl border border-brand-light-gray/60 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray px-5 py-4 hover:border-brand-primary/30 dark:hover:border-brand-red/30 transition-colors">
      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Link
            href={href}
            className="text-sm font-semibold text-brand-navy dark:text-brand-off-white hover:text-brand-primary dark:hover:text-brand-red transition-colors truncate"
          >
            {entity.name}
          </Link>
          {entity.county_name && (
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium bg-brand-light-gray/50 dark:bg-brand-dark-gray/60 text-brand-navy/55 dark:text-brand-off-white/45">
              {entity.county_name} Co.
            </span>
          )}
        </div>

        {/* Contact */}
        {entity.contact_name && (
          <p className="text-xs text-brand-navy/55 dark:text-brand-off-white/50 mt-0.5 truncate">
            {entity.contact_label && (
              <span className="font-medium text-brand-navy/40 dark:text-brand-off-white/35 mr-1">
                {entity.contact_label}:
              </span>
            )}
            {entity.contact_name}
          </p>
        )}

        {/* Jurisdiction / detail row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
          {entity.detail_value && entity.detail_label && (
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium bg-brand-light-blue/15 dark:bg-brand-red/10 text-brand-primary/80 dark:text-brand-red/80">
              {entity.detail_label}: {entity.detail_value}
            </span>
          )}
          {entity.jurisdiction && !entity.county_name && (
            <span className="text-xs text-brand-navy/40 dark:text-brand-off-white/35 truncate max-w-xs">
              {entity.jurisdiction}
            </span>
          )}
        </div>
      </div>

      {/* Right column: phone + website */}
      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
        {entity.phone && (
          <a
            href={`tel:${entity.phone}`}
            className="text-xs text-brand-navy/55 dark:text-brand-off-white/50 hover:text-brand-primary dark:hover:text-brand-red transition-colors tabular-nums whitespace-nowrap"
          >
            {entity.phone}
          </a>
        )}
        {entity.website && (
          <a
            href={entity.website.startsWith("http") ? entity.website : `https://${entity.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary dark:text-brand-red hover:underline whitespace-nowrap"
          >
            Website
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
            </svg>
          </a>
        )}
        <Link
          href={href}
          className="text-xs text-brand-navy/40 dark:text-brand-off-white/35 hover:text-brand-primary dark:hover:text-brand-red transition-colors whitespace-nowrap"
        >
          Details →
        </Link>
      </div>
    </div>
  );
}

// ── Main browser ───────────────────────────────────────────────────────────────

export function DirectoryBrowser({ initialCategory, initialEntities, counties }: Props) {
  const [selectedState, setSelectedState]   = useState("WA");
  const [activeCategory, setActiveCategory] = useState<DirectoryCategory>(initialCategory);
  const [entities, setEntities]             = useState<DirectoryEntity[]>(initialEntities);
  const [loading, setLoading]               = useState(false);
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState<DirectoryEntity[] | null>(null);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const searchTimeout                       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabsRef                             = useRef<HTMLDivElement>(null);

  // Load entities when tab or county changes
  const loadCategory = useCallback(async (cat: DirectoryCategory, countyId: string) => {
    setLoading(true);
    setSearchQuery("");
    setSearchResults(null);
    try {
      const data = await getEntitiesByCategory(cat, countyId || null);
      setEntities(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTabChange = (cat: DirectoryCategory) => {
    setActiveCategory(cat);
    loadCategory(cat, selectedCounty);
  };

  const handleCountyChange = (countyId: string) => {
    setSelectedCounty(countyId);
    if (!searchQuery.trim()) {
      loadCategory(activeCategory, countyId);
    }
  };

  // Debounced global search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    const q = searchQuery.trim();
    if (!q) { setSearchResults(null); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchDirectory(q, null);
        setSearchResults(results);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery]);

  // Read ?category= from URL on mount
  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get("category") as DirectoryCategory | null;
    if (cat && cat !== initialCategory && TABS.some(t => t.id === cat)) {
      setActiveCategory(cat);
      loadCategory(cat, "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayEntities = searchQuery.trim() ? (searchResults ?? []) : entities;
  const isSearchMode    = searchQuery.trim().length > 0;

  const selectedStateName = US_STATES.find((s) => s.abbr === selectedState)?.name ?? selectedState;

  return (
    <div className="space-y-6">

      {/* State selector */}
      <div className="flex items-center gap-2.5">
        <span className="text-sm text-brand-navy/55 dark:text-brand-off-white/50">
          Showing data for
        </span>
        <div className="inline-flex items-center p-1 rounded-lg bg-brand-light-gray/30 dark:bg-brand-dark-gray/50">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer focus:outline-none bg-white dark:bg-brand-charcoal text-brand-navy dark:text-brand-off-white shadow-sm transition-colors"
          >
            {US_STATES.map(({ abbr, name }) => (
              <option key={abbr} value={abbr}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Coming soon (non-WA) */}
      {selectedState !== "WA" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-light-gray/40 dark:bg-brand-dark-gray flex items-center justify-center mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-navy/30 dark:text-brand-off-white/30">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-brand-navy dark:text-brand-off-white mb-2">
            {selectedStateName} directory coming soon
          </h3>
          <p className="max-w-sm text-sm text-brand-navy/55 dark:text-brand-off-white/50 leading-relaxed">
            CommuneUSA is expanding to all 50 states. The {selectedStateName} public
            institution directory will be available once we complete data collection for
            that state.
          </p>
        </div>
      )}

      {selectedState === "WA" && <>
      {/* Search + county filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-mid-gray" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all entities by name…"
            className="w-full rounded-xl border border-brand-light-gray dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray text-brand-navy dark:text-brand-off-white placeholder:text-brand-mid-gray pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 dark:focus:ring-brand-red/40 focus:border-transparent transition"
          />
          {searchLoading && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-mid-gray text-xs">…</span>
          )}
        </div>

        <select
          value={selectedCounty}
          onChange={(e) => handleCountyChange(e.target.value)}
          className="rounded-xl border border-brand-light-gray dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray text-brand-navy dark:text-brand-off-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 dark:focus:ring-brand-red/40 focus:border-transparent transition sm:w-52"
        >
          <option value="">All counties</option>
          {counties.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Category tabs */}
      {!isSearchMode && (
        <div ref={tabsRef} className="overflow-x-auto -mx-1 px-1">
          <div className="flex gap-1 min-w-max p-1 rounded-xl bg-brand-light-gray/30 dark:bg-brand-dark-gray/50">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  activeCategory === id
                    ? "bg-white dark:bg-brand-charcoal text-brand-navy dark:text-brand-off-white shadow-sm"
                    : "text-brand-navy/50 dark:text-brand-off-white/45 hover:text-brand-navy dark:hover:text-brand-off-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div>
        {/* Count line */}
        {!loading && !searchLoading && (
          <p className="text-xs text-brand-navy/40 dark:text-brand-off-white/35 mb-3">
            {isSearchMode
              ? `${displayEntities.length} result${displayEntities.length !== 1 ? "s" : ""} across all categories`
              : `${displayEntities.length} ${TABS.find(t => t.id === activeCategory)?.label.toLowerCase() ?? "entities"}${selectedCounty ? " in selected county" : ""}`
            }
          </p>
        )}

        {(loading || searchLoading) && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl border border-brand-light-gray/60 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !searchLoading && displayEntities.length === 0 && (
          <div className="rounded-xl border border-brand-light-gray/60 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray px-6 py-10 text-center">
            <p className="text-sm text-brand-navy/45 dark:text-brand-off-white/40">
              {isSearchMode
                ? `No entities found matching "${searchQuery}"`
                : "No records found for this category."
              }
            </p>
          </div>
        )}

        {!loading && !searchLoading && displayEntities.length > 0 && (
          <div className="space-y-2">
            {displayEntities.map((entity) => (
              <EntityCard key={`${entity.category}-${entity.id}`} entity={entity} />
            ))}
          </div>
        )}
      </div>
      </>}
    </div>
  );
}

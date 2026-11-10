"use client";

import { CANDIDATES_PENDING_MESSAGE, formatVotes } from "@/lib/electionFlags";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { geocodeAddress } from "@/app/actions/geocode";
import {
  getElectionsByLocation,
  getElectionsForBrowse,
} from "@/app/actions/elections";
import type { Election, ElectionCandidate } from "@/app/actions/elections";
import { ElectionsMap } from "./ElectionsMap";

type Tab = "location" | "browse";

const US_STATES: [string, string][] = [
  ["01","Alabama"],["02","Alaska"],["04","Arizona"],["05","Arkansas"],["06","California"],["08","Colorado"],
  ["09","Connecticut"],["10","Delaware"],["12","Florida"],["13","Georgia"],["15","Hawaii"],["16","Idaho"],
  ["17","Illinois"],["18","Indiana"],["19","Iowa"],["20","Kansas"],["21","Kentucky"],["22","Louisiana"],
  ["23","Maine"],["24","Maryland"],["25","Massachusetts"],["26","Michigan"],["27","Minnesota"],["28","Mississippi"],
  ["29","Missouri"],["30","Montana"],["31","Nebraska"],["32","Nevada"],["33","New Hampshire"],["34","New Jersey"],
  ["35","New Mexico"],["36","New York"],["37","North Carolina"],["38","North Dakota"],["39","Ohio"],["40","Oklahoma"],
  ["41","Oregon"],["42","Pennsylvania"],["44","Rhode Island"],["45","South Carolina"],["46","South Dakota"],["47","Tennessee"],
  ["48","Texas"],["49","Utah"],["50","Vermont"],["51","Virginia"],["53","Washington"],["54","West Virginia"],
  ["55","Wisconsin"],["56","Wyoming"],
];
// Only Washington has data so far; the rest are listed so people can see what is coming.
const LIVE_STATES = new Set(["53"]);


const LEVEL_ORDER = ["city", "county", "state", "federal"] as const;
const LEVEL_LABELS: Record<string, string> = {
  city: "City",
  county: "County",
  state: "State",
  federal: "Federal",
};

const SESSION_KEY = "communeusa_lookup";
const BROWSE_KEY = "communeusa_browse";

interface Props {
  counties: { id: string; name: string }[];
  cities: { id: string; name: string }[];
}

export function ElectionsBrowser({ counties, cities }: Props) {
  const [tab, setTab] = useState<Tab>("location");
  const [address, setAddress] = useState("");
  const [selectedStateFips, setSelectedStateFips] = useState("");
  const [selectedCountyId, setSelectedCountyId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [elections, setElections] = useState<Election[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const browseRestored = useRef(false);
  const persistReady = useRef(false);

  // Derived: county name for map highlight (follows Browse tab selection)
  const selectedCountyName =
    selectedCountyId
      ? (counties.find((c) => c.id === selectedCountyId)?.name ?? null)
      : null;

  const runLocationLookup = useCallback(async (addr: string) => {
    setLoading(true);
    setError(null);
    setElections(null);
    try {
      const geo = await geocodeAddress(addr);
      if (!geo) {
        setError("Address not found. Please try a more specific address.");
        return;
      }

      // Highlight the user's county on the map
      if (geo.county) {
        const bare = geo.county.replace(/\s+county$/i, "").trim();
        window.dispatchEvent(
          new CustomEvent("communeusa:county-highlight", {
            detail: { county: bare },
          }),
        );
      }

      const results = await getElectionsByLocation(
        geo.stateAbbr ?? "WA",
        geo.county,
        geo.city,
      );
      if (!results.length) {
        setError("No upcoming elections found for that address.");
        return;
      }
      setElections(results);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Restore the Browse selection (state, county, city) when coming back from a race page.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BROWSE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        tab?: Tab; state?: string; county?: string; city?: string;
      };
      if (saved.tab !== "browse" || !saved.state) return;
      setTab("browse");
      setSelectedStateFips(saved.state);
      if (saved.county) setSelectedCountyId(saved.county);
      if (saved.city) setSelectedCityId(saved.city);
      browseRestored.current = true;
      // The map loads its shapes asynchronously, so repeat until it has caught up.
      const countyName = saved.county
        ? counties.find((c) => c.id === saved.county)?.name ?? null
        : null;
      const send = () => {
        window.dispatchEvent(new CustomEvent("communeusa:state-select", { detail: { fips: saved.state } }));
        if (countyName) {
          window.dispatchEvent(new CustomEvent("communeusa:county-highlight", { detail: { county: countyName } }));
        }
      };
      [200, 800, 2000, 4000].forEach((ms) => setTimeout(send, ms));
    } catch {
      // ignore malformed session data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (tab === "browse" && selectedStateFips) {
        sessionStorage.setItem(
          BROWSE_KEY,
          JSON.stringify({ tab, state: selectedStateFips, county: selectedCountyId, city: selectedCityId }),
        );
      } else if (persistReady.current) {
        sessionStorage.removeItem(BROWSE_KEY);
      }
      persistReady.current = true;
    } catch {
      // storage unavailable
    }
  }, [tab, selectedStateFips, selectedCountyId, selectedCityId]);

  // Restore address from sessionStorage on mount and auto-trigger
  useEffect(() => {
    if (browseRestored.current) return;
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const { address: savedAddress } = JSON.parse(saved) as {
          address: string;
        };
        if (savedAddress) {
          setAddress(savedAddress);
          runLocationLookup(savedAddress);
          return;
        }
      }
    } catch {
      // ignore malformed session data
    }
    const param = new URLSearchParams(window.location.search).get("address");
    if (param) {
      setAddress(param);
      runLocationLookup(param);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Browse mode: fetch when county/city selection changes
  useEffect(() => {
    if (tab !== "browse") return;
    if (!selectedCountyId && !selectedCityId) {
      setElections(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setElections(null);
    getElectionsForBrowse(
      selectedCountyId || undefined,
      selectedCityId || undefined,
    )
      .then((results) => {
        if (!results.length) setError("No upcoming elections found.");
        else setElections(results);
      })
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [tab, selectedCountyId, selectedCityId]);

  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) return;
    await runLocationLookup(trimmed);
  }

  function switchTab(t: Tab) {
    setTab(t);
    setElections(null);
    setError(null);
  }

  // Map county click → switch to Browse tab with that county selected
  // Picked from the dropdown: drive the map to match.
  function handleStateSelect(fips: string) {
    setSelectedStateFips(fips);
    setSelectedCountyId("");
    setSelectedCityId("");
    setElections(null);
    setError(null);
    window.dispatchEvent(
      new CustomEvent("communeusa:state-select", { detail: { fips: fips || null } }),
    );
  }

  // Picked or cleared on the map: keep the dropdown in sync (map already moved).
  function handleMapStateChange(fips: string | null) {
    setSelectedStateFips(fips ?? "");
    if (!fips) {
      setSelectedCountyId("");
      setSelectedCityId("");
      setElections(null);
    }
  }

  function handleMapCountySelect(countyName: string) {
    const match = counties.find(
      (c) => c.name.toLowerCase() === countyName.toLowerCase(),
    );
    if (match) {
      setSelectedStateFips("53");
      setSelectedCountyId(match.id);
      setSelectedCityId("");
      setTab("browse");
    }
  }

  // Clear map county selection and reset browse tab
  function handleMapReset() {
    window.dispatchEvent(
      new CustomEvent("communeusa:county-highlight", { detail: { county: null } }),
    );
    setSelectedCountyId("");
    setSelectedCityId("");
    setElections(null);
    setError(null);
  }

  const grouped = elections
    ? LEVEL_ORDER.reduce<Partial<Record<string, Election[]>>>((acc, lvl) => {
        const group = elections.filter((e) => e.level === lvl);
        if (group.length) acc[lvl] = group;
        return acc;
      }, {})
    : null;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-fg/5 w-fit mb-8">
        {(["location", "browse"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-surface text-fg shadow-sm"
                : "text-muted hover:text-fg"
            }`}
          >
            {t === "location" ? "My Location" : "Browse"}
          </button>
        ))}
      </div>

      {/* Location tab */}
      {tab === "location" && (
        <form onSubmit={handleAddressSubmit} className="flex gap-3 mb-8 max-w-lg">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your address…"
            className="flex-1 rounded-2xl border border-line bg-surface text-fg placeholder:text-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 dark:focus:ring-brand-light-blue/40 focus:border-transparent transition"
          />
          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="rounded-2xl bg-fg hover:bg-fg/90 disabled:opacity-50 disabled:cursor-not-allowed text-on-fg font-semibold px-5 py-3 text-sm transition-colors whitespace-nowrap"
          >
            {loading ? "Searching…" : "Find elections"}
          </button>
        </form>
      )}

      {/* Browse tab */}
      {tab === "browse" && (
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-[180px] max-w-[260px]">
            <label htmlFor="browse-state" className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1.5">
              State
            </label>
            <select
              id="browse-state"
              value={selectedStateFips}
              onChange={(e) => handleStateSelect(e.target.value)}
              className="w-full rounded-2xl border border-line bg-surface text-fg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 dark:focus:ring-brand-light-blue/40 transition"
            >
              <option value="">Select a state</option>
              {US_STATES.map(([fips, name]) => (
                <option key={fips} value={fips} disabled={!LIVE_STATES.has(fips)}>
                  {LIVE_STATES.has(fips) ? name : `${name} (coming soon)`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px] max-w-[260px]">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1.5">
              County
            </label>
            <select
              value={selectedCountyId}
              disabled={!selectedStateFips}
              onChange={(e) => {
                setSelectedCountyId(e.target.value);
                setSelectedCityId("");
              }}
              className="disabled:opacity-50 disabled:cursor-not-allowed w-full rounded-2xl border border-line bg-surface text-fg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 dark:focus:ring-brand-light-blue/40 transition"
            >
              <option value="">All counties</option>
              {counties.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px] max-w-[260px]">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted mb-1.5">
              City
            </label>
            <select
              value={selectedCityId}
              disabled={!selectedStateFips}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="disabled:opacity-50 disabled:cursor-not-allowed w-full rounded-2xl border border-line bg-surface text-fg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 dark:focus:ring-brand-light-blue/40 transition"
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Interactive map — below the search controls */}
      <div className="mb-8">
        <ElectionsMap
          selectedCounty={tab === "browse" ? selectedCountyName : null}
          onCountySelect={handleMapCountySelect}
          onReset={handleMapReset}
          onStateChange={handleMapStateChange}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red mb-6">
          {error}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-line bg-surface h-24 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty prompt for browse */}
      {tab === "browse" && !selectedCountyId && !selectedCityId && !loading && (
        <p className="text-sm text-muted">
          Choose a state, then a county or city above, or click a state and county on the map.
        </p>
      )}

      {/* Results */}
      {grouped && !loading && (
        <div className="space-y-10">
          {LEVEL_ORDER.filter((lvl) => grouped[lvl]).map((lvl) => (
            <div key={lvl}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-4">
                {LEVEL_LABELS[lvl]}
              </p>
              <div className="space-y-3">
                {(grouped[lvl] as Election[]).map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ElectionCard({ election }: { election: Election }) {
  const candidates = election.candidates ?? [];
  return (
    <Link
      href={`/elections/${election.id}`}
      className="block rounded-2xl border border-line bg-surface p-5 hover:border-fg/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h3 className="text-base font-semibold text-fg group-hover:text-brand-primary dark:group-hover:text-brand-light-blue transition-colors">
          {election.office_name}
        </h3>
        {election.election_date && (
          <span className="text-xs font-medium text-brand-primary dark:text-brand-light-blue shrink-0">
            {formatDate(election.election_date)}
          </span>
        )}
        {election.primary_date && (
          <span className="text-xs text-muted shrink-0">
            Primary: {formatDate(election.primary_date)}
          </span>
        )}
      </div>
      {candidates.length > 0 ? (
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-brand-off-white/40 dark:bg-transparent">
          {candidates.map((c, i) => (
            <CandidateRow key={c.id} candidate={c} leading={i === 0 && (c.votes ?? 0) > 0} />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted mt-2">{CANDIDATES_PENDING_MESSAGE}</p>
      )}
    </Link>
  );
}

function CandidateRow({ candidate, leading }: { candidate: ElectionCandidate; leading: boolean }) {
  const pct = candidate.vote_pct ?? null;
  return (
    <li className="px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-sm font-semibold text-fg">
          {candidate.name}
          {candidate.is_incumbent && (
            <span className="ml-2 rounded-full bg-brand-primary/10 dark:bg-brand-primary/25 text-brand-primary dark:text-brand-light-blue px-1.5 text-[10px] font-semibold leading-5">
              Incumbent
            </span>
          )}
          {candidate.party && (
            <span className={`ml-2 text-xs font-medium ${partyColor(candidate.party)}`}>
              {candidate.party}
            </span>
          )}
        </span>
        {formatVotes(candidate.votes) && (
          <span className="shrink-0 text-sm text-fg tabular-nums">
            {formatVotes(candidate.votes)}
            {pct != null && <span className="text-muted"> · {pct}%</span>}
          </span>
        )}
      </div>
      {pct != null && (
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-fg/10" aria-hidden="true">
          <div
            className={`h-1.5 rounded-full ${leading ? "bg-brand-primary dark:bg-brand-light-blue" : "bg-fg/35"}`}
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
      )}
    </li>
  );
}

function partyColor(party: string): string {
  if (party === "Democrat" || party === "Democratic")
    return "text-brand-primary dark:text-brand-light-blue";
  if (party === "Republican") return "text-brand-red";
  return "text-muted";
}

function partyShort(party: string): string {
  if (party === "Democrat" || party === "Democratic") return "Dem";
  if (party === "Republican") return "Rep";
  return party.slice(0, 3);
}

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

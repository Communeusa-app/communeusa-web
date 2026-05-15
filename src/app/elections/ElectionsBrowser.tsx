"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { geocodeAddress } from "@/app/actions/geocode";
import {
  getElectionsByLocation,
  getElectionsForBrowse,
} from "@/app/actions/elections";
import type { Election, ElectionCandidate } from "@/app/actions/elections";

type Tab = "location" | "browse";

const LEVEL_ORDER = ["city", "county", "state", "federal"] as const;
const LEVEL_LABELS: Record<string, string> = {
  city: "City",
  county: "County",
  state: "State",
  federal: "Federal",
};

const SESSION_KEY = "communeusa_lookup";

interface Props {
  counties: { id: string; name: string }[];
  cities: { id: string; name: string }[];
}

export function ElectionsBrowser({ counties, cities }: Props) {
  const [tab, setTab] = useState<Tab>("location");
  const [address, setAddress] = useState("");
  const [selectedCountyId, setSelectedCountyId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [elections, setElections] = useState<Election[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Restore address from sessionStorage on mount and auto-trigger
  useEffect(() => {
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

  // Browse mode: fetch when selections change
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
      <div className="flex gap-1 p-1 rounded-xl bg-brand-light-gray/30 dark:bg-brand-dark-gray/50 w-fit mb-8">
        {(["location", "browse"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white dark:bg-brand-charcoal text-brand-navy dark:text-brand-off-white shadow-sm"
                : "text-brand-navy/55 dark:text-brand-off-white/50 hover:text-brand-navy dark:hover:text-brand-off-white"
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
            className="flex-1 rounded-xl border border-brand-light-gray dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray text-brand-navy dark:text-brand-off-white placeholder:text-brand-mid-gray px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 dark:focus:ring-brand-red/40 focus:border-transparent transition"
          />
          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="rounded-xl bg-brand-primary hover:bg-brand-navy disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-red text-white font-semibold px-5 py-3 text-sm transition-colors whitespace-nowrap"
          >
            {loading ? "Searching…" : "Find elections"}
          </button>
        </form>
      )}

      {/* Browse tab */}
      {tab === "browse" && (
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-[180px] max-w-[260px]">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-brand-navy/45 dark:text-brand-off-white/40 mb-1.5">
              County
            </label>
            <select
              value={selectedCountyId}
              onChange={(e) => {
                setSelectedCountyId(e.target.value);
                setSelectedCityId("");
              }}
              className="w-full rounded-xl border border-brand-light-gray dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray text-brand-navy dark:text-brand-off-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 dark:focus:ring-brand-red/40 transition"
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
            <label className="block text-[11px] font-medium uppercase tracking-wider text-brand-navy/45 dark:text-brand-off-white/40 mb-1.5">
              City
            </label>
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full rounded-xl border border-brand-light-gray dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray text-brand-navy dark:text-brand-off-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 dark:focus:ring-brand-red/40 transition"
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

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red mb-6">
          {error}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray h-24 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty prompt for browse */}
      {tab === "browse" && !selectedCountyId && !selectedCityId && !loading && (
        <p className="text-sm text-brand-navy/45 dark:text-brand-off-white/40">
          Select a county or city to browse elections.
        </p>
      )}

      {/* Results */}
      {grouped && !loading && (
        <div className="space-y-10">
          {LEVEL_ORDER.filter((lvl) => grouped[lvl]).map((lvl) => (
            <div key={lvl}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-navy/45 dark:text-brand-off-white/40 mb-4">
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
      className="block rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray p-5 hover:border-brand-primary/40 dark:hover:border-brand-red/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h3 className="text-base font-semibold text-brand-navy dark:text-brand-off-white group-hover:text-brand-primary dark:group-hover:text-brand-red transition-colors">
          {election.office_name}
        </h3>
        {election.election_date && (
          <span className="text-xs font-medium text-brand-primary dark:text-brand-red shrink-0">
            {formatDate(election.election_date)}
          </span>
        )}
        {election.primary_date && (
          <span className="text-xs text-brand-navy/40 dark:text-brand-off-white/35 shrink-0">
            Primary: {formatDate(election.primary_date)}
          </span>
        )}
      </div>
      {candidates.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {candidates.map((c) => (
            <CandidateChip key={c.id} candidate={c} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-brand-navy/35 dark:text-brand-off-white/30 mt-1">
          No candidates on file yet
        </p>
      )}
    </Link>
  );
}

function CandidateChip({ candidate }: { candidate: ElectionCandidate }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-light-gray dark:border-brand-dark-gray bg-brand-off-white/60 dark:bg-brand-charcoal/40 px-3 py-1">
      <span className="text-xs font-medium text-brand-navy dark:text-brand-off-white">
        {candidate.name}
      </span>
      {candidate.is_incumbent && (
        <span className="rounded-full bg-brand-light-blue/60 dark:bg-brand-primary/25 text-brand-primary dark:text-brand-light-blue px-1.5 text-[10px] font-semibold leading-5">
          Inc
        </span>
      )}
      {candidate.party && (
        <span className={`text-[10px] font-medium ${partyColor(candidate.party)}`}>
          {partyShort(candidate.party)}
        </span>
      )}
    </span>
  );
}

function partyColor(party: string): string {
  if (party === "Democrat" || party === "Democratic")
    return "text-brand-primary dark:text-brand-light-blue";
  if (party === "Republican") return "text-brand-red";
  return "text-brand-mid-gray";
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

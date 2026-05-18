"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { geocodeAddress } from "@/app/actions/geocode";
import { searchOfficialFinance } from "@/app/actions/finance";
import type {
  FinanceSummary,
  PACDonorRow,
  IndividualDonorRow,
  IndustryRow,
  TopDonor,
} from "@/app/actions/finance";

// ── Types ──────────────────────────────────────────────────────────────────────

type LeaderboardTab = "pacs" | "individuals" | "industries";

interface Props {
  allSummaries: FinanceSummary[];
  pacDonors: PACDonorRow[];
  individualDonors: IndividualDonorRow[];
  industries: IndustryRow[];
}

const SESSION_KEY = "communeusa_lookup";

// ── Formatting helpers ─────────────────────────────────────────────────────────

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function donorTypeBadge(donor: TopDonor): { label: string; className: string } {
  if (donor.industrySector === "Political Action Committee") {
    return { label: "PAC", className: "bg-brand-red/15 text-brand-red" };
  }
  if (donor.donorType === "Individual") {
    return { label: "Indiv", className: "bg-brand-light-gray/60 dark:bg-brand-dark-gray text-brand-mid-gray dark:text-brand-off-white/50" };
  }
  return { label: "Org", className: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FundingBar({ pacTotal, individualTotal, otherTotal, totalRaised }: {
  pacTotal: number; individualTotal: number; otherTotal: number; totalRaised: number;
}) {
  if (totalRaised === 0) return null;
  const pct = (n: number) => Math.round((n / totalRaised) * 100);
  const indPct = pct(individualTotal);
  const pacPct = pct(pacTotal);
  const otherPct = Math.max(0, 100 - indPct - pacPct);

  return (
    <div className="space-y-1.5">
      <div className="flex h-2 rounded-full overflow-hidden bg-brand-light-gray/40 dark:bg-brand-dark-gray/60">
        {indPct > 0 && (
          <div className="h-full bg-brand-primary dark:bg-brand-light-blue" style={{ width: `${indPct}%` }} />
        )}
        {pacPct > 0 && (
          <div className="h-full bg-brand-red" style={{ width: `${pacPct}%` }} />
        )}
        {otherPct > 0 && (
          <div className="h-full bg-brand-mid-gray/50" style={{ width: `${otherPct}%` }} />
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {indPct > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-brand-navy/50 dark:text-brand-off-white/40">
            <span className="w-2 h-2 rounded-sm bg-brand-primary dark:bg-brand-light-blue inline-block" />
            Individual {indPct}%
          </span>
        )}
        {pacPct > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-brand-navy/50 dark:text-brand-off-white/40">
            <span className="w-2 h-2 rounded-sm bg-brand-red inline-block" />
            PAC {pacPct}%
          </span>
        )}
        {otherPct > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-brand-navy/50 dark:text-brand-off-white/40">
            <span className="w-2 h-2 rounded-sm bg-brand-mid-gray/50 inline-block" />
            Other {otherPct}%
          </span>
        )}
      </div>
    </div>
  );
}

function FinanceCard({ summary }: { summary: FinanceSummary }) {
  return (
    <div className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/officials/${summary.id}`}
            className="text-base font-semibold text-brand-navy dark:text-brand-off-white hover:text-brand-primary dark:hover:text-brand-red transition-colors"
          >
            {summary.name}
          </Link>
          <p className="text-xs text-brand-navy/50 dark:text-brand-off-white/45 mt-0.5">
            {summary.officeTitle}
            {summary.district && ` · District ${summary.district}`}
            {summary.municipalityName && ` · ${summary.municipalityName}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-brand-navy dark:text-brand-off-white tabular-nums">
            {formatMoney(summary.totalRaised)}
          </p>
          <p className="text-[10px] text-brand-navy/40 dark:text-brand-off-white/35 mt-0.5">
            {summary.donorCount} donors
          </p>
        </div>
      </div>

      {/* Funding breakdown bar */}
      <FundingBar
        pacTotal={summary.pacTotal}
        individualTotal={summary.individualTotal}
        otherTotal={summary.otherTotal}
        totalRaised={summary.totalRaised}
      />

      {/* Top donors */}
      {summary.topDonors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-navy/40 dark:text-brand-off-white/35">
            Top donors
          </p>
          {summary.topDonors.map((donor, i) => {
            const badge = donorTypeBadge(donor);
            return (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs text-brand-navy/70 dark:text-brand-off-white/65 truncate">
                    {donor.name}
                  </span>
                </div>
                <span className="text-xs font-medium text-brand-navy dark:text-brand-off-white tabular-nums shrink-0">
                  {formatMoney(donor.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href={`/officials/${summary.id}`}
        className="mt-auto text-xs font-medium text-brand-primary dark:text-brand-red hover:underline"
      >
        Full profile →
      </Link>
    </div>
  );
}

// ── Main browser ───────────────────────────────────────────────────────────────

export function FinanceBrowser({
  allSummaries,
  pacDonors,
  individualDonors,
  industries,
}: Props) {
  const [address, setAddress]                   = useState("");
  const [repSummaries, setRepSummaries]         = useState<FinanceSummary[] | null>(null);
  const [repLoading, setRepLoading]             = useState(false);
  const [repError, setRepError]                 = useState<string | null>(null);
  const [leaderboardTab, setLeaderboardTab]     = useState<LeaderboardTab>("pacs");
  const [searchQuery, setSearchQuery]           = useState("");
  const [searchResults, setSearchResults]       = useState<FinanceSummary[] | null>(null);
  const [searchLoading, setSearchLoading]       = useState(false);
  const searchTimeout                           = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Max total raised for leaderboard bar scaling
  const maxIndustryAmount = industries[0]?.totalAmount ?? 1;
  const maxPACAmount      = pacDonors[0]?.totalAmount ?? 1;
  const maxIndivAmount    = individualDonors[0]?.totalAmount ?? 1;

  // ── Address lookup ───────────────────────────────────────────────────────────

  const runAddressLookup = useCallback(async (addr: string) => {
    setRepLoading(true);
    setRepError(null);
    setRepSummaries(null);
    try {
      const geo = await geocodeAddress(addr);
      if (!geo) {
        setRepError("Address not found. Please try a more specific address.");
        return;
      }

      const city   = geo.city?.toLowerCase() ?? "";
      const county = geo.county?.replace(/\s+county$/i, "").trim().toLowerCase() ?? "";

      // Filter pre-fetched summaries by location
      const relevant = allSummaries.filter((s) => {
        if (s.level === "federal" || s.level === "state") return true;
        if (s.level === "county" && s.countyName?.toLowerCase() === county) return true;
        if (s.level === "city" && s.municipalityName?.toLowerCase() === city) return true;
        return false;
      });

      if (!relevant.length) {
        setRepError("No finance data found for representatives at that address yet.");
        return;
      }
      setRepSummaries(relevant);
    } catch {
      setRepError("Something went wrong. Please try again.");
    } finally {
      setRepLoading(false);
    }
  }, [allSummaries]);

  // Restore address from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const { address: savedAddr } = JSON.parse(saved) as { address: string };
        if (savedAddr) {
          setAddress(savedAddr);
          runAddressLookup(savedAddr);
          return;
        }
      }
    } catch { /* ignore */ }
    const param = new URLSearchParams(window.location.search).get("address");
    if (param) {
      setAddress(param);
      runAddressLookup(param);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) return;
    await runAddressLookup(trimmed);
  }

  // ── Browse search (debounced) ─────────────────────────────────────────────────

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    const q = searchQuery.trim();
    if (!q) { setSearchResults(null); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchOfficialFinance(q);
        setSearchResults(results);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery]);

  // Browse results: if query is active use search results, else show all
  const browseItems = searchQuery.trim()
    ? (searchResults ?? [])
    : allSummaries;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-16">

      {/* ── Your Representatives' Funding ─────────────────────────────────── */}
      <section>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white mb-2">
          Your Representatives&apos; Funding
        </h2>
        <p className="text-sm text-brand-navy/55 dark:text-brand-off-white/50 mb-6">
          Enter your address to see campaign finance data for officials who represent you.
        </p>

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
            disabled={repLoading || !address.trim()}
            className="rounded-xl bg-brand-primary hover:bg-brand-navy disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-red text-white font-semibold px-5 py-3 text-sm transition-colors whitespace-nowrap"
          >
            {repLoading ? "Searching…" : "Find funding"}
          </button>
        </form>

        {repError && (
          <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red mb-6">
            {repError}
          </div>
        )}

        {repLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray h-44 animate-pulse" />
            ))}
          </div>
        )}

        {repSummaries && !repLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {repSummaries.map((s) => <FinanceCard key={s.id} summary={s} />)}
          </div>
        )}
      </section>

      {/* ── Top Donors Leaderboard ────────────────────────────────────────── */}
      <section>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white mb-6">
          Top Donors
        </h2>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl bg-brand-light-gray/30 dark:bg-brand-dark-gray/50 w-fit mb-6">
          {([
            { id: "pacs",        label: "PACs & Super PACs" },
            { id: "individuals", label: "Individual Donors" },
            { id: "industries",  label: "Industries" },
          ] as { id: LeaderboardTab; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setLeaderboardTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                leaderboardTab === id
                  ? "bg-white dark:bg-brand-charcoal text-brand-navy dark:text-brand-off-white shadow-sm"
                  : "text-brand-navy/55 dark:text-brand-off-white/50 hover:text-brand-navy dark:hover:text-brand-off-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* PACs tab */}
        {leaderboardTab === "pacs" && (
          <div className="space-y-2">
            {pacDonors.length === 0 ? (
              <EmptyState label="No PAC data on file yet." />
            ) : (
              pacDonors.map((row, i) => (
                <div key={row.donorName} className="flex items-center gap-4 rounded-xl border border-brand-light-gray/60 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray px-4 py-3">
                  <span className="w-6 text-xs font-semibold text-brand-navy/35 dark:text-brand-off-white/30 tabular-nums text-right shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-brand-red/15 text-brand-red shrink-0">
                        PAC
                      </span>
                      <span className="text-sm font-medium text-brand-navy dark:text-brand-off-white truncate">
                        {row.donorName}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-brand-light-gray/40 dark:bg-brand-dark-gray/60 overflow-hidden">
                      <div
                        className="h-full bg-brand-red rounded-full"
                        style={{ width: `${(row.totalAmount / maxPACAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-brand-navy dark:text-brand-off-white tabular-nums">
                      {formatMoney(row.totalAmount)}
                    </p>
                    <p className="text-[10px] text-brand-navy/40 dark:text-brand-off-white/35">
                      {row.officialCount} official{row.officialCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Individuals tab */}
        {leaderboardTab === "individuals" && (
          <div className="space-y-2">
            {individualDonors.length === 0 ? (
              <EmptyState label="No individual donor data on file yet." />
            ) : (
              individualDonors.map((row, i) => (
                <div key={row.donorName} className="flex items-center gap-4 rounded-xl border border-brand-light-gray/60 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray px-4 py-3">
                  <span className="w-6 text-xs font-semibold text-brand-navy/35 dark:text-brand-off-white/30 tabular-nums text-right shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-brand-light-gray/60 dark:bg-brand-dark-gray text-brand-mid-gray dark:text-brand-off-white/50 shrink-0">
                        Indiv
                      </span>
                      <span className="text-sm font-medium text-brand-navy dark:text-brand-off-white truncate">
                        {row.donorName}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-brand-light-gray/40 dark:bg-brand-dark-gray/60 overflow-hidden">
                      <div
                        className="h-full bg-brand-primary dark:bg-brand-light-blue rounded-full"
                        style={{ width: `${(row.totalAmount / maxIndivAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-brand-navy dark:text-brand-off-white tabular-nums">
                      {formatMoney(row.totalAmount)}
                    </p>
                    <p className="text-[10px] text-brand-navy/40 dark:text-brand-off-white/35">
                      {row.officialCount} official{row.officialCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Industries tab */}
        {leaderboardTab === "industries" && (
          <div className="space-y-2">
            {industries.length === 0 ? (
              <EmptyState label="No industry data on file yet." />
            ) : (
              industries.map((row, i) => (
                <div key={row.sector} className="flex items-center gap-4 rounded-xl border border-brand-light-gray/60 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray px-4 py-3">
                  <span className="w-6 text-xs font-semibold text-brand-navy/35 dark:text-brand-off-white/30 tabular-nums text-right shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-navy dark:text-brand-off-white mb-1.5 truncate">
                      {row.sector}
                    </p>
                    <div className="h-1.5 rounded-full bg-brand-light-gray/40 dark:bg-brand-dark-gray/60 overflow-hidden">
                      <div
                        className="h-full bg-brand-primary/70 dark:bg-brand-light-blue/60 rounded-full"
                        style={{ width: `${(row.totalAmount / maxIndustryAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-brand-navy dark:text-brand-off-white tabular-nums">
                      {formatMoney(row.totalAmount)}
                    </p>
                    <p className="text-[10px] text-brand-navy/40 dark:text-brand-off-white/35">
                      {row.donorCount} donor{row.donorCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* ── Browse Officials ───────────────────────────────────────────────── */}
      <section>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white mb-2">
          Browse Officials
        </h2>
        <p className="text-sm text-brand-navy/55 dark:text-brand-off-white/50 mb-6">
          Search for any official with campaign finance data on file.
        </p>

        <div className="relative max-w-md mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name…"
            className="w-full rounded-xl border border-brand-light-gray dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray text-brand-navy dark:text-brand-off-white placeholder:text-brand-mid-gray px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 dark:focus:ring-brand-red/40 focus:border-transparent transition"
          />
          {searchLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-mid-gray text-xs">
              …
            </span>
          )}
        </div>

        {searchQuery.trim() && !searchLoading && searchResults?.length === 0 && (
          <p className="text-sm text-brand-navy/45 dark:text-brand-off-white/40">
            No officials with finance data found matching &ldquo;{searchQuery}&rdquo;.
          </p>
        )}

        {browseItems.length > 0 && (
          <>
            {!searchQuery.trim() && (
              <p className="text-xs text-brand-navy/40 dark:text-brand-off-white/35 mb-4">
                Showing {browseItems.length} official{browseItems.length !== 1 ? "s" : ""} with finance data on file
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {browseItems.map((s) => <FinanceCard key={s.id} summary={s} />)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-sm text-brand-navy/45 dark:text-brand-off-white/40 py-4">{label}</p>
  );
}

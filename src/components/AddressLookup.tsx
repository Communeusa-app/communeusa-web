"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getFederalOfficials,
  getOfficialsByCounty,
  findOfficialIdsByNames,
} from "@/app/actions/officials";
import type { Official } from "@/app/actions/officials";
import { geocodeAddress } from "@/app/actions/geocode";

type Level = "Federal" | "State" | "County";
const LEVEL_ORDER: Level[] = ["Federal", "State", "County"];

interface Rep {
  name: string;
  officeName: string;
  party: string | null;
  level: Level;
  dbId: string | null;
}

// ── Open States API → state legislators ───────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function openStatesToRep(person: any): Omit<Rep, "dbId"> {
  const role  = person.roles?.[0];
  const type  = role?.type ?? "";
  const district = role?.district ? `, District ${role.district}` : "";

  let chamber = "State Legislature";
  if (type === "upper")         chamber = "State Senate";
  else if (type === "lower")    chamber = "State House of Representatives";
  else if (type === "governor") chamber = "Governor";

  return {
    name:       person.name,
    officeName: `${chamber}${district}`,
    party:      person.party?.[0]?.name ?? null,
    level:      "State",
  };
}

async function fetchStateLegs(
  lat: number,
  lng: number,
): Promise<Omit<Rep, "dbId">[]> {
  const apiKey = process.env.NEXT_PUBLIC_OPENSTATES_API_KEY;
  const url = `https://v3.openstates.org/people.geo?lat=${lat}&lng=${lng}&apikey=${apiKey ?? ""}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statePeople = (data.results ?? []).filter((p: any) => p.jurisdiction?.classification === "state");
  return statePeople.map(openStatesToRep);
}

// ── DB officials → Rep ─────────────────────────────────────────────────────
function dbToRep(o: Official, level: Level): Rep {
  return {
    name:       o.official_name,
    officeName: o.office_title ?? "—",
    party:      o.party,
    level,
    dbId:       o.id,
  };
}

// ── Party colour ───────────────────────────────────────────────────────────
function partyClass(party: string) {
  if (party === "Democratic" || party === "Democrat")
    return "text-brand-primary dark:text-brand-light-blue";
  if (party === "Republican") return "text-brand-red";
  return "text-brand-mid-gray";
}

const SESSION_KEY = "communeusa_lookup";

// ── Component ──────────────────────────────────────────────────────────────
export function AddressLookup() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const [address, setAddress] = useState("");
  const [reps, setReps]       = useState<Rep[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const runLookup = useCallback(async (trimmed: string) => {
    sessionStorage.removeItem(SESSION_KEY);
    setLoading(true);
    setError(null);
    setReps(null);

    try {
      // 1. Geocode
      const geo = await geocodeAddress(trimmed);
      if (!geo) {
        setError("Address not found. Please try a more specific address.");
        return;
      }
      const county = geo.county?.replace(/\s+county$/i, "").trim() ?? null;

      // 2. Fetch all three sources in parallel
      const [stateLegsRaw, countyOfficials, federalOfficials] =
        await Promise.all([
          fetchStateLegs(geo.lat, geo.lng),
          county ? getOfficialsByCounty(county) : Promise.resolve<Official[]>([]),
          geo.stateAbbr ? getFederalOfficials(geo.stateAbbr) : Promise.resolve<Official[]>([]),
        ]);

      // 3. Cross-reference Open States names against our DB
      const stateNames = stateLegsRaw.map((r) => r.name);
      const idMap = stateNames.length
        ? await findOfficialIdsByNames(stateNames)
        : {};

      const stateReps: Rep[] = stateLegsRaw.map((r) => ({
        ...r,
        dbId: idMap[r.name] ?? null,
      }));

      const allReps: Rep[] = [
        ...federalOfficials.map((o) => dbToRep(o, "Federal")),
        ...stateReps,
        ...countyOfficials.map((o) => dbToRep(o, "County")),
      ];

      if (!allReps.length) {
        setError("No representatives found for that address.");
        return;
      }

      setReps(allReps);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ address: trimmed, reps: allReps, county, navigatedAway: false }));
      window.history.replaceState(null, "", `/?address=${encodeURIComponent(trimmed)}`);
      window.dispatchEvent(new CustomEvent("communeusa:county-highlight", { detail: { county } }));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Restore from sessionStorage on mount (survives Next.js cache restores and fresh remounts)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const { address: savedAddress, reps: savedReps, county: savedCounty, navigatedAway } =
          JSON.parse(saved) as { address: string; reps: Rep[]; county: string | null; navigatedAway: boolean };
        setAddress(savedAddress);
        setReps(savedReps);
        if (navigatedAway) {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify({ address: savedAddress, reps: savedReps, county: savedCounty, navigatedAway: false }));
          // Strip hash (e.g. #map) so the browser doesn't auto-scroll to the map
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          requestAnimationFrame(() => {
            inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
          // Delay long enough for the map component to mount and attach its listener
          if (savedCounty) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("communeusa:county-highlight", { detail: { county: savedCounty } }));
            }, 300);
          }
        }
        return;
      }
    } catch {
      // ignore malformed session data
    }
    // Fall back to URL param for direct/shared links
    const param = new URLSearchParams(window.location.search).get("address");
    if (param) {
      setAddress(param);
      runLookup(param);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function navigateToProfile(id: string) {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...data, navigatedAway: true }));
      }
    } catch {}
    router.push(`/officials/${id}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) return;
    await runLookup(trimmed);
  }

  const grouped = reps
    ? LEVEL_ORDER.reduce<Partial<Record<Level, Rep[]>>>((acc, lvl) => {
        const group = reps.filter((r) => r.level === lvl);
        if (group.length) acc[lvl] = group;
        return acc;
      }, {})
    : null;

  return (
    <div ref={containerRef} className="mt-10 w-full max-w-md">
      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            if (!e.target.value) {
              sessionStorage.removeItem(SESSION_KEY);
              setReps(null);
              window.dispatchEvent(new CustomEvent("communeusa:county-highlight", { detail: { county: null } }));
            }
          }}
          placeholder="Enter your address…"
          ref={inputRef}
          className="w-full rounded-xl border border-brand-light-gray dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray text-brand-navy dark:text-brand-off-white placeholder:text-brand-mid-gray px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary/40 dark:focus:ring-brand-red/40 focus:border-transparent transition"
        />
        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="w-full rounded-xl bg-brand-primary hover:bg-brand-navy disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-red text-white font-semibold px-6 py-3.5 text-base transition-colors"
        >
          {loading ? "Looking up…" : "Find my representatives"}
        </button>
        <a
          href="#map"
          className="w-full rounded-xl border border-brand-light-gray dark:border-brand-dark-gray bg-transparent hover:bg-brand-light-blue/25 dark:hover:bg-brand-red/10 text-brand-navy dark:text-brand-off-white font-medium px-6 py-3.5 text-base transition-colors text-center"
        >
          Explore the map ↓
        </a>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-xl border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red text-left">
          {error}
        </div>
      )}

      {/* Results */}
      {grouped && (
        <div className="mt-8 text-left space-y-6 max-h-[60vh] overflow-y-auto pr-1">
          {(Object.entries(grouped) as [Level, Rep[]][]).map(
            ([level, officials]) => (
              <div key={level}>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-navy/45 dark:text-brand-off-white/40 mb-2">
                  {level}
                </p>
                <ul className="space-y-0.5">
                  {officials.map((rep, i) =>
                    rep.dbId ? (
                      <li key={i}>
                        <div
                          role="button"
                          onClick={() => navigateToProfile(rep.dbId!)}
                          className="group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 -mx-3 cursor-pointer hover:bg-brand-light-blue/20 dark:hover:bg-brand-red/10 transition-colors"
                        >
                          <RepCard rep={rep} />
                          <ChevronRight />
                        </div>
                      </li>
                    ) : (
                      <li key={i} className="px-3 py-2.5 -mx-3">
                        <RepCard rep={rep} />
                      </li>
                    )
                  )}
                </ul>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function RepCard({ rep }: { rep: Rep }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wider text-brand-navy/50 dark:text-brand-off-white/45 leading-none mb-0.5">
        {rep.officeName}
      </p>
      <p className="text-sm font-semibold text-brand-navy dark:text-brand-off-white truncate">
        {rep.name}
      </p>
      {rep.party && (
        <p className={`text-xs mt-0.5 ${partyClass(rep.party)}`}>
          {rep.party}
        </p>
      )}
    </div>
  );
}

function ChevronRight() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      className="shrink-0 text-brand-navy/25 dark:text-brand-off-white/25 group-hover:text-brand-primary dark:group-hover:text-brand-red transition-colors"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

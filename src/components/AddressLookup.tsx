"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getFederalOfficials,
  getOfficialsByCounty,
  getCityOfficials,
  findOfficialIdsByNames,
} from "@/app/actions/officials";
import type { Official } from "@/app/actions/officials";
import { geocodeAddress } from "@/app/actions/geocode";

import {
  LOOKUP_SESSION_KEY as SESSION_KEY,
  sendAddressResult,
  type Level,
  type Rep,
} from "@/lib/lookup";

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

// ── Component ──────────────────────────────────────────────────────────────
export function AddressLookup() {
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

      // 2. Fetch all four sources in parallel
      const [stateLegsRaw, countyOfficials, federalOfficials, cityOfficials] =
        await Promise.all([
          fetchStateLegs(geo.lat, geo.lng),
          county ? getOfficialsByCounty(county) : Promise.resolve<Official[]>([]),
          geo.stateAbbr ? getFederalOfficials(geo.stateAbbr) : Promise.resolve<Official[]>([]),
          geo.city ? getCityOfficials(geo.city) : Promise.resolve<Official[]>([]),
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
        ...cityOfficials.map((o) => dbToRep(o, "City")),
      ];

      if (!allReps.length) {
        setError("No representatives found for that address.");
        return;
      }

      setReps(allReps);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ address: trimmed, reps: allReps, county, navigatedAway: false }));
      window.history.replaceState(null, "", `/?address=${encodeURIComponent(trimmed)}`);
      // The map zooms to the state, highlights the county and shows these officials beside it.
      sendAddressResult({ address: trimmed, county, reps: allReps });
      window.dispatchEvent(new CustomEvent("communeusa:county-highlight", { detail: { county } }));
      document.getElementById("map")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Restore from sessionStorage on mount (survives Next.js cache restores and fresh remounts)
  useEffect(() => {
    // Clear stale cache when returning from a 404 official page (deactivated ID)
    const params = new URLSearchParams(window.location.search);
    if (params.get("clearSession") === "true") {
      sessionStorage.removeItem(SESSION_KEY);
      params.delete("clearSession");
      const newSearch = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (newSearch ? `?${newSearch}` : ""));
    }

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
        }
        // Delay long enough for the map section to mount and attach its listeners.
        setTimeout(() => {
          sendAddressResult({ address: savedAddress, county: savedCounty, reps: savedReps });
          if (savedCounty) {
            window.dispatchEvent(new CustomEvent("communeusa:county-highlight", { detail: { county: savedCounty } }));
          }
          // Coming back from a profile: land on the map and officials, not the top of the page.
          if (navigatedAway) document.getElementById("map")?.scrollIntoView({ block: "start" });
        }, 300);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) return;
    await runLookup(trimmed);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-center gap-2 rounded-[28px] border border-fg/20 bg-surface p-2 sm:flex-nowrap sm:rounded-full sm:pl-6 focus-within:border-brand-light-blue/60 transition-colors"
      >
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            if (!e.target.value) {
              sessionStorage.removeItem(SESSION_KEY);
              setReps(null);
              sendAddressResult(null);
              window.dispatchEvent(new CustomEvent("communeusa:county-highlight", { detail: { county: null } }));
            }
          }}
          placeholder="Street address, city, ZIP"
          aria-label="Street address"
          ref={inputRef}
          className="min-w-0 flex-1 basis-full bg-transparent px-4 py-3 text-base text-fg placeholder:text-muted focus:outline-none sm:basis-0 sm:px-0 sm:text-[17px]"
        />
        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="w-full flex-none rounded-full bg-fg px-7 py-3.5 text-base font-semibold text-on-fg transition-colors hover:bg-fg/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? "Looking up…" : "Find my officials"}
        </button>
      </form>
      <a
        href="#map"
        className="mt-5 inline-block font-mono text-[13px] text-brand-primary dark:text-brand-light-blue hover:text-fg dark:hover:text-white transition-colors"
      >
        or explore the map ↓
      </a>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-2xl border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red text-left">
          {error}
        </div>
      )}

      {/* Results appear next to the map */}
      {reps && (
        <p className="mt-6 text-left font-mono text-[13px] text-muted">
          {reps.length} officials represent this address.{" "}
          <a href="#map" className="text-brand-primary dark:text-brand-light-blue hover:text-fg">
            See them on the map ↓
          </a>
        </p>
      )}
    </div>
  );
}

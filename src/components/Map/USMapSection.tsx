"use client";

import { useEffect, useState } from "react";
import { USMap } from "./USMap";
import { CountyPanel } from "./CountyPanel";

interface Props {
  initialState?: string;
}

const MAP_KEY = "communeusa_map";

function readSaved(): { state?: string; county?: string } {
  try {
    return JSON.parse(sessionStorage.getItem(MAP_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeSaved(next: { state?: string; county?: string }) {
  try {
    if (!next.state && !next.county) sessionStorage.removeItem(MAP_KEY);
    else sessionStorage.setItem(MAP_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable
  }
}

export function USMapSection({ initialState }: Props) {
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  // The map only reads its starting state once, so wait until we know what was saved.
  const [ready, setReady] = useState(false);
  const [startState, setStartState] = useState<string | undefined>(initialState);
  const [startCounty, setStartCounty] = useState<string | undefined>(undefined);

  // Coming back from a profile: reopen the same state and county.
  useEffect(() => {
    const saved = readSaved();
    if (!initialState && saved.state) setStartState(saved.state);
    if (saved.county) {
      setSelectedCounty(saved.county);
      setStartCounty(saved.county);
    }
    setReady(true);
  }, [initialState]);

  return (
    <section id="map" className="px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg mb-3 text-center">
          Explore Your Government
        </h2>
        <p className="text-base text-muted text-center mb-10 max-w-xl mx-auto leading-relaxed">
          Click any state to drill down into counties, cities, and the officials
          representing you at every level.
        </p>

        <div className="flex items-start gap-4">
          {/* Map shrinks slightly when panel is open */}
          <div className="flex-1 min-w-0">
            {ready ? (
              <USMap
                initialState={startState}
                initialCounty={startCounty}
                onStateClick={(fipsId) => writeSaved({ ...readSaved(), state: fipsId })}
                onStateReset={() => {
                  writeSaved({});
                  setSelectedCounty(null);
                }}
                onCountyClick={(name) => {
                  writeSaved({ ...readSaved(), county: name });
                  setSelectedCounty(name);
                }}
              />
            ) : (
              <div className="h-[420px]" aria-hidden />
            )}
          </div>

          {selectedCounty && (
            <div className="relative z-10">
              <CountyPanel
                countyName={selectedCounty}
                onClose={() => {
                  const { county: _county, ...rest } = readSaved();
                  void _county;
                  writeSaved(rest);
                  setSelectedCounty(null);
                  // Closing the panel clears the county highlight on the map.
                  window.dispatchEvent(new CustomEvent("communeusa:county-highlight", { detail: { county: null } }));
                }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

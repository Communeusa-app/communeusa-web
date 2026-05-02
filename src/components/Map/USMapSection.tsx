"use client";

import { useState } from "react";
import { USMap } from "./USMap";
import { CountyPanel } from "./CountyPanel";

export function USMapSection() {
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);

  return (
    <section id="map" className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white mb-3 text-center">
          Explore Your Government
        </h2>
        <p className="text-base text-brand-navy/60 dark:text-brand-off-white/55 text-center mb-10 max-w-xl mx-auto leading-relaxed">
          Click any state to drill down into counties, cities, and the officials
          representing you at every level.
        </p>

        <div className="flex items-start gap-4">
          {/* Map shrinks slightly when panel is open */}
          <div className="flex-1 min-w-0">
            <USMap
              onStateClick={(fipsId) =>
                console.log("State clicked — FIPS:", fipsId)
              }
              onCountyClick={setSelectedCounty}
            />
          </div>

          {selectedCounty && (
            <CountyPanel
              countyName={selectedCounty}
              onClose={() => setSelectedCounty(null)}
            />
          )}
        </div>
      </div>
    </section>
  );
}

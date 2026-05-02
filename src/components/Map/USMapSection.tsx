"use client";

import { useState } from "react";
import { USMap } from "./USMap";
import { CountyPanel } from "./CountyPanel";

export function USMapSection() {
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white mb-8 text-center">
          Explore Your Government
        </h2>

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

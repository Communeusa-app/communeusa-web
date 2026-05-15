"use client";

import { useEffect, useRef } from "react";
import { USMap } from "@/components/Map/USMap";

const WA_FIPS = "53";

interface Props {
  selectedCounty: string | null;
  onCountySelect: (countyName: string) => void;
  onReset: () => void;
}

export function ElectionsMap({ selectedCounty, onCountySelect, onReset }: Props) {
  const prevCounty = useRef<string | null>(undefined);

  // Sync external county changes (from Browse tab or location lookup) to map highlight
  useEffect(() => {
    if (prevCounty.current === selectedCounty) return;
    prevCounty.current = selectedCounty;
    window.dispatchEvent(
      new CustomEvent("communeusa:county-highlight", {
        detail: { county: selectedCounty },
      }),
    );
  }, [selectedCounty]);

  return (
    <div className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray overflow-hidden mb-8">
      <div className="px-5 py-3 border-b border-brand-light-gray/50 dark:border-brand-dark-gray/60 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-navy/45 dark:text-brand-off-white/40">
          {selectedCounty ? `${selectedCounty} County selected` : "Click a county to filter elections"}
        </p>
        {selectedCounty && (
          <button
            onClick={onReset}
            className="text-xs text-brand-navy/50 dark:text-brand-off-white/45 hover:text-brand-primary dark:hover:text-brand-red transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <USMap
        initialState={WA_FIPS}
        onCountyClick={onCountySelect}
      />
    </div>
  );
}

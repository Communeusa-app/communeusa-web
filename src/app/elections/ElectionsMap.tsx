"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { USMap } from "@/components/Map/USMap";
import { getDistrictOfficials, getRedistrictedDistricts } from "@/app/actions/districts";
import type { DistrictType, DistrictOfficialMap, RecentlyRedrawn } from "@/app/actions/districts";

type LayerMode = "counties" | "districts";

const WA_FIPS = "53";

interface Props {
  selectedCounty: string | null;
  onCountySelect: (countyName: string) => void;
  onReset: () => void;
}

export function ElectionsMap({ selectedCounty, onCountySelect, onReset }: Props) {
  const prevCounty = useRef<string | null>(undefined);

  const [layerMode,         setLayerMode]         = useState<LayerMode>("counties");
  const [districtSubType,   setDistrictSubType]   = useState<DistrictType>("congressional");
  const [districtOfficials, setDistrictOfficials] = useState<DistrictOfficialMap | null>(null);
  const [recentlyRedrawn,   setRecentlyRedrawn]   = useState<RecentlyRedrawn | null>(null);
  const [loadingOfficials,  setLoadingOfficials]  = useState(false);

  // Sync external county changes to map highlight
  useEffect(() => {
    if (prevCounty.current === selectedCounty) return;
    prevCounty.current = selectedCounty;
    window.dispatchEvent(
      new CustomEvent("communeusa:county-highlight", {
        detail: { county: selectedCounty },
      }),
    );
  }, [selectedCounty]);

  // Fetch district officials once when first switching to Districts mode
  const handleLayerModeChange = useCallback(async (mode: LayerMode) => {
    setLayerMode(mode);
    if (mode === "districts" && !districtOfficials && !loadingOfficials) {
      setLoadingOfficials(true);
      try {
        const [officials, redrawn] = await Promise.all([
          getDistrictOfficials(),
          getRedistrictedDistricts(),
        ]);
        setDistrictOfficials(officials);
        setRecentlyRedrawn(redrawn);
      } finally {
        setLoadingOfficials(false);
      }
    }
  }, [districtOfficials, loadingOfficials]);

  const activeDistrictType = layerMode === "districts" ? districtSubType : null;

  return (
    <div className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray overflow-hidden mb-8">
      {/* Map header */}
      <div className="px-4 py-2.5 border-b border-brand-light-gray/50 dark:border-brand-dark-gray/60 flex flex-wrap items-center gap-3">

        {/* Layer mode toggle — Counties / Districts */}
        <div className="flex gap-0.5 p-0.5 rounded-lg bg-brand-light-gray/30 dark:bg-brand-dark-gray/60">
          {(["counties", "districts"] as LayerMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleLayerModeChange(mode)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                layerMode === mode
                  ? "bg-white dark:bg-brand-charcoal text-brand-navy dark:text-brand-off-white shadow-sm"
                  : "text-brand-navy/50 dark:text-brand-off-white/45 hover:text-brand-navy dark:hover:text-brand-off-white"
              }`}
            >
              {mode === "counties" ? "Counties" : "Districts"}
            </button>
          ))}
        </div>

        {/* District sub-toggle — Congressional / State House / State Senate */}
        {layerMode === "districts" && (
          <div className="flex gap-0.5 p-0.5 rounded-lg bg-brand-light-gray/30 dark:bg-brand-dark-gray/60">
            {(["congressional", "house", "senate"] as DistrictType[]).map((type) => (
              <button
                key={type}
                onClick={() => setDistrictSubType(type)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  districtSubType === type
                    ? "bg-white dark:bg-brand-charcoal text-brand-navy dark:text-brand-off-white shadow-sm"
                    : "text-brand-navy/50 dark:text-brand-off-white/45 hover:text-brand-navy dark:hover:text-brand-off-white"
                }`}
              >
                {type === "congressional" ? "Congressional" : type === "house" ? "State House" : "State Senate"}
              </button>
            ))}
          </div>
        )}

        {/* County mode — selection status + clear */}
        {layerMode === "counties" && (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-navy/45 dark:text-brand-off-white/40 ml-auto">
              {selectedCounty
                ? `${selectedCounty} County selected`
                : "Click a county to filter elections"}
            </p>
            {selectedCounty && (
              <button
                onClick={onReset}
                className="text-xs text-brand-navy/50 dark:text-brand-off-white/45 hover:text-brand-primary dark:hover:text-brand-red transition-colors"
              >
                Clear
              </button>
            )}
          </>
        )}

        {/* Districts mode — hint + redrawn legend */}
        {layerMode === "districts" && (
          <div className="ml-auto flex items-center gap-3">
            {recentlyRedrawn && Object.values(recentlyRedrawn).some((arr) => arr.length > 0) && (
              <span className="flex items-center gap-1.5 text-xs text-brand-navy/50 dark:text-brand-off-white/40">
                <svg width="20" height="8" viewBox="0 0 20 8" fill="none">
                  <line x1="0" y1="4" x2="20" y2="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
                </svg>
                Redrawn recently
              </span>
            )}
            <p className="text-xs text-brand-navy/40 dark:text-brand-off-white/35">
              {loadingOfficials ? "Loading…" : "Click a district to view representative"}
            </p>
          </div>
        )}
      </div>

      <USMap
        initialState={WA_FIPS}
        onCountyClick={layerMode === "counties" ? onCountySelect : undefined}
        districtType={activeDistrictType}
        districtOfficials={districtOfficials ?? undefined}
        recentlyRedrawn={recentlyRedrawn ?? undefined}
      />
    </div>
  );
}

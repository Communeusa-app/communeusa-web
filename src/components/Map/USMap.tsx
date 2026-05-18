"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import type { DistrictType, DistrictOfficialMap, DistrictRep, RecentlyRedrawn } from "@/app/actions/districts";

const STATES_URL   = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const COUNTIES_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";

const DISTRICT_URLS: Record<DistrictType, string> = {
  congressional: "/districts/congressional.geojson",
  house:         "/districts/house_districts_wa.geojson",
  senate:        "/districts/senate_districts_wa.geojson",
};

// GeoJSON property key that holds the (zero-padded) district number
const DISTRICT_NUM_KEY: Record<DistrictType, string> = {
  congressional: "CD119FP",
  house:         "SLDLST",
  senate:        "SLDUST",
};

// Module-level fallback — replaced at runtime by prop from Supabase
const EMPTY_REDRAWN: Record<DistrictType, Set<string>> = {
  congressional: new Set(),
  house:         new Set(),
  senate:        new Set(),
};

const FILL                 = "#B5D4F4";
const FILL_HOVER           = "#185FA5";
const FILL_MUTED           = "#D3D1C7";
const FILL_HIGHLIGHT_LIGHT = "#E24B4A";
const FILL_HIGHLIGHT_DARK  = "#185FA5";
const DISTRICT_FILL        = "rgba(24,95,165,0.14)";
const DISTRICT_FILL_HOVER  = "rgba(24,95,165,0.38)";
const STROKE               = "#ffffff";
const WIDTH                = 960;
const HEIGHT               = 600;
const WA_FIPS              = "53";
const ZOOM_DURATION        = 750;

const WA_COUNTY_NAMES: Record<string, string> = {
  "53001": "Adams",        "53003": "Asotin",       "53005": "Benton",
  "53007": "Chelan",       "53009": "Clallam",      "53011": "Clark",
  "53013": "Columbia",     "53015": "Cowlitz",      "53017": "Douglas",
  "53019": "Ferry",        "53021": "Franklin",     "53023": "Garfield",
  "53025": "Grant",        "53027": "Grays Harbor", "53029": "Island",
  "53031": "Jefferson",    "53033": "King",          "53035": "Kitsap",
  "53037": "Kittitas",     "53039": "Klickitat",    "53041": "Lewis",
  "53043": "Lincoln",      "53045": "Mason",         "53047": "Okanogan",
  "53049": "Pacific",      "53051": "Pend Oreille", "53053": "Pierce",
  "53055": "San Juan",     "53057": "Skagit",        "53059": "Skamania",
  "53061": "Snohomish",    "53063": "Spokane",       "53065": "Stevens",
  "53067": "Thurston",     "53069": "Wahkiakum",    "53071": "Walla Walla",
  "53073": "Whatcom",      "53075": "Whitman",       "53077": "Yakima",
};

let waCountiesCache: GeoJSON.Feature[] | null = null;
const geoJsonCache = new Map<string, GeoJSON.FeatureCollection>();

interface DistrictTooltip {
  x: number;
  y: number;
  title: string;
  reps: string[];
}

interface Props {
  initialState?:      string;
  onStateClick?:      (fipsId: string) => void;
  onCountyClick?:     (countyName: string) => void;
  districtType?:      DistrictType | null;
  districtOfficials?: DistrictOfficialMap;
  recentlyRedrawn?:   RecentlyRedrawn;
}

interface SimpleTooltip { x: number; y: number }

export function USMap({
  initialState,
  onStateClick,
  onCountyClick,
  districtType,
  districtOfficials,
  recentlyRedrawn,
}: Props) {
  const containerRef          = useRef<HTMLDivElement>(null);
  const svgRef                = useRef<SVGSVGElement>(null);
  const onClickRef            = useRef(onStateClick);
  const onCountyClickRef      = useRef(onCountyClick);
  const resetRef              = useRef<(() => void) | null>(null);
  const initialStateRef       = useRef(initialState);
  const inStateViewRef        = useRef(false);
  const waFeatureRef          = useRef<GeoJSON.Feature | null>(null);
  const highlightedCountyRef  = useRef<string | null>(null);
  const pendingHighlightRef   = useRef<string | null>(null);
  const districtTypeRef       = useRef(districtType ?? null);
  const districtOfficialsRef  = useRef(districtOfficials ?? null);
  const recentlyRedrawnRef    = useRef<Record<DistrictType, Set<string>>>(EMPTY_REDRAWN);
  const updateDistrictRef     = useRef<((type: DistrictType | null) => Promise<void>) | null>(null);

  const [inStateView,     setInStateView]     = useState(false);
  const [simpleTooltip,   setSimpleTooltip]   = useState<SimpleTooltip | null>(null);
  const [districtTooltip, setDistrictTooltip] = useState<DistrictTooltip | null>(null);
  const [mapLoading,      setMapLoading]      = useState(true);
  const [mapError,        setMapError]        = useState<string | null>(null);

  useEffect(() => { onClickRef.current = onStateClick; });
  useEffect(() => { onCountyClickRef.current = onCountyClick; });
  useEffect(() => { districtTypeRef.current = districtType ?? null; }, [districtType]);
  useEffect(() => { districtOfficialsRef.current = districtOfficials ?? null; }, [districtOfficials]);
  useEffect(() => {
    recentlyRedrawnRef.current = recentlyRedrawn
      ? {
          congressional: new Set(recentlyRedrawn.congressional),
          house:         new Set(recentlyRedrawn.house),
          senate:        new Set(recentlyRedrawn.senate),
        }
      : EMPTY_REDRAWN;
  }, [recentlyRedrawn]);

  // React to districtType prop changes — delegate to the D3-managed update function
  useEffect(() => {
    updateDistrictRef.current?.(districtType ?? null);
    if (districtType) setDistrictTooltip(null);
  }, [districtType]);

  useEffect(() => {
    const svgEl       = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl) return;

    let cancelled   = false;
    let countyDrawn = false;

    const svg        = d3.select(svgEl);
    const projection = d3.geoAlbersUsa().scale(1300).translate([WIDTH / 2, HEIGHT / 2]);
    const pathGen    = d3.geoPath().projection(projection);

    const zoomGroup      = svg.append("g");
    const statesLayer    = zoomGroup.append("g");
    const countiesLayer  = zoomGroup.append("g");
    const districtsLayer = zoomGroup.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (ev) => {
        const { k, x, y } = ev.transform;
        const clampedX = Math.min(0, Math.max(x, WIDTH  * (1 - k)));
        const clampedY = Math.min(0, Math.max(y, HEIGHT * (1 - k)));
        zoomGroup.attr("transform", `translate(${clampedX},${clampedY}) scale(${k})`);
      });
    svg.call(zoom);

    function onWheel(e: WheelEvent) { e.preventDefault(); }
    svgEl.addEventListener("wheel", onWheel, { passive: false });

    function zoomToFeature(feature: GeoJSON.Feature) {
      const [[x0, y0], [x1, y1]] = pathGen.bounds(feature);
      const scale = Math.min(8, 0.85 / Math.max((x1 - x0) / WIDTH, (y1 - y0) / HEIGHT));
      svg.transition("zoom").duration(ZOOM_DURATION).call(
        zoom.transform,
        d3.zoomIdentity.translate(WIDTH / 2, HEIGHT / 2).scale(scale).translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      );
    }

    function highlightFill() {
      return document.documentElement.classList.contains("dark") ? FILL_HIGHLIGHT_DARK : FILL_HIGHLIGHT_LIGHT;
    }

    function applyCountyHighlight(countyName: string | null) {
      const hFill = highlightFill();
      highlightedCountyRef.current = countyName;
      countiesLayer
        .selectAll<SVGPathElement, GeoJSON.Feature>("path")
        .transition("highlight").duration(200)
        .attr("fill", (d) => WA_COUNTY_NAMES[String(d.id ?? "")] === countyName ? hFill : FILL);
    }

    // ── District helpers ──────────────────────────────────────────────────────

    function getDistrictNum(feature: GeoJSON.Feature, type: DistrictType): string {
      const raw = (feature.properties ?? {})[DISTRICT_NUM_KEY[type]] as string ?? "0";
      return String(parseInt(raw, 10)); // strip leading zeros
    }

    function getDistrictReps(feature: GeoJSON.Feature, type: DistrictType): DistrictRep[] {
      const officials = districtOfficialsRef.current;
      if (!officials) return [];
      const num = getDistrictNum(feature, type);
      if (type === "congressional") return officials.congressional[num] ? [officials.congressional[num]] : [];
      if (type === "senate")        return officials.senate[num]        ? [officials.senate[num]]        : [];
      return officials.house[num] ?? [];
    }

    function relPos(ev: MouseEvent) {
      const r = containerEl!.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    }

    // ── District layer ────────────────────────────────────────────────────────

    updateDistrictRef.current = async (type: DistrictType | null) => {
      if (!inStateViewRef.current) return;
      districtsLayer.selectAll("path").remove();
      setDistrictTooltip(null);

      if (!type) {
        countiesLayer.selectAll<SVGPathElement, GeoJSON.Feature>("path")
          .attr("pointer-events", "all")
          .transition().duration(300).attr("opacity", 1);
        return;
      }

      // Hide counties while districts are shown
      countiesLayer.selectAll<SVGPathElement, GeoJSON.Feature>("path")
        .attr("pointer-events", "none")
        .transition().duration(200).attr("opacity", 0);

      const url = DISTRICT_URLS[type];
      let geoData = geoJsonCache.get(url);
      if (!geoData) {
        try {
          geoData = await d3.json(url) as GeoJSON.FeatureCollection;
          geoJsonCache.set(url, geoData);
        } catch { return; }
      }
      if (!inStateViewRef.current || cancelled) return;

      const redrawn = recentlyRedrawnRef.current[type];

      districtsLayer
        .selectAll<SVGPathElement, GeoJSON.Feature>("path")
        .data(geoData.features)
        .join("path")
        .attr("fill", DISTRICT_FILL)
        .attr("stroke", STROKE)
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("vector-effect", "non-scaling-stroke")
        .attr("stroke-dasharray", (d) => redrawn.has(getDistrictNum(d, type)) ? "6 3" : "none")
        .attr("cursor", "pointer")
        .attr("pointer-events", "all")
        .attr("opacity", 0)
        .attr("d", (d) => pathGen(d) ?? "")
        .on("mouseenter", function (ev, d) {
          d3.select(this).transition().duration(120).attr("fill", DISTRICT_FILL_HOVER);
          const props   = d.properties ?? {};
          const title   = (props.NAMELSAD as string) ?? getDistrictNum(d, type);
          const reps    = getDistrictReps(d, type);
          const repNames = reps.length ? reps.map((r) => r.name) : ["No representative on file"];
          setDistrictTooltip({ ...relPos(ev), title, reps: repNames });
        })
        .on("mousemove", (ev) => {
          setDistrictTooltip((prev) => prev ? { ...prev, ...relPos(ev) } : null);
        })
        .on("mouseleave", function () {
          d3.select(this).transition().duration(120).attr("fill", DISTRICT_FILL);
          setDistrictTooltip(null);
        })
        .on("click", (_, d) => {
          const reps = getDistrictReps(d, type);
          if (reps.length > 0) window.location.href = `/officials/${reps[0].id}`;
        })
        .transition("fade").duration(400).attr("opacity", 1);
    };

    // ── County layer ──────────────────────────────────────────────────────────

    async function loadCounties() {
      if (countyDrawn) return;

      if (!waCountiesCache) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let topo: any;
        try { topo = await d3.json(COUNTIES_URL); }
        catch { if (!cancelled) setMapError("Failed to load county data. Please refresh."); return; }
        if (cancelled || !inStateViewRef.current) return;
        const { features } = topojson.feature(topo, topo.objects.counties) as unknown as GeoJSON.FeatureCollection;
        waCountiesCache = features.filter((f) => String(f.id ?? "").startsWith(WA_FIPS));
      }

      if (!inStateViewRef.current) return;
      countyDrawn = true;

      const pending = pendingHighlightRef.current;
      if (pending) { highlightedCountyRef.current = pending; pendingHighlightRef.current = null; }
      const hFill = highlightFill();
      const inDistrictMode = !!districtTypeRef.current;

      countiesLayer
        .selectAll<SVGPathElement, GeoJSON.Feature>("path")
        .data(waCountiesCache!)
        .join("path")
        .attr("fill", (d) => WA_COUNTY_NAMES[String(d.id ?? "")] === highlightedCountyRef.current ? hFill : FILL)
        .attr("stroke", STROKE)
        .attr("stroke-width", 0.5)
        .attr("stroke-linejoin", "round")
        .attr("vector-effect", "non-scaling-stroke")
        .attr("cursor", "pointer")
        .attr("pointer-events", inDistrictMode ? "none" : "all")
        .attr("d", (d) => pathGen(d) ?? "")
        .attr("opacity", 0)
        .on("mouseenter", function (_, d) {
          const name = WA_COUNTY_NAMES[String(d.id ?? "")];
          if (name === highlightedCountyRef.current) return;
          d3.select(this).transition().duration(120).attr("fill", FILL_HOVER);
        })
        .on("mouseleave", function (_, d) {
          const name = WA_COUNTY_NAMES[String(d.id ?? "")];
          d3.select(this).transition().duration(120)
            .attr("fill", name === highlightedCountyRef.current ? highlightFill() : FILL);
        })
        .on("click", (_, d) => {
          const fipsId     = String(d.id ?? "");
          const countyName = WA_COUNTY_NAMES[fipsId];
          if (highlightedCountyRef.current) applyCountyHighlight(null);
          onClickRef.current?.(fipsId);
          if (countyName) onCountyClickRef.current?.(countyName);
        })
        .transition("fade").duration(400).attr("opacity", inDistrictMode ? 0 : 1);

      // If district mode was already active when counties loaded, apply it now
      if (inDistrictMode) {
        updateDistrictRef.current?.(districtTypeRef.current);
      }
    }

    // ── Reset ─────────────────────────────────────────────────────────────────

    resetRef.current = () => {
      inStateViewRef.current = false;
      countyDrawn = false;
      highlightedCountyRef.current = null;
      pendingHighlightRef.current = null;
      setInStateView(false);
      setSimpleTooltip(null);
      setDistrictTooltip(null);

      svg.transition("zoom").duration(400)
        .call(zoom.transform, d3.zoomIdentity)
        .on("end", () => {
          countiesLayer.selectAll("path").remove();
          districtsLayer.selectAll("path").remove();
          statesLayer
            .selectAll<SVGPathElement, GeoJSON.Feature>("path")
            .attr("fill", FILL).attr("pointer-events", "auto").attr("cursor", "pointer");
        });
    };

    // ── county-highlight event (address lookup) ───────────────────────────────

    function handleCountyHighlight(e: Event) {
      const county = (e as CustomEvent<{ county: string | null }>).detail?.county;
      if (county === undefined) return;

      if (!inStateViewRef.current) {
        const waFeature = waFeatureRef.current;
        if (!waFeature) return;
        pendingHighlightRef.current = county;
        inStateViewRef.current = true;
        setInStateView(true);
        setSimpleTooltip(null);
        statesLayer.selectAll<SVGPathElement, GeoJSON.Feature>("path")
          .filter((f) => String(f.id ?? "") !== WA_FIPS)
          .transition().duration(ZOOM_DURATION)
          .attr("fill", FILL_MUTED).attr("pointer-events", "none").attr("cursor", "default");
        zoomToFeature(waFeature);
        loadCounties();
      } else if (countyDrawn) {
        applyCountyHighlight(county);
      } else {
        pendingHighlightRef.current = county;
      }
    }

    window.addEventListener("communeusa:county-highlight", handleCountyHighlight);

    // ── State layer ───────────────────────────────────────────────────────────

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    d3.json(STATES_URL).then((topo: any) => {
      if (cancelled || !topo) return;
      setMapLoading(false);

      const { features } = topojson.feature(topo, topo.objects.states) as unknown as GeoJSON.FeatureCollection;
      waFeatureRef.current = features.find((f) => String(f.id ?? "") === WA_FIPS) ?? null;

      statesLayer
        .selectAll<SVGPathElement, GeoJSON.Feature>("path")
        .data(features)
        .join("path")
        .attr("fill", FILL)
        .attr("stroke", STROKE)
        .attr("stroke-width", 0.5)
        .attr("stroke-linejoin", "round")
        .attr("vector-effect", "non-scaling-stroke")
        .attr("cursor", "pointer")
        .attr("d", (d) => pathGen(d) ?? "")
        .on("mouseenter", function (ev, d) {
          if (inStateViewRef.current) return;
          d3.select(this).transition().duration(120).attr("fill", FILL_HOVER);
          if (String(d.id ?? "") !== WA_FIPS) setSimpleTooltip(relPos(ev));
        })
        .on("mousemove", (ev, d) => {
          if (inStateViewRef.current || String(d.id ?? "") === WA_FIPS) return;
          setSimpleTooltip(relPos(ev));
        })
        .on("mouseleave", function () {
          d3.select(this).transition().duration(120).attr("fill", FILL);
          setSimpleTooltip(null);
        })
        .on("click", (_, d) => {
          if (inStateViewRef.current) return;
          const fipsId = String(d.id ?? "");
          if (fipsId !== WA_FIPS) return;
          onClickRef.current?.(fipsId);
          inStateViewRef.current = true;
          setInStateView(true);
          setSimpleTooltip(null);
          statesLayer.selectAll<SVGPathElement, GeoJSON.Feature>("path")
            .filter((f) => String(f.id ?? "") !== WA_FIPS)
            .transition().duration(ZOOM_DURATION)
            .attr("fill", FILL_MUTED).attr("pointer-events", "none").attr("cursor", "default");
          zoomToFeature(d);
          loadCounties();
        });

      if (initialStateRef.current === WA_FIPS) {
        const waFeature = waFeatureRef.current;
        if (waFeature) {
          inStateViewRef.current = true;
          setInStateView(true);
          statesLayer.selectAll<SVGPathElement, GeoJSON.Feature>("path")
            .filter((f) => String(f.id ?? "") !== WA_FIPS)
            .attr("fill", FILL_MUTED).attr("pointer-events", "none").attr("cursor", "default");
          zoomToFeature(waFeature);
          loadCounties();
        }
      }
    }).catch(() => {
      if (!cancelled) { setMapLoading(false); setMapError("Failed to load map data. Please refresh."); }
    });

    return () => {
      cancelled = true;
      svgEl.removeEventListener("wheel", onWheel);
      window.removeEventListener("communeusa:county-highlight", handleCountyHighlight);
      svg.on(".zoom", null);
      svg.selectAll("*").remove();
      updateDistrictRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full pointer-events-none">
      {mapLoading && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-brand-navy/40 dark:text-brand-off-white/40">Loading map…</p>
        </div>
      )}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-brand-red">{mapError}</p>
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ display: "block", touchAction: "none", pointerEvents: "auto" }}
        role="img"
        aria-label="Interactive map of Washington State"
      />

      {inStateView && (
        <button
          onClick={() => resetRef.current?.()}
          style={{ pointerEvents: "auto" }}
          className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg border border-brand-light-gray dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray px-3 py-1.5 text-sm font-medium text-brand-navy dark:text-brand-off-white shadow-sm hover:bg-brand-light-blue/30 dark:hover:bg-brand-red/10 hover:text-brand-primary dark:hover:text-brand-red transition-colors"
        >
          ← All States
        </button>
      )}

      {/* "Coming soon" tooltip for non-WA states */}
      {simpleTooltip && !inStateView && (
        <div
          className="pointer-events-none absolute rounded-md bg-brand-navy dark:bg-brand-charcoal px-2.5 py-1 text-xs font-medium text-white dark:text-brand-off-white shadow-md whitespace-nowrap"
          style={{ left: simpleTooltip.x, top: simpleTooltip.y - 36, transform: "translateX(-50%)" }}
        >
          Coming soon
        </div>
      )}

      {/* District hover tooltip */}
      {districtTooltip && (
        <div
          className="pointer-events-none absolute rounded-lg border border-brand-light-gray/60 dark:border-brand-dark-gray bg-white dark:bg-brand-charcoal px-3 py-2 shadow-lg whitespace-nowrap"
          style={{ left: districtTooltip.x, top: districtTooltip.y - 64, transform: "translateX(-50%)" }}
        >
          <p className="text-xs font-semibold text-brand-navy dark:text-brand-off-white">
            {districtTooltip.title}
          </p>
          {districtTooltip.reps.map((name, i) => (
            <p key={i} className="text-xs text-brand-navy/60 dark:text-brand-off-white/55 mt-0.5">
              {name}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

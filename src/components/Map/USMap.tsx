"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";

const STATES_URL   = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const COUNTIES_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";

const FILL                = "#B5D4F4"; // brand-light-blue
const FILL_HOVER          = "#185FA5"; // brand-primary
const FILL_MUTED          = "#D3D1C7"; // brand-light-gray — non-WA states when zoomed
const FILL_HIGHLIGHT_LIGHT = "#E24B4A"; // brand-red  (light mode)
const FILL_HIGHLIGHT_DARK  = "#185FA5"; // brand-primary (dark mode)
const STROKE              = "#ffffff";
const WIDTH               = 960;
const HEIGHT              = 600;
const WA_FIPS             = "53";
const ZOOM_DURATION       = 750;

// Full FIPS → name lookup for all 39 WA counties
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

// Module-level cache so remounting doesn't re-fetch the county file
let waCountiesCache: GeoJSON.Feature[] | null = null;

interface Props {
  initialState?:  string;
  onStateClick?:  (fipsId: string) => void;
  onCountyClick?: (countyName: string) => void;
}

interface Tooltip { x: number; y: number }

export function USMap({ initialState, onStateClick, onCountyClick }: Props) {
  const containerRef       = useRef<HTMLDivElement>(null);
  const svgRef             = useRef<SVGSVGElement>(null);
  const onClickRef         = useRef(onStateClick);
  const onCountyClickRef   = useRef(onCountyClick);
  const resetRef           = useRef<(() => void) | null>(null);
  const initialStateRef    = useRef(initialState);
  // Ref so D3 handlers can read current zoom state without going stale
  const inStateViewRef     = useRef(false);
  // County highlight state shared across D3 closures
  const waFeatureRef       = useRef<GeoJSON.Feature | null>(null);
  const highlightedCountyRef = useRef<string | null>(null);
  const pendingHighlightRef  = useRef<string | null>(null);

  const [inStateView, setInStateView] = useState(false);
  const [tooltip, setTooltip]         = useState<Tooltip | null>(null);
  const [mapLoading, setMapLoading]   = useState(true);
  const [mapError, setMapError]       = useState<string | null>(null);

  useEffect(() => { onClickRef.current = onStateClick; });
  useEffect(() => { onCountyClickRef.current = onCountyClick; });

  useEffect(() => {
    const svgEl       = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl) return;

    let cancelled    = false;
    let countyDrawn  = false; // true once county paths are in the DOM

    const svg        = d3.select(svgEl);
    const projection = d3.geoAlbersUsa().scale(1300).translate([WIDTH / 2, HEIGHT / 2]);
    const pathGen    = d3.geoPath().projection(projection);

    // ── Layer order: states below counties ───────────────────────────────
    const zoomGroup     = svg.append("g");
    const statesLayer   = zoomGroup.append("g");
    const countiesLayer = zoomGroup.append("g");

    // ── Zoom behaviour ────────────────────────────────────────────────────
    // translateExtent is intentionally omitted: it reads the SVG's rendered
    // pixel size, which differs from the viewBox when the element scales
    // responsively. Instead, we clamp x/y manually in viewBox coordinates.
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (ev) => {
        const { k, x, y } = ev.transform;
        const clampedX = Math.min(0, Math.max(x, WIDTH  * (1 - k)));
        const clampedY = Math.min(0, Math.max(y, HEIGHT * (1 - k)));
        zoomGroup.attr("transform", `translate(${clampedX},${clampedY}) scale(${k})`);
      });
    svg.call(zoom);

    // Prevent the browser from scrolling the page when the wheel is used over
    // the map. Must be a non-passive native listener — D3's own handler alone
    // is not sufficient in all browsers.
    function onWheel(e: WheelEvent) { e.preventDefault(); }
    svgEl.addEventListener("wheel", onWheel, { passive: false });

    function zoomToFeature(feature: GeoJSON.Feature) {
      const [[x0, y0], [x1, y1]] = pathGen.bounds(feature);
      const scale = Math.min(
        8,
        0.85 / Math.max((x1 - x0) / WIDTH, (y1 - y0) / HEIGHT),
      );
      // Named transition "zoom" so the reset can cancel it if triggered early
      svg.transition("zoom").duration(ZOOM_DURATION).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(WIDTH / 2, HEIGHT / 2)
          .scale(scale)
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      );
    }

    // ── County highlight helpers ──────────────────────────────────────────
    function highlightFill() {
      return document.documentElement.classList.contains("dark")
        ? FILL_HIGHLIGHT_DARK
        : FILL_HIGHLIGHT_LIGHT;
    }

    function applyCountyHighlight(countyName: string | null) {
      const hFill = highlightFill();
      highlightedCountyRef.current = countyName;
      countiesLayer
        .selectAll<SVGPathElement, GeoJSON.Feature>("path")
        .transition("highlight").duration(200)
        .attr("fill", (d) => {
          const name = WA_COUNTY_NAMES[String(d.id ?? "")];
          return name === countyName ? hFill : FILL;
        });
    }

    // ── County layer ──────────────────────────────────────────────────────
    async function loadCounties() {
      if (countyDrawn) return;

      // Populate cache on first load
      if (!waCountiesCache) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let topo: any;
        try {
          topo = await d3.json(COUNTIES_URL);
        } catch {
          if (!cancelled) setMapError("Failed to load county data. Please refresh.");
          return;
        }
        // Abort if unmounted or user already navigated back
        if (cancelled || !inStateViewRef.current) return;
        const { features } = topojson.feature(
          topo,
          topo.objects.counties,
        ) as unknown as GeoJSON.FeatureCollection;
        waCountiesCache = features.filter((f) =>
          String(f.id ?? "").startsWith(WA_FIPS),
        );
      }

      if (!inStateViewRef.current) return;
      countyDrawn = true;

      // Consume any pending highlight set before counties finished loading
      const pending = pendingHighlightRef.current;
      if (pending) {
        highlightedCountyRef.current = pending;
        pendingHighlightRef.current = null;
      }
      const hFill = highlightFill();

      countiesLayer
        .selectAll<SVGPathElement, GeoJSON.Feature>("path")
        .data(waCountiesCache!)
        .join("path")
        .attr("fill", (d) => {
          const name = WA_COUNTY_NAMES[String(d.id ?? "")];
          return name === highlightedCountyRef.current ? hFill : FILL;
        })
        .attr("stroke", STROKE)
        .attr("stroke-width", 0.5)
        .attr("stroke-linejoin", "round")
        // Keeps stroke visually thin regardless of zoom scale
        .attr("vector-effect", "non-scaling-stroke")
        .attr("cursor", "pointer")
        // "all" ensures hover fires even before the opacity fade-in completes.
        // The SVG default "visiblePainted" suppresses events on opacity-0 elements.
        .attr("pointer-events", "all")
        .attr("d", (d) => pathGen(d) ?? "")
        .attr("opacity", 0)
        .on("mouseenter", function (_, d) {
          const name = WA_COUNTY_NAMES[String(d.id ?? "")];
          if (name === highlightedCountyRef.current) return;
          d3.select(this).transition().duration(120).attr("fill", FILL_HOVER);
        })
        .on("mouseleave", function (_, d) {
          const name = WA_COUNTY_NAMES[String(d.id ?? "")];
          const restoreFill = name === highlightedCountyRef.current ? highlightFill() : FILL;
          d3.select(this).transition().duration(120).attr("fill", restoreFill);
        })
        .on("click", (_, d) => {
          const fipsId     = String(d.id ?? "");
          const countyName = WA_COUNTY_NAMES[fipsId];
          // Clicking a county clears any address-lookup highlight
          if (highlightedCountyRef.current) applyCountyHighlight(null);
          onClickRef.current?.(fipsId);
          if (countyName) onCountyClickRef.current?.(countyName);
        })
        .transition("fade")
        .duration(400)
        .attr("opacity", 1);
    }

    // ── Reset to full-US view (called by back button) ─────────────────────
    resetRef.current = () => {
      inStateViewRef.current = false;
      countyDrawn = false;
      highlightedCountyRef.current = null;
      pendingHighlightRef.current = null;
      setInStateView(false);
      setTooltip(null);

      // Named "zoom" cancels any in-progress zoom-in. Restore layers only after
      // the transition fully completes so the viewport is settled first.
      svg.transition("zoom").duration(400)
        .call(zoom.transform, d3.zoomIdentity)
        .on("end", () => {
          countiesLayer.selectAll("path").remove();

          statesLayer
            .selectAll<SVGPathElement, GeoJSON.Feature>("path")
            .attr("fill", FILL)
            .attr("pointer-events", "auto")
            .attr("cursor", "pointer");
        });
    };

    // ── Helper: cursor-relative tooltip position ──────────────────────────
    function relPos(ev: MouseEvent) {
      const r = containerEl!.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    }

    // ── county-highlight event from address lookup ────────────────────────
    function handleCountyHighlight(e: Event) {
      const county = (e as CustomEvent<{ county: string | null }>).detail?.county;
      if (county === undefined) return;

      if (!inStateViewRef.current) {
        // Zoom into WA first, then load counties with the highlight pending
        const waFeature = waFeatureRef.current;
        if (!waFeature) return;

        pendingHighlightRef.current = county;
        inStateViewRef.current = true;
        setInStateView(true);
        setTooltip(null);

        statesLayer
          .selectAll<SVGPathElement, GeoJSON.Feature>("path")
          .filter((f) => String(f.id ?? "") !== WA_FIPS)
          .transition().duration(ZOOM_DURATION)
          .attr("fill", FILL_MUTED)
          .attr("pointer-events", "none")
          .attr("cursor", "default");

        zoomToFeature(waFeature);
        loadCounties();
      } else if (countyDrawn) {
        // Counties already on screen — apply immediately
        applyCountyHighlight(county);
      } else {
        // loadCounties() is in-flight; it will pick up pendingHighlightRef
        pendingHighlightRef.current = county;
      }
    }

    window.addEventListener("communeusa:county-highlight", handleCountyHighlight);

    // ── State layer ───────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    d3.json(STATES_URL).then((topo: any) => {
      if (cancelled || !topo) return;
      setMapLoading(false);

      const { features } = topojson.feature(
        topo,
        topo.objects.states,
      ) as unknown as GeoJSON.FeatureCollection;

      // Store WA feature so the county-highlight handler can zoom to it
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
          if (String(d.id ?? "") !== WA_FIPS) setTooltip(relPos(ev));
        })
        .on("mousemove", (ev, d) => {
          if (inStateViewRef.current || String(d.id ?? "") === WA_FIPS) return;
          setTooltip(relPos(ev));
        })
        .on("mouseleave", function () {
          d3.select(this).transition().duration(120).attr("fill", FILL);
          setTooltip(null);
        })
        .on("click", (_, d) => {
          if (inStateViewRef.current) return;
          const fipsId = String(d.id ?? "");

          // Non-WA states: no action (tooltip already signals "coming soon")
          if (fipsId !== WA_FIPS) return;

          onClickRef.current?.(fipsId);
          inStateViewRef.current = true;
          setInStateView(true);
          setTooltip(null);

          // Mute all other states and disable their pointer events
          statesLayer
            .selectAll<SVGPathElement, GeoJSON.Feature>("path")
            .filter((f) => String(f.id ?? "") !== WA_FIPS)
            .transition().duration(ZOOM_DURATION)
            .attr("fill", FILL_MUTED)
            .attr("pointer-events", "none")
            .attr("cursor", "default");

          zoomToFeature(d);
          loadCounties();
        });

      // ── Auto-zoom if returning from an official's profile page ─────────
      if (initialStateRef.current === WA_FIPS) {
        const waFeature = waFeatureRef.current;
        if (waFeature) {
          inStateViewRef.current = true;
          setInStateView(true);

          statesLayer
            .selectAll<SVGPathElement, GeoJSON.Feature>("path")
            .filter((f) => String(f.id ?? "") !== WA_FIPS)
            .attr("fill", FILL_MUTED)
            .attr("pointer-events", "none")
            .attr("cursor", "default");

          zoomToFeature(waFeature);
          loadCounties();
        }
      }
    }).catch(() => {
      if (!cancelled) {
        setMapLoading(false);
        setMapError("Failed to load map data. Please refresh.");
      }
    });

    return () => {
      cancelled = true;
      svgEl.removeEventListener("wheel", onWheel);
      window.removeEventListener("communeusa:county-highlight", handleCountyHighlight);
      svg.on(".zoom", null);
      svg.selectAll("*").remove();
    };
  }, []);

  return (
    // pointer-events-none on the container so the positioned div itself is
    // never the hit target — only the SVG and the overlay buttons inside it are.
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
        aria-label="Interactive map of the United States"
      />

      {/* Back button — visible only when zoomed into a state */}
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
      {tooltip && !inStateView && (
        <div
          className="pointer-events-none absolute rounded-md bg-brand-navy dark:bg-brand-charcoal px-2.5 py-1 text-xs font-medium text-white dark:text-brand-off-white shadow-md whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y - 36, transform: "translateX(-50%)" }}
        >
          Coming soon
        </div>
      )}
    </div>
  );
}

"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";

function track(e: PointerEvent<HTMLElement>, el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 100;
  const y = ((e.clientY - r.top) / r.height) * 100;
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
}

/** Headline text whose red end glows toward the cursor. Colors are unchanged at rest. */
export function GradientHeadline({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span
      ref={ref}
      className="hero-gradient-text block pb-[0.14em]"
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el || e.pointerType === "touch") return;
        const { x, y } = track(e, el);
        el.style.setProperty("--gx", `${x}%`);
        el.style.setProperty("--gy", `${y}%`);
        el.style.setProperty("--glow", "0.9em");
      }}
      onPointerLeave={() => ref.current?.style.setProperty("--glow", "0px")}
    >
      {children}
    </span>
  );
}

/** Closing banner whose two background lights follow the cursor. Same colors as before. */
export function GlowPanel({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  function reset() {
    const el = ref.current;
    if (!el) return;
    el.dataset.active = "false";
    ["--gx", "--gy", "--bx", "--by"].forEach((p) => el.style.removeProperty(p));
  }
  return (
    <div
      ref={ref}
      className={`cta-glow ${className ?? ""}`}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el || e.pointerType === "touch") return;
        const { x, y } = track(e, el);
        el.dataset.active = "true";
        el.style.setProperty("--gx", `${x}%`);
        el.style.setProperty("--gy", `${y}%`);
        el.style.setProperty("--bx", `${100 - x}%`);
        el.style.setProperty("--by", `${100 - y}%`);
      }}
      onPointerLeave={reset}
    >
      {children}
    </div>
  );
}

"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";

function track(e: PointerEvent<HTMLElement>, el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 100;
  const y = ((e.clientY - r.top) / r.height) * 100;
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
}

/** The three-line hero headline. A red glow follows the cursor across every line; colors at rest are unchanged
 *  (solid on the first lines, the last line fades to red). */
export function GradientHeadline({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLHeadingElement>(null);
  function setGlow(el: HTMLHeadingElement, x: number | null, y: number | null) {
    el.querySelectorAll<HTMLElement>(".hero-line").forEach((line) => {
      if (x === null || y === null) {
        line.style.setProperty("--glow", "0px");
        return;
      }
      const r = line.getBoundingClientRect();
      line.style.setProperty("--hx", `${x - r.left}px`);
      line.style.setProperty("--hy", `${y - r.top}px`);
      line.style.setProperty("--glow", "1.7em");
    });
  }
  return (
    <h1
      ref={ref}
      className="text-[clamp(44px,7vw,92px)] font-bold leading-[1.04] tracking-[-0.04em]"
      onPointerMove={(e) => {
        if (ref.current && e.pointerType !== "touch") setGlow(ref.current, e.clientX, e.clientY);
      }}
      onPointerLeave={() => ref.current && setGlow(ref.current, null, null)}
    >
      {lines.map((text, i) => {
        const last = i === lines.length - 1;
        return (
          <span key={text} className={`hero-line block ${last ? "hero-line--fade pb-[0.14em]" : ""}`}>
            {text}
          </span>
        );
      })}
    </h1>
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

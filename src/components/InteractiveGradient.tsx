"use client";

import { useEffect, useRef, type ReactNode, type PointerEvent } from "react";

function track(e: PointerEvent<HTMLElement>, el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 100;
  const y = ((e.clientY - r.top) / r.height) * 100;
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
}

/** The three-line hero headline. A soft red glow follows the cursor across every line, eased with a small
 *  spring so it glides instead of snapping. Colors at rest are unchanged (the last line fades to red). */
export function GradientHeadline({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const st = useRef({ tx: 0, ty: 0, x: 0, y: 0, target: 0, strength: 0, raf: 0, reduced: false });

  useEffect(() => {
    st.current.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => cancelAnimationFrame(st.current.raf);
  }, []);

  function frame() {
    const s = st.current;
    const el = ref.current;
    if (!el) return;
    s.x += (s.tx - s.x) * 0.2;
    s.y += (s.ty - s.y) * 0.2;
    s.strength += (s.target - s.strength) * 0.14;
    el.querySelectorAll<HTMLElement>(".hero-line").forEach((line) => {
      const r = line.getBoundingClientRect();
      line.style.setProperty("--hx", `${s.x - r.left}px`);
      line.style.setProperty("--hy", `${s.y - r.top}px`);
      line.style.setProperty("--gs", s.strength.toFixed(3));
    });
    const settled = Math.abs(s.tx - s.x) < 0.3 && Math.abs(s.ty - s.y) < 0.3 && Math.abs(s.target - s.strength) < 0.005;
    if (settled && s.target === 0) {
      el.querySelectorAll<HTMLElement>(".hero-line").forEach((line) => line.style.setProperty("--gs", "0"));
      s.raf = 0;
      return;
    }
    s.raf = requestAnimationFrame(frame);
  }

  function start() {
    if (!st.current.raf) st.current.raf = requestAnimationFrame(frame);
  }

  return (
    <h1
      ref={ref}
      className="text-[clamp(44px,7vw,92px)] font-bold leading-[1.04] tracking-[-0.04em]"
      onPointerEnter={(e) => {
        const s = st.current;
        if (s.reduced || e.pointerType === "touch") return;
        // Start the glow where the cursor entered so it fades in place instead of sliding in from a corner.
        s.tx = s.x = e.clientX;
        s.ty = s.y = e.clientY;
        s.target = 1;
        start();
      }}
      onPointerMove={(e) => {
        const s = st.current;
        if (s.reduced || e.pointerType === "touch") return;
        s.tx = e.clientX;
        s.ty = e.clientY;
        s.target = 1;
        start();
      }}
      onPointerLeave={() => {
        st.current.target = 0;
        start();
      }}
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

"use client";

import { useRef } from "react";

/** The hero's gradient line. Same colors as before; a red glow follows the cursor across the words. */
export function HeroGradientText({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  function move(e: React.PointerEvent<HTMLSpanElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
    el.style.setProperty("--r", `${Math.max(140, r.width * 0.22)}px`);
  }

  function leave() {
    ref.current?.style.setProperty("--r", "0px");
  }

  return (
    <span
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className="hero-glow block bg-clip-text pb-[0.14em] text-transparent"
    >
      {children}
    </span>
  );
}

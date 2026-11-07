"use client";

import { useState } from "react";

export interface HowTab {
  label: string;
  step: string;
  title: string;
  body: string;
  content: React.ReactNode;
}

export function HowTabs({ tabs }: { tabs: HowTab[] }) {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <div>
      <div role="tablist" aria-label="How CommuneUSA works" className="flex gap-3.5">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            role="tab"
            id={`how-tab-${i}`}
            aria-selected={i === active}
            aria-controls="how-panel"
            onClick={() => setActive(i)}
            className={`flex-1 border-t-[3px] pt-4 text-center text-base font-semibold transition-colors sm:text-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-light-blue ${
              i === active
                ? "border-brand-off-white text-brand-off-white"
                : "border-line text-muted hover:text-brand-off-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="how-panel"
        aria-labelledby={`how-tab-${active}`}
        className="mt-7 flex min-h-[420px] flex-wrap items-center gap-8 rounded-[32px] border border-line bg-gradient-to-br from-brand-navy via-brand-primary to-[#2C78C2] p-8 sm:p-12"
      >
        <div className="min-w-0 flex-[1_1_320px]">
          <span className="font-mono text-[13px] uppercase tracking-[0.12em] text-brand-light-blue">
            {tab.step}
          </span>
          <h3 className="mb-3.5 mt-4 text-[clamp(28px,3.4vw,42px)] font-bold leading-[1.1] tracking-[-0.03em]">
            {tab.title}
          </h3>
          <p className="text-lg leading-relaxed text-[#DCE9F7]">{tab.body}</p>
        </div>
        <div className="min-w-0 flex-[1_1_360px] rounded-[22px] border border-line bg-ink p-6">
          {tab.content}
        </div>
      </div>
    </div>
  );
}

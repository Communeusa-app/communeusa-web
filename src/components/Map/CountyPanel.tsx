"use client";

import { useEffect, useState } from "react";
import { getOfficialsByCounty } from "@/app/actions/officials";
import type { Official } from "@/app/actions/officials";

interface Props {
  countyName: string;
  onClose: () => void;
}

function partyClass(party: string | null) {
  if (party === "Democrat") return "text-brand-primary dark:text-brand-light-blue";
  if (party === "Republican") return "text-brand-red";
  return "text-brand-mid-gray";
}

export function CountyPanel({ countyName, onClose }: Props) {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setOfficials([]);

    getOfficialsByCounty(countyName).then((data) => {
      if (!alive) return;
      setOfficials(data);
      setLoading(false);
    });

    return () => { alive = false; };
  }, [countyName]);

  return (
    <div className="w-72 flex-shrink-0 flex flex-col rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-brand-light-gray/70 dark:border-brand-dark-gray">
        <h3 className="font-semibold text-sm text-brand-navy dark:text-brand-off-white">
          {countyName} County
        </h3>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-md p-1 text-brand-navy/40 dark:text-brand-off-white/40 hover:text-brand-primary dark:hover:text-brand-red hover:bg-brand-light-blue/30 dark:hover:bg-brand-red/10 transition-colors"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-h-[420px]">
        {loading ? (
          <ul className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="animate-pulse space-y-1.5 border-b border-brand-light-gray/50 dark:border-brand-dark-gray/60 pb-4 last:border-0"
              >
                <div className="h-2 w-2/3 rounded-full bg-brand-light-gray dark:bg-brand-dark-gray/80" />
                <div className="h-3 w-3/4 rounded-full bg-brand-light-gray dark:bg-brand-dark-gray/80" />
                <div className="h-2 w-1/3 rounded-full bg-brand-light-gray/60 dark:bg-brand-dark-gray/50" />
              </li>
            ))}
          </ul>
        ) : officials.length === 0 ? (
          <p className="text-xs text-brand-navy/50 dark:text-brand-off-white/45 leading-relaxed">
            No officials on record for {countyName} County.
          </p>
        ) : (
          <ul className="space-y-4">
            {officials.map((o, i) => (
              <li
                key={i}
                className="border-b border-brand-light-gray/50 dark:border-brand-dark-gray/60 pb-4 last:border-0 last:pb-0"
              >
                <p className="text-[11px] font-medium uppercase tracking-wider text-brand-navy/50 dark:text-brand-off-white/45">
                  {o.office_title ?? "—"}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-brand-navy dark:text-brand-off-white">
                  {o.official_name}
                </p>
                <p className={`mt-0.5 text-xs ${partyClass(o.party)}`}>
                  {o.party ?? "—"}
                  {o.term_end ? ` · until ${o.term_end}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOfficialsByCounty } from "@/app/actions/officials";
import type { Official } from "@/app/actions/officials";

interface Props {
  countyName: string;
  onClose: () => void;
}

function partyClass(party: string | null) {
  if (party === "Democrat") return "text-brand-primary dark:text-brand-light-blue";
  if (party === "Republican") return "text-brand-red";
  return "text-muted";
}

export function CountyPanel({ countyName, onClose }: Props) {
  const router = useRouter();
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setOfficials([]);
    setError(null);

    getOfficialsByCounty(countyName)
      .then((data) => {
        if (!alive) return;
        setOfficials(data);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("Failed to load officials. Please try again.");
        setLoading(false);
      });

    return () => { alive = false; };
  }, [countyName]);

  return (
    <div className="w-72 flex-shrink-0 flex flex-col rounded-2xl border border-line bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-line">
        <h3 className="font-semibold text-sm text-fg">
          {countyName} County
        </h3>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-md p-1 text-muted hover:text-brand-primary dark:hover:text-brand-light-blue hover:bg-fg/5 transition-colors"
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
                className="animate-pulse space-y-1.5 border-b border-line pb-4 last:border-0"
              >
                <div className="h-2 w-2/3 rounded-full bg-brand-light-gray" />
                <div className="h-3 w-3/4 rounded-full bg-brand-light-gray" />
                <div className="h-2 w-1/3 rounded-full bg-fg/5" />
              </li>
            ))}
          </ul>
        ) : error ? (
          <p className="text-xs text-brand-red leading-relaxed">{error}</p>
        ) : officials.length === 0 ? (
          <p className="text-xs text-muted leading-relaxed">
            No officials on record for {countyName} County.
          </p>
        ) : (
          <ul className="space-y-1">
            {officials.map((o) => (
              <li key={o.id}>
                <div
                  role="button"
                  onClick={() => router.push(`/officials/${o.id}`)}
                  className="group flex items-center justify-between gap-3 rounded-xl px-3 py-3 -mx-3 cursor-pointer hover:bg-fg/5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                      {o.office_title ?? "—"}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-fg truncate">
                      {o.official_name}
                    </p>
                    <p className={`mt-0.5 text-xs ${partyClass(o.party)}`}>
                      {o.party ?? "—"}
                      {o.term_end ? ` · until ${o.term_end}` : ""}
                    </p>
                  </div>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-brand-navy/25 group-hover:text-brand-primary dark:group-hover:text-brand-light-blue transition-colors"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
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

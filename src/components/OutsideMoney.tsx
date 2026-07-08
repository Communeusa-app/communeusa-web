"use client";

import { useState } from "react";
import type { OutsideMoneySummary, OutsideMoneyGroup } from "@/app/actions/officials";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const COMMITTEE_TYPE_LABELS: Record<string, string> = {
  super_pac:  "Super PAC",
  pac:        "PAC",
  hybrid_pac: "Hybrid PAC",
  party:      "Party Committee",
  other:      "Other",
};

const DEFAULT_VISIBLE = 5;

export function OutsideMoney({ data }: { data: OutsideMoneySummary }) {
  const [expanded, setExpanded] = useState(false);
  const { total_supporting, total_opposing, by_pac } = data;
  const hasData = by_pac.length > 0;
  const hasMore = by_pac.length > DEFAULT_VISIBLE;

  return (
    <div>
      <p className="text-xs text-brand-navy/55 dark:text-brand-off-white/45 leading-relaxed mb-5">
        Independent expenditures are money spent by PACs and Super PACs to support or oppose this
        official, independently and without coordinating with their campaign. This is separate from
        direct contributions.
      </p>

      {!hasData ? (
        <div className="rounded-lg border border-brand-light-gray/60 dark:border-brand-dark-gray/60 bg-brand-light-gray/20 dark:bg-brand-dark-gray/30 px-4 py-5 space-y-1.5">
          <p className="text-sm font-medium text-brand-navy/60 dark:text-brand-off-white/50">
            No significant independent expenditures on file for this official in the current cycle.
          </p>
          <p className="text-xs text-brand-navy/40 dark:text-brand-off-white/35 leading-relaxed">
            Outside spending tends to concentrate in competitive races.
          </p>
        </div>
      ) : (
        <div>
          {/* Summary totals */}
          <div className="grid grid-cols-2 gap-3 mb-6 pb-5 border-b border-brand-light-gray/60 dark:border-brand-dark-gray/60">
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/30 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-700/70 dark:text-emerald-400/60 mb-1">
                Spent Supporting
              </p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-800 dark:text-emerald-300">
                {total_supporting > 0 ? fmt.format(total_supporting) : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/30 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-red-700/70 dark:text-red-400/60 mb-1">
                Spent Opposing
              </p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-red-800 dark:text-red-300">
                {total_opposing > 0 ? fmt.format(total_opposing) : "—"}
              </p>
            </div>
          </div>

          {/* PAC list — first DEFAULT_VISIBLE always visible */}
          <div className="divide-y divide-brand-light-gray/60 dark:divide-brand-dark-gray/60">
            {by_pac.slice(0, DEFAULT_VISIBLE).map((group) => (
              <PACRow key={`${group.pac_id}-${group.support_oppose}`} group={group} />
            ))}
          </div>

          {/* Expandable remainder */}
          {hasMore && (
            <>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                  expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="divide-y divide-brand-light-gray/60 dark:divide-brand-dark-gray/60">
                    {by_pac.slice(DEFAULT_VISIBLE).map((group) => (
                      <PACRow key={`${group.pac_id}-${group.support_oppose}`} group={group} />
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setExpanded((e) => !e)}
                className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg border border-brand-light-gray dark:border-brand-dark-gray px-4 py-2.5 text-sm font-medium text-brand-navy/65 dark:text-brand-off-white/55 hover:text-brand-primary dark:hover:text-brand-red hover:border-brand-primary/40 dark:hover:border-brand-red/40 transition-all duration-150"
                aria-expanded={expanded}
              >
                {expanded ? (
                  <>Show fewer <ChevronUpIcon /></>
                ) : (
                  <>Show all {by_pac.length} organizations <ChevronDownIcon /></>
                )}
              </button>
            </>
          )}

          <p className="mt-5 text-[11px] text-brand-navy/35 dark:text-brand-off-white/30 leading-relaxed">
            Source: FEC bulk data (2024 cycle). Independent expenditures are legally required to be
            made without coordination with the candidate or their campaign. Super PACs may raise and
            spend unlimited amounts from corporations, unions, and individuals.
          </p>
        </div>
      )}
    </div>
  );
}

function PACRow({ group }: { group: OutsideMoneyGroup }) {
  const isSupport = group.support_oppose === "support";
  const typeLabel = COMMITTEE_TYPE_LABELS[group.committee_type] ?? "Other";
  const isSuperPac = group.committee_type === "super_pac";

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-brand-navy dark:text-brand-off-white truncate">
            {group.pac_name}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
            <CommitteeTypeBadge label={typeLabel} isSuperPac={isSuperPac} />
            <DirectionBadge support={isSupport} />
            {group.expenditure_count > 1 && (
              <span className="text-xs text-brand-navy/40 dark:text-brand-off-white/35">
                {group.expenditure_count} filings
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p
            className={`text-sm font-semibold ${
              isSupport
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-red-700 dark:text-red-400"
            }`}
          >
            {fmt.format(group.total_amount)}
          </p>
          <p className="text-xs text-brand-navy/40 dark:text-brand-off-white/35 mt-0.5">
            {isSupport ? "spent supporting" : "spent opposing"}
          </p>
        </div>
      </div>
    </div>
  );
}

function CommitteeTypeBadge({
  label,
  isSuperPac,
}: {
  label: string;
  isSuperPac: boolean;
}) {
  if (isSuperPac) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-300/70 dark:border-amber-600/40 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
        Super PAC
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-brand-light-gray dark:border-brand-dark-gray px-2 py-0.5 text-[11px] font-medium text-brand-navy/55 dark:text-brand-off-white/45">
      {label}
    </span>
  );
}

function DirectionBadge({ support }: { support: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        support
          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
      }`}
    >
      {support ? "Supporting" : "Opposing"}
    </span>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

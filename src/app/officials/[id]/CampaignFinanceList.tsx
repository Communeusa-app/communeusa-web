"use client";

import { useState } from "react";
import type { CampaignFinanceRecord } from "@/app/actions/officials";

const DEFAULT_VISIBLE = 5;

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// ── Public component ───────────────────────────────────────────────────────

export function CampaignFinanceList({ records }: { records: CampaignFinanceRecord[] }) {
  const [expanded, setExpanded] = useState(false);

  if (records.length === 0) {
    return (
      <p className="text-sm text-brand-navy/40 dark:text-brand-off-white/35 text-center py-4">
        No campaign finance data on file
      </p>
    );
  }

  const totalRaised = records.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const hasMore = records.length > DEFAULT_VISIBLE;
  const hiddenCount = records.length - DEFAULT_VISIBLE;

  return (
    <div>
      {/* Total raised */}
      <div className="mb-6 pb-5 border-b border-brand-light-gray/60 dark:border-brand-dark-gray/60">
        <p className="text-[11px] font-medium uppercase tracking-wider text-brand-navy/45 dark:text-brand-off-white/40 mb-1">
          Total Raised
        </p>
        <p className="text-3xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white">
          {totalRaised > 0 ? fmt.format(totalRaised) : "—"}
        </p>
        {records.length === 50 && (
          <p className="mt-1 text-xs text-brand-navy/40 dark:text-brand-off-white/35">
            Showing top 50 donors by amount
          </p>
        )}
      </div>

      {/* Always-visible first five */}
      <div className="divide-y divide-brand-light-gray/60 dark:divide-brand-dark-gray/60">
        {records.slice(0, DEFAULT_VISIBLE).map((r) => (
          <DonorCard key={r.id} record={r} />
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
                {records.slice(DEFAULT_VISIBLE).map((r) => (
                  <DonorCard key={r.id} record={r} />
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
              <>Show all {records.length} donors <ChevronDownIcon /></>
            )}
          </button>
        </>
      )}
    </div>
  );
}

// ── Donor card ─────────────────────────────────────────────────────────────

function DonorCard({ record }: { record: CampaignFinanceRecord }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-brand-navy dark:text-brand-off-white truncate">
            {record.donor_name ?? "—"}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            {record.donor_type && <DonorTypeBadge type={record.donor_type} />}
            {record.industry_sector && (
              <span className="text-xs text-brand-navy/45 dark:text-brand-off-white/40">
                {record.industry_sector}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-brand-navy dark:text-brand-off-white">
            {record.amount != null ? fmt.format(record.amount) : "—"}
          </p>
          {record.election_cycle && (
            <p className="text-xs text-brand-navy/45 dark:text-brand-off-white/40 mt-0.5">
              {record.election_cycle}
            </p>
          )}
        </div>
      </div>

      {record.source_url && (
        <a
          href={normalizeUrl(record.source_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-xs text-brand-primary dark:text-brand-red hover:opacity-75 transition-opacity"
        >
          {record.filing_source ?? "Source"} <ArrowUpRightIcon />
        </a>
      )}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────

function DonorTypeBadge({ type }: { type: string }) {
  const t = type.toLowerCase();
  let cls: string;
  if (t.includes("individual")) {
    cls = "border-brand-light-gray dark:border-brand-dark-gray text-brand-navy/60 dark:text-brand-off-white/50";
  } else if (t.includes("labor") || t.includes("union")) {
    cls = "border-brand-primary/30 text-brand-primary dark:border-brand-light-blue/30 dark:text-brand-light-blue";
  } else if (t.includes("corporate") || t.includes("business") || t.includes("pac") || t.includes("political action")) {
    cls = "border-brand-red/30 text-brand-red dark:border-brand-red/30 dark:text-brand-red";
  } else if (t.includes("public") || t.includes("voucher")) {
    cls = "border-green-400/40 text-green-700 dark:border-green-500/30 dark:text-green-400";
  } else {
    cls = "border-brand-light-gray dark:border-brand-dark-gray text-brand-navy/60 dark:text-brand-off-white/50";
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {type}
    </span>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────

function ArrowUpRightIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

// ── Util ───────────────────────────────────────────────────────────────────

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

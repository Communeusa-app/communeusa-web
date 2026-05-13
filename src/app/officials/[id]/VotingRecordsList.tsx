"use client";

import { useState } from "react";
import type { VotingRecord } from "@/app/actions/officials";

const DEFAULT_VISIBLE = 5;

// ── Public component ───────────────────────────────────────────────────────

export function VotingRecordsList({ records }: { records: VotingRecord[] }) {
  const [expanded, setExpanded] = useState(false);

  if (records.length === 0) {
    return (
      <p className="text-sm text-brand-navy/40 dark:text-brand-off-white/35 text-center py-4">
        No voting records on file
      </p>
    );
  }

  const hasMore = records.length > DEFAULT_VISIBLE;
  const hiddenCount = records.length - DEFAULT_VISIBLE;

  return (
    <div>
      {/* Always-visible first five */}
      <div className="divide-y divide-brand-light-gray/60 dark:divide-brand-dark-gray/60">
        {records.slice(0, DEFAULT_VISIBLE).map((r) => (
          <VotingRecordCard key={r.id} record={r} />
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
                  <VotingRecordCard key={r.id} record={r} />
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
              <>
                Show fewer
                <ChevronUpIcon />
              </>
            ) : (
              <>
                Show all {records.length} votes
                <ChevronDownIcon />
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────

function VotingRecordCard({ record }: { record: VotingRecord }) {
  return (
    <div className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1.5">
        <h3 className="text-sm font-semibold text-brand-navy dark:text-brand-off-white flex-1 min-w-0">
          {record.bill_name}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <VoteBadge vote={record.vote_cast} />
          {record.result && <ResultBadge result={record.result} />}
        </div>
      </div>

      {record.bill_description && (
        <p className="text-[13px] text-brand-navy/60 dark:text-brand-off-white/50 leading-relaxed mb-2">
          {record.bill_description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
        {record.topic_category && <TopicBadge category={record.topic_category} />}
        {record.vote_date && (
          <span className="text-xs text-brand-navy/45 dark:text-brand-off-white/40">
            {record.vote_date}
          </span>
        )}
      </div>

      {record.constituent_impact && (
        <p className="text-sm text-brand-navy/70 dark:text-brand-off-white/60 leading-relaxed">
          {record.constituent_impact}
        </p>
      )}

      {record.source_url && (
        <a
          href={normalizeUrl(record.source_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-brand-primary dark:text-brand-red hover:opacity-75 transition-opacity"
        >
          Source <ArrowUpRightIcon />
        </a>
      )}
    </div>
  );
}

// ── Badges ─────────────────────────────────────────────────────────────────

function VoteBadge({ vote }: { vote: string | null }) {
  if (!vote) return null;
  const v = vote.toLowerCase();
  const isYes = ["yes", "yea", "aye", "signed"].some((k) => v.includes(k));
  const isNo  = v === "no" || v === "nay" || v.startsWith("no ") || v.startsWith("nay ");
  const cls = isYes
    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : isNo
    ? "bg-brand-red/15 text-brand-red dark:bg-brand-red/20 dark:text-brand-red"
    : "bg-brand-light-gray/60 text-brand-navy/60 dark:bg-brand-dark-gray dark:text-brand-off-white/50";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {vote}
    </span>
  );
}

function ResultBadge({ result }: { result: string }) {
  const r = result.toLowerCase();
  const cls = r.includes("pass") || r.includes("enact")
    ? "text-green-700 dark:text-green-400"
    : r.includes("fail")
    ? "text-brand-red dark:text-brand-red"
    : "text-brand-navy/55 dark:text-brand-off-white/45";
  return (
    <span className={`text-xs font-semibold uppercase tracking-wide ${cls}`}>
      {result}
    </span>
  );
}

function TopicBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-brand-light-gray dark:border-brand-dark-gray px-2.5 py-0.5 text-xs font-medium text-brand-navy/60 dark:text-brand-off-white/50">
      {category}
    </span>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────

function ArrowUpRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getDonorRecipients, type DonorRecipients } from "@/app/actions/finance";

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function partyClass(party: string | null) {
  const p = (party ?? "").toLowerCase();
  if (p.startsWith("rep")) return "text-brand-red";
  if (p.startsWith("dem")) return "text-brand-primary dark:text-brand-light-blue";
  return "text-muted";
}

const KIND_LABEL = {
  contribution: "Contributed",
  support: "Spent to support",
  oppose: "Spent to oppose",
} as const;

/** A donor name shown as a clickable pill. Opens a panel listing who the donor gave to. */
export function DonorPill({
  name,
  tone = "neutral",
  className = "",
}: {
  name: string;
  tone?: "pac" | "neutral";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        title="See who this donor gives to"
        className={`group inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 dark:focus-visible:ring-brand-light-blue/50 ${
          tone === "pac"
            ? "border-brand-red/30 text-fg hover:border-brand-red/70 hover:bg-brand-red/10"
            : "border-line text-fg hover:border-fg/40 hover:bg-fg/5"
        } ${className}`}
      >
        <span className="truncate">{name}</span>
        <span aria-hidden="true" className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5">→</span>
      </button>
      {open && (
        <DonorDialog
          name={name}
          onClose={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
        />
      )}
    </>
  );
}

function DonorDialog({ name, onClose }: { name: string; onClose: () => void }) {
  const [data, setData] = useState<DonorRecipients | null>(null);
  const [failed, setFailed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let live = true;
    getDonorRecipients(name)
      .then((d) => live && setData(d))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [name]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Who ${name} gives to`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-line bg-surface text-fg sm:rounded-[28px]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">Who this donor gives to</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight">{name}</h3>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {!data && !failed && <p className="text-sm text-muted">Loading…</p>}
          {failed && <p className="text-sm text-muted">Could not load this right now. Please try again.</p>}

          {data && data.recipients.length === 0 && (
            <p className="text-sm text-muted">
              No recipients on file for this donor yet. Our campaign finance data is still being filled in.
            </p>
          )}

          {data && data.recipients.length > 0 && (
            <>
              <p className="mb-4 font-mono text-[13px] text-muted">
                {[
                  data.totalContributed > 0 ? `${money(data.totalContributed)} contributed` : null,
                  data.totalSupporting > 0 ? `${money(data.totalSupporting)} spent to support` : null,
                  data.totalOpposing > 0 ? `${money(data.totalOpposing)} spent to oppose` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {data.recipients.map((r) => (
                  <li key={`${r.officialId}-${r.kind}`}>
                    <Link
                      href={`/officials/${r.officialId}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-fg/5 focus-visible:bg-fg/5 focus-visible:outline-none"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {r.name}
                          {r.party && <span className={`ml-2 font-mono text-xs font-normal ${partyClass(r.party)}`}>{r.party}</span>}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {[r.officeTitle, r.place].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums">{money(r.amount)}</p>
                        <p
                          className={`text-[11px] ${
                            r.kind === "oppose" ? "text-brand-red" : "text-muted"
                          }`}
                        >
                          {KIND_LABEL[r.kind]}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted">
                Matched on the donor name as filed, so the same donor filed under a slightly different name may not be combined.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

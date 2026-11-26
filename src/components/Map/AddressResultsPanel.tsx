"use client";

import { useRouter } from "next/navigation";
import { LEVEL_ORDER, markLookupNavigatedAway, type AddressResult, type Level, type Rep } from "@/lib/lookup";
import { partyLabel } from "@/lib/party";

function partyClass(party: string | null) {
  if (party === "Democratic" || party === "Democrat") return "text-brand-primary dark:text-brand-light-blue";
  if (party === "Republican") return "text-brand-red";
  return "text-muted";
}

export function AddressResultsPanel({ result, onClose }: { result: AddressResult; onClose: () => void }) {
  const router = useRouter();
  const groups = LEVEL_ORDER.map((level) => ({ level, reps: result.reps.filter((r) => r.level === level) })).filter(
    (g) => g.reps.length,
  ) as { level: Level; reps: Rep[] }[];

  function open(id: string) {
    markLookupNavigatedAway();
    router.push(`/officials/${id}`);
  }

  return (
    <div className="w-72 flex-shrink-0 flex flex-col rounded-2xl border border-line bg-surface overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 py-3.5 border-b border-line">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-fg">Your officials</h3>
          <p className="mt-0.5 truncate text-xs text-muted" title={result.address}>
            {result.address}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-md p-1 text-muted hover:text-brand-primary dark:hover:text-brand-light-blue hover:bg-fg/5 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 max-h-[420px] space-y-5">
        {groups.map(({ level, reps }) => (
          <section key={level}>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              {level} · {reps.length}
            </p>
            <ul className="mt-1 space-y-1">
              {reps.map((rep, i) => {
                const body = (
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{rep.officeName}</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-fg">{rep.name}</p>
                    <p className={`mt-0.5 text-xs ${partyClass(rep.party)}`}>{partyLabel(rep.party)}</p>
                  </div>
                );
                return (
                  <li key={`${rep.name}-${i}`}>
                    {rep.dbId ? (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => open(rep.dbId!)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            open(rep.dbId!);
                          }
                        }}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 -mx-3 hover:bg-fg/5 focus-visible:bg-fg/5 focus-visible:outline-none transition-colors"
                      >
                        {body}
                      </div>
                    ) : (
                      <div className="px-3 py-2.5 -mx-3">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

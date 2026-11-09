import { SHOW_CANDIDATES, CANDIDATES_PENDING_MESSAGE } from "@/lib/electionFlags";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getElectionById } from "@/app/actions/elections";
import type { ElectionCandidate } from "@/app/actions/elections";
import { SiteShell } from "@/components/SiteShell";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ElectionPage({ params }: Props) {
  const { id } = await params;
  const election = await getElectionById(id);
  if (!election) notFound();

  return (
    <SiteShell>
<main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Back */}
        <Link
          href="/elections"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand-primary dark:hover:text-brand-light-blue transition-colors"
        >
          ← Back to elections
        </Link>

        {/* Header */}
        <div className="rounded-2xl border border-line bg-surface px-6 py-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <LevelBadge level={election.level} />
            {election.election_date && (
              <span className="inline-flex items-center rounded-full border border-brand-primary/30 dark:border-brand-red/30 bg-brand-primary/10 dark:bg-brand-red/10 px-2.5 py-0.5 text-xs font-medium text-brand-primary dark:text-brand-light-blue">
                {formatDate(election.election_date)}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">
            {election.office_name}
          </h1>
          {election.description && (
            <p className="mt-2 text-muted leading-relaxed">
              {election.description}
            </p>
          )}
          {(election.primary_date || election.filing_deadline) && (
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
              {election.primary_date && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted mb-0.5">
                    Primary
                  </dt>
                  <dd className="text-sm font-medium text-fg">
                    {formatDate(election.primary_date)}
                  </dd>
                </div>
              )}
              {election.filing_deadline && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted mb-0.5">
                    Filing Deadline
                  </dt>
                  <dd className="text-sm font-medium text-fg">
                    {formatDate(election.filing_deadline)}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Candidates */}
        <div className="rounded-2xl border border-line bg-surface px-6 py-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-5">
            Candidates
          </h2>
          {!SHOW_CANDIDATES ? (
            <p className="text-sm text-muted">{CANDIDATES_PENDING_MESSAGE}</p>
          ) : election.candidates.length === 0 ? (
            <p className="text-sm text-muted">
              No candidates on file yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {election.candidates.map((c) => (
                <CandidateCard key={c.id} candidate={c} />
              ))}
            </div>
          )}
        </div>

        {/* Source */}
        {election.source_url && (
          <a
            href={normalizeUrl(election.source_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand-primary dark:hover:text-brand-light-blue transition-colors"
          >
            View source
            <ArrowUpRightIcon />
          </a>
        )}
      </div>
    </main>
</SiteShell>
  );
}

function CandidateCard({ candidate }: { candidate: ElectionCandidate }) {
  return (
    <Link
      href={`/elections/candidates/${candidate.id}`}
      className="block rounded-2xl border border-line bg-brand-off-white/40 p-4 hover:border-fg/30 hover:bg-white dark:hover:bg-brand-dark-gray hover:shadow-sm transition-all duration-150 group"
    >
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {candidate.party && <PartyBadge party={candidate.party} />}
        {candidate.is_incumbent && <IncumbentBadge />}
      </div>
      <p className="text-base font-semibold text-fg group-hover:text-brand-primary dark:group-hover:text-brand-light-blue transition-colors">
        {candidate.name}
      </p>
      {(candidate.website || candidate.ballotpedia_url) && (
        <p className="mt-1 text-xs text-muted">
          {candidate.ballotpedia_url ? "Ballotpedia profile available" : "Campaign website available"}
        </p>
      )}
    </Link>
  );
}

/* ── Shared sub-components ────────────────────────────────────────────────── */

function PartyBadge({ party }: { party: string }) {
  const styles: Record<string, string> = {
    Democrat:
      "bg-brand-primary/10 text-fg dark:bg-brand-primary/25",
    Democratic:
      "bg-brand-primary/10 text-fg dark:bg-brand-primary/25",
    Republican:
      "bg-brand-red/15 text-brand-red dark:bg-brand-red/20",
  };
  const cls =
    styles[party] ??
    "bg-fg/5 text-muted";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {party}
    </span>
  );
}

function IncumbentBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary dark:text-brand-light-blue px-2.5 py-0.5 text-xs font-semibold">
      Incumbent
    </span>
  );
}

function LevelBadge({ level }: { level: string }) {
  const labels: Record<string, string> = {
    federal: "Federal",
    state: "State",
    county: "County",
    city: "City",
  };
  return (
    <span className="inline-flex items-center rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-muted">
      {labels[level] ?? level}
    </span>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const election = await getElectionById(id);
  if (!election) return { title: "Election not found — CommuneUSA" };
  return {
    title: `${election.office_name} — CommuneUSA`,
    description: `Candidates and details for the ${election.office_name} election.`,
  };
}

export const dynamic = "force-dynamic";

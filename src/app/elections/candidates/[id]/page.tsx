import Link from "next/link";
import { notFound } from "next/navigation";
import { CorrectionModal } from "@/components/CorrectionModal";
import {
  getCandidateById,
  getCandidatePositions,
  getCandidateEndorsements,
} from "@/app/actions/elections";
import { getVotingRecords, getCampaignFinance } from "@/app/actions/officials";
import { VotingRecordsList } from "@/app/officials/[id]/VotingRecordsList";
import { CampaignFinanceList } from "@/app/officials/[id]/CampaignFinanceList";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CandidatePage({ params }: Props) {
  const { id } = await params;
  const candidate = await getCandidateById(id);
  if (!candidate) notFound();

  const [positions, endorsements, votingRecords, campaignFinance] =
    await Promise.all([
      getCandidatePositions(id),
      getCandidateEndorsements(id),
      candidate.official_id
        ? getVotingRecords(candidate.official_id)
        : Promise.resolve([]),
      candidate.official_id
        ? getCampaignFinance(candidate.official_id)
        : Promise.resolve([]),
    ]);

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Back */}
        <Link
          href={`/elections/${candidate.election.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-brand-navy/55 dark:text-brand-off-white/50 hover:text-brand-primary dark:hover:text-brand-red transition-colors"
        >
          ← Back to election
        </Link>

        {/* Header */}
        <div className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray px-6 py-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {candidate.party && <PartyBadge party={candidate.party} />}
            {candidate.is_incumbent && <IncumbentBadge />}
            <LevelBadge level={candidate.election.level} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white">
            {candidate.name}
          </h1>
          <p className="mt-1.5 text-lg text-brand-navy/65 dark:text-brand-off-white/60">
            Candidate for {candidate.election.office_name}
          </p>
          {candidate.election.election_date && (
            <p className="mt-0.5 text-sm text-brand-navy/45 dark:text-brand-off-white/40">
              Election: {formatDate(candidate.election.election_date)}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            {candidate.website && (
              <ExternalLink
                href={normalizeUrl(candidate.website)}
                label="Campaign website"
              />
            )}
            {candidate.ballotpedia_url && (
              <ExternalLink
                href={normalizeUrl(candidate.ballotpedia_url)}
                label="Ballotpedia"
              />
            )}
            {candidate.official_id && (
              <Link
                href={`/officials/${candidate.official_id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-light-gray dark:border-brand-dark-gray bg-transparent hover:bg-brand-light-blue/25 dark:hover:bg-brand-red/10 hover:border-brand-primary/40 dark:hover:border-brand-red/40 px-4 py-2 text-sm font-medium text-brand-navy dark:text-brand-off-white transition-all duration-150"
              >
                View official profile
              </Link>
            )}
          </div>
        </div>

        {/* Campaign Finance — only when linked to an official */}
        {candidate.official_id && (
          <Section title="Campaign Finance">
            <CampaignFinanceList records={campaignFinance} />
          </Section>
        )}

        {/* Policy Positions */}
        {positions.length > 0 && (
          <Section title="Policy Positions">
            <div className="space-y-5">
              {positions.map((p) => (
                <div key={p.id}>
                  {p.issue_area && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary dark:text-brand-red mb-1">
                      {p.issue_area}
                    </p>
                  )}
                  {p.position_statement && (
                    <p className="text-sm text-brand-navy/75 dark:text-brand-off-white/70 leading-relaxed">
                      {p.position_statement}
                    </p>
                  )}
                  {p.source_url && (
                    <a
                      href={normalizeUrl(p.source_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-0.5 text-xs text-brand-primary dark:text-brand-red hover:underline"
                    >
                      Source
                      <ArrowUpRightIcon />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Endorsements */}
        {endorsements.length > 0 && (
          <Section title="Endorsements">
            <div className="divide-y divide-brand-light-gray/50 dark:divide-brand-dark-gray">
              {endorsements.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-brand-navy dark:text-brand-off-white">
                      {e.endorser_name}
                    </p>
                    {e.endorser_type && (
                      <p className="text-xs text-brand-navy/50 dark:text-brand-off-white/45 mt-0.5">
                        {e.endorser_type}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    {e.endorsement_date && (
                      <p className="text-xs text-brand-navy/40 dark:text-brand-off-white/35">
                        {e.endorsement_date}
                      </p>
                    )}
                    {e.source_url && (
                      <a
                        href={normalizeUrl(e.source_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-xs text-brand-primary dark:text-brand-red hover:underline"
                      >
                        Source
                        <ArrowUpRightIcon />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Voting Record — only for incumbents linked to an official */}
        {candidate.is_incumbent && candidate.official_id && (
          <Section title="Voting Record">
            <VotingRecordsList records={votingRecords} />
          </Section>
        )}

        {/* ── Suggest a correction ─────────────────────────────────── */}
        <div className="flex justify-end">
          <CorrectionModal
            entityType="candidate"
            entityId={candidate.id}
            entityName={candidate.name}
          />
        </div>
      </div>
      <div className="mx-auto max-w-3xl pb-6 flex justify-center">
        <CorrectionModal entityType="general" variant="footer-link" />
      </div>
    </main>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray px-6 py-6">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-navy/45 dark:text-brand-off-white/40 mb-5">
        {title}
      </h2>
      {children}
    </div>
  );
}

function PartyBadge({ party }: { party: string }) {
  const styles: Record<string, string> = {
    Democrat:
      "bg-brand-light-blue/50 text-brand-navy dark:bg-brand-primary/25 dark:text-brand-light-blue",
    Democratic:
      "bg-brand-light-blue/50 text-brand-navy dark:bg-brand-primary/25 dark:text-brand-light-blue",
    Republican:
      "bg-brand-red/15 text-brand-red dark:bg-brand-red/20 dark:text-brand-red",
  };
  const cls =
    styles[party] ??
    "bg-brand-light-gray/50 text-brand-navy/60 dark:bg-brand-dark-gray dark:text-brand-off-white/50";
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
    <span className="inline-flex items-center rounded-full bg-brand-light-blue/50 dark:bg-brand-primary/20 text-brand-primary dark:text-brand-light-blue px-2.5 py-0.5 text-xs font-semibold">
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
    <span className="inline-flex items-center rounded-full border border-brand-light-gray dark:border-brand-dark-gray px-2.5 py-0.5 text-xs font-medium text-brand-navy/60 dark:text-brand-off-white/50">
      {labels[level] ?? level}
    </span>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-light-gray dark:border-brand-dark-gray bg-transparent hover:bg-brand-light-blue/25 dark:hover:bg-brand-red/10 hover:border-brand-primary/40 dark:hover:border-brand-red/40 px-4 py-2 text-sm font-medium text-brand-navy dark:text-brand-off-white transition-all duration-150"
    >
      {label}
      <ArrowUpRightIcon />
    </a>
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
  const candidate = await getCandidateById(id);
  if (!candidate) return { title: "Candidate not found — CommuneUSA" };
  return {
    title: `${candidate.name} — CommuneUSA`,
    description: `${candidate.name} is a candidate for ${candidate.election.office_name}.`,
  };
}

export const dynamic = "force-dynamic";

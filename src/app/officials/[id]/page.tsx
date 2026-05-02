import { notFound } from "next/navigation";
import Link from "next/link";
import { getOfficialById } from "@/app/actions/officials";
import type { OfficialProfile } from "@/app/actions/officials";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OfficialPage({ params }: Props) {
  const { id } = await params;
  const official = await getOfficialById(id);

  if (!official) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-5xl font-bold text-brand-light-gray dark:text-brand-dark-gray mb-4">
          404
        </p>
        <h1 className="text-xl font-semibold text-brand-navy dark:text-brand-off-white mb-2">
          Official not found
        </h1>
        <p className="text-sm text-brand-navy/55 dark:text-brand-off-white/50 mb-8">
          This profile may have been removed or the link is incorrect.
        </p>
        <Link
          href="/?state=53#map"
          className="rounded-lg bg-brand-primary hover:bg-brand-navy dark:bg-brand-red text-white font-medium px-5 py-2.5 text-sm transition-colors"
        >
          ← Back to map
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Back button */}
        <Link
          href="/?state=53#map"
          className="inline-flex items-center gap-1.5 text-sm text-brand-navy/55 dark:text-brand-off-white/50 hover:text-brand-primary dark:hover:text-brand-red transition-colors"
        >
          ← Back to map
        </Link>

        {/* ── Profile header ──────────────────────────────────────── */}
        <div className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray px-6 py-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <PartyBadge party={official.party} />
            <LevelBadge level={official.level} />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white">
            {official.official_name}
          </h1>

          {official.office_title && (
            <p className="mt-1.5 text-lg text-brand-navy/65 dark:text-brand-off-white/60">
              {official.office_title}
            </p>
          )}
        </div>

        {/* ── Key details ─────────────────────────────────────────── */}
        <Section title="Details">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <Detail label="Category"      value={official.office_category} />
            <Detail label="District"      value={official.district} />
            <Detail label="Term start"    value={official.term_start} />
            <Detail label="Term end"      value={official.term_end} />
            <Detail label="Role type"     value={official.appointed_or_elected} />
            <Detail label="Committees"    value={official.key_committees} />
            {official.notes && (
              <div className="sm:col-span-2">
                <Detail label="Notes" value={official.notes} />
              </div>
            )}
          </dl>
        </Section>

        {/* ── Contact ─────────────────────────────────────────────── */}
        <Section title="Contact">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <Detail label="Phone" value={official.phone} />
            <Detail label="Email" value={official.email} />
          </dl>
          <div className="mt-4 flex flex-wrap gap-3">
            {official.official_website && (
              <ExternalLink
                href={normalizeUrl(official.official_website)}
                label="Official website"
              />
            )}
            {official.ballotpedia_url && (
              <ExternalLink
                href={normalizeUrl(official.ballotpedia_url)}
                label="Ballotpedia"
              />
            )}
          </div>
        </Section>

        {/* ── Voting records placeholder ───────────────────────────── */}
        <Section title="Voting Records">
          <Placeholder message="Voting records coming soon" />
        </Section>

        {/* ── Campaign finance placeholder ─────────────────────────── */}
        <Section title="Campaign Finance">
          <Placeholder message="Campaign finance coming soon" />
        </Section>
      </div>
    </main>
  );
}

/* ── Sub-components ───────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray px-6 py-6">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-navy/45 dark:text-brand-off-white/40 mb-5">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-brand-navy/45 dark:text-brand-off-white/40 mb-0.5">
        {label}
      </dt>
      <dd className="text-sm font-medium text-brand-navy dark:text-brand-off-white">
        {value}
      </dd>
    </div>
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

function Placeholder({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-brand-light-gray dark:border-brand-dark-gray/80 px-6 py-8 text-center">
      <p className="text-sm text-brand-navy/40 dark:text-brand-off-white/35">{message}</p>
    </div>
  );
}

function PartyBadge({ party }: { party: OfficialProfile["party"] }) {
  const styles: Record<string, string> = {
    Democrat:    "bg-brand-light-blue/50 text-brand-navy dark:bg-brand-primary/25 dark:text-brand-light-blue",
    Republican:  "bg-brand-red/15 text-brand-red dark:bg-brand-red/20 dark:text-brand-red",
  };
  const cls = (party && styles[party]) ?? "bg-brand-light-gray/50 text-brand-navy/60 dark:bg-brand-dark-gray dark:text-brand-off-white/50";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {party ?? "No party"}
    </span>
  );
}

function LevelBadge({ level }: { level: string }) {
  const labels: Record<string, string> = {
    federal: "Federal",
    state:   "State",
    county:  "County",
    city:    "City",
  };
  return (
    <span className="inline-flex items-center rounded-full border border-brand-light-gray dark:border-brand-dark-gray px-2.5 py-0.5 text-xs font-medium text-brand-navy/60 dark:text-brand-off-white/50">
      {labels[level] ?? level}
    </span>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const official = await getOfficialById(id);
  if (!official) return { title: "Official not found — CommuneUSA" };
  return {
    title: `${official.official_name} — CommuneUSA`,
    description: `${official.office_title ?? "Official"} profile on CommuneUSA.`,
  };
}

// Opt out of static generation — profiles are fetched at request time
export const dynamic = "force-dynamic";

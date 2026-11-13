import Link from "next/link";
import { getOfficialById, getVotingRecords, getCampaignFinance, getUpcomingElectionForOfficial, getOutsideMoneyForOfficial, getOfficialTerms, getOfficialBio } from "@/app/actions/officials";
import type { OfficialTerm, OfficialBio } from "@/app/actions/officials";
import type { OfficialProfile } from "@/app/actions/officials";
import { VotingRecordsList } from "./VotingRecordsList";
import { CampaignFinanceList } from "./CampaignFinanceList";
import { OutsideMoney } from "@/components/OutsideMoney";
import { CorrectionModal } from "@/components/CorrectionModal";
import { TakeActionCenter } from "@/components/TakeActionCenter";
import { SiteShell } from "@/components/SiteShell";
import { BackLink } from "@/components/BackLink";
import { formatVerified } from "@/lib/electionFlags";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OfficialPage({ params }: Props) {
  const { id } = await params;
  const [official, votingRecords, campaignFinance, upcomingElectionDate, outsideMoney, terms, bio] = await Promise.all([
    getOfficialById(id),
    getVotingRecords(id),
    getCampaignFinance(id),
    getUpcomingElectionForOfficial(id),
    getOutsideMoneyForOfficial(id),
    getOfficialTerms(id),
    getOfficialBio(id),
  ]);

  const fields = official ? profileFields(official) : null;

  if (!official || !fields) {
    return (
      <SiteShell>
<main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-5xl font-bold text-brand-light-gray dark:text-brand-dark-gray mb-4">
          404
        </p>
        <h1 className="text-xl font-semibold text-fg mb-2">
          Official not found
        </h1>
        <p className="text-sm text-muted mb-8">
          This profile may have been removed or the link is incorrect.
        </p>
        <Link
          href="/?state=53&clearSession=true#map"
          className="rounded-xl bg-fg hover:bg-fg/90 text-on-fg font-medium px-5 py-2.5 text-sm transition-colors"
        >
          ← Back to map
        </Link>
      </main>
</SiteShell>
    );
  }

  return (
    <SiteShell>
<main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Back button */}
        <BackLink
          fallbackHref="/officials"
          fallbackLabel="Back"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand-primary dark:hover:text-brand-light-blue transition-colors"
        />

        {/* ── Profile header ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-line bg-surface px-6 py-6">
          {official.party?.trim() && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <PartyBadge party={official.party} />
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">
            {official.official_name}
          </h1>

          {official.office_title && (
            <p className="mt-1.5 text-lg text-muted">
              {official.office_title}
            </p>
          )}

          <p className="mt-1 text-sm text-muted">
            <LocationLine level={official.level} jurisdictionName={official.jurisdiction_name} />
          </p>

          {(official.source || official.last_verified_at) && (
            <p className="mt-3 text-xs text-muted">
              {official.source && (
                <>
                  Source:{" "}
                  {official.source_url ? (
                    <a
                      href={official.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-fg"
                    >
                      {official.source}
                    </a>
                  ) : (
                    official.source
                  )}
                </>
              )}
              {official.source && official.last_verified_at && " · "}
              {official.last_verified_at && <>Last verified {formatVerified(official.last_verified_at)}</>}
            </p>
          )}
        </div>

        {/* ── About ───────────────────────────────────────────────── */}
        <AboutSection bio={bio} />

        {/* ── Key details ─────────────────────────────────────────── */}
        <Section title="Details">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {/* Same fields in the same places on every profile; Term start and Term end sit side by side. */}
            <Detail label="Category"      value={official.office_category} />
            <Detail label="Role type"     value={official.appointed_or_elected} />
            <Detail label="Term start"    value={official.term_start} />
            <Detail label="Term end"      value={official.term_end} />
            <Detail label="District"      value={fields.district} fallback={fields.districtFallback} />
            <Detail label="Committees"    value={official.key_committees} fallback={fields.committeesFallback} />
            {fields.notes && (
              <div className="sm:col-span-2">
                <Detail label="Notes" value={fields.notes} />
              </div>
            )}
          </dl>
        </Section>

        {/* ── Public office history ───────────────────────────────── */}
        <OfficeHistory official={official} terms={terms} district={fields.district} />

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

        {/* ── Voting records ───────────────────────────────────────── */}
        <Section title="Voting Records">
          <VotingRecordsList records={votingRecords} />
        </Section>

        {/* ── Campaign finance ─────────────────────────────────────── */}
        <Section title="Campaign Finance">
          <CampaignFinanceList records={campaignFinance} />
        </Section>

        {/* ── Outside money ─────────────────────────────────────────── */}
        <Section title="Outside Money">
          <OutsideMoney data={outsideMoney} />
        </Section>

        {/* ── Take Action center ───────────────────────────────────── */}
        <TakeActionCenter official={official} upcomingElectionDate={upcomingElectionDate} />

        {/* ── Suggest a correction ─────────────────────────────────── */}
        <div className="flex justify-center">
          <CorrectionModal
            entityType="official"
            entityId={official.id}
            entityName={official.official_name}
          />
        </div>
      </div>
    </main>
</SiteShell>
  );
}

/* ── Sub-components ───────────────────────────────────────────────── */

interface HistoryItem {
  key: string;
  office: string;
  years: string;
  current: boolean;
  how: string | null;
  note: string | null;
  endsLabel: string | null;
}

/** "County Councilmember" + "9" -> "County Councilmember, District 9"; "At-Large" stays as is. */
function withDistrict(title: string, district: string | null): string {
  const d = district?.trim();
  if (!d || title.toLowerCase().includes(d.toLowerCase())) return title;
  return /^\d+$/.test(d) ? `${title}, District ${d}` : `${title}, ${d}`;
}

function buildHistory(official: OfficialProfile, terms: OfficialTerm[], district: string | null): HistoryItem[] {
  if (terms.length > 0) {
    return terms.map((t, i) => ({
      key: t.id,
      office: t.office,
      years: t.end_year ? (t.end_year === t.start_year ? `${t.start_year}` : `${t.start_year} – ${t.end_year}`) : `${t.start_year} – Present`,
      current: t.end_year === null,
      how: t.how_assumed === "appointed" ? "Appointed" : t.how_assumed === "elected" ? "Elected" : null,
      note: t.note,
      // Only the current office carries the end of the present term.
      endsLabel: t.end_year === null && i === 0 && official.term_end ? `Current term ends ${official.term_end}` : null,
    }));
  }
  // Nothing recorded yet: show what we do know about the present office.
  if (official.term_start && official.office_title) {
    return [{
      key: "current",
      office: withDistrict(official.office_title, district),
      years: `${official.term_start} – Present`,
      current: true,
      how: null,
      note: null,
      endsLabel: official.term_end ? `Current term ends ${official.term_end}` : null,
    }];
  }
  return [];
}

function OfficeHistory({ official, terms, district }: { official: OfficialProfile; terms: OfficialTerm[]; district: string | null }) {
  const items = buildHistory(official, terms, district);
  if (items.length === 0) {
    return (
      <Section title="Public office history">
        <p className="text-sm text-muted">No office history on file yet.</p>
      </Section>
    );
  }
  const sourced = terms.find((t) => t.source);
  return (
    <Section title="Public office history">
      <ol className="relative ml-2 border-l border-line">
        {items.map((it) => (
          <li key={it.key} className="relative pl-6 pb-6 last:pb-0">
            <span
              className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface ${
                it.current ? "bg-brand-primary dark:bg-brand-light-blue" : "bg-muted/60"
              }`}
            />
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-sm font-semibold text-fg">{it.office}</h3>
              <span className="text-sm text-muted tabular-nums">{it.years}</span>
              {it.how && (
                <span className="rounded-full bg-fg/10 px-2 py-0.5 text-[11px] font-medium text-muted">{it.how}</span>
              )}
            </div>
            {it.endsLabel && <p className="mt-1 text-xs text-muted">{it.endsLabel}</p>}
            {it.note && <p className="mt-1 text-xs text-muted leading-relaxed">{it.note}</p>}
          </li>
        ))}
      </ol>
      {sourced?.source && (
        <p className="mt-5 text-[11px] text-muted">
          Source:{" "}
          {sourced.source_url ? (
            <a href={sourced.source_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-fg">
              {sourced.source}
            </a>
          ) : (
            sourced.source
          )}
        </p>
      )}
    </Section>
  );
}

const LICENSE_LINKS: Record<string, string> = {
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
};

function AboutSection({ bio }: { bio: OfficialBio | null }) {
  if (!bio) {
    return (
      <Section title="About">
        <p className="text-sm text-muted">No background on file yet.</p>
      </Section>
    );
  }
  const licenseUrl = bio.bio_license ? LICENSE_LINKS[bio.bio_license] : undefined;
  return (
    <Section title="About">
      <p className="text-[15px] leading-relaxed text-fg">{bio.bio_summary}</p>
      {bio.bio_source && (
        <p className="mt-4 text-xs text-muted">
          From{" "}
          {bio.bio_source_url ? (
            <a
              href={bio.bio_source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-fg"
            >
              {bio.bio_source}
            </a>
          ) : (
            bio.bio_source
          )}
          {bio.bio_license && (
            <>
              , licensed under{" "}
              {licenseUrl ? (
                <a
                  href={licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-fg"
                >
                  {bio.bio_license}
                </a>
              ) : (
                bio.bio_license
              )}
            </>
          )}
          . Text may be shortened.
        </p>
      )}
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-6 py-6">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-5">
        {title}
      </h2>
      {children}
    </div>
  );
}

const STATEWIDE_OFFICE = /governor|secretary of state|treasurer|auditor|attorney general|superintendent|public lands|insurance commissioner/i;
const LEGISLATOR = /senator|representative|delegate/i;
const DISTRICT_NOTE = /^(?:district|dist\.?|position|pos\.?|ward|seat)\s*#?\s*\w+$/i;

/**
 * What to show in Details. A district recorded in Notes (older records) is shown as the district,
 * and offices that have no district or committees say so instead of "Not listed".
 */
function profileFields(o: OfficialProfile) {
  const title = o.office_title ?? "";
  const notes = o.notes?.trim() || null;

  let district = o.district?.trim() || null;
  let leftoverNotes = notes;
  if (!district && notes && DISTRICT_NOTE.test(notes)) {
    district = notes.replace(/^(?:district|dist\.?)\s*#?\s*/i, "").trim() || notes;
    leftoverNotes = null;
  }

  const statewide = o.level === "state" && STATEWIDE_OFFICE.test(title) && !LEGISLATOR.test(title);
  const countywide = o.level === "county" && !/commissioner|council/i.test(title);
  const citywide = o.level === "city" && /mayor/i.test(title);
  const usSenator = o.level === "federal" && /senator/i.test(title);

  let districtFallback = "Not listed";
  if (statewide || usSenator) districtFallback = "Statewide";
  else if (countywide) districtFallback = "Countywide";
  else if (citywide) districtFallback = "Citywide";

  const committeesFallback = statewide || countywide || citywide ? "Not applicable" : "Not listed";
  return { district, districtFallback, committeesFallback, notes: leftoverNotes };
}

function Detail({ label, value, fallback = "Not listed" }: { label: string; value: string | null | undefined; fallback?: string }) {
  const has = !!value?.trim();
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted mb-0.5">
        {label}
      </dt>
      <dd className={has ? "text-sm font-medium text-fg" : "text-sm text-muted"}>
        {has ? value : fallback}
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
      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-transparent hover:bg-fg/5 hover:border-fg/30 px-4 py-2 text-sm font-medium text-fg transition-all duration-150"
    >
      {label}
      <ArrowUpRightIcon />
    </a>
  );
}

function PartyBadge({ party }: { party: OfficialProfile["party"] }) {
  if (!party?.trim()) return null;
  const normalized = party === "Democrat" ? "Democratic" : party;
  const styles: Record<string, string> = {
    Democratic: "bg-brand-primary/10 text-fg dark:bg-brand-primary/25",
    Republican: "bg-brand-red/15 text-brand-red dark:bg-brand-red/20",
  };
  const cls = styles[normalized] ?? "bg-fg/5 text-muted";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {normalized}
    </span>
  );
}

function LocationLine({ level, jurisdictionName }: { level: string; jurisdictionName: string | null }) {
  const levelLabel: Record<string, string> = { federal: "Federal", state: "State", county: "County", city: "City" };
  const label = levelLabel[level] ?? level;
  if (!jurisdictionName?.trim()) return <>{label}</>;
  if (jurisdictionName.toLowerCase().includes(label.toLowerCase())) return <>{jurisdictionName}</>;
  return <>{jurisdictionName} · {label}</>;
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

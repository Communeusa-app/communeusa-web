import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { CorrectionModal } from "@/components/CorrectionModal";
import {
  getEntityDetailRaw,
  getSchoolBoardMembers,
  getSchoolBoardMemberDistrictId,
} from "@/app/actions/directory";
import type { DirectoryCategory, SchoolBoardMember } from "@/app/actions/directory";
import { SiteShell } from "@/components/SiteShell";



const CATEGORY_LABELS: Record<string, string> = {
  "school-districts":    "School Districts",
  "law-enforcement":     "Law Enforcement",
  "fire-ems":            "Fire & EMS",
  "hospitals":           "Hospitals",
  "utilities-transit":   "Utilities & Transit",
  "state-agencies":      "State Agencies",
  "judiciary":           "Judiciary",
  "courts":              "Courts",
  "school-board-members": "School Board Members",
};

const VALID_CATEGORIES: DirectoryCategory[] = [
  "school-districts", "law-enforcement", "fire-ems", "hospitals",
  "utilities-transit", "state-agencies", "judiciary", "courts",
];

interface Props {
  params: Promise<{ category: string; id: string }>;
}

export default async function EntityDetailPage({ params }: Props) {
  const { category: rawCategory, id } = await params;

  // Redirect school board member pages to parent district
  if (rawCategory === "school-board-members") {
    const districtId = await getSchoolBoardMemberDistrictId(id);
    if (!districtId) notFound();
    redirect(`/directory/school-districts/${districtId}`);
  }

  if (!VALID_CATEGORIES.includes(rawCategory as DirectoryCategory)) notFound();
  const category = rawCategory as DirectoryCategory;
  const categoryLabel = CATEGORY_LABELS[category];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any = await getEntityDetailRaw(category, id);
  if (!raw) notFound();

  const boardMembers: SchoolBoardMember[] =
    category === "school-districts" ? await getSchoolBoardMembers(id) : [];

  const entityName: string =
    category === "judiciary"
      ? (raw.judge_name ?? raw.position ?? raw.court_name ?? "Unknown")
      : category === "courts"
      ? (raw.court_name ?? "Unknown Court")
      : (raw.name ?? "Unknown");

  const website: string | null =
    raw.website ?? raw.official_website ?? null;

  const countyName: string | null = raw.counties?.name ?? null;

  return (
    <SiteShell>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Back link */}
          <Link
            href={`/directory?category=${category}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand-primary dark:hover:text-brand-light-blue transition-colors"
          >
            ← {categoryLabel}
          </Link>

          {/* Profile header */}
          <div className="rounded-2xl border border-line bg-surface px-6 py-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Pill cls="bg-brand-primary/10 dark:bg-brand-red/10 text-brand-primary dark:text-brand-light-blue">
                {categoryLabel}
              </Pill>
              {category === "law-enforcement" && raw.agency_type && (
                <Pill cls="bg-fg/5 text-muted border border-line">
                  {raw.agency_type}
                </Pill>
              )}
              {category === "fire-ems" && raw.agency_type && (
                <Pill cls="bg-fg/5 text-muted border border-line">
                  {raw.agency_type}
                </Pill>
              )}
              {category === "hospitals" && raw.ownership_type && (
                <Pill cls="bg-fg/5 text-muted border border-line">
                  {raw.ownership_type}
                </Pill>
              )}
              {category === "utilities-transit" && raw.category && (
                <Pill cls="bg-fg/5 text-muted border border-line">
                  {raw.category}
                </Pill>
              )}
              {category === "state-agencies" && raw.abbreviation && (
                <Pill cls="bg-fg/5 text-muted border border-line font-mono">
                  {raw.abbreviation}
                </Pill>
              )}
              {category === "judiciary" && raw.court_level && (
                <Pill cls="bg-fg/5 text-muted border border-line">
                  {raw.court_level}
                </Pill>
              )}
              {category === "courts" && raw.court_level && (
                <Pill cls="bg-fg/5 text-muted border border-line">
                  {raw.court_level}
                </Pill>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-fg">
              {entityName}
            </h1>
            {countyName && (
              <p className="mt-1.5 text-lg text-muted">
                {countyName} County
              </p>
            )}
          </div>

          {/* ── Category-specific detail sections ──────────────────── */}

          {/* Law Enforcement */}
          {category === "law-enforcement" && (
            <>
              <Section title="Agency Details">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Detail label="Jurisdiction"    value={raw.jurisdiction} />
                  <Detail label="Chief / Sheriff" value={raw.chief_name} />
                  <Detail label="Sworn Officers"  value={raw.sworn_officers != null ? String(raw.sworn_officers) : null} />
                  <Detail label="Headquarters"    value={raw.headquarters} />
                </dl>
                {!raw.chief_name?.trim() && (
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-sm text-muted">
                      The current chief or sheriff for this agency isn&apos;t on file yet.
                    </p>
                    <CorrectionModal
                      entityType="law_enforcement"
                      entityId={id}
                      entityName={entityName}
                      variant="footer-link"
                    />
                  </div>
                )}
              </Section>
              <Section title="Contact">
                {!raw.phone?.trim() && !website ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted">
                      Direct contact details for this agency aren&apos;t on file yet.
                    </p>
                    {countyName && (
                      <p className="text-sm text-muted">
                        You can reach this agency through{" "}
                        <span className="font-medium text-muted">
                          {countyName} County
                        </span>{" "}
                        government.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {raw.phone?.trim() && (
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        <Detail label="Phone" value={raw.phone} />
                      </dl>
                    )}
                    {website && (
                      <div className={raw.phone?.trim() ? "mt-4" : ""}>
                        <ExternalLink href={normalizeUrl(website)} label="Official website" />
                      </div>
                    )}
                  </>
                )}
              </Section>
            </>
          )}

          {/* Fire & EMS */}
          {category === "fire-ems" && (
            <>
              <Section title="Agency Details">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Detail label="Jurisdiction"  value={raw.jurisdiction} />
                  <Detail label="Service Type"  value={raw.service_type} />
                  <Detail label="Fire Chief"    value={raw.fire_chief} />
                  <Detail label="Stations"      value={raw.stations != null ? String(raw.stations) : null} />
                  <Detail label="Personnel"     value={raw.personnel != null ? String(raw.personnel) : null} />
                  <Detail label="Headquarters"  value={raw.headquarters} />
                </dl>
              </Section>
              <Section title="Contact">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Detail label="Phone" value={raw.phone} />
                </dl>
                {website && (
                  <div className="mt-4">
                    <ExternalLink href={normalizeUrl(website)} label="Official website" />
                  </div>
                )}
              </Section>
            </>
          )}

          {/* Hospitals */}
          {category === "hospitals" && (
            <>
              <Section title="Hospital Details">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Detail label="Health System" value={raw.health_system} />
                  <Detail label="CEO / Admin"   value={raw.ceo} />
                  <Detail label="Beds"          value={raw.beds != null ? String(raw.beds) : null} />
                  {raw.trauma_level && (
                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted mb-0.5">
                        Trauma Level
                      </dt>
                      <dd>
                        <TraumaLevelBadge level={raw.trauma_level} />
                      </dd>
                    </div>
                  )}
                </dl>
              </Section>
              <Section title="Contact">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Detail label="Phone" value={raw.phone} />
                </dl>
                {website && (
                  <div className="mt-4">
                    <ExternalLink href={normalizeUrl(website)} label="Official website" />
                  </div>
                )}
              </Section>
            </>
          )}

          {/* School Districts */}
          {category === "school-districts" && (
            <>
              <Section title="District Details">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Detail label="Superintendent" value={raw.superintendent} />
                  <Detail label="Enrollment"     value={raw.enrollment != null ? Number(raw.enrollment).toLocaleString() : null} />
                </dl>
                <div className="mt-4 flex flex-wrap gap-3">
                  {raw.phone && (
                    <Detail label="Phone" value={raw.phone} />
                  )}
                </div>
                {(raw.official_website) && (
                  <div className="mt-4">
                    <ExternalLink href={normalizeUrl(raw.official_website)} label="District website" />
                  </div>
                )}
              </Section>

              {boardMembers.length > 0 && (
                <Section title="School Board Members">
                  <ul className="space-y-3">
                    {boardMembers.map((m) => (
                      <li
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2.5 border-b border-line last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-fg">
                            {m.name}
                          </p>
                          {m.position && (
                            <p className="text-xs text-muted mt-0.5">
                              {m.position}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {m.party && (
                            <Pill cls="bg-fg/5 text-muted border border-line">
                              {m.party}
                            </Pill>
                          )}
                          {(m.term_start || m.term_end) && (
                            <span className="text-[11px] text-muted">
                              {m.term_start ?? "?"} – {m.term_end ?? "?"}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          )}

          {/* State Agencies */}
          {category === "state-agencies" && (
            <>
              {raw.mission && (
                <Section title="Mission">
                  <p className="text-sm text-muted leading-relaxed">
                    {raw.mission}
                  </p>
                </Section>
              )}
              <Section title="Agency Details">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Detail label="Category"         value={raw.category} />
                  <Detail label="Director"         value={raw.director} />
                  <Detail label="Selection Method" value={raw.selection_method} />
                  <Detail label="Employees"        value={raw.employees != null ? Number(raw.employees).toLocaleString() : null} />
                  <Detail label="Annual Budget"    value={raw.budget} />
                  <Detail label="Headquarters"     value={raw.headquarters} />
                </dl>
              </Section>
              <Section title="Contact">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Detail label="Phone" value={raw.phone} />
                </dl>
                {website && (
                  <div className="mt-4">
                    <ExternalLink href={normalizeUrl(website)} label="Official website" />
                  </div>
                )}
              </Section>
            </>
          )}

          {/* Judiciary */}
          {category === "judiciary" && (
            <>
              <Section title="Court Details">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Detail label="Court"            value={raw.court_name} />
                  <Detail label="Position"         value={raw.position} />
                  <Detail label="Jurisdiction"     value={raw.jurisdiction} />
                  <Detail label="Selection Method" value={raw.selection_method} />
                  <Detail label="Appointed By"     value={raw.appointed_by} />
                  <Detail label="Term Start"       value={raw.term_start} />
                  <Detail label="Term End"         value={raw.term_end} />
                </dl>
              </Section>
              {website && (
                <Section title="Links">
                  <ExternalLink href={normalizeUrl(website)} label="Court website" />
                </Section>
              )}
            </>
          )}

          {/* Courts */}
          {category === "courts" && (
            <>
              <Section title="Court Details">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Detail label="Court Level"  value={raw.court_level} />
                  <Detail label="Jurisdiction" value={raw.jurisdiction} />
                </dl>
              </Section>
              {website && (
                <Section title="Links">
                  <ExternalLink href={normalizeUrl(website)} label="Court website" />
                </Section>
              )}
            </>
          )}

          {/* Utilities & Transit */}
          {category === "utilities-transit" && (
            <>
              <Section title="Agency Details">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Detail label="Service Type"        value={raw.service_type} />
                  <Detail label="Region"              value={raw.county_region} />
                  <Detail label="CEO / Exec Director" value={raw.ceo} />
                  <Detail label="Customers / Riders"  value={raw.customers_riders != null ? Number(raw.customers_riders).toLocaleString() : null} />
                  {raw.governing_board && (
                    <div className="sm:col-span-2">
                      <Detail label="Governing Board" value={raw.governing_board} />
                    </div>
                  )}
                </dl>
              </Section>
              <Section title="Contact">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Detail label="Phone" value={raw.phone} />
                </dl>
                {website && (
                  <div className="mt-4">
                    <ExternalLink href={normalizeUrl(website)} label="Official website" />
                  </div>
                )}
              </Section>
            </>
          )}

          {/* Correction button */}
          <div className="flex justify-center">
            <CorrectionModal
              entityType={category.replace(/-/g, "_")}
              entityId={id}
              entityName={entityName}
            />
          </div>
        </div>
      </main>

    </SiteShell>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

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

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted mb-0.5">
        {label}
      </dt>
      <dd className="text-sm font-medium text-fg">
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
      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-transparent hover:bg-fg/5 hover:border-fg/30 px-4 py-2 text-sm font-medium text-fg transition-all duration-150"
    >
      {label}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
      </svg>
    </a>
  );
}

function Pill({ cls, children }: { cls: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function TraumaLevelBadge({ level }: { level: string }) {
  const lower = level.toLowerCase();
  let cls = "bg-fg/5 text-muted";
  if (lower.includes("level i") && !lower.includes("level ii")) {
    cls = "bg-brand-red/15 text-brand-red dark:bg-brand-red/20";
  } else if (lower.includes("level ii") && !lower.includes("level iii")) {
    cls = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  } else if (lower.includes("level iii")) {
    cls = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {level}
    </span>
  );
}

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}


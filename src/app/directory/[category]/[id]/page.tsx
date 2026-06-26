import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CorrectionModal } from "@/components/CorrectionModal";
import {
  getEntityDetailRaw,
  getSchoolBoardMembers,
  getSchoolBoardMemberDistrictId,
} from "@/app/actions/directory";
import type { DirectoryCategory, SchoolBoardMember } from "@/app/actions/directory";

const NAV_LINKS = [
  { label: "Representatives", href: "/#representatives" },
  { label: "Officials",       href: "/officials" },
  { label: "Elections",       href: "/elections" },
  { label: "Finance",         href: "/finance" },
  { label: "Directory",       href: "/directory" },
  { label: "Rights",          href: "/rights" },
  { label: "About",           href: "/about" },
] as const;

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
    <>
      <header className="sticky top-0 z-50 border-b border-brand-light-gray/60 dark:border-brand-dark-gray bg-brand-off-white/95 dark:bg-brand-charcoal/95 backdrop-blur-sm">
        <nav className="mx-auto max-w-6xl px-6 h-16 flex items-center gap-6">
          <a href="/" className="flex items-center gap-2.5 shrink-0">
            <LogoMark />
            <span className="font-semibold text-[15px] tracking-tight text-brand-navy dark:text-brand-off-white">
              CommuneUSA
            </span>
          </a>
          <div className="hidden md:flex items-center gap-0.5 ml-2">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  href === "/directory"
                    ? "text-brand-primary dark:text-brand-red font-medium bg-brand-light-blue/20 dark:bg-brand-red/10"
                    : "text-brand-navy/60 dark:text-brand-off-white/60 hover:text-brand-primary dark:hover:text-brand-red hover:bg-brand-light-blue/25 dark:hover:bg-brand-red/10"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Back link */}
          <Link
            href={`/directory?category=${category}`}
            className="inline-flex items-center gap-1.5 text-sm text-brand-navy/55 dark:text-brand-off-white/50 hover:text-brand-primary dark:hover:text-brand-red transition-colors"
          >
            ← {categoryLabel}
          </Link>

          {/* Profile header */}
          <div className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray px-6 py-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Pill cls="bg-brand-light-blue/20 dark:bg-brand-red/10 text-brand-primary dark:text-brand-red">
                {categoryLabel}
              </Pill>
              {category === "law-enforcement" && raw.agency_type && (
                <Pill cls="bg-brand-light-gray/50 dark:bg-brand-dark-gray text-brand-navy/60 dark:text-brand-off-white/50 border border-brand-light-gray dark:border-brand-dark-gray">
                  {raw.agency_type}
                </Pill>
              )}
              {category === "fire-ems" && raw.agency_type && (
                <Pill cls="bg-brand-light-gray/50 dark:bg-brand-dark-gray text-brand-navy/60 dark:text-brand-off-white/50 border border-brand-light-gray dark:border-brand-dark-gray">
                  {raw.agency_type}
                </Pill>
              )}
              {category === "hospitals" && raw.ownership_type && (
                <Pill cls="bg-brand-light-gray/50 dark:bg-brand-dark-gray text-brand-navy/60 dark:text-brand-off-white/50 border border-brand-light-gray dark:border-brand-dark-gray">
                  {raw.ownership_type}
                </Pill>
              )}
              {category === "utilities-transit" && raw.category && (
                <Pill cls="bg-brand-light-gray/50 dark:bg-brand-dark-gray text-brand-navy/60 dark:text-brand-off-white/50 border border-brand-light-gray dark:border-brand-dark-gray">
                  {raw.category}
                </Pill>
              )}
              {category === "state-agencies" && raw.abbreviation && (
                <Pill cls="bg-brand-light-gray/50 dark:bg-brand-dark-gray text-brand-navy/60 dark:text-brand-off-white/50 border border-brand-light-gray dark:border-brand-dark-gray font-mono">
                  {raw.abbreviation}
                </Pill>
              )}
              {category === "judiciary" && raw.court_level && (
                <Pill cls="bg-brand-light-gray/50 dark:bg-brand-dark-gray text-brand-navy/60 dark:text-brand-off-white/50 border border-brand-light-gray dark:border-brand-dark-gray">
                  {raw.court_level}
                </Pill>
              )}
              {category === "courts" && raw.court_level && (
                <Pill cls="bg-brand-light-gray/50 dark:bg-brand-dark-gray text-brand-navy/60 dark:text-brand-off-white/50 border border-brand-light-gray dark:border-brand-dark-gray">
                  {raw.court_level}
                </Pill>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white">
              {entityName}
            </h1>
            {countyName && (
              <p className="mt-1.5 text-lg text-brand-navy/65 dark:text-brand-off-white/60">
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
                  <Detail label="Jurisdiction"   value={raw.jurisdiction} />
                  <Detail label="Chief / Sheriff" value={raw.chief_name} />
                  <Detail label="Sworn Officers" value={raw.sworn_officers != null ? String(raw.sworn_officers) : null} />
                  <Detail label="Headquarters"   value={raw.headquarters} />
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
                      <dt className="text-[11px] font-medium uppercase tracking-wider text-brand-navy/45 dark:text-brand-off-white/40 mb-0.5">
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
                        className="flex flex-wrap items-center justify-between gap-2 py-2.5 border-b border-brand-light-gray/40 dark:border-brand-dark-gray/60 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-brand-navy dark:text-brand-off-white">
                            {m.name}
                          </p>
                          {m.position && (
                            <p className="text-xs text-brand-navy/55 dark:text-brand-off-white/45 mt-0.5">
                              {m.position}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {m.party && (
                            <Pill cls="bg-brand-light-gray/40 dark:bg-brand-dark-gray text-brand-navy/55 dark:text-brand-off-white/45 border border-brand-light-gray/60 dark:border-brand-dark-gray">
                              {m.party}
                            </Pill>
                          )}
                          {(m.term_start || m.term_end) && (
                            <span className="text-[11px] text-brand-navy/40 dark:text-brand-off-white/35">
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
                  <p className="text-sm text-brand-navy/75 dark:text-brand-off-white/70 leading-relaxed">
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

      <footer className="border-t border-brand-light-gray/60 dark:border-brand-dark-gray px-6 py-8 mt-auto">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="text-sm font-semibold text-brand-navy dark:text-brand-off-white">CommuneUSA</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-brand-navy/55 dark:text-brand-off-white/55">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} className="hover:text-brand-primary dark:hover:text-brand-red transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-5 flex justify-center">
          <CorrectionModal entityType="general" variant="footer-link" />
        </div>
        <p className="mt-2 text-center text-xs text-brand-navy/35 dark:text-brand-off-white/35">
          © {new Date().getFullYear()} CommuneUSA. All rights reserved.
        </p>
      </footer>
    </>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

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
  let cls = "bg-brand-light-gray/40 text-brand-navy/70 dark:bg-brand-dark-gray dark:text-brand-off-white/60";
  if (lower.includes("level i") && !lower.includes("level ii")) {
    cls = "bg-brand-red/15 text-brand-red dark:bg-brand-red/20 dark:text-brand-red";
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

function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <rect x="5.5" y="5.5" width="13" height="13" transform="rotate(45 12 12)" className="stroke-brand-primary dark:stroke-white fill-none" strokeWidth="1.5" />
      <rect x="8.5" y="8.5" width="7" height="7" transform="rotate(45 12 12)" className="fill-brand-primary dark:fill-brand-red" />
    </svg>
  );
}

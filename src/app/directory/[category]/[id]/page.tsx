import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getEntityById } from "@/app/actions/directory";
import type { DirectoryCategory } from "@/app/actions/directory";
import { notFound } from "next/navigation";
import { CorrectionModal } from "@/components/CorrectionModal";

const NAV_LINKS = [
  { label: "Representatives", href: "/#representatives" },
  { label: "Elections",       href: "/elections" },
  { label: "Finance",         href: "/finance" },
  { label: "Directory",       href: "/directory" },
  { label: "Rights",          href: "/rights" },
  { label: "About",           href: "/about" },
] as const;

const CATEGORY_LABELS: Record<DirectoryCategory, string> = {
  "school-districts":  "School Districts",
  "law-enforcement":   "Law Enforcement",
  "fire-ems":          "Fire & EMS",
  "hospitals":         "Hospitals",
  "utilities-transit": "Utilities & Transit",
  "state-agencies":    "State Agencies",
  "judiciary":         "Judiciary",
  "courts":            "Courts",
};

interface Props {
  params: Promise<{ category: string; id: string }>;
}

export default async function EntityDetailPage({ params }: Props) {
  const { category: rawCategory, id } = await params;
  const category = rawCategory as DirectoryCategory;

  if (!CATEGORY_LABELS[category]) notFound();

  const entity = await getEntityById(category, id);
  if (!entity) notFound();

  const categoryLabel = CATEGORY_LABELS[category];

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
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <Link
              href={`/directory?category=${category}`}
              className="text-sm text-brand-navy/50 dark:text-brand-off-white/45 hover:text-brand-primary dark:hover:text-brand-red transition-colors"
            >
              ← {categoryLabel}
            </Link>
          </div>

          <div className="rounded-2xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <span className="inline-block mb-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-brand-light-blue/20 dark:bg-brand-red/10 text-brand-primary dark:text-brand-red">
                  {categoryLabel}
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white">
                  {entity.name}
                </h1>
                {entity.county_name && (
                  <p className="mt-1 text-sm text-brand-navy/50 dark:text-brand-off-white/45">
                    {entity.county_name} County
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-brand-light-gray/50 dark:border-brand-dark-gray/60 bg-brand-light-gray/15 dark:bg-brand-charcoal/40 px-6 py-8 text-center">
              <p className="text-base font-medium text-brand-navy/60 dark:text-brand-off-white/55 mb-1">
                Full profile coming soon
              </p>
              <p className="text-sm text-brand-navy/40 dark:text-brand-off-white/35">
                Detailed information for this entity will be available in a future update.
              </p>
              {entity.website && (
                <a
                  href={entity.website.startsWith("http") ? entity.website : `https://${entity.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary dark:text-brand-red hover:underline"
                >
                  Visit official website
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                  </svg>
                </a>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <CorrectionModal
                entityType={category.replace(/-/g, "_")}
                entityId={entity.id}
                entityName={entity.name}
              />
            </div>
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

function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <rect x="5.5" y="5.5" width="13" height="13" transform="rotate(45 12 12)" className="stroke-brand-primary dark:stroke-white fill-none" strokeWidth="1.5" />
      <rect x="8.5" y="8.5" width="7" height="7" transform="rotate(45 12 12)" className="fill-brand-primary dark:fill-brand-red" />
    </svg>
  );
}

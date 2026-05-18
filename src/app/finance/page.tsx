import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  getAllFinanceOfficials,
  getTopPACDonors,
  getTopIndividualDonors,
  getTopIndustries,
} from "@/app/actions/finance";
import { FinanceBrowser } from "./FinanceBrowser";

const NAV_LINKS = [
  { label: "Representatives", href: "/#representatives" },
  { label: "Elections", href: "/elections" },
  { label: "Finance", href: "/finance" },
  { label: "About", href: "/about" },
] as const;

export const metadata = {
  title: "Finance — CommuneUSA",
  description:
    "Campaign finance data for every Washington official, sourced from the Washington PDC and FEC.",
};

export default async function FinancePage() {
  const [allSummaries, pacDonors, individualDonors, industries] =
    await Promise.all([
      getAllFinanceOfficials(),
      getTopPACDonors(25),
      getTopIndividualDonors(25),
      getTopIndustries(15),
    ]);

  return (
    <>
      {/* Navbar */}
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
                  href === "/finance"
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
        <div className="mx-auto max-w-5xl">
          {/* Hero */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white">
              Follow the Money
            </h1>
            <p className="mt-2 text-brand-navy/60 dark:text-brand-off-white/55 max-w-2xl">
              Campaign finance data for every Washington official, sourced from
              the Washington PDC and FEC.
            </p>
          </div>

          <FinanceBrowser
            allSummaries={allSummaries}
            pacDonors={pacDonors}
            individualDonors={individualDonors}
            industries={industries}
          />

          {/* Disclosure */}
          <p className="mt-16 text-xs text-brand-navy/40 dark:text-brand-off-white/35 leading-relaxed border-t border-brand-light-gray/50 dark:border-brand-dark-gray pt-6">
            Federal contributions under $200 and Washington State contributions
            under $25 are not required to be publicly disclosed and are not
            reflected in this data. Data is sourced from the Washington Public
            Disclosure Commission (PDC) and the Federal Election Commission
            (FEC). Last updated during each sync cycle.
          </p>
        </div>
      </main>

      <footer className="border-t border-brand-light-gray/60 dark:border-brand-dark-gray px-6 py-8 mt-auto">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="text-sm font-semibold text-brand-navy dark:text-brand-off-white">
              CommuneUSA
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-brand-navy/55 dark:text-brand-off-white/55">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="hover:text-brand-primary dark:hover:text-brand-red transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-brand-navy/35 dark:text-brand-off-white/35">
          © {new Date().getFullYear()} CommuneUSA. All rights reserved.
        </p>
      </footer>
    </>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <rect x="5.5" y="5.5" width="13" height="13" transform="rotate(45 12 12)"
        className="stroke-brand-primary dark:stroke-white fill-none" strokeWidth="1.5" />
      <rect x="8.5" y="8.5" width="7" height="7" transform="rotate(45 12 12)"
        className="fill-brand-primary dark:fill-brand-red" />
    </svg>
  );
}

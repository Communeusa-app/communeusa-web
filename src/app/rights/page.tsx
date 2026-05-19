import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RightsBrowser } from "./RightsBrowser";

const NAV_LINKS = [
  { label: "Representatives", href: "/#representatives" },
  { label: "Elections",       href: "/elections" },
  { label: "Finance",         href: "/finance" },
  { label: "Directory",       href: "/directory" },
  { label: "Rights",          href: "/rights" },
  { label: "About",           href: "/about" },
] as const;

export const metadata = {
  title: "Know Your Rights — CommuneUSA",
  description:
    "Plain language explanations of your rights as an American citizen at the federal, state, and local level. Every entry is sourced to the actual statute, ruling, or regulation.",
};

export default function RightsPage() {
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
                  href === "/rights"
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
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white">
              Know Your Rights
            </h1>
            <p className="mt-3 max-w-2xl text-brand-navy/60 dark:text-brand-off-white/55 leading-relaxed">
              Plain language explanations of your rights as an American citizen at the
              federal, state, and local level. Every entry is sourced to the actual
              statute, ruling, or regulation.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="mb-10 flex gap-3 rounded-xl border border-brand-light-gray/60 dark:border-brand-dark-gray bg-brand-light-gray/20 dark:bg-brand-dark-gray/30 px-5 py-4">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 mt-0.5 text-brand-navy/40 dark:text-brand-off-white/35"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-brand-navy/60 dark:text-brand-off-white/50 leading-relaxed">
              <strong className="font-semibold text-brand-navy/75 dark:text-brand-off-white/70">
                Educational purposes only.
              </strong>{" "}
              This information does not constitute legal advice. Laws change — always
              verify current law with an attorney or official government source. If you
              need legal help,{" "}
              <a
                href="https://www.aclu.org/know-your-rights"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary dark:text-brand-red hover:underline"
              >
                ACLU Know Your Rights
              </a>
              {" "}and{" "}
              <a
                href="https://www.lawhelp.org/wa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary dark:text-brand-red hover:underline"
              >
                LawHelp WA
              </a>
              {" "}offer free resources.
            </p>
          </div>

          <RightsBrowser />
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

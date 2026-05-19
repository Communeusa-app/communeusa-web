import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_LINKS = [
  { label: "Representatives", href: "/#representatives" },
  { label: "Elections",       href: "/elections" },
  { label: "Finance",         href: "/finance" },
  { label: "Directory",       href: "/directory" },
  { label: "Rights",          href: "/rights" },
  { label: "About",           href: "/about" },
] as const;

export const metadata = {
  title: "About — CommuneUSA",
  description:
    "CommuneUSA is a civic utility built to make government transparent and accessible to every American.",
};

const COVERAGE = [
  {
    title: "Representatives",
    description:
      "Every elected and appointed official from city hall to Congress.",
  },
  {
    title: "Voting Records",
    description: "How officials vote on the issues that matter.",
  },
  {
    title: "Campaign Finance",
    description:
      "Where the money comes from and who funds your representatives.",
  },
  {
    title: "Elections",
    description:
      "Every race at every level with every candidate.",
  },
];

const PRINCIPLES = [
  {
    title: "Nonpartisan",
    description:
      "We present facts, public records, and officials' own stated positions. We do not editorialize.",
  },
  {
    title: "Transparent",
    description:
      "Every data point links back to its source. We show our work.",
  },
  {
    title: "Accessible",
    description: "Civic data belongs to everyone. CommuneUSA is built for citizens.",
  },
];

const SOURCES = [
  "Congress.gov",
  "Open States",
  "Washington PDC",
  "FEC.gov",
  "Ballotpedia",
  "US Census Bureau",
  "Washington Secretary of State",
  "MRSC Officials Directory",
];

export default function AboutPage() {
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
                  href === "/about"
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

      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-4xl space-y-20">

          {/* Mission */}
          <section>
            <h1 className="text-4xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white mb-6">
              Our Mission
            </h1>
            <p className="text-lg leading-relaxed text-brand-navy/70 dark:text-brand-off-white/65 max-w-3xl">
              CommuneUSA is a civic utility built to make government transparent
              and accessible to every American. We believe an informed citizen is
              the foundation of a healthy democracy. Our mission is to put the
              full picture of your government — your representatives, their
              votes, their funding, and the elections that shape your community —
              in one place, without bias.
            </p>
          </section>

          {/* What we cover */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white mb-6">
              What We Cover
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COVERAGE.map(({ title, description }) => (
                <div
                  key={title}
                  className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray p-6"
                >
                  <h3 className="text-base font-semibold text-brand-navy dark:text-brand-off-white mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-brand-navy/60 dark:text-brand-off-white/55 leading-relaxed">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Our principles */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white mb-6">
              Our Principles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {PRINCIPLES.map(({ title, description }) => (
                <div key={title}>
                  <div className="w-8 h-0.5 bg-brand-primary dark:bg-brand-red mb-4 rounded-full" />
                  <h3 className="text-base font-semibold text-brand-navy dark:text-brand-off-white mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-brand-navy/60 dark:text-brand-off-white/55 leading-relaxed">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Data sources */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white mb-6">
              Data Sources
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SOURCES.map((source) => (
                <li
                  key={source}
                  className="flex items-center gap-3 text-sm text-brand-navy/70 dark:text-brand-off-white/65"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary dark:bg-brand-red shrink-0" />
                  {source}
                </li>
              ))}
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white mb-4">
              Contact
            </h2>
            <div className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray px-6 py-5">
              <p className="text-sm text-brand-navy/60 dark:text-brand-off-white/55">
                Have a question or found inaccurate data? Contact form coming
                soon.
              </p>
            </div>
          </section>

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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
    >
      <rect
        x="5.5"
        y="5.5"
        width="13"
        height="13"
        transform="rotate(45 12 12)"
        className="stroke-brand-primary dark:stroke-white fill-none"
        strokeWidth="1.5"
      />
      <rect
        x="8.5"
        y="8.5"
        width="7"
        height="7"
        transform="rotate(45 12 12)"
        className="fill-brand-primary dark:fill-brand-red"
      />
    </svg>
  );
}

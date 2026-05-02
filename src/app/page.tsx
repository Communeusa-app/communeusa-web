import { ThemeToggle } from "@/components/ThemeToggle";
import { USMapSection } from "@/components/Map/USMapSection";

const NAV_LINKS = ["Representatives", "Elections", "Finance", "About"] as const;

const FEATURES = [
  {
    title: "Your Representatives",
    description:
      "Find every official by address — from city hall to Congress — in seconds.",
    Icon: UsersIcon,
  },
  {
    title: "Voting Records",
    description:
      "See exactly how your officials vote on the issues that matter to you.",
    Icon: ClipboardIcon,
  },
  {
    title: "Campaign Finance",
    description:
      "Follow the money and see who funds your representatives.",
    Icon: DollarIcon,
  },
];

export default function Home() {
  return (
    <>
      {/* ── Navbar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-brand-light-gray/60 dark:border-brand-dark-gray bg-brand-off-white/95 dark:bg-brand-charcoal/95 backdrop-blur-sm">
        <nav className="mx-auto max-w-6xl px-6 h-16 flex items-center gap-6">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 shrink-0">
            <LogoMark />
            <span className="font-semibold text-[15px] tracking-tight text-brand-navy dark:text-brand-off-white">
              CommuneUSA
            </span>
          </a>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-0.5 ml-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="px-3 py-1.5 rounded-md text-sm text-brand-navy/60 dark:text-brand-off-white/60 hover:text-brand-primary dark:hover:text-brand-red hover:bg-brand-light-blue/25 dark:hover:bg-brand-red/10 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="flex flex-col items-center text-center px-6 pt-24 pb-20">
          {/* Eyebrow badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-light-gray dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-brand-navy/55 dark:text-brand-off-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary dark:bg-brand-red shrink-0" />
            Free · Open · Nonpartisan
          </div>

          {/* Heading */}
          <h1 className="max-w-3xl text-5xl sm:text-6xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white leading-[1.1]">
            Your representatives. Your votes.{" "}
            <br className="hidden sm:block" />
            <span className="text-brand-primary dark:text-brand-red">
              Your government.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 max-w-2xl text-lg text-brand-navy/65 dark:text-brand-off-white/60 leading-relaxed">
            Find every official representing you at the federal, state, and
            local level. See how they vote, where their money comes from, and
            how to reach them.
          </p>
          <p className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-brand-primary dark:text-brand-red">
            Want change? Command it.
          </p>

          {/* Address input + CTAs */}
          <div className="mt-10 w-full max-w-md flex flex-col gap-3">
            <input
              type="text"
              placeholder="Enter your address..."
              className="w-full rounded-xl border border-brand-light-gray dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray text-brand-navy dark:text-brand-off-white placeholder:text-brand-mid-gray px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary/40 dark:focus:ring-brand-red/40 focus:border-transparent transition"
            />
            <button className="w-full rounded-xl bg-brand-primary hover:bg-brand-navy dark:bg-brand-red text-white font-semibold px-6 py-3.5 text-base transition-colors">
              Find my representatives
            </button>
            <a
              href="#map"
              className="w-full rounded-xl border border-brand-light-gray dark:border-brand-dark-gray bg-transparent hover:bg-brand-light-blue/25 dark:hover:bg-brand-red/10 text-brand-navy dark:text-brand-off-white font-medium px-6 py-3.5 text-base transition-colors text-center"
            >
              Explore the map ↓
            </a>
          </div>
        </section>

        {/* ── Map ───────────────────────────────────────────────── */}
        <USMapSection />

        {/* ── Feature Cards ─────────────────────────────────────── */}
        <section className="px-6 pb-28">
          <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map(({ title, description, Icon }) => (
              <div
                key={title}
                className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray p-6 hover:border-brand-primary/40 dark:hover:border-brand-red/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-light-blue dark:bg-brand-red/20 flex items-center justify-center text-brand-primary dark:text-brand-red mb-4 shrink-0">
                  <Icon />
                </div>
                <h3 className="text-base font-semibold text-brand-navy dark:text-brand-off-white mb-2">
                  {title}
                </h3>
                <p className="text-sm text-brand-navy/55 dark:text-brand-off-white/55 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-brand-light-gray/60 dark:border-brand-dark-gray px-6 py-10">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col items-center sm:items-start gap-1.5">
            <a href="/" className="flex items-center gap-2">
              <LogoMark />
              <span className="text-sm font-semibold text-brand-navy dark:text-brand-off-white">
                CommuneUSA
              </span>
            </a>
            <p className="text-xs text-brand-navy/45 dark:text-brand-off-white/45">
              Civic data for verified American citizens.
            </p>
          </div>

          {/* Footer links */}
          <div className="flex flex-wrap justify-center sm:justify-end gap-x-6 gap-y-2 text-sm text-brand-navy/55 dark:text-brand-off-white/55">
            {[...NAV_LINKS, "Privacy", "Terms"].map((link) => (
              <a
                key={link}
                href="#"
                className="hover:text-brand-primary dark:hover:text-brand-red transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-brand-navy/35 dark:text-brand-off-white/35">
          © {new Date().getFullYear()} CommuneUSA. All rights reserved.
        </p>
      </footer>
    </>
  );
}

/* ── Logo mark: two rotated squares, inner solid / outer outline ─ */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      className={className}
    >
      {/* Outer diamond — white stroke in dark mode */}
      <rect
        x="5.5"
        y="5.5"
        width="13"
        height="13"
        transform="rotate(45 12 12)"
        className="stroke-brand-primary dark:stroke-white fill-none"
        strokeWidth="1.5"
      />
      {/* Inner diamond — brand-red fill in dark mode */}
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

/* ── Feature icons ────────────────────────────────────────────── */
function UsersIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

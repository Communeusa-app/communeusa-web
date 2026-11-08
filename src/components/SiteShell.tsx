import Link from "next/link";
import { CorrectionModal } from "@/components/CorrectionModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "@/components/MobileNav";

export const NAV_LINKS = [
  { label: "Representatives", href: "/#representatives" },
  { label: "Officials",       href: "/officials" },
  { label: "Elections",       href: "/elections" },
  { label: "Finance",         href: "/finance" },
  { label: "Directory",       href: "/directory" },
  { label: "Rights",          href: "/rights" },
  { label: "About",           href: "/about" },
] as const;

/** Page frame shared by every page: background glow, nav pill, footer card. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-x-clip bg-ink text-fg">
      {/* Background glow (dark) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden dark:block"
        style={{
          background:
            "radial-gradient(1100px 520px at 50% -8%, rgba(24,95,165,.62), transparent 65%), radial-gradient(700px 420px at 0% 0%, rgba(226,75,74,.12), transparent 60%), radial-gradient(1000px 800px at 100% 30%, rgba(24,95,165,.28), transparent 60%), radial-gradient(900px 700px at 0% 100%, rgba(12,68,124,.28), transparent 60%)",
        }}
      />
      {/* Background glow (light) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 dark:hidden"
        style={{
          background:
            "radial-gradient(1100px 520px at 50% -8%, rgba(24,95,165,.22), transparent 65%), radial-gradient(700px 420px at 0% 0%, rgba(226,75,74,.08), transparent 60%), radial-gradient(1000px 800px at 100% 30%, rgba(181,212,244,.55), transparent 60%)",
        }}
      />

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="mx-auto max-w-6xl px-6 pt-6">
        <nav
          aria-label="Main"
          className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[28px] border border-line bg-surface/70 px-4 py-3 backdrop-blur sm:px-5 sm:py-3.5"
        >
          <a href="/" className="flex min-w-0 items-center gap-2.5 text-lg font-semibold tracking-tight sm:gap-3 sm:text-xl xl:text-2xl">
            <LogoMark />
            CommuneUSA
          </a>
          <div className="hidden flex-1 items-center justify-center gap-5 px-4 text-sm lg:flex xl:gap-6 xl:px-8 xl:text-[15px]">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} className="text-fg hover:text-brand-primary dark:hover:text-brand-light-blue transition-colors">
                {label}
              </Link>
            ))}
          </div>
          <a
            href="#lookup"
            className="hidden flex-none whitespace-nowrap sm:ml-auto sm:inline-block lg:ml-0 rounded-full bg-fg px-3.5 py-2.5 text-[13px] font-semibold text-on-fg hover:bg-fg/90 transition-colors sm:px-5 sm:py-3 sm:text-sm xl:px-6 xl:text-[15px]"
          >
            Look up my reps
          </a>
          <MobileNav links={NAV_LINKS} />
        </nav>
      </header>

      <div className="flex-1">{children}</div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-[32px] border border-line bg-surface px-8 pb-8 pt-12 sm:px-12">
          <div className="flex flex-wrap justify-between gap-x-12 gap-y-10">
            <div className="min-w-0 max-w-sm flex-[1_1_300px]">
              <a href="/" className="flex items-center gap-3 text-[26px] font-semibold tracking-tight">
                <LogoMark />
                CommuneUSA
              </a>
              <p className="mt-7 text-lg font-medium leading-snug">Your representatives. Your votes. Your government.</p>
              <p className="mt-3 text-[17px] leading-relaxed text-muted">
                A nonpartisan civic utility, built from public records.
              </p>
            </div>
            <FooterCol title="Product">
              <Link href="/#representatives">Representatives</Link>
              <Link href="/elections">Elections</Link>
              <Link href="/finance">Finance</Link>
              <Link href="/directory">Directory</Link>
            </FooterCol>
            <FooterCol title="Resources">
              <Link href="/officials">Officials</Link>
              <Link href="/rights">Know your rights</Link>
              <Link href="/about">About</Link>
            </FooterCol>
            <FooterCol title="Legal">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </FooterCol>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-7">
            <span className="font-mono text-[13px] text-muted">
              © {new Date().getFullYear()} CommuneUSA. Built from public records.
            </span>
            <div className="flex items-center gap-3">
              <CorrectionModal entityType="general" variant="footer-link" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-[1_1_160px] flex-col gap-[18px] text-base [&_a]:text-muted [&_a:hover]:text-fg [&_a]:transition-colors">
      <span className="font-medium">{title}</span>
      {children}
    </div>
  );
}

/* ── Logo mark: two rotated squares, outer outline / inner solid (original brand mark) ─ */
export function LogoMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="30"
      aria-hidden="true"
      className="flex-none"
    >
      <rect x="5.5" y="5.5" width="13" height="13" transform="rotate(45 12 12)" className="stroke-brand-primary dark:stroke-white fill-none" strokeWidth="1.5" />
      <rect x="8.5" y="8.5" width="7" height="7" transform="rotate(45 12 12)" className="fill-brand-primary dark:fill-brand-red" />
    </svg>
  );
}


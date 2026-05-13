import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Privacy Policy — CommuneUSA",
  description: "How CommuneUSA collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <>
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-brand-light-gray/60 dark:border-brand-dark-gray bg-brand-off-white/95 dark:bg-brand-charcoal/95 backdrop-blur-sm">
        <nav className="mx-auto max-w-6xl px-6 h-16 flex items-center gap-6">
          <a href="/" className="flex items-center gap-2.5 shrink-0">
            <LogoMark />
            <span className="font-semibold text-[15px] tracking-tight text-brand-navy dark:text-brand-off-white">
              CommuneUSA
            </span>
          </a>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
          {/* Header */}
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-primary dark:text-brand-red mb-3">
              Legal
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-brand-navy/55 dark:text-brand-off-white/55 text-sm">
              Last updated: May 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose-communeusa">
            <p>
              CommuneUSA is a nonpartisan civic information tool. We built it to
              make your government more accessible, not to collect data about
              you. This page explains plainly what information passes through our
              service and what we do with it.
            </p>

            <Section title="What we collect">
              <p>
                <strong>Address lookups.</strong> When you type an address to
                find your representatives, that address is sent to the U.S.
                Census Bureau geocoding service to determine your location. We
                do not store your address on our servers and we do not log
                search history.
              </p>
              <p>
                <strong>No accounts.</strong> CommuneUSA does not require you
                to create an account or provide any personal information to use
                the site.
              </p>
              <p>
                <strong>Standard server logs.</strong> Like every website, our
                hosting provider (Vercel) automatically records basic request
                logs — your IP address, browser type, and pages visited. These
                logs are used for debugging and security, are retained for a
                short period, and are not sold.
              </p>
            </Section>

            <Section title="How we use it">
              <p>
                The only reason we process your address is to show you the right
                representatives. We do not build profiles, run advertising, or
                sell data to anyone. If you close the tab, nothing about your
                session is retained on our end.
              </p>
            </Section>

            <Section title="Third-party services">
              <p>
                CommuneUSA pulls data from several public APIs to keep
                representative information current. Here is who they are and
                what role they play:
              </p>
              <ul>
                <li>
                  <strong>Supabase</strong> — our database, hosted in the United
                  States. Official records (names, offices, contact info) are
                  stored here. No personal user data is stored.{" "}
                  <ExternalLink href="https://supabase.com/privacy">
                    Supabase privacy policy
                  </ExternalLink>
                </li>
                <li>
                  <strong>Open States</strong> — a nonprofit that aggregates
                  state legislative data from official government sources. We
                  use their API to look up your state legislators by location.{" "}
                  <ExternalLink href="https://openstates.org/privacy/">
                    Open States privacy policy
                  </ExternalLink>
                </li>
                <li>
                  <strong>Congress.gov</strong> — the official API of the U.S.
                  Library of Congress, used to retrieve current Washington
                  federal legislators.
                </li>
                <li>
                  <strong>U.S. Census Bureau Geocoder</strong> — a free
                  government service that converts a street address into
                  geographic coordinates. Your address is sent directly to the
                  Census Bureau; we do not proxy or retain it.{" "}
                  <ExternalLink href="https://www.census.gov/about/policies/privacy.html">
                    Census Bureau privacy policy
                  </ExternalLink>
                </li>
                <li>
                  <strong>Vercel</strong> — our hosting platform. Vercel may
                  collect standard request metadata as described in their
                  privacy policy.{" "}
                  <ExternalLink href="https://vercel.com/legal/privacy-policy">
                    Vercel privacy policy
                  </ExternalLink>
                </li>
              </ul>
            </Section>

            <Section title="Cookies and local storage">
              <p>
                We use your browser&apos;s <code>sessionStorage</code> to
                remember your most recent address lookup within a single
                session — so that pressing the back button restores your
                results. This data never leaves your device and is cleared when
                you close the tab. We do not use tracking cookies or
                third-party advertising cookies.
              </p>
            </Section>

            <Section title="Your rights">
              <p>
                Because we do not store personal information, there is nothing
                for us to delete, correct, or export on your behalf. The
                representative data we display comes from public government
                records and is available to anyone.
              </p>
              <p>
                If you believe we have inadvertently collected something we
                should not have, please contact us and we will address it
                promptly.
              </p>
            </Section>

            <Section title="Children">
              <p>
                CommuneUSA is a general-public civic tool. We do not knowingly
                collect information from children under 13.
              </p>
            </Section>

            <Section title="Changes to this policy">
              <p>
                If we make meaningful changes to this policy, we will update the
                date at the top of this page. We will not change our practices
                to be less protective of your information without clear notice.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                Questions or concerns? Contact form coming soon. We read
                everything and respond to every serious inquiry.
              </p>
            </Section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

/* ── Sub-components ────────────────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-brand-navy dark:text-brand-off-white mb-3">
        {title}
      </h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-brand-navy/75 dark:text-brand-off-white/70">
        {children}
      </div>
    </section>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-primary dark:text-brand-red underline underline-offset-2 hover:opacity-75 transition-opacity"
    >
      {children}
    </a>
  );
}

function Footer() {
  return (
    <footer className="border-t border-brand-light-gray/60 dark:border-brand-dark-gray px-6 py-10 mt-8">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8">
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
        <div className="flex flex-wrap justify-center sm:justify-end gap-x-6 gap-y-2 text-sm text-brand-navy/55 dark:text-brand-off-white/55">
          <a href="/" className="hover:text-brand-primary dark:hover:text-brand-red transition-colors">Home</a>
          <a href="/privacy" className="text-brand-primary dark:text-brand-red">Privacy</a>
          <a href="/terms" className="hover:text-brand-primary dark:hover:text-brand-red transition-colors">Terms</a>
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-brand-navy/35 dark:text-brand-off-white/35">
        © {new Date().getFullYear()} CommuneUSA. All rights reserved.
      </p>
    </footer>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
      <rect x="5.5" y="5.5" width="13" height="13" transform="rotate(45 12 12)"
        className="stroke-brand-primary dark:stroke-white fill-none" strokeWidth="1.5" />
      <rect x="8.5" y="8.5" width="7" height="7" transform="rotate(45 12 12)"
        className="fill-brand-primary dark:fill-brand-red" />
    </svg>
  );
}

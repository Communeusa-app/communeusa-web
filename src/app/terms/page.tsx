import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Terms of Service — CommuneUSA",
  description: "The terms under which you may use CommuneUSA.",
};

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-brand-navy/55 dark:text-brand-off-white/55 text-sm">
              Last updated: May 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose-communeusa">
            <p>
              Welcome to CommuneUSA. By using this site you agree to these
              terms. We have written them in plain language on purpose — if
              something is unclear, just ask.
            </p>

            <Section title="What CommuneUSA is">
              <p>
                CommuneUSA is a free, nonpartisan civic information tool. It
                helps you identify your elected and appointed representatives at
                the federal, state, and county level, and see how to reach them.
                It is not affiliated with any political party, campaign,
                government agency, or advocacy group.
              </p>
            </Section>

            <Section title="Acceptable use">
              <p>You may use CommuneUSA to:</p>
              <ul>
                <li>Look up your own representatives by address.</li>
                <li>Share representative information with others.</li>
                <li>Learn about the structure of your government.</li>
              </ul>
              <p>Please do not:</p>
              <ul>
                <li>
                  Scrape, crawl, or bulk-download data from this site at a rate
                  that would disrupt service for others.
                </li>
                <li>
                  Use the site to harass, threaten, or target individuals —
                  including the officials listed.
                </li>
                <li>
                  Attempt to reverse-engineer, attack, or interfere with the
                  site&apos;s infrastructure.
                </li>
                <li>
                  Misrepresent this site as an official government resource.
                </li>
              </ul>
            </Section>

            <Section title="Data accuracy — no warranty">
              <p>
                Our representative data is sourced from public government APIs
                and official directories — Open States, Congress.gov, the U.S.
                Census Bureau geocoder, and the MRSC Officials Directory for
                Washington counties. We keep this data as current as possible
                through automated nightly syncs, but we cannot guarantee that
                it is always complete, accurate, or up to date.
              </p>
              <p>
                <strong>
                  CommuneUSA is provided &ldquo;as is&rdquo; with no warranty
                  of any kind.
                </strong>{" "}
                Do not rely on it as your sole source for time-sensitive civic
                matters like voting deadlines or official contact information.
                Always verify with an official government source when it counts.
              </p>
            </Section>

            <Section title="Civic data and public records">
              <p>
                The information displayed on CommuneUSA — names, offices,
                districts, phone numbers, and email addresses — is public record.
                It is the same information published by government bodies and
                available through official channels. We aggregate and organize
                it to make it more accessible, but we do not create, alter, or
                verify the underlying facts.
              </p>
              <p>
                If you believe a specific record is incorrect, please contact
                us. We will investigate and, where appropriate, update our data
                or reach out to the source API.
              </p>
            </Section>

            <Section title="No political affiliation">
              <p>
                CommuneUSA has no political agenda. We display information about
                officials regardless of party. We do not endorse, oppose, or
                rank candidates or elected officials. Any party labels shown are
                taken directly from official government data sources.
              </p>
              <p>
                CommuneUSA is not sponsored by or affiliated with any campaign,
                PAC, political party, or government entity.
              </p>
            </Section>

            <Section title="Third-party links">
              <p>
                Official profile links on this site may point to government
                websites, legislative pages, or other external resources. We are
                not responsible for the content or privacy practices of those
                sites.
              </p>
            </Section>

            <Section title="Limitation of liability">
              <p>
                To the maximum extent permitted by law, CommuneUSA and its
                operators are not liable for any loss or damage arising from
                your use of the site, reliance on the data displayed, or
                inability to access the service.
              </p>
            </Section>

            <Section title="Changes to these terms">
              <p>
                We may update these terms from time to time. When we do, we
                will update the date at the top of this page. Continued use of
                the site after changes means you accept the updated terms.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                Questions about these terms? Contact form coming soon.
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
          <a href="/privacy" className="hover:text-brand-primary dark:hover:text-brand-red transition-colors">Privacy</a>
          <a href="/terms" className="text-brand-primary dark:text-brand-red">Terms</a>
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

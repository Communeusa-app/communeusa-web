import { SiteShell } from "@/components/SiteShell";



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
    <SiteShell>

      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-4xl space-y-20">

          {/* Mission */}
          <section>
            <h1 className="text-4xl font-bold tracking-tight text-fg mb-6">
              Our Mission
            </h1>
            <p className="text-lg leading-relaxed text-muted max-w-3xl">
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
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              What We Cover
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COVERAGE.map(({ title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-line bg-surface p-6"
                >
                  <h3 className="text-base font-semibold text-fg mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Our principles */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              Our Principles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {PRINCIPLES.map(({ title, description }) => (
                <div key={title}>
                  <div className="w-8 h-0.5 bg-fg mb-4 rounded-full" />
                  <h3 className="text-base font-semibold text-fg mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Data sources */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              Data Sources
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SOURCES.map((source) => (
                <li
                  key={source}
                  className="flex items-center gap-3 text-sm text-muted"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-fg shrink-0" />
                  {source}
                </li>
              ))}
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-4">
              Contact
            </h2>
            <div className="rounded-2xl border border-line bg-surface px-6 py-5">
              <p className="text-sm text-muted">
                Have a question or found inaccurate data? Contact form coming
                soon.
              </p>
            </div>
          </section>

        </div>
      </main>

    </SiteShell>
  );
}


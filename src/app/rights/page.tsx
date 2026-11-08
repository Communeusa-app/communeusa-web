import { RightsBrowser } from "./RightsBrowser";
import { SiteShell } from "@/components/SiteShell";



export const metadata = {
  title: "Know Your Rights — CommuneUSA",
  description:
    "Plain language explanations of your rights as an American citizen at the federal, state, and local level. Every entry is sourced to the actual statute, ruling, or regulation.",
};

export default function RightsPage() {
  return (
    <SiteShell>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-fg">
              Know Your Rights
            </h1>
            <p className="mt-3 max-w-2xl text-muted leading-relaxed">
              Plain language explanations of your rights as an American citizen at the
              federal, state, and local level. Every entry is sourced to the actual
              statute, ruling, or regulation.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="mb-10 flex gap-3 rounded-2xl border border-line bg-fg/5 px-5 py-4">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 mt-0.5 text-muted"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-muted leading-relaxed">
              <strong className="font-semibold text-muted">
                Educational purposes only.
              </strong>{" "}
              This information does not constitute legal advice. Laws change — always
              verify current law with an attorney or official government source. If you
              need legal help,{" "}
              <a
                href="https://www.aclu.org/know-your-rights"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary dark:text-brand-light-blue hover:underline"
              >
                ACLU Know Your Rights
              </a>
              {" "}and{" "}
              <a
                href="https://www.lawhelp.org/wa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary dark:text-brand-light-blue hover:underline"
              >
                LawHelp WA
              </a>
              {" "}offer free resources.
            </p>
          </div>

          <RightsBrowser />
        </div>
      </main>

    </SiteShell>
  );
}


import {
  getAllFinanceOfficials,
  getTopPACDonors,
  getTopIndividualDonors,
  getTopIndustries,
} from "@/app/actions/finance";
import { FinanceBrowser } from "./FinanceBrowser";
import { SiteShell } from "@/components/SiteShell";



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
    <SiteShell>

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

          {/* Coverage note */}
          <div className="mb-10 rounded-xl border border-brand-light-gray/60 dark:border-brand-dark-gray bg-brand-light-gray/20 dark:bg-brand-dark-gray/30 px-5 py-4">
            <p className="text-sm text-brand-navy/65 dark:text-brand-off-white/55 leading-relaxed">
              Campaign finance data is available for officials who have filed with the Washington PDC
              or federal FEC. Many local officials run unopposed or in races below disclosure
              thresholds and will not have finance records on file. Data is sourced directly from{" "}
              <a
                href="https://www.pdc.wa.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-brand-primary dark:hover:text-brand-red transition-colors"
              >
                PDC.wa.gov
              </a>
              {" "}and{" "}
              <a
                href="https://www.fec.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-brand-primary dark:hover:text-brand-red transition-colors"
              >
                FEC.gov
              </a>
              .
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

    </SiteShell>
  );
}


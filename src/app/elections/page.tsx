import { getWACounties, getWACities, getElectionCycles } from "@/app/actions/elections";
import { ElectionsBrowser } from "./ElectionsBrowser";
import { SiteShell } from "@/components/SiteShell";



export const metadata = {
  title: "Elections — CommuneUSA",
  description: "Find upcoming elections and candidates in Washington State.",
};

export default async function ElectionsPage() {
  const [counties, cities, cycles] = await Promise.all([getWACounties(), getWACities(), getElectionCycles()]);

  return (
    <SiteShell>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-fg">
              Elections
            </h1>
            <p className="mt-2 text-muted">
              Races, candidates and results for Washington State, from 2022 onward.
            </p>
          </div>
          <ElectionsBrowser counties={counties} cities={cities} cycles={cycles} />
        </div>
      </main>

    </SiteShell>
  );
}


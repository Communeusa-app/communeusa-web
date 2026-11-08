import { OfficialSearch } from "./OfficialSearch";
import { SiteShell } from "@/components/SiteShell";



export const metadata = {
  title: "Officials Search — CommuneUSA",
  description:
    "Search every elected and appointed official in Washington by name.",
};

export default function OfficialsPage() {
  return (
    <SiteShell>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Hero */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-brand-navy dark:text-brand-off-white">
              Officials Search
            </h1>
            <p className="mt-2 text-brand-navy/60 dark:text-brand-off-white/55">
              Find any elected or appointed official in Washington by name.
            </p>
          </div>

          <OfficialSearch />
        </div>
      </main>

    </SiteShell>
  );
}


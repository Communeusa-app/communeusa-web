import { OfficialSearch } from "./OfficialSearch";
import { SiteShell } from "@/components/SiteShell";



export const metadata = {
  title: "Find Officials — CommuneUSA",
  description:
    "Find any elected or appointed official in Washington by name, office or place, like Seattle mayor or King County sheriff.",
};

export default function OfficialsPage() {
  return (
    <SiteShell>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Hero */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-fg">
              Find your officials
            </h1>
            <p className="mt-2 text-muted">
              Search by name, office or place. No need to know who holds the seat.
            </p>
          </div>

          <OfficialSearch />
        </div>
      </main>

    </SiteShell>
  );
}


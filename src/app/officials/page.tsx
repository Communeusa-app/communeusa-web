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
            <h1 className="text-4xl font-bold tracking-tight text-fg">
              Officials Search
            </h1>
            <p className="mt-2 text-muted">
              Find any elected or appointed official in Washington by name.
            </p>
          </div>

          <OfficialSearch />
        </div>
      </main>

    </SiteShell>
  );
}


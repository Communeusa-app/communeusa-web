import { getEntitiesByCategory, getDirectoryCounties } from "@/app/actions/directory";
import { DirectoryBrowser } from "./DirectoryBrowser";
import { SiteShell } from "@/components/SiteShell";



export const metadata = {
  title: "Directory — CommuneUSA",
  description:
    "Every public institution, agency, and entity serving American residents, starting with Washington State.",
};

export default async function DirectoryPage() {
  const [initialEntities, counties] = await Promise.all([
    getEntitiesByCategory("school-districts"),
    getDirectoryCounties(),
  ]);

  return (
    <SiteShell>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          {/* Hero */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-fg">
              Government Directory
            </h1>
            <p className="mt-2 text-muted max-w-2xl">
              Every public institution, agency, and entity serving American residents.
            </p>
          </div>

          <DirectoryBrowser
            initialCategory="school-districts"
            initialEntities={initialEntities}
            counties={counties}
          />
        </div>
      </main>

    </SiteShell>
  );
}


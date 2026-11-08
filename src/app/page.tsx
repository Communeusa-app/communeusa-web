import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { USMapSection } from "@/components/Map/USMapSection";
import { AddressLookup } from "@/components/AddressLookup";
import { HowTabs, type HowTab } from "@/components/HowTabs";


const GAPS = [
  {
    n: "01",
    title: "It is scattered.",
    body: "Information about your officials sits on dozens of separate government sites, and most people do not know where to look.",
  },
  {
    n: "02",
    title: "Local gets the least coverage.",
    body: "School boards, sheriffs and city councils shape daily life, and they get the least attention.",
  },
  {
    n: "03",
    title: "Money is hard to follow.",
    body: "Campaign funding and outside spending live in filings that are slow to search and harder to read.",
  },
] as const;

const DATA_CARDS = [
  {
    n: "01",
    title: "Officials",
    body: "Federal, state, county and city, with party, office and contact details where on file.",
    href: "/officials",
  },
  {
    n: "02",
    title: "Voting records",
    body: "How each official voted, taken from official legislative records.",
    href: "/officials",
  },
  {
    n: "03",
    title: "Campaign finance",
    body: "Who funds each campaign, and which PACs spent to support or oppose it.",
    href: "/finance",
  },
  {
    n: "04",
    title: "Elections",
    body: "What is on the ballot and who is running, on a map you can explore.",
    href: "/elections",
  },
] as const;

const ACTIONS = [
  { label: "contact", text: "copy a message template" },
  { label: "vote",    text: "register and check your ballot" },
  { label: "testify", text: "legislature and city councils" },
  { label: "recall",  text: "how it works, educational" },
] as const;

const HOW_TABS: HowTab[] = [
  {
    label: "Look up",
    step: "Step 1",
    title: "Start with an address.",
    body: "One street address finds your congressional, legislative and county districts, then lists every official who represents you.",
    content: (
      <>
        <div className="rounded-full border border-line bg-surface px-5 py-3.5 text-base text-muted">Street address, city, ZIP</div>
        <dl className="mt-5 flex flex-col gap-3 font-mono text-[13px]">
          <Row k="congressional district" v="from your address" />
          <Row k="legislative district" v="from your address" />
          <Row k="county" v="from your address" />
        </dl>
      </>
    ),
  },
  {
    label: "Understand",
    step: "Step 2",
    title: "See the record behind each name.",
    body: "Each profile shows how the official voted and who paid to support or oppose them, taken from public filings.",
    content: (
      <>
        <div className="text-xl font-semibold">Every official has a profile</div>
        <div className="mt-1 text-[15px] text-muted">Federal, state, county and city</div>
        <dl className="mt-5 flex flex-col gap-3 border-t border-line pt-4 font-mono text-[13px]">
          <Row k="votes" v="official roll calls" />
          <Row k="campaign funding" v="public filings" />
          <Row k="outside spending" v="spent supporting / opposing" />
        </dl>
      </>
    ),
  },
  {
    label: "Act",
    step: "Step 3",
    title: "Do something with it.",
    body: "Contact an official, check your next election, find where to testify, or learn how recall works in Washington.",
    content: (
      <ul className="flex flex-col font-mono text-sm">
        {ACTIONS.map((a, i) => (
          <li key={a.label} className={`flex gap-5 py-3.5 ${i < ACTIONS.length - 1 ? "border-b border-line" : ""}`}>
            <span className="w-20 flex-none text-brand-primary dark:text-brand-light-blue">{a.label}</span>
            <span>{a.text}</span>
          </li>
        ))}
      </ul>
    ),
  },
];

const MONO = "font-mono tracking-[0.12em] uppercase";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state: initialState } = await searchParams;
  return (
    <SiteShell>
      <main>
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section id="representatives" className="mx-auto flex max-w-6xl flex-col items-center px-6 pt-24 pb-16 text-center sm:pt-28">
          <h1 className="text-[clamp(44px,7vw,92px)] font-bold leading-[1.04] tracking-[-0.04em]">
            <span className="block">Your representatives.</span>
            <span className="block">Your votes.</span>
            <span className="block bg-gradient-to-r from-fg to-brand-red/90 bg-clip-text pb-[0.14em] text-transparent">
              Your government.
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            Enter an address and see every official who represents you, how they vote, who funds them, and what you can do about it.
          </p>

          <div id="lookup" className="mt-10 w-full">
            <AddressLookup />
          </div>

          <p className={`mt-8 text-[13px] text-muted ${MONO} !tracking-[0.04em] !normal-case`}>
            Public records · Nonpartisan · Built for citizens
          </p>
        </section>

        {/* ── Look up / Understand / Act ───────────────────────── */}
        <section id="how" className="mx-auto max-w-6xl px-6 pb-24">
          <HowTabs tabs={HOW_TABS} />
        </section>

        {/* ── Map (focal point) ────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="overflow-hidden rounded-[28px] border border-line bg-surface">
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4 text-[13px] text-muted ${MONO}`}>
              <span>United States / Explore</span>
              <span className="normal-case tracking-normal">Click a state, then a county</span>
            </div>
            <USMapSection initialState={initialState} />
          </div>
        </section>

        {/* ── The gap ──────────────────────────────────────────── */}
        <section id="about" className="mx-auto max-w-6xl px-6 pb-24">
          <Eyebrow>The gap</Eyebrow>
          <h2 className="mt-7 max-w-3xl text-[clamp(34px,4.6vw,56px)] font-bold leading-[1.08] tracking-[-0.035em]">
            Your government is public. Finding it should not take a research project.
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {GAPS.map((g) => (
              <div key={g.n} className="rounded-[28px] border border-line bg-surface px-9 pb-11 pt-8">
                <span className="font-mono text-sm text-accent">{g.n}</span>
                <h3 className="mb-3.5 mt-7 text-[26px] font-semibold leading-tight tracking-tight">{g.title}</h3>
                <p className="text-lg leading-relaxed text-muted">{g.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── What is inside ───────────────────────────────────── */}
        <section id="finance" className="mx-auto flex max-w-6xl flex-wrap items-start gap-x-14 gap-y-12 px-6 pb-24">
          <div className="min-w-0 flex-[1_1_360px]">
            <Eyebrow>Washington</Eyebrow>
            <h2 className="mt-7 text-[clamp(34px,4.2vw,52px)] font-bold leading-[1.08] tracking-[-0.035em]">
              A public record of your government, in one place.
            </h2>
            <p className="mt-7 text-[19px] leading-[1.65] text-muted">
              CommuneUSA pulls from official sources and keeps them current: Congress.gov, OpenStates, the Washington Public Disclosure Commission, the FEC, and the Census Bureau.
            </p>
            <p className="mt-5 text-[19px] leading-[1.65] text-muted">
              Every profile shows who the person is, how they voted, and who paid to support or oppose them.
            </p>
          </div>
          <div className="grid min-w-0 flex-[1.5_1_480px] gap-6 sm:grid-cols-2">
            {DATA_CARDS.map((c) => (
              <Link
                key={c.n}
                href={c.href}
                className="group rounded-[28px] border border-line bg-surface px-[30px] pb-8 pt-7 transition-colors hover:border-brand-light-blue/40"
              >
                <span className="font-mono text-sm text-accent">{c.n}</span>
                <h3 className="mb-2.5 mt-5 text-2xl font-semibold tracking-tight">{c.title}</h3>
                <p className="text-[17px] leading-relaxed text-muted">{c.body}</p>
                <span className="mt-6 inline-block font-mono text-[13px] text-brand-primary dark:text-brand-light-blue">Open →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div
            className="rounded-[36px] border border-line bg-surface px-8 py-20 text-center sm:py-24"
            style={{
              backgroundImage:
                "radial-gradient(700px 400px at 20% 0%, rgba(226,75,74,.12), transparent 60%), radial-gradient(800px 500px at 100% 100%, rgba(24,95,165,.30), transparent 60%)",
            }}
          >
            <h2 className="text-[clamp(34px,5vw,60px)] font-bold leading-[1.06] tracking-[-0.04em]">
              Find the people who represent you.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[19px] leading-relaxed text-muted">
              Start with an address. See every official, how they vote, and who funds them.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3.5">
              <a href="#lookup" className="rounded-full bg-fg px-8 py-[18px] text-[17px] font-semibold text-on-fg hover:bg-fg/90 transition-colors">
                Look up my address
              </a>
              <Link href="/elections" className="rounded-full border border-fg/25 px-8 py-[17px] text-[17px] font-medium hover:border-fg/60 transition-colors">
                Browse elections
              </Link>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

/* ── Small pieces ─────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-xs ${MONO}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-red" />
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

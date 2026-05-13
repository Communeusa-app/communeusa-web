import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Allow up to 60 s on Vercel Pro; hobby plan caps at 10 s.
export const maxDuration = 60;

// ── Types ──────────────────────────────────────────────────────────────────

interface Official {
  id: string;
  official_name: string;
  party: string | null;
  term_end: string | null;
  phone: string | null;
  email: string | null;
  office_title: string | null;
  district: string | null;
  official_website: string | null;
  is_active: boolean;
}

interface ApiOfficial {
  official_name: string;
  level: "state" | "federal";
  office_title: string;
  office_category: string;
  party?: string | null;
  district?: string | null;
  term_start?: string | null;
  term_end?: string | null;
  phone?: string | null;
  email?: string | null;
  official_website?: string | null;
}

interface SyncResult {
  inserted: number;
  updated: number;
  flagged_inactive: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function clean(val: unknown): string | null {
  if (val == null) return null;
  const s = String(val).trim();
  return s || null;
}

function lastFirstToFirstLast(name: string): string {
  const parts = name.split(",", 2);
  return parts.length === 2
    ? `${parts[1].trim()} ${parts[0].trim()}`
    : name.trim();
}

// ── Open States ────────────────────────────────────────────────────────────

async function fetchStateOfficials(apiKey: string): Promise<ApiOfficial[]> {
  const people: ApiOfficial[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://v3.openstates.org/people?jurisdiction=wa&include=offices&per_page=50&page=${page}`,
      { headers: { "X-API-KEY": apiKey } },
    );
    if (!res.ok) throw new Error(`Open States ${res.status}: ${await res.text()}`);
    const data = await res.json();

    for (const person of data.results ?? []) {
      const role = person.current_role as Record<string, string> | null;
      if (!role) continue;

      const orgClass = role.org_classification;
      let officeTitle: string;
      let officeCategory: string;

      if (orgClass === "upper") {
        officeTitle = "State Senate";
        officeCategory = "Senate";
      } else if (orgClass === "lower") {
        officeTitle = "State House of Representatives";
        officeCategory = "House";
      } else {
        continue;
      }

      const offices: Array<Record<string, string>> = person.offices ?? [];
      const phone = clean(offices[0]?.voice);

      people.push({
        official_name:   clean(person.name) ?? "",
        level:           "state",
        office_title:    officeTitle,
        office_category: officeCategory,
        party:           clean(person.party),
        district:        role.district != null ? clean(String(role.district)) : null,
        email:           clean(person.email),
        phone,
      });
    }

    const { pagination } = data;
    if (!pagination || page >= (pagination.max_page ?? 1)) break;
    page++;
  }

  return people;
}

// ── Congress.gov ───────────────────────────────────────────────────────────

function extractTerms(obj: Record<string, unknown>): Array<Record<string, unknown>> {
  const t = obj.terms;
  if (Array.isArray(t)) return t;
  if (t && typeof t === "object" && Array.isArray((t as Record<string, unknown>).item)) {
    return (t as Record<string, unknown[]>).item as Array<Record<string, unknown>>;
  }
  return [];
}

async function fetchFederalOfficials(apiKey: string): Promise<ApiOfficial[]> {
  // Step 1 — collect all current WA members from the list endpoint
  const rawMembers: Array<Record<string, unknown>> = [];
  let offset = 0;

  while (true) {
    const res = await fetch(
      `https://api.congress.gov/v3/member?currentMember=true&limit=250&offset=${offset}&format=json&api_key=${apiKey}`,
    );
    if (!res.ok) throw new Error(`Congress.gov list ${res.status}`);
    const data = await res.json();
    const batch: Array<Record<string, unknown>> = data.members ?? [];
    const waMembers = batch.filter((m) => m.state === "Washington");
    rawMembers.push(...waMembers);

    const total: number = data.pagination?.count ?? batch.length;
    if (offset + 250 >= total || batch.length === 0) break;
    offset += 250;
  }

  // Step 2 — fetch detail for each WA member
  const CHAMBER_TITLE: Record<string, string> = {
    "Senate":               "U.S. Senator",
    "House of Representatives": "U.S. Representative",
  };
  const CHAMBER_CATEGORY: Record<string, string> = {
    "Senate":               "Senate",
    "House of Representatives": "House",
  };

  const members: ApiOfficial[] = [];

  for (const raw of rawMembers) {
    const detailUrl = raw.url as string | undefined;
    let detail: Record<string, unknown> = {};

    if (detailUrl) {
      try {
        const res = await fetch(`${detailUrl}?format=json&api_key=${apiKey}`);
        if (res.ok) detail = (await res.json()).member ?? {};
      } catch {
        // non-fatal — fall back to list data
      }
    }

    const name = clean(detail.directOrderName as string)
      ?? lastFirstToFirstLast(String(raw.name ?? ""));
    if (!name) continue;

    const terms = extractTerms(detail).length
      ? extractTerms(detail)
      : extractTerms(raw as Record<string, unknown>);
    const currentTerm = terms.at(-1) as Record<string, unknown> | undefined ?? {};
    const chamber = String(currentTerm.chamber ?? "");

    const officeTitle    = CHAMBER_TITLE[chamber];
    const officeCategory = CHAMBER_CATEGORY[chamber];
    if (!officeTitle) continue;

    const endYear = currentTerm.endYear;
    members.push({
      official_name:    name,
      level:            "federal",
      office_title:     officeTitle,
      office_category:  officeCategory,
      party:            clean(String(raw.partyName ?? detail.partyName ?? "")),
      district:         raw.district != null ? clean(String(raw.district)) : null,
      term_start:       currentTerm.startYear != null ? clean(String(currentTerm.startYear)) : null,
      term_end:         endYear != null ? `Jan ${endYear}` : null,
      official_website: clean(detail.officialUrl as string),
    });

    // Respect Congress.gov rate limit
    await new Promise((r) => setTimeout(r, 500));
  }

  return members;
}

// ── Supabase sync ──────────────────────────────────────────────────────────

const MUTABLE_FIELDS = [
  "party", "term_end", "phone", "email",
  "office_title", "district", "official_website",
] as const;

async function syncOfficials(
  supabase: SupabaseClient,
  waId: string,
  incoming: ApiOfficial[],
  level: "state" | "federal",
): Promise<SyncResult> {
  const { data: existingRows } = await supabase
    .from("officials")
    .select("id,official_name,party,term_end,phone,email,office_title,district,official_website,is_active")
    .eq("level", level);

  const existing = new Map<string, Official>(
    (existingRows ?? []).map((r: Official) => [r.official_name, r]),
  );
  const incomingByName = new Map(
    incoming
      .filter((r) => r.official_name)
      .map((r) => [r.official_name, r]),
  );

  let inserted = 0, updated = 0, flagged_inactive = 0;

  // INSERT or UPDATE
  for (const [name, apiRow] of incomingByName) {
    const dbRow = existing.get(name);

    if (!dbRow) {
      await supabase.from("officials").insert({
        state_id:        waId,
        level,
        is_active:       true,
        official_name:   apiRow.official_name,
        office_title:    apiRow.office_title,
        office_category: apiRow.office_category,
        party:           apiRow.party ?? null,
        district:        apiRow.district ?? null,
        term_start:      apiRow.term_start ?? null,
        term_end:        apiRow.term_end ?? null,
        phone:           apiRow.phone ?? null,
        email:           apiRow.email ?? null,
        official_website: apiRow.official_website ?? null,
      });
      inserted++;
      continue;
    }

    const changes: Record<string, string | boolean | null> = {};
    for (const field of MUTABLE_FIELDS) {
      const newVal = clean(apiRow[field] ?? null);
      const oldVal = clean(dbRow[field] ?? null);
      if (newVal !== null && newVal !== oldVal) changes[field] = newVal;
    }
    if (!dbRow.is_active) changes.is_active = true;

    if (Object.keys(changes).length > 0) {
      await supabase.from("officials").update(changes).eq("id", dbRow.id);
      updated++;
    }
  }

  // FLAG INACTIVE
  for (const [name, dbRow] of existing) {
    if (!incomingByName.has(name) && dbRow.is_active) {
      await supabase.from("officials").update({ is_active: false }).eq("id", dbRow.id);
      flagged_inactive++;
    }
  }

  return { inserted, updated, flagged_inactive };
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Auth — Vercel injects Authorization: Bearer <CRON_SECRET> automatically.
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const openStatesKey = process.env.OPENSTATES_API_KEY;
  const congressKey = process.env.CONGRESS_API_KEY;

  const missing = (
    [
      ["SUPABASE_URL", supabaseUrl],
      ["SUPABASE_SERVICE_KEY", supabaseKey],
      ["OPENSTATES_API_KEY", openStatesKey],
      ["CONGRESS_API_KEY", congressKey],
    ] as [string, string | undefined][]
  )
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing env vars: ${missing.join(", ")}` },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl!, supabaseKey!);

  try {
    const { data: waState } = await supabase
      .from("states")
      .select("id")
      .eq("abbreviation", "WA")
      .single();

    if (!waState) {
      return NextResponse.json({ error: "WA state row not found" }, { status: 500 });
    }
    const waId: string = waState.id;

    const [stateOfficials, federalOfficials] = await Promise.all([
      fetchStateOfficials(openStatesKey!),
      fetchFederalOfficials(congressKey!),
    ]);

    const [stateResult, federalResult] = await Promise.all([
      syncOfficials(supabase, waId, stateOfficials, "state"),
      syncOfficials(supabase, waId, federalOfficials, "federal"),
    ]);

    return NextResponse.json({
      ok: true,
      synced_at: new Date().toISOString(),
      state: {
        fetched: stateOfficials.length,
        ...stateResult,
      },
      federal: {
        fetched: federalOfficials.length,
        ...federalResult,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

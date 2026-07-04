import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Vercel Pro allows up to 300 s for cron jobs.
export const maxDuration = 300;

// ── Constants ──────────────────────────────────────────────────────────────

const FEC_BASE          = "https://api.fec.gov/v1";
const DEFAULT_CYCLE     = 2026;
const IE_PAGE_CAP       = 20;   // ≤ 2 000 aggregate rows per run
const DONORS_PAGES      = 2;    // top ~200 donors per PAC
const PER_PAGE          = 100;
const REQUEST_DELAY     = 300;  // ms between FEC calls → ~3 req/s, safe for 1 000/hr keys
const DEFAULT_LIMIT     = 100;  // committees per invocation
const HARD_LIMIT        = 200;
const CANDIDATE_API_CAP = 50;   // max /candidate/{id}/ fallback calls per run

// ── FEC type maps ──────────────────────────────────────────────────────────

const COMMITTEE_TYPE_MAP: Record<string, string> = {
  O: "super_pac",
  N: "pac",
  Q: "pac",
  V: "hybrid_pac",
  W: "hybrid_pac",
  X: "party",
  Y: "party",
  Z: "party",
};

function mapCommitteeType(code: string): string {
  return COMMITTEE_TYPE_MAP[code] ?? "other";
}

const DONOR_TYPE_MAP: Record<string, string> = {
  IND:  "individual",
  ORG:  "corporation",
  CORP: "corporation",
  LAB:  "union",
  COM:  "other_pac",
  CCM:  "other_pac",
  PAC:  "other_pac",
};

function mapDonorType(entityType: string | null): string {
  if (!entityType) return "other";
  return DONOR_TYPE_MAP[entityType.toUpperCase()] ?? "other";
}

// ── Value helpers ──────────────────────────────────────────────────────────

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

// Normalises FEC "LAST, FIRST" or plain "First Last" to lowercase "first last".
function normalizeName(raw: string): string {
  const parts = raw.split(",", 2);
  const flipped =
    parts.length === 2
      ? `${parts[1].trim()} ${parts[0].trim()}`
      : raw.trim();
  return flipped.toLowerCase().replace(/\s+/g, " ").trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── FEC fetch helper ───────────────────────────────────────────────────────

async function fecGet(
  path: string,
  params: Record<string, string>,
  apiKey: string,
): Promise<Record<string, unknown>> {
  const url = new URL(`${FEC_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("api_key", apiKey);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FEC ${res.status} ${path}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

// ── Phase 1: Independent Expenditures ─────────────────────────────────────

interface FecIE {
  committeeId: string;
  candidateId: string | null;
  candidateName: string;
  supportOppose: "support" | "oppose";
  amount: number;
  expenditureDate: string | null;
}

interface IEFetchResult {
  ies: FecIE[];
  cycle: number;
  firstPageUrl: string;
  firstPagePagination: Record<string, unknown>;
  fecError: { status: number; message: string } | null;
}

// Uses the by_candidate aggregate endpoint which supports plain page-number
// pagination and returns one row per committee × candidate × support/oppose.
async function fetchAllIEs(apiKey: string, cycle: number): Promise<IEFetchResult> {
  const ies: FecIE[] = [];
  let firstPageUrl             = "";
  let firstPagePagination: Record<string, unknown> = {};
  let fecError: IEFetchResult["fecError"]          = null;

  for (let page = 1; page <= IE_PAGE_CAP; page++) {
    const params: Record<string, string> = {
      cycle:         String(cycle),
      election_full: "false",
      per_page:      String(PER_PAGE),
      page:          String(page),
    };

    const fetchUrl = new URL(`${FEC_BASE}/schedules/schedule_e/by_candidate/`);
    for (const [k, v] of Object.entries(params)) fetchUrl.searchParams.set(k, v);
    fetchUrl.searchParams.set("api_key", apiKey);

    if (page === 1) {
      const debugUrl = new URL(fetchUrl.toString());
      debugUrl.searchParams.set("api_key", "REDACTED");
      firstPageUrl = debugUrl.toString();
    }

    let res: Response;
    try {
      res = await fetch(fetchUrl.toString(), { cache: "no-store" });
    } catch (err) {
      fecError = { status: 0, message: String(err) };
      break;
    }
    await sleep(REQUEST_DELAY);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      fecError = { status: res.status, message: body.slice(0, 500) };
      break;
    }

    const data       = await res.json() as Record<string, unknown>;
    const pagination = (data.pagination as Record<string, unknown>) ?? {};
    if (page === 1) firstPagePagination = pagination;

    const results = (data.results as Array<Record<string, unknown>>) ?? [];
    if (!results.length) break;

    for (const r of results) {
      const committeeId = str(r.committee_id);
      if (!committeeId) continue;

      const so = str(r.support_oppose_indicator);
      if (so !== "S" && so !== "O") continue;

      ies.push({
        committeeId,
        candidateId:     str(r.candidate_id),
        candidateName:   str(r.candidate_name) ?? "Unknown",
        supportOppose:   so === "S" ? "support" : "oppose",
        amount:          Number(r.total ?? 0),
        expenditureDate: null, // aggregate — no single date
      });
    }
  }

  return { ies, cycle, firstPageUrl, firstPagePagination, fecError };
}

// ── Phase 2: Candidate-to-official resolution ──────────────────────────────

async function buildOfficialLookup(
  supabase: SupabaseClient,
): Promise<Map<string, string>> {
  const { data } = await supabase
    .from("officials")
    .select("id, official_name")
    .eq("level", "federal")
    .eq("is_active", true);

  const lookup = new Map<string, string>();
  for (const row of data ?? []) {
    const key = normalizeName(row.official_name ?? "");
    if (key) lookup.set(key, row.id as string);
  }
  return lookup;
}

// Build candidateId → official_id cache. Tries name match first; falls back
// to the FEC /candidate/{id}/ endpoint for up to CANDIDATE_API_CAP calls.
async function buildCandidateCache(
  ies: FecIE[],
  officialLookup: Map<string, string>,
  apiKey: string,
): Promise<Map<string, string | null>> {
  const cache = new Map<string, string | null>();

  // Pass 1: name-based matching (no API calls)
  for (const ie of ies) {
    if (!ie.candidateId || cache.has(ie.candidateId)) continue;
    const key = normalizeName(ie.candidateName);
    cache.set(ie.candidateId, officialLookup.get(key) ?? null);
  }

  // Pass 2: FEC candidate detail fallback for unmatched IDs
  let fallbackCalls = 0;
  for (const [candidateId, officialId] of cache) {
    if (officialId !== null || fallbackCalls >= CANDIDATE_API_CAP) continue;
    fallbackCalls++;
    try {
      const data = await fecGet(`/candidate/${candidateId}/`, {}, apiKey);
      await sleep(REQUEST_DELAY);
      const detail = (data.results as Array<Record<string, unknown>>)?.[0] ?? {};
      const fecName = str(detail.name);
      if (fecName) {
        const matched = officialLookup.get(normalizeName(fecName)) ?? null;
        if (matched) cache.set(candidateId, matched);
      }
    } catch {
      // non-fatal: leave as null
    }
  }

  console.log(
    `sync-pacs: candidate resolution — ${[...cache.values()].filter(Boolean).length}` +
    ` matched of ${cache.size} unique candidates (${fallbackCalls} FEC lookups)`,
  );

  return cache;
}

// ── Phase 3a: Committee detail + totals ────────────────────────────────────

interface PacUpsertRow {
  fec_committee_id: string;
  name: string;
  committee_type: string;
  designation: string | null;
  total_raised: number | null;
  total_spent: number | null;
  cycle: number;
  treasurer: string | null;
  state: string | null;
  website: string | null;
  updated_at: string;
}

async function fetchPacRow(
  committeeId: string,
  apiKey: string,
  cycle: number,
): Promise<PacUpsertRow | null> {
  let detail: Record<string, unknown> = {};
  try {
    const data = await fecGet(`/committee/${committeeId}/`, {}, apiKey);
    detail = (data.results as Array<Record<string, unknown>>)?.[0] ?? {};
  } catch (err) {
    console.error(`sync-pacs: committee detail failed for ${committeeId}:`, err);
    return null;
  }
  await sleep(REQUEST_DELAY);

  let totalRaised: number | null = null;
  let totalSpent: number | null  = null;
  try {
    const totalsData = await fecGet(
      `/committee/${committeeId}/totals/`,
      { cycle: String(cycle) },
      apiKey,
    );
    const totals = (totalsData.results as Array<Record<string, unknown>>)?.[0] ?? {};
    if (totals.receipts      != null) totalRaised = Number(totals.receipts);
    if (totals.disbursements != null) totalSpent  = Number(totals.disbursements);
  } catch {
    // non-fatal: totals unavailable for some committees
  }
  await sleep(REQUEST_DELAY);

  return {
    fec_committee_id: committeeId,
    name:             str(detail.name) ?? committeeId,
    committee_type:   mapCommitteeType(str(detail.committee_type) ?? ""),
    designation:      str(detail.designation),
    total_raised:     totalRaised,
    total_spent:      totalSpent,
    cycle,
    treasurer:        str(detail.treasurer_name),
    state:            str(detail.state),
    website:          str(detail.website),
    updated_at:       new Date().toISOString(),
  };
}

// ── Phase 3b: Direct contributions (Schedule B / line 24K) ────────────────

interface ContribRow {
  pac_id: string;
  official_id: string | null;
  candidate_name: string;
  fec_candidate_id: string | null;
  amount: number;
  contribution_date: string | null;
  cycle: number;
}

async function fetchDirectContributions(
  pacId: string,
  committeeId: string,
  apiKey: string,
  officialLookup: Map<string, string>,
  cycle: number,
): Promise<ContribRow[]> {
  let data: Record<string, unknown>;
  try {
    data = await fecGet("/schedules/schedule_b/", {
      committee_id: committeeId,
      two_year_transaction_period: String(cycle),
      line_number: "24K",
      per_page: String(PER_PAGE),
    }, apiKey);
  } catch {
    return [];
  }
  await sleep(REQUEST_DELAY);

  const rows: ContribRow[] = [];
  for (const r of (data.results as Array<Record<string, unknown>>) ?? []) {
    const amount = Number(r.disbursement_amount ?? 0);
    if (!amount) continue;

    const recipientName  = str(r.recipient_name) ?? "Unknown";
    const candidateId    = str(r.recipient_candidate_id ?? r.candidate_id);
    const officialId     = officialLookup.get(normalizeName(recipientName)) ?? null;

    rows.push({
      pac_id:            pacId,
      official_id:       officialId,
      candidate_name:    recipientName,
      fec_candidate_id:  candidateId,
      amount,
      contribution_date: str(r.disbursement_date),
      cycle,
    });
  }
  return rows;
}

// ── Phase 3c: Top donors (Schedule A) ─────────────────────────────────────

interface DonorRow {
  pac_id: string;
  donor_name: string;
  donor_type: string;
  donor_employer: string | null;
  amount: number;
  contribution_date: string | null;
  cycle: number;
}

async function fetchTopDonors(
  pacId: string,
  committeeId: string,
  apiKey: string,
  cycle: number,
): Promise<DonorRow[]> {
  const rows: DonorRow[]       = [];
  let lastIndex: string | null = null;

  for (let page = 0; page < DONORS_PAGES; page++) {
    const params: Record<string, string> = {
      committee_id: committeeId,
      two_year_transaction_period: String(cycle),
      per_page: String(PER_PAGE),
      sort: "-contribution_receipt_amount",
      sort_hide_null: "true",
    };
    if (lastIndex) params.last_index = lastIndex;

    let data: Record<string, unknown>;
    try {
      data = await fecGet("/schedules/schedule_a/", params, apiKey);
    } catch {
      break;
    }
    await sleep(REQUEST_DELAY);

    const results = (data.results as Array<Record<string, unknown>>) ?? [];
    for (const r of results) {
      const amount = Number(r.contribution_receipt_amount ?? 0);
      if (!amount) continue;
      rows.push({
        pac_id:            pacId,
        donor_name:        str(r.contributor_name) ?? "Unknown",
        donor_type:        mapDonorType(str(r.entity_type)),
        donor_employer:    str(r.contributor_employer),
        amount,
        contribution_date: str(r.contribution_receipt_date),
        cycle,
      });
    }

    const pagination  = (data.pagination as Record<string, unknown>) ?? {};
    const lastIndexes = (pagination.last_indexes as Record<string, unknown>) ?? {};
    lastIndex = str(lastIndexes.last_index);
    if (!results.length || !lastIndex) break;
  }

  return rows;
}

// ── Batch insert helper ────────────────────────────────────────────────────

async function batchInsert(
  supabase: SupabaseClient,
  table: string,
  rows: object[],
  chunkSize = 200,
): Promise<{ inserted: number; errors: number }> {
  let inserted = 0;
  let errors   = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) {
      console.error(`sync-pacs: insert into ${table} failed:`, error.message);
      errors++;
    } else {
      inserted += chunk.length;
    }
  }
  return { inserted, errors };
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Auth — Vercel injects Authorization: Bearer <CRON_SECRET> for cron calls.
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const fecKey      = process.env.FEC_API_KEY;

  const missing = (
    [
      ["SUPABASE_URL",         supabaseUrl],
      ["SUPABASE_SERVICE_KEY", supabaseKey],
      ["FEC_API_KEY",          fecKey],
    ] as [string, string | undefined][]
  )
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length) {
    return NextResponse.json(
      { error: `Missing env vars: ${missing.join(", ")}` },
      { status: 500 },
    );
  }

  // Query params for incremental runs
  const url              = new URL(req.url);
  const limit            = Math.min(Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT), HARD_LIMIT);
  const committeeOffset  = Math.max(Number(url.searchParams.get("committee_offset") ?? 0), 0);
  const cycleOverride    = url.searchParams.get("cycle");
  const requestedCycle   = cycleOverride ? Number(cycleOverride) : DEFAULT_CYCLE;

  const supabase = createClient(supabaseUrl!, supabaseKey!);

  try {
    // ── Build official name lookup ────────────────────────────────────────
    const officialLookup = await buildOfficialLookup(supabase);
    console.log(`sync-pacs: ${officialLookup.size} federal officials loaded`);

    // ── Phase 1: Fetch all independent expenditures ───────────────────────
    console.log(`sync-pacs: fetching IEs for cycle ${requestedCycle}...`);
    const ieResult = await fetchAllIEs(fecKey!, requestedCycle);
    console.log(`sync-pacs: fetched ${ieResult.ies.length} IE records (cycle ${ieResult.cycle})`);

    if (ieResult.fecError) {
      console.error("sync-pacs: FEC IE fetch failed:", ieResult.fecError);
      return NextResponse.json({
        ok:            false,
        cycle_requested: requestedCycle,
        ie_debug: {
          first_page_url: ieResult.firstPageUrl,
          fec_status:     ieResult.fecError.status,
          fec_error:      ieResult.fecError.message,
        },
      }, { status: 502 });
    }

    const allIEs = ieResult.ies;

    // Group by committee
    const iesByCommittee = new Map<string, FecIE[]>();
    for (const ie of allIEs) {
      const list = iesByCommittee.get(ie.committeeId) ?? [];
      list.push(ie);
      iesByCommittee.set(ie.committeeId, list);
    }

    const allCommitteeIds = [...iesByCommittee.keys()].sort();
    const slice           = allCommitteeIds.slice(committeeOffset, committeeOffset + limit);
    console.log(
      `sync-pacs: ${allCommitteeIds.length} unique committees; ` +
      `processing ${slice.length} (offset ${committeeOffset})`,
    );

    // ── Phase 2: Resolve candidate IDs → official IDs ────────────────────
    // Only for the IEs belonging to the committees we'll actually process.
    const sliceSet     = new Set(slice);
    const sliceIEs     = allIEs.filter((ie) => sliceSet.has(ie.committeeId));
    const candidateCache = await buildCandidateCache(sliceIEs, officialLookup, fecKey!);

    // ── Phase 3: Process each committee ──────────────────────────────────
    let pacsUpserted           = 0;
    let ieInserted             = 0;
    let contributionsInserted  = 0;
    let donorsInserted         = 0;
    let committeeErrors        = 0;

    const effectiveCycle = ieResult.cycle;

    for (const committeeId of slice) {
      // 3a. Fetch committee detail + totals → upsert pacs
      const pacRow = await fetchPacRow(committeeId, fecKey!, effectiveCycle);
      if (!pacRow) { committeeErrors++; continue; }

      const { data: upserted, error: upsertErr } = await supabase
        .from("pacs")
        .upsert(pacRow, { onConflict: "fec_committee_id" })
        .select("id")
        .single();

      if (upsertErr || !upserted) {
        console.error(`sync-pacs: pacs upsert failed for ${committeeId}:`, upsertErr?.message);
        committeeErrors++;
        continue;
      }

      const pacId = upserted.id as string;
      pacsUpserted++;

      // 3b. Delete + reinsert IEs for this PAC+cycle (idempotent)
      await supabase
        .from("pac_independent_expenditures")
        .delete()
        .eq("pac_id", pacId)
        .eq("cycle", effectiveCycle);

      const committeeIEs = iesByCommittee.get(committeeId) ?? [];
      if (committeeIEs.length) {
        const ieRows = committeeIEs.map((ie) => ({
          pac_id:           pacId,
          official_id:      ie.candidateId ? (candidateCache.get(ie.candidateId) ?? null) : null,
          candidate_name:   ie.candidateName,
          fec_candidate_id: ie.candidateId,
          amount:           ie.amount,
          support_oppose:   ie.supportOppose,
          expenditure_date: ie.expenditureDate,
          cycle:            effectiveCycle,
        }));
        const { inserted } = await batchInsert(supabase, "pac_independent_expenditures", ieRows);
        ieInserted += inserted;
      }

      // 3c. Direct contributions — schedule B / 24K
      const contributions = await fetchDirectContributions(pacId, committeeId, fecKey!, officialLookup, effectiveCycle);
      if (contributions.length) {
        await supabase
          .from("pac_contributions")
          .delete()
          .eq("pac_id", pacId)
          .eq("cycle", effectiveCycle);
        const { inserted } = await batchInsert(supabase, "pac_contributions", contributions);
        contributionsInserted += inserted;
      }

      // 3d. Top donors — schedule A
      const donors = await fetchTopDonors(pacId, committeeId, fecKey!, effectiveCycle);
      if (donors.length) {
        await supabase
          .from("pac_donors")
          .delete()
          .eq("pac_id", pacId)
          .eq("cycle", effectiveCycle);
        const { inserted } = await batchInsert(supabase, "pac_donors", donors);
        donorsInserted += inserted;
      }
    }

    const hasMore             = committeeOffset + limit < allCommitteeIds.length;
    const nextCommitteeOffset = hasMore ? committeeOffset + limit : null;

    return NextResponse.json({
      ok:                      true,
      synced_at:               new Date().toISOString(),
      cycle_requested:         requestedCycle,
      cycle_used:              effectiveCycle,
      ie_debug: {
        first_page_url:        ieResult.firstPageUrl,
        first_page_pagination: ieResult.firstPagePagination,
        fec_status:            200,
        fec_error:             null,
      },
      ie_records_fetched:      allIEs.length,
      committees_total:        allCommitteeIds.length,
      committee_offset:        committeeOffset,
      committees_processed:    slice.length,
      next_committee_offset:   nextCommitteeOffset,
      pacs_upserted:           pacsUpserted,
      ie_inserted:             ieInserted,
      contributions_inserted:  contributionsInserted,
      donors_inserted:         donorsInserted,
      committee_errors:        committeeErrors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("sync-pacs: fatal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

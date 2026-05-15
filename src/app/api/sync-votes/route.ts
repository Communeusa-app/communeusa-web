import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Vercel Pro allows up to 300 s for cron jobs; hobby plan caps at 60 s.
export const maxDuration = 300;

// ── Constants ──────────────────────────────────────────────────────────────

const OPENSTATES_BASE  = "https://v3.openstates.org";
const HOUSE_CLERK_BASE = "https://clerk.house.gov/evs";
const SENATE_VOTE_BASE = "https://www.senate.gov/legislative/LIS/roll_call_votes";

const CURRENT_SESSION  = "2025-2026";
const CURRENT_CONGRESS = 119;
const RECENT_VOTES     = 30;   // roll calls to fetch per source per run
const OPENSTATES_PAGES = 5;    // pages of WA bills to scan (50 bills / page)

const FINAL_PASSAGE_RE = /final passage|3rd reading|passage|concurrence|sine die/i;

const HOUSE_PROCEDURAL = new Set([
  "QUORUM", "JOURNAL", "ADJOURN", "RECESS", "H RES", "MOTION",
]);

// ── Types ──────────────────────────────────────────────────────────────────

interface RawVote {
  /** Set for Open States and Senate sources. */
  official_name?: string;
  /** Set for House Clerk source (XML only contains last names). */
  _house_last?: string;
  bill_name:        string | null;
  bill_description: string | null;
  topic_category:   string | null;
  vote_date:        string | null;
  vote_cast:        string;
  result:           string;
  source_url:       string | null;
}

interface VoteRow {
  official_id:      string;
  bill_name:        string | null;
  bill_description: string | null;
  topic_category:   string | null;
  vote_date:        string | null;
  vote_cast:        string;
  result:           string;
  constituent_impact: null;
  source_url:       string | null;
}

// ── Value helpers ──────────────────────────────────────────────────────────

function clean(val: unknown): string | null {
  if (val == null) return null;
  const s = String(val).trim();
  return s || null;
}

function normalizeVoteCast(raw: string): string {
  const v = raw.toLowerCase().trim();
  if (["yes", "yea", "aye"].includes(v)) return "Yea";
  if (["no", "nay"].includes(v)) return "Nay";
  if (["not voting", "absent", "not present"].includes(v)) return "Not Voting";
  if (v === "present") return "Present";
  if (v === "excused") return "Excused";
  return raw.trim();
}

function normalizeResult(raw: string): string {
  const r = raw.toLowerCase();
  if (/pass|agreed|confirmed|adopted|enacted/.test(r)) return "Passed";
  if (/fail|rejected|defeated|not agreed/.test(r)) return "Failed";
  return raw.trim();
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  // "12-Jan-2025"
  const dmy = raw.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})/);
  if (dmy) {
    const mo: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
    };
    const m = mo[dmy[2].toLowerCase()];
    if (m) return `${dmy[3]}-${m}-${dmy[1].padStart(2, "0")}`;
  }
  // "January 12, 2025" (possibly embedded in a longer string)
  const mdy = raw.match(/([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (mdy) {
    const mo: Record<string, string> = {
      january: "01", february: "02", march: "03", april: "04",
      may: "05", june: "06", july: "07", august: "08",
      september: "09", october: "10", november: "11", december: "12",
    };
    const m = mo[mdy[1].toLowerCase()];
    if (m) return `${mdy[3]}-${m}-${mdy[2].padStart(2, "0")}`;
  }
  return raw;
}

// ── Minimal XML helpers ────────────────────────────────────────────────────
// Both House Clerk and Senate XML have simple, predictable schemas — no
// parser dependency needed.

/** First text content of a tag (handles attributes on the opening tag). */
function xmlFirst(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  return xml.match(re)?.[1]?.trim() ?? "";
}

/** All outer-element strings for a repeated tag. */
function xmlBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) blocks.push(m[0]);
  return blocks;
}

/** Value of an XML attribute in an opening tag string. */
function xmlAttr(tagStr: string, attr: string): string {
  return tagStr.match(new RegExp(`${attr}="([^"]*)"`))
    ?.[1] ?? "";
}

// ── Supabase lookups ───────────────────────────────────────────────────────

/**
 * Full-name → official_id for all active officials.
 * When the same name has multiple rows with identical level+title (duplicate
 * seeding), the first ID is used. Genuinely different people with the same
 * name are mapped to null (skipped during resolution).
 */
async function buildNameLookup(
  supabase: SupabaseClient,
): Promise<Map<string, string | null>> {
  const { data } = await supabase
    .from("officials")
    .select("id, official_name, level, office_title")
    .eq("is_active", true);

  const candidates = new Map<string, Array<{ id: string; profile: string }>>();
  for (const row of data ?? []) {
    const key = (row.official_name ?? "").trim().toLowerCase();
    if (!key) continue;
    const profile = `${row.level ?? ""}:${row.office_title ?? ""}`;
    const entry = { id: row.id as string, profile };
    candidates.set(key, [...(candidates.get(key) ?? []), entry]);
  }

  const lookup = new Map<string, string | null>();
  for (const [key, entries] of candidates) {
    if (entries.length === 1) {
      lookup.set(key, entries[0].id);
    } else {
      const uniqueProfiles = new Set(entries.map((e) => e.profile));
      lookup.set(key, uniqueProfiles.size === 1 ? entries[0].id : null);
    }
  }
  return lookup;
}

/**
 * Last-name → official_id for active federal House members.
 * House Clerk XML only provides last names; same duplicate-row logic applies.
 */
async function buildHouseLastLookup(
  supabase: SupabaseClient,
): Promise<Map<string, string | null>> {
  const { data } = await supabase
    .from("officials")
    .select("id, official_name, office_title")
    .eq("level", "federal")
    .eq("is_active", true);

  const candidates = new Map<string, Array<{ id: string; fullName: string }>>();
  for (const row of data ?? []) {
    const title = (row.office_title ?? "").toLowerCase();
    if (!title.includes("representative") && !title.includes("house")) continue;
    const name = row.official_name ?? "";
    const last = name.split(/\s+/).pop()?.toLowerCase() ?? "";
    if (!last) continue;
    const entry = { id: row.id as string, fullName: name };
    candidates.set(last, [...(candidates.get(last) ?? []), entry]);
  }

  const lookup = new Map<string, string | null>();
  for (const [last, entries] of candidates) {
    if (entries.length === 1) {
      lookup.set(last, entries[0].id);
    } else {
      const uniqueNames = new Set(entries.map((e) => e.fullName));
      lookup.set(last, uniqueNames.size === 1 ? entries[0].id : null);
    }
  }
  return lookup;
}

/**
 * Loads all (official_id, bill_name, vote_date) composite keys from the DB,
 * paginating past Supabase's 1 000-row default to avoid re-inserting duplicates.
 */
async function loadExistingKeys(supabase: SupabaseClient): Promise<Set<string>> {
  const keys = new Set<string>();
  const pageSize = 1000;
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from("voting_records")
      .select("official_id, bill_name, vote_date")
      .range(offset, offset + pageSize - 1);
    for (const r of data ?? []) {
      keys.add(`${r.official_id}|${r.bill_name ?? ""}|${r.vote_date ?? ""}`);
    }
    if ((data?.length ?? 0) < pageSize) break;
    offset += pageSize;
  }
  return keys;
}

// ── Open States — WA state votes ───────────────────────────────────────────

async function fetchWaStateVotes(apiKey: string): Promise<RawVote[]> {
  const records: RawVote[] = [];

  for (let page = 1; page <= OPENSTATES_PAGES; page++) {
    const url = new URL(`${OPENSTATES_BASE}/bills`);
    url.searchParams.set("jurisdiction", "wa");
    url.searchParams.set("session", CURRENT_SESSION);
    url.searchParams.set("include", "votes");
    url.searchParams.set("limit", "50");
    url.searchParams.set("page", String(page));

    let data: Record<string, unknown>;
    try {
      const res = await fetch(url.toString(), { headers: { "X-API-KEY": apiKey } });
      if (!res.ok) break;
      data = await res.json();
    } catch {
      break;
    }

    const bills = (data.results as Array<Record<string, unknown>>) ?? [];
    if (!bills.length) break;

    for (const bill of bills) {
      const classification = (bill.classification as string[] | null) ?? [];
      if (!classification.includes("bill")) continue;

      const identifier = clean(bill.identifier) ?? "";
      const title      = clean(bill.title);
      const subjects   = (bill.subject as string[] | null) ?? [];
      const category   = subjects[0] ?? null;
      const sourceUrl  = clean(bill.openstates_url);

      for (const voteEvent of (bill.votes as Array<Record<string, unknown>> | null) ?? []) {
        const motion = String(voteEvent.motion_text ?? "");
        if (!FINAL_PASSAGE_RE.test(motion)) continue;

        const voteDate = clean(voteEvent.start_date);
        const result   = normalizeResult(String(voteEvent.result ?? ""));

        for (const v of (voteEvent.votes as Array<Record<string, unknown>> | null) ?? []) {
          const voter = (v.voter as Record<string, unknown> | null) ?? {};
          const name  = clean(voter.name ?? v.voter_name);
          if (!name) continue;

          records.push({
            official_name:    name,
            bill_name:        identifier || null,
            bill_description: title,
            topic_category:   category,
            vote_date:        voteDate,
            vote_cast:        normalizeVoteCast(String(v.option ?? "")),
            result,
            source_url:       sourceUrl,
          });
        }
      }
    }

    const pagination = (data.pagination as Record<string, unknown>) ?? {};
    if (page >= (Number(pagination.max_page) || page)) break;
  }

  return records;
}

// ── House Clerk roll call XML ──────────────────────────────────────────────

async function findMaxHouseRoll(year: number): Promise<number> {
  let lo = 1, hi = 600;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    const url = `${HOUSE_CLERK_BASE}/${year}/roll${String(mid).padStart(3, "0")}.xml`;
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) lo = mid; else hi = mid - 1;
    } catch {
      hi = mid - 1;
    }
  }
  return lo;
}

async function fetchHouseVotes(year: number): Promise<RawVote[]> {
  const maxRoll = await findMaxHouseRoll(year);
  if (maxRoll < 1) return [];

  const records: RawVote[] = [];
  const start = Math.max(1, maxRoll - RECENT_VOTES + 1);

  for (let rollNum = maxRoll; rollNum >= start; rollNum--) {
    const rollStr = String(rollNum).padStart(3, "0");
    const url = `${HOUSE_CLERK_BASE}/${year}/roll${rollStr}.xml`;

    let xml: string;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      xml = await res.text();
    } catch {
      continue;
    }

    const legisNum     = xmlFirst(xml, "legis-num").toUpperCase().trim();
    const voteQuestion = xmlFirst(xml, "vote-question");
    const voteDesc     = xmlFirst(xml, "vote-desc");
    const actionDate   = xmlFirst(xml, "action-date");
    const voteResult   = xmlFirst(xml, "vote-result");

    if (!legisNum || HOUSE_PROCEDURAL.has(legisNum)) continue;
    if (!/\d/.test(legisNum)) continue;  // no bill number present

    const result          = normalizeResult(voteResult);
    const voteDate        = parseDate(actionDate);
    const billDescription = voteDesc || null;

    for (const block of xmlBlocks(xml, "recorded-vote")) {
      const legOpenTag = block.match(/<legislator[^>]*>/)?.[0] ?? "";
      if (xmlAttr(legOpenTag, "state") !== "WA") continue;

      const rawLast = xmlFirst(block, "legislator");
      const voteCast = xmlFirst(block, "vote");
      if (!rawLast) continue;

      const cleanLast = rawLast.replace(/\s*\([^)]+\)\s*$/, "").trim().toLowerCase();

      records.push({
        _house_last:      cleanLast,
        bill_name:        legisNum,
        bill_description: billDescription,
        topic_category:   voteQuestion || null,
        vote_date:        voteDate,
        vote_cast:        normalizeVoteCast(voteCast),
        result,
        source_url:       url,
      });
    }
  }

  return records;
}

// ── Senate vote XML ────────────────────────────────────────────────────────

async function findMaxSenateVote(congress: number, session: number): Promise<number> {
  let lo = 1, hi = 600;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    const url = `${SENATE_VOTE_BASE}/vote${congress}${session}/vote_${congress}_${session}_${String(mid).padStart(5, "0")}.xml`;
    try {
      // redirect: "manual" so a redirect to an HTML 404 page doesn't appear as 200
      const res = await fetch(url, { method: "HEAD", redirect: "manual" });
      if (res.status === 200) lo = mid; else hi = mid - 1;
    } catch {
      hi = mid - 1;
    }
  }
  return lo;
}

async function fetchSenateVotes(congress: number, session: number): Promise<RawVote[]> {
  const maxVote = await findMaxSenateVote(congress, session);
  if (maxVote < 1) return [];

  const records: RawVote[] = [];
  const start = Math.max(1, maxVote - RECENT_VOTES + 1);

  for (let voteNum = maxVote; voteNum >= start; voteNum--) {
    const numStr = String(voteNum).padStart(5, "0");
    const url = `${SENATE_VOTE_BASE}/vote${congress}${session}/vote_${congress}_${session}_${numStr}.xml`;

    let xml: string;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      xml = await res.text();
    } catch {
      continue;
    }

    const voteQuestion = xmlFirst(xml, "vote_question_text");
    const docText      = xmlFirst(xml, "vote_document_text");
    const voteResultTx = xmlFirst(xml, "vote_result_text");
    const voteDateRaw  = xmlFirst(xml, "vote_date");
    const voteTitle    = xmlFirst(xml, "vote_title");

    const billName        = docText || voteQuestion.slice(0, 80) || null;
    const billDescription = voteTitle || null;
    const result          = normalizeResult(voteResultTx);
    const voteDate        = parseDate(voteDateRaw);

    for (const block of xmlBlocks(xml, "member")) {
      if (xmlFirst(block, "state") !== "WA") continue;

      const firstName = xmlFirst(block, "first_name");
      const lastName  = xmlFirst(block, "last_name");
      const castRaw   = xmlFirst(block, "vote_cast");

      const fullName = [firstName, lastName].filter(Boolean).join(" ");
      if (!fullName) continue;

      records.push({
        official_name:    fullName,
        bill_name:        billName,
        bill_description: billDescription,
        topic_category:   voteQuestion || null,
        vote_date:        voteDate,
        vote_cast:        normalizeVoteCast(castRaw),
        result,
        source_url:       url,
      });
    }
  }

  return records;
}

// ── Resolution & dedup ─────────────────────────────────────────────────────

function resolveVotes(
  rawVotes: RawVote[],
  nameLookup: Map<string, string | null>,
  houseLastLookup: Map<string, string | null>,
  existingKeys: Set<string>,
): { rows: VoteRow[]; unmatched: number; duplicates: number } {
  const rows: VoteRow[] = [];
  let unmatched = 0;
  let duplicates = 0;

  for (const rec of rawVotes) {
    let officialId: string | null | undefined;

    if (rec._house_last !== undefined) {
      officialId = houseLastLookup.get(rec._house_last);
    } else {
      const key = (rec.official_name ?? "").toLowerCase().trim();
      officialId = nameLookup.get(key);
    }

    if (!officialId) { unmatched++; continue; }

    const dupKey = `${officialId}|${rec.bill_name ?? ""}|${rec.vote_date ?? ""}`;
    if (existingKeys.has(dupKey)) { duplicates++; continue; }
    existingKeys.add(dupKey);

    rows.push({
      official_id:      officialId,
      bill_name:        rec.bill_name,
      bill_description: rec.bill_description,
      topic_category:   rec.topic_category,
      vote_date:        rec.vote_date,
      vote_cast:        rec.vote_cast,
      result:           rec.result,
      constituent_impact: null,
      source_url:       rec.source_url,
    });
  }

  return { rows, unmatched, duplicates };
}

async function batchInsert(supabase: SupabaseClient, rows: VoteRow[]): Promise<number> {
  const chunkSize = 100;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const { error } = await supabase
      .from("voting_records")
      .insert(rows.slice(i, i + chunkSize));
    if (error) {
      console.error(`sync-votes: batch insert failed at offset ${i}:`, error.message);
    } else {
      inserted += Math.min(chunkSize, rows.length - i);
    }
  }
  return inserted;
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl  = process.env.SUPABASE_URL;
  const supabaseKey  = process.env.SUPABASE_SERVICE_KEY;
  const openStatesKey = process.env.OPENSTATES_API_KEY;

  const missing = (
    [
      ["SUPABASE_URL",         supabaseUrl],
      ["SUPABASE_SERVICE_KEY", supabaseKey],
      ["OPENSTATES_API_KEY",   openStatesKey],
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

  const supabase = createClient(supabaseUrl!, supabaseKey!);

  try {
    const currentYear = new Date().getFullYear();
    const prevYear    = currentYear - 1;

    // Build lookups and fetch all sources concurrently to stay within timeout.
    const [
      nameLookup,
      houseLastLookup,
      existingKeys,
      stateVotes,
      housePrevVotes,
      houseCurrVotes,
      senate1Votes,
      senate2Votes,
    ] = await Promise.all([
      buildNameLookup(supabase),
      buildHouseLastLookup(supabase),
      loadExistingKeys(supabase),
      fetchWaStateVotes(openStatesKey!),
      fetchHouseVotes(prevYear),
      fetchHouseVotes(currentYear),
      fetchSenateVotes(CURRENT_CONGRESS, 1),
      fetchSenateVotes(CURRENT_CONGRESS, 2),
    ]);

    // Resolve names → official IDs, dedup against existing records.
    const sources = [
      { label: "state",         votes: stateVotes },
      { label: `house-${prevYear}`, votes: housePrevVotes },
      { label: `house-${currentYear}`, votes: houseCurrVotes },
      { label: "senate-s1",     votes: senate1Votes },
      { label: "senate-s2",     votes: senate2Votes },
    ];

    let totalUnmatched  = 0;
    let totalDuplicates = 0;
    const allRows: VoteRow[] = [];

    for (const { votes } of sources) {
      const { rows, unmatched, duplicates } = resolveVotes(
        votes, nameLookup, houseLastLookup, existingKeys,
      );
      allRows.push(...rows);
      totalUnmatched  += unmatched;
      totalDuplicates += duplicates;
    }

    const inserted = await batchInsert(supabase, allRows);

    return NextResponse.json({
      ok:         true,
      synced_at:  new Date().toISOString(),
      inserted,
      duplicates: totalDuplicates,
      unmatched:  totalUnmatched,
      fetched: {
        state:                 stateVotes.length,
        [`house_${prevYear}`]: housePrevVotes.length,
        [`house_${currentYear}`]: houseCurrVotes.length,
        senate_s1:             senate1Votes.length,
        senate_s2:             senate2Votes.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

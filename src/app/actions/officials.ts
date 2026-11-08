"use server";

import { cache } from "react";
import { supabase } from "@/lib/supabase";

// ── Bill description enrichment ────────────────────────────────────────────
//
// For bills where bill_description is null in the DB, we fetch a short
// description from Open States (WA state bills) or Congress.gov (federal).
// React's cache() deduplicates calls for the same bill within a single render.
// Next.js's fetch cache (revalidate: 86400) persists results across requests.

const WA_BILL_RE = /^[A-Z]+\s+\d+$/i;        // e.g. "HB 1234", "SB 567"
const FEDERAL_BILL_RE = [
  [/\bH\.?\s*R\.?\s*(\d+)/i,               "hr"],
  [/\bH\.?\s*J\.?\s*RES\.?\s*(\d+)/i,      "hjres"],
  [/\bH\.?\s*CON\.?\s*RES\.?\s*(\d+)/i,    "hconres"],
  [/\bH\.?\s*RES\.?\s*(\d+)/i,             "hres"],
  [/\bS\.?\s*J\.?\s*RES\.?\s*(\d+)/i,      "sjres"],
  [/\bS\.?\s*CON\.?\s*RES\.?\s*(\d+)/i,    "sconres"],
  [/\bS\.?\s*RES\.?\s*(\d+)/i,             "sres"],
  [/\bS\.?\s*(\d+)\b/i,                    "s"],
] as const;

function parseFederalBill(identifier: string): { type: string; num: string } | null {
  for (const [re, type] of FEDERAL_BILL_RE) {
    const m = identifier.match(re);
    if (m) return { type, num: m[1] };
  }
  return null;
}

const fetchWaStateBillDescription = cache(async (identifier: string): Promise<string | null> => {
  const apiKey = process.env.OPENSTATES_API_KEY;
  if (!apiKey) return null;
  try {
    const url =
      `https://v3.openstates.org/bills` +
      `?jurisdiction=ocd-jurisdiction%2Fcountry%3Aus%2Fstate%3Awa%2Fgovernment` +
      `&identifier=${encodeURIComponent(identifier)}` +
      `&apikey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    const bill = (data.results as Array<Record<string, unknown>> | null)?.[0];
    if (!bill) return null;
    const abstracts = bill.abstracts as Array<{ abstract: string }> | null;
    return abstracts?.[0]?.abstract ?? (bill.title as string | null) ?? null;
  } catch {
    return null;
  }
});

const fetchFederalBillDescription = cache(async (identifier: string): Promise<string | null> => {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return null;
  const parsed = parseFederalBill(identifier);
  if (!parsed) return null;
  try {
    const url =
      `https://api.congress.gov/v3/bill/119/${parsed.type}/${parsed.num}` +
      `?format=json&api_key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.bill?.title as string | null) ?? null;
  } catch {
    return null;
  }
});

async function enrichDescription(identifier: string): Promise<string | null> {
  if (WA_BILL_RE.test(identifier.trim())) {
    return fetchWaStateBillDescription(identifier.trim());
  }
  if (parseFederalBill(identifier)) {
    return fetchFederalBillDescription(identifier);
  }
  return null;
}

export interface Official {
  id: string;
  office_title: string | null;
  official_name: string;
  party: string | null;
  term_end: string | null;
}

export interface VotingRecord {
  id: string;
  bill_name: string | null;
  bill_description: string | null;
  topic_category: string | null;
  vote_date: string | null;
  vote_cast: string | null;
  result: string | null;
  constituent_impact: string | null;
  source_url: string | null;
}

export interface CampaignFinanceRecord {
  id: string;
  donor_name: string | null;
  donor_type: string | null;
  amount: number | null;
  election_cycle: string | null;
  donation_date: string | null;
  industry_sector: string | null;
  source_url: string | null;
  filing_source: string | null;
}

export interface OfficialProfile {
  id: string;
  official_name: string;
  office_title: string | null;
  office_category: string | null;
  level: string;
  party: string | null;
  district: string | null;
  term_start: string | null;
  term_end: string | null;
  appointed_or_elected: string | null;
  phone: string | null;
  email: string | null;
  official_website: string | null;
  ballotpedia_url: string | null;
  key_committees: string | null;
  notes: string | null;
  jurisdiction_name: string | null;
}

export async function getOfficialById(
  id: string,
): Promise<OfficialProfile | null> {
  const { data, error } = await supabase
    .from("officials")
    .select(
      "id, official_name, office_title, office_category, level, party, district, term_start, term_end, appointed_or_elected, phone, email, official_website, ballotpedia_url, key_committees, notes, is_active, municipalities(name), counties(name)",
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  // Supabase returns a many-to-one FK join as a plain object, not an array.
  const raw = data as unknown as Omit<OfficialProfile, "jurisdiction_name"> & {
    is_active: boolean;
    municipalities: { name: string } | null;
    counties: { name: string } | null;
  };
  // TEMP DEBUG — remove after verifying jurisdiction_name and official_website
  console.log("[getOfficialById] raw municipalities:", raw.municipalities);
  console.log("[getOfficialById] raw counties:", raw.counties);
  console.log("[getOfficialById] official_website:", raw.official_website);
  // Stale duplicate rows remain in the DB but are inactive — treat them as not found.
  if (!raw.is_active) return null;
  const jurisdiction_name = raw.municipalities?.name ?? raw.counties?.name ?? null;
  console.log("[getOfficialById] jurisdiction_name:", jurisdiction_name);
  return { ...raw, jurisdiction_name } as OfficialProfile;
}

export async function getVotingRecords(
  officialId: string,
): Promise<VotingRecord[]> {
  const { data, error } = await supabase
    .from("voting_records")
    .select(
      "id, bill_name, bill_description, topic_category, vote_date, vote_cast, result, constituent_impact, source_url",
    )
    .eq("official_id", officialId)
    .order("vote_date", { ascending: false });

  if (error) {
    console.error("getVotingRecords:", error.message);
    return [];
  }

  const records = (data ?? []) as VotingRecord[];

  // Enrich any records missing a description from external APIs.
  // Fetches are deduplicated per bill (cache()) and cached 24 h (revalidate).
  const enriched = await Promise.all(
    records.map(async (r) => {
      if (r.bill_description || !r.bill_name) return r;
      const description = await enrichDescription(r.bill_name);
      return description ? { ...r, bill_description: description } : r;
    }),
  );

  return enriched;
}

export async function getCampaignFinance(
  officialId: string,
): Promise<CampaignFinanceRecord[]> {
  const { data, error } = await supabase
    .from("campaign_finance")
    .select(
      "id, donor_name, donor_type, amount, election_cycle, donation_date, industry_sector, source_url, filing_source",
    )
    .eq("official_id", officialId)
    .order("amount", { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) {
    console.error("getCampaignFinance:", error.message);
    return [];
  }
  return (data ?? []) as CampaignFinanceRecord[];
}

export async function getFederalOfficials(stateAbbr: string): Promise<Official[]> {
  const { data: state, error: stateError } = await supabase
    .from("states")
    .select("id")
    .eq("abbreviation", stateAbbr.toUpperCase())
    .single();

  if (stateError) console.error("getFederalOfficials (state lookup):", stateError.message);
  if (!state) return [];

  const { data, error } = await supabase
    .from("officials")
    .select("id, office_title, official_name, party, term_end")
    .eq("level", "federal")
    .eq("state_id", state.id)
    .eq("is_active", true)
    .not("official_name", "is", null)
    .order("office_title");

  if (error) {
    console.error("getFederalOfficials:", error.message);
    return [];
  }

  return (data ?? []) as Official[];
}

export interface OfficialSearchResult {
  id: string;
  official_name: string;
  office_title: string | null;
  level: string;
  party: string | null;
  jurisdiction_name: string | null;
}

export async function searchOfficialsByName(
  query: string,
): Promise<OfficialSearchResult[]> {
  if (query.trim().length < 2) return [];

  const { data, error } = await supabase
    .from("officials")
    .select("id, official_name, office_title, level, party, municipalities(name), counties(name)")
    .eq("is_active", true)
    .ilike("official_name", `%${query.trim()}%`)
    .order("official_name")
    .limit(30);

  if (error || !data) return [];

  return (
    data as unknown as Array<{
      id: string;
      official_name: string;
      office_title: string | null;
      level: string;
      party: string | null;
      municipalities: { name: string } | null;
      counties: { name: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    official_name: row.official_name,
    office_title: row.office_title,
    level: row.level,
    party: row.party,
    jurisdiction_name: row.municipalities?.name ?? row.counties?.name ?? null,
  }));
}

export async function getUpcomingElectionForOfficial(
  officialId: string,
): Promise<string | null> {
  const today = new Date().toISOString().split("T")[0];

  const { data: candidateRows, error: candError } = await supabase
    .from("candidates")
    .select("election_id")
    .eq("official_id", officialId);

  if (candError || !candidateRows?.length) return null;

  const electionIds = (candidateRows as { election_id: string }[])
    .map((c) => c.election_id)
    .filter(Boolean);
  if (!electionIds.length) return null;

  const { data, error } = await supabase
    .from("elections")
    .select("election_date")
    .in("id", electionIds)
    .gte("election_date", today)
    .order("election_date", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;
  return (data as { election_date: string }).election_date;
}

export interface OutsideMoneyGroup {
  pac_id: string;
  pac_name: string;
  committee_type: string;
  support_oppose: "support" | "oppose";
  total_amount: number;
  expenditure_count: number;
}

export interface OutsideMoneySummary {
  total_supporting: number;
  total_opposing: number;
  by_pac: OutsideMoneyGroup[];
}

export async function getOutsideMoneyForOfficial(
  officialId: string,
): Promise<OutsideMoneySummary> {
  const { data, error } = await supabase
    .from("pac_independent_expenditures")
    .select("pac_id, amount, support_oppose, pacs(name, committee_type)")
    .eq("official_id", officialId)
    .order("amount", { ascending: false });

  if (error) {
    console.error("getOutsideMoneyForOfficial:", error.message);
    return { total_supporting: 0, total_opposing: 0, by_pac: [] };
  }

  type RawRow = {
    pac_id: string;
    amount: number | null;
    support_oppose: "support" | "oppose";
    pacs: { name: string; committee_type: string } | null;
  };

  const rows = (data ?? []) as unknown as RawRow[];
  const groups = new Map<string, OutsideMoneyGroup>();
  let total_supporting = 0;
  let total_opposing = 0;

  for (const row of rows) {
    const amount = row.amount ?? 0;
    const key = `${row.pac_id}::${row.support_oppose}`;

    if (row.support_oppose === "support") total_supporting += amount;
    else total_opposing += amount;

    const existing = groups.get(key);
    if (existing) {
      existing.total_amount += amount;
      existing.expenditure_count += 1;
    } else {
      groups.set(key, {
        pac_id: row.pac_id,
        pac_name: row.pacs?.name ?? "Unknown PAC",
        committee_type: row.pacs?.committee_type ?? "other",
        support_oppose: row.support_oppose,
        total_amount: amount,
        expenditure_count: 1,
      });
    }
  }

  const by_pac = Array.from(groups.values()).sort(
    (a, b) => b.total_amount - a.total_amount,
  );
  return { total_supporting, total_opposing, by_pac };
}

export async function findOfficialIdsByNames(
  names: string[],
): Promise<Record<string, string>> {
  if (names.length === 0) return {};

  const { data, error } = await supabase
    .from("officials")
    .select("id, official_name")
    .in("official_name", names)
    .eq("is_active", true);

  if (error) console.error("findOfficialIdsByNames:", error.message);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.official_name] = row.id;
  }
  return map;
}

export async function getCityOfficials(cityName: string): Promise<Official[]> {
  // ilike handles the Census geocoder returning city names in uppercase
  const { data: munis, error: muniError } = await supabase
    .from("municipalities")
    .select("id")
    .ilike("name", cityName)
    .limit(1);

  if (muniError) console.error("getCityOfficials (municipality lookup):", muniError.message);
  const municipality = munis?.[0];
  if (!municipality) return [];

  const { data, error } = await supabase
    .from("officials")
    .select("id, office_title, official_name, party, term_end")
    .eq("municipality_id", municipality.id)
    .eq("level", "city")
    .eq("is_active", true)
    .not("official_name", "is", null)
    .order("office_title");

  if (error) {
    console.error("getCityOfficials:", error.message);
    return [];
  }
  return (data ?? []) as Official[];
}

export async function getOfficialsByCounty(
  countyName: string,
): Promise<Official[]> {
  const { data: state, error: stateError } = await supabase
    .from("states")
    .select("id")
    .eq("abbreviation", "WA")
    .single();

  if (stateError) console.error("getOfficialsByCounty (state lookup):", stateError.message);
  if (!state) return [];

  const { data: county, error: countyError } = await supabase
    .from("counties")
    .select("id")
    .eq("name", countyName)
    .eq("state_id", state.id)
    .single();

  if (countyError) console.error("getOfficialsByCounty (county lookup):", countyError.message);
  if (!county) return [];

  const { data, error } = await supabase
    .from("officials")
    .select("id, office_title, official_name, party, term_end")
    .eq("level", "county")
    .eq("county_id", county.id)
    .eq("is_active", true)
    .not("official_name", "is", null)
    .order("office_title");

  if (error) {
    console.error("getOfficialsByCounty:", error.message);
    return [];
  }

  return (data ?? []) as Official[];
}

// ── Smart search: "Seattle mayor", "King County sheriff", "Representatives for King County" ──

export interface SmartSearchResponse {
  results: OfficialSearchResult[];
  /** What we understood from the query, shown back to the user. */
  place: { name: string; kind: "city" | "county" } | null;
  role: string | null;
  /** True when the query named a county, so state/federal officials are not included. */
  countyOnly: boolean;
  /** Plain-language explanation when we widened or changed the search, e.g. a statewide office. */
  note: string | null;
}

interface PlaceRow { id: string; name: string }

let placeCache: { at: number; counties: PlaceRow[]; cities: PlaceRow[] } | null = null;

async function loadPlaces() {
  if (placeCache && Date.now() - placeCache.at < 60 * 60 * 1000) return placeCache;
  const [{ data: counties }, { data: cities }] = await Promise.all([
    supabase.from("counties").select("id, name"),
    supabase.from("municipalities").select("id, name"),
  ]);
  placeCache = {
    at: Date.now(),
    counties: (counties ?? []) as PlaceRow[],
    cities: (cities ?? []) as PlaceRow[],
  };
  return placeCache;
}

// Words in a query that name an office. `titles` are matched against office_title.
const ROLES: { label: string; re: RegExp; titles: string[] }[] = [
  { label: "Mayor",            re: /\bmayors?\b/,                                     titles: ["mayor"] },
  { label: "Council",          re: /\bcouncil(?:\s?member|man|woman|lor)?s?\b/,       titles: ["council"] },
  { label: "Sheriff",          re: /\bsheriffs?\b/,                                   titles: ["sheriff"] },
  { label: "Assessor",         re: /\bassessors?\b/,                                  titles: ["assessor"] },
  { label: "Auditor",          re: /\bauditors?\b/,                                   titles: ["auditor"] },
  { label: "Treasurer",        re: /\btreasurers?\b/,                                 titles: ["treasurer"] },
  { label: "Prosecutor",       re: /\bprosecut(?:or|ors|ing attorneys?)\b/,           titles: ["prosecut"] },
  { label: "Clerk",            re: /\bclerks?\b/,                                     titles: ["clerk"] },
  { label: "Coroner",          re: /\b(?:coroners?|medical examiners?)\b/,            titles: ["coroner", "medical examiner"] },
  { label: "Commissioner",     re: /\bcommissioners?\b/,                              titles: ["commissioner"] },
  { label: "Executive",        re: /\b(?:county )?executives?\b/,                     titles: ["executive"] },
  { label: "Judge",            re: /\b(?:judges?|justices?)\b/,                       titles: ["judge", "justice"] },
  { label: "Governor",         re: /\bgovernors?\b/,                                  titles: ["governor"] },
  { label: "Attorney General", re: /\battorney generals?\b/,                          titles: ["attorney general"] },
  { label: "Senator",          re: /\bsenators?\b/,                                   titles: ["senator"] },
  { label: "School board",     re: /\bschool (?:board|directors?)\b|\bschool\b/,      titles: ["school", "director"] },
];

const STOP_WORDS = new Set([
  "who", "is", "are", "the", "my", "of", "in", "for", "at", "a", "an", "and", "me", "show",
  "find", "list", "all", "current", "county", "city", "wa", "washington", "state", "us", "u.s.",
  "officials", "official", "representative", "representatives", "reps", "rep", "elected",
]);

function escapeLike(s: string) {
  // Strip characters that have meaning inside a PostgREST filter string.
  return s.replace(/[%,()*\\]/g, " ").replace(/\s+/g, " ").trim();
}

export async function smartSearchOfficials(rawQuery: string): Promise<SmartSearchResponse> {
  const empty: SmartSearchResponse = { results: [], place: null, role: null, countyOnly: false, note: null };
  const q = rawQuery.toLowerCase().replace(/[“”"']/g, "").replace(/\s+/g, " ").trim();
  if (q.length < 2) return empty;

  const { counties, cities } = await loadPlaces();
  const hasWord = (w: string) => new RegExp(`\\b${w}\\b`).test(q);
  const countyHint = hasWord("county");
  const cityHint = hasWord("city");

  // 1. Find a place named in the query (longest name wins).
  const nameIn = (name: string) => {
    const n = name.toLowerCase();
    return new RegExp(`(^|[^a-z])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(q);
  };
  const cityMatches = cities.filter((c) => nameIn(c.name)).sort((a, b) => b.name.length - a.name.length);
  const countyMatches = counties.filter((c) => nameIn(c.name)).sort((a, b) => b.name.length - a.name.length);

  let place: { name: string; kind: "city" | "county"; id: string } | null = null;
  const city = cityMatches[0];
  const county = countyMatches[0];
  if (county && (countyHint || !city)) place = { name: county.name, kind: "county", id: county.id };
  else if (city && !(cityHint === false && countyHint && county)) place = { name: city.name, kind: "city", id: city.id };
  else if (county) place = { name: county.name, kind: "county", id: county.id };

  // 2. Find an office named in the query.
  const role = ROLES.find((r) => r.re.test(q)) ?? null;

  // Some offices cover the whole state, so a place in the query ("Seattle governor") should not
  // filter them out. Search statewide and say so.
  const STATEWIDE = new Set(["Governor", "Attorney General"]);
  let note: string | null = null;
  if (place && role && STATEWIDE.has(role.label)) {
    note = `${role.label} is a statewide office, so ${place.name}${place.kind === "county" ? " County" : ""} is not used to narrow the results.`;
    place = null;
  }

  // 3. Text left over once place and office words are removed.
  let rest = q;
  if (place) rest = rest.replace(new RegExp(place.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), " ");
  if (role) rest = rest.replace(role.re, " ");
  const leftover = rest
    .split(/[^a-z0-9.'-]+/)
    .filter((w) => w && !STOP_WORDS.has(w))
    .join(" ");

  // 4. Build the query.
  let builder = supabase
    .from("officials")
    .select("id, official_name, office_title, level, party, municipalities(name), counties(name)")
    .eq("is_active", true)
    .not("official_name", "is", null);

  if (place?.kind === "city") builder = builder.eq("municipality_id", place.id);
  if (place?.kind === "county") builder = builder.eq("county_id", place.id);

  const conds: string[] = [];
  if (role) {
    // "representative(s)" never appears here: it is a stop word, so "Representatives for
    // King County" lists everyone for that place.
    for (const t of role.titles) conds.push(`office_title.ilike.%${t}%`);
  }
  const text = escapeLike(leftover);
  if (!place && !role) {
    // Nothing recognised: treat the whole query as a name or office.
    const whole = escapeLike(q);
    if (whole.length < 2) return empty;
    conds.push(`official_name.ilike.%${whole}%`, `office_title.ilike.%${whole}%`);
  } else if (text.length >= 2 && !role) {
    conds.push(`official_name.ilike.%${text}%`, `office_title.ilike.%${text}%`);
  }
  if (conds.length) builder = builder.or(conds.join(","));

  // "senator" / "governor" with no place: keep state and federal results.
  const { data, error } = await builder.order("official_name").limit(80);
  if (error || !data) return { ...empty, place: place && { name: place.name, kind: place.kind }, role: role?.label ?? null, note };

  const results = (data as unknown as Array<{
    id: string;
    official_name: string;
    office_title: string | null;
    level: string;
    party: string | null;
    municipalities: { name: string } | null;
    counties: { name: string } | null;
  }>).map((row) => ({
    id: row.id,
    official_name: row.official_name,
    office_title: row.office_title,
    level: row.level,
    party: row.party,
    jurisdiction_name: row.municipalities?.name ?? row.counties?.name ?? null,
  }));

  return {
    results,
    place: place ? { name: place.name, kind: place.kind } : null,
    role: role?.label ?? null,
    countyOnly: place?.kind === "county",
    note,
  };
}

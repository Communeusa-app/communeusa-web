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

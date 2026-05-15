"use server";

import { supabase } from "@/lib/supabase";

export interface ElectionCandidate {
  id: string;
  name: string;
  party: string | null;
  is_incumbent: boolean;
  official_id: string | null;
  website: string | null;
  ballotpedia_url: string | null;
}

export interface Election {
  id: string;
  office_name: string;
  level: string;
  election_date: string | null;
  primary_date: string | null;
  filing_deadline: string | null;
  description: string | null;
  source_url: string | null;
  candidates: ElectionCandidate[];
}

export interface CandidateDetail {
  id: string;
  name: string;
  party: string | null;
  is_incumbent: boolean;
  official_id: string | null;
  website: string | null;
  ballotpedia_url: string | null;
  election: {
    id: string;
    office_name: string;
    level: string;
    election_date: string | null;
  };
}

export interface CandidatePosition {
  id: string;
  issue_area: string | null;
  position_statement: string | null;
  source_url: string | null;
}

export interface CandidateEndorsement {
  id: string;
  endorser_name: string | null;
  endorser_type: string | null;
  endorsement_date: string | null;
  source_url: string | null;
}

// ── Internal types ─────────────────────────────────────────────────────────

type ElectionRow = Omit<Election, "candidates">;

const ELECTION_SELECT =
  "id, office_name, level, election_date, primary_date, filing_deadline, description, source_url";

// ── Helpers ────────────────────────────────────────────────────────────────

async function attachCandidates(elections: ElectionRow[]): Promise<Election[]> {
  if (!elections.length) return [];
  const ids = elections.map((e) => e.id);
  const { data, error } = await supabase
    .from("candidates")
    .select(
      "id, election_id, name, party, is_incumbent, official_id, website, ballotpedia_url",
    )
    .in("election_id", ids);
  if (error) console.error("attachCandidates:", error.message);
  const byElection = new Map<string, ElectionCandidate[]>();
  for (const c of (data ?? []) as (ElectionCandidate & { election_id: string })[]) {
    const list = byElection.get(c.election_id) ?? [];
    list.push(c);
    byElection.set(c.election_id, list);
  }
  return elections.map((e) => ({ ...e, candidates: byElection.get(e.id) ?? [] }));
}

async function dedupeAndAttach(rows: ElectionRow[]): Promise<Election[]> {
  const seen = new Set<string>();
  const unique: ElectionRow[] = [];
  for (const r of rows) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      unique.push(r);
    }
  }
  return attachCandidates(unique);
}

// ── Location helpers ───────────────────────────────────────────────────────

export async function getWACounties(): Promise<{ id: string; name: string }[]> {
  const { data: state } = await supabase
    .from("states")
    .select("id")
    .eq("abbreviation", "WA")
    .single();
  if (!state) return [];
  const { data } = await supabase
    .from("counties")
    .select("id, name")
    .eq("state_id", state.id)
    .order("name");
  return (data ?? []) as { id: string; name: string }[];
}

export async function getWACities(): Promise<{ id: string; name: string }[]> {
  const { data: state } = await supabase
    .from("states")
    .select("id")
    .eq("abbreviation", "WA")
    .single();
  if (!state) return [];
  const { data } = await supabase
    .from("municipalities")
    .select("id, name")
    .eq("state_id", state.id)
    .order("name");
  return (data ?? []) as { id: string; name: string }[];
}

// ── Elections ──────────────────────────────────────────────────────────────

export async function getElectionsByLocation(
  stateAbbr: string,
  rawCounty?: string | null,
  rawCity?: string | null,
): Promise<Election[]> {
  const { data: stateRow } = await supabase
    .from("states")
    .select("id")
    .eq("abbreviation", stateAbbr.toUpperCase())
    .single();
  if (!stateRow) return [];
  const stateId = stateRow.id as string;

  let countyId: string | null = null;
  if (rawCounty) {
    const bare = rawCounty.replace(/\s+county$/i, "").trim();
    const { data } = await supabase
      .from("counties")
      .select("id")
      .eq("state_id", stateId)
      .ilike("name", bare)
      .maybeSingle();
    countyId = (data?.id as string) ?? null;
  }

  let municipalityId: string | null = null;
  if (rawCity) {
    const { data } = await supabase
      .from("municipalities")
      .select("id")
      .eq("state_id", stateId)
      .ilike("name", rawCity)
      .maybeSingle();
    municipalityId = (data?.id as string) ?? null;
  }

  const queries: PromiseLike<ElectionRow[]>[] = [
    supabase
      .from("elections")
      .select(ELECTION_SELECT)
      .eq("state_id", stateId)
      .in("level", ["federal", "state"])
      .is("county_id", null)
      .is("municipality_id", null)
      .order("election_date")
      .then(({ data }) => (data ?? []) as ElectionRow[]),
  ];

  if (countyId) {
    queries.push(
      supabase
        .from("elections")
        .select(ELECTION_SELECT)
        .eq("county_id", countyId)
        .order("election_date")
        .then(({ data }) => (data ?? []) as ElectionRow[]),
    );
  }

  if (municipalityId) {
    queries.push(
      supabase
        .from("elections")
        .select(ELECTION_SELECT)
        .eq("municipality_id", municipalityId)
        .order("election_date")
        .then(({ data }) => (data ?? []) as ElectionRow[]),
    );
  }

  const results = await Promise.all(queries);
  return dedupeAndAttach(results.flat());
}

export async function getElectionsForBrowse(
  countyId?: string,
  municipalityId?: string,
): Promise<Election[]> {
  if (!countyId && !municipalityId) return [];

  let stateId: string | null = null;
  if (countyId) {
    const { data } = await supabase
      .from("counties")
      .select("state_id")
      .eq("id", countyId)
      .single();
    stateId = (data?.state_id as string) ?? null;
  } else if (municipalityId) {
    const { data } = await supabase
      .from("municipalities")
      .select("state_id")
      .eq("id", municipalityId)
      .single();
    stateId = (data?.state_id as string) ?? null;
  }

  const queries: PromiseLike<ElectionRow[]>[] = [];

  if (stateId) {
    queries.push(
      supabase
        .from("elections")
        .select(ELECTION_SELECT)
        .eq("state_id", stateId)
        .in("level", ["federal", "state"])
        .is("county_id", null)
        .is("municipality_id", null)
        .order("election_date")
        .then(({ data }) => (data ?? []) as ElectionRow[]),
    );
  }

  if (countyId) {
    queries.push(
      supabase
        .from("elections")
        .select(ELECTION_SELECT)
        .eq("county_id", countyId)
        .order("election_date")
        .then(({ data }) => (data ?? []) as ElectionRow[]),
    );
  }

  if (municipalityId) {
    queries.push(
      supabase
        .from("elections")
        .select(ELECTION_SELECT)
        .eq("municipality_id", municipalityId)
        .order("election_date")
        .then(({ data }) => (data ?? []) as ElectionRow[]),
    );
  }

  const results = await Promise.all(queries);
  return dedupeAndAttach(results.flat());
}

export async function getElectionById(id: string): Promise<Election | null> {
  const { data, error } = await supabase
    .from("elections")
    .select(ELECTION_SELECT)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  const elections = await attachCandidates([data as ElectionRow]);
  return elections[0] ?? null;
}

export async function getCandidateById(
  id: string,
): Promise<CandidateDetail | null> {
  const { data: candidate, error } = await supabase
    .from("candidates")
    .select(
      "id, election_id, name, party, is_incumbent, official_id, website, ballotpedia_url",
    )
    .eq("id", id)
    .single();
  if (error || !candidate) return null;

  const { data: election } = await supabase
    .from("elections")
    .select("id, office_name, level, election_date")
    .eq("id", candidate.election_id as string)
    .single();
  if (!election) return null;

  return {
    id: candidate.id as string,
    name: candidate.name as string,
    party: candidate.party as string | null,
    is_incumbent: candidate.is_incumbent as boolean,
    official_id: candidate.official_id as string | null,
    website: candidate.website as string | null,
    ballotpedia_url: candidate.ballotpedia_url as string | null,
    election: {
      id: election.id as string,
      office_name: election.office_name as string,
      level: election.level as string,
      election_date: election.election_date as string | null,
    },
  };
}

export async function getCandidatePositions(
  candidateId: string,
): Promise<CandidatePosition[]> {
  const { data, error } = await supabase
    .from("candidate_positions")
    .select("id, issue_area, position_statement, source_url")
    .eq("candidate_id", candidateId)
    .order("issue_area");
  if (error) console.error("getCandidatePositions:", error.message);
  return (data ?? []) as CandidatePosition[];
}

export async function getCandidateEndorsements(
  candidateId: string,
): Promise<CandidateEndorsement[]> {
  const { data, error } = await supabase
    .from("candidate_endorsements")
    .select("id, endorser_name, endorser_type, endorsement_date, source_url")
    .eq("candidate_id", candidateId)
    .order("endorsement_date", { ascending: false });
  if (error) console.error("getCandidateEndorsements:", error.message);
  return (data ?? []) as CandidateEndorsement[];
}

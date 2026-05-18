"use server";

import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TopDonor {
  name: string;
  amount: number;
  donorType: string;
  industrySector: string | null;
}

export interface FinanceSummary {
  id: string;
  name: string;
  officeTitle: string;
  level: string;
  district: string | null;
  municipalityName: string | null;
  countyName: string | null;
  totalRaised: number;
  topDonors: TopDonor[];
  pacTotal: number;
  individualTotal: number;
  otherTotal: number;
  donorCount: number;
}

export interface PACDonorRow {
  donorName: string;
  totalAmount: number;
  officialCount: number;
}

export interface IndividualDonorRow {
  donorName: string;
  totalAmount: number;
  officialCount: number;
}

export interface IndustryRow {
  sector: string;
  totalAmount: number;
  donorCount: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

type RawFinanceRow = {
  official_id: string;
  donor_name: string | null;
  donor_type: string | null;
  amount: number | null;
  industry_sector: string | null;
};

type RawOfficial = {
  id: string;
  official_name: string;
  office_title: string;
  level: string;
  district: string | null;
  municipality_id: string | null;
  county_id: string | null;
  municipalities: { name: string } | null;
  counties: { name: string } | null;
};

function buildSummary(official: RawOfficial, rows: RawFinanceRow[]): FinanceSummary {
  const totalRaised = rows.reduce((s, r) => s + (r.amount ?? 0), 0);

  // Aggregate by donor name
  const byDonor = new Map<string, { amount: number; donorType: string; industrySector: string | null }>();
  for (const row of rows) {
    const key = row.donor_name ?? "Unknown";
    const existing = byDonor.get(key);
    if (existing) {
      existing.amount += row.amount ?? 0;
    } else {
      byDonor.set(key, {
        amount: row.amount ?? 0,
        donorType: row.donor_type ?? "",
        industrySector: row.industry_sector ?? null,
      });
    }
  }

  const topDonors: TopDonor[] = [...byDonor.entries()]
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 3)
    .map(([name, d]) => ({ name, ...d }));

  const pacTotal = rows
    .filter((r) => r.industry_sector === "Political Action Committee")
    .reduce((s, r) => s + (r.amount ?? 0), 0);
  const individualTotal = rows
    .filter((r) => r.donor_type === "Individual")
    .reduce((s, r) => s + (r.amount ?? 0), 0);
  const otherTotal = Math.max(0, totalRaised - pacTotal - individualTotal);

  return {
    id: official.id,
    name: official.official_name,
    officeTitle: official.office_title,
    level: official.level,
    district: official.district,
    municipalityName: official.municipalities?.name ?? null,
    countyName: official.counties?.name ?? null,
    totalRaised,
    topDonors,
    pacTotal,
    individualTotal,
    otherTotal,
    donorCount: byDonor.size,
  };
}

// ── Shared data loader ─────────────────────────────────────────────────────────

async function loadAllFinanceData(): Promise<{ officials: RawOfficial[]; rows: RawFinanceRow[] }> {
  const { data: rows, error: rowsErr } = await supabase
    .from("campaign_finance")
    .select("official_id, donor_name, donor_type, amount, industry_sector");

  if (rowsErr || !rows?.length) return { officials: [], rows: [] };

  const officialIds = [...new Set(rows.map((r) => r.official_id as string))];

  const { data: officials, error: offErr } = await supabase
    .from("officials")
    .select("id, official_name, office_title, level, district, municipality_id, county_id, municipalities(name), counties(name)")
    .in("id", officialIds)
    .eq("is_active", true);

  if (offErr || !officials) return { officials: [], rows: [] };

  return {
    officials: officials as unknown as RawOfficial[],
    rows: rows as RawFinanceRow[],
  };
}

// ── Public actions ─────────────────────────────────────────────────────────────

export async function getAllFinanceOfficials(): Promise<FinanceSummary[]> {
  const { officials, rows } = await loadAllFinanceData();
  if (!officials.length) return [];

  const rowsByOfficial = new Map<string, RawFinanceRow[]>();
  for (const row of rows) {
    const list = rowsByOfficial.get(row.official_id) ?? [];
    list.push(row);
    rowsByOfficial.set(row.official_id, list);
  }

  return officials
    .map((o) => buildSummary(o, rowsByOfficial.get(o.id) ?? []))
    .sort((a, b) => b.totalRaised - a.totalRaised);
}

export async function getRepresentativeFinance(
  officialIds: string[],
): Promise<FinanceSummary[]> {
  if (!officialIds.length) return [];

  const { data: rows, error: rowsErr } = await supabase
    .from("campaign_finance")
    .select("official_id, donor_name, donor_type, amount, industry_sector")
    .in("official_id", officialIds);

  if (rowsErr || !rows?.length) return [];

  const foundIds = [...new Set(rows.map((r) => r.official_id as string))];
  const { data: officials, error: offErr } = await supabase
    .from("officials")
    .select("id, official_name, office_title, level, district, municipality_id, county_id, municipalities(name), counties(name)")
    .in("id", foundIds);

  if (offErr || !officials) return [];

  const rowsByOfficial = new Map<string, RawFinanceRow[]>();
  for (const row of rows as RawFinanceRow[]) {
    const list = rowsByOfficial.get(row.official_id) ?? [];
    list.push(row);
    rowsByOfficial.set(row.official_id, list);
  }

  return (officials as unknown as RawOfficial[])
    .map((o) => buildSummary(o, rowsByOfficial.get(o.id) ?? []))
    .sort((a, b) => b.totalRaised - a.totalRaised);
}

export async function getTopPACDonors(limit = 20): Promise<PACDonorRow[]> {
  const { data, error } = await supabase
    .from("campaign_finance")
    .select("official_id, donor_name, amount")
    .eq("industry_sector", "Political Action Committee");

  if (error || !data) return [];

  const byDonor = new Map<string, { total: number; officials: Set<string> }>();
  for (const row of data) {
    const name = (row.donor_name as string) ?? "Unknown";
    const existing = byDonor.get(name) ?? { total: 0, officials: new Set() };
    existing.total += (row.amount as number) ?? 0;
    existing.officials.add(row.official_id as string);
    byDonor.set(name, existing);
  }

  return [...byDonor.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, limit)
    .map(([donorName, d]) => ({
      donorName,
      totalAmount: d.total,
      officialCount: d.officials.size,
    }));
}

export async function getTopIndividualDonors(limit = 20): Promise<IndividualDonorRow[]> {
  const { data, error } = await supabase
    .from("campaign_finance")
    .select("official_id, donor_name, amount")
    .eq("donor_type", "Individual");

  if (error || !data) return [];

  const byDonor = new Map<string, { total: number; officials: Set<string> }>();
  for (const row of data) {
    const name = (row.donor_name as string) ?? "Unknown";
    const existing = byDonor.get(name) ?? { total: 0, officials: new Set() };
    existing.total += (row.amount as number) ?? 0;
    existing.officials.add(row.official_id as string);
    byDonor.set(name, existing);
  }

  return [...byDonor.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, limit)
    .map(([donorName, d]) => ({
      donorName,
      totalAmount: d.total,
      officialCount: d.officials.size,
    }));
}

export async function getTopIndustries(limit = 15): Promise<IndustryRow[]> {
  const { data, error } = await supabase
    .from("campaign_finance")
    .select("industry_sector, amount, donor_name");

  if (error || !data) return [];

  const bySector = new Map<string, { total: number; donors: Set<string> }>();
  for (const row of data) {
    const sector = (row.industry_sector as string | null) ?? "Other";
    const existing = bySector.get(sector) ?? { total: 0, donors: new Set() };
    existing.total += (row.amount as number) ?? 0;
    if (row.donor_name) existing.donors.add(row.donor_name as string);
    bySector.set(sector, existing);
  }

  return [...bySector.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, limit)
    .map(([sector, d]) => ({
      sector,
      totalAmount: d.total,
      donorCount: d.donors.size,
    }));
}

export async function searchOfficialFinance(query: string): Promise<FinanceSummary[]> {
  if (!query.trim()) return [];

  const { data: officials, error } = await supabase
    .from("officials")
    .select("id, official_name, office_title, level, district, municipality_id, county_id, municipalities(name), counties(name)")
    .eq("is_active", true)
    .ilike("official_name", `%${query.trim()}%`)
    .limit(20);

  if (error || !officials?.length) return [];

  const ids = (officials as unknown as RawOfficial[]).map((o) => o.id);

  const { data: rows, error: rowsErr } = await supabase
    .from("campaign_finance")
    .select("official_id, donor_name, donor_type, amount, industry_sector")
    .in("official_id", ids);

  if (rowsErr) return [];

  const rowsByOfficial = new Map<string, RawFinanceRow[]>();
  for (const row of (rows ?? []) as RawFinanceRow[]) {
    const list = rowsByOfficial.get(row.official_id) ?? [];
    list.push(row);
    rowsByOfficial.set(row.official_id, list);
  }

  return (officials as unknown as RawOfficial[])
    .filter((o) => (rowsByOfficial.get(o.id)?.length ?? 0) > 0)
    .map((o) => buildSummary(o, rowsByOfficial.get(o.id) ?? []))
    .sort((a, b) => b.totalRaised - a.totalRaised);
}

"use server";

import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────────

export type DirectoryCategory =
  | "school-districts"
  | "law-enforcement"
  | "fire-ems"
  | "hospitals"
  | "utilities-transit"
  | "state-agencies"
  | "judiciary"
  | "courts";

export interface DirectoryEntity {
  id: string;
  category: DirectoryCategory;
  name: string;
  county_name: string | null;
  contact_label: string | null;
  contact_name: string | null;
  phone: string | null;
  website: string | null;
  detail_label: string | null;
  detail_value: string | null;
  jurisdiction: string | null;
}

export interface DirectoryCounty {
  id: string;
  name: string;
}

// ── Normalizers ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function countyName(row: any): string | null {
  return row.counties?.name ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(category: DirectoryCategory, row: any): DirectoryEntity {
  switch (category) {
    case "school-districts":
      return {
        id: row.id, category,
        name: row.name,
        county_name: countyName(row),
        contact_label: row.superintendent ? "Superintendent" : null,
        contact_name: row.superintendent ?? null,
        phone: row.phone ?? null,
        website: row.official_website ?? null,
        detail_label: row.enrollment ? "Enrollment" : null,
        detail_value: row.enrollment ? row.enrollment.toLocaleString() : null,
        jurisdiction: countyName(row),
      };
    case "law-enforcement":
      return {
        id: row.id, category,
        name: row.name,
        county_name: countyName(row),
        contact_label: row.chief_name ? "Chief / Sheriff" : null,
        contact_name: row.chief_name ?? null,
        phone: row.phone ?? null,
        website: row.website ?? null,
        detail_label: row.sworn_officers != null ? "Sworn Officers" : null,
        detail_value: row.sworn_officers != null ? String(row.sworn_officers) : null,
        jurisdiction: row.jurisdiction ?? countyName(row),
      };
    case "fire-ems":
      return {
        id: row.id, category,
        name: row.name,
        county_name: countyName(row),
        contact_label: row.fire_chief ? "Fire Chief" : null,
        contact_name: row.fire_chief ?? null,
        phone: row.phone ?? null,
        website: row.website ?? null,
        detail_label: row.service_type ? "Service" : null,
        detail_value: row.service_type ?? null,
        jurisdiction: row.jurisdiction ?? countyName(row),
      };
    case "hospitals":
      return {
        id: row.id, category,
        name: row.name,
        county_name: countyName(row),
        contact_label: row.ceo ? "CEO / Admin" : null,
        contact_name: row.ceo ?? null,
        phone: row.phone ?? null,
        website: row.website ?? null,
        detail_label: row.beds != null ? "Beds" : null,
        detail_value: row.beds != null ? String(row.beds) : null,
        jurisdiction: countyName(row),
      };
    case "utilities-transit":
      return {
        id: row.id, category,
        name: row.name,
        county_name: countyName(row),
        contact_label: row.ceo ? "CEO / Director" : null,
        contact_name: row.ceo ?? null,
        phone: row.phone ?? null,
        website: row.website ?? null,
        detail_label: row.service_type ? "Service" : null,
        detail_value: row.service_type ?? null,
        jurisdiction: row.county_region ?? countyName(row),
      };
    case "state-agencies":
      return {
        id: row.id, category,
        name: row.name,
        county_name: null,
        contact_label: row.director ? "Director" : null,
        contact_name: row.director ?? null,
        phone: row.phone ?? null,
        website: row.website ?? null,
        detail_label: row.category ? "Category" : null,
        detail_value: row.category ?? null,
        jurisdiction: row.headquarters ?? null,
      };
    case "judiciary":
      return {
        id: row.id, category,
        name: row.judge_name ?? row.position ?? row.court_name,
        county_name: countyName(row),
        contact_label: "Court",
        contact_name: row.court_name ?? null,
        phone: null,
        website: row.official_website ?? null,
        detail_label: row.court_level ? "Level" : null,
        detail_value: row.court_level ?? null,
        jurisdiction: row.jurisdiction ?? null,
      };
    case "courts":
      return {
        id: row.id, category,
        name: row.court_name ?? "Unknown Court",
        county_name: countyName(row),
        contact_label: row.court_level ? "Level" : null,
        contact_name: row.court_level ?? null,
        phone: null,
        website: row.official_website ?? null,
        detail_label: row.jurisdiction ? "Jurisdiction" : null,
        detail_value: row.jurisdiction ?? null,
        jurisdiction: row.jurisdiction ?? null,
      };
  }
}

const TABLE_MAP: Record<Exclude<DirectoryCategory, "courts">, string> = {
  "school-districts":  "school_districts",
  "law-enforcement":   "law_enforcement_agencies",
  "fire-ems":          "fire_ems_agencies",
  "hospitals":         "hospitals",
  "utilities-transit": "utilities_transit",
  "state-agencies":    "state_agencies",
  "judiciary":         "judiciary",
};

const SELECT_MAP: Record<Exclude<DirectoryCategory, "courts">, string> = {
  "school-districts":  "id,name,enrollment,official_website,phone,superintendent,counties(name)",
  "law-enforcement":   "id,name,agency_type,jurisdiction,chief_name,sworn_officers,phone,website,counties(name)",
  "fire-ems":          "id,name,agency_type,jurisdiction,fire_chief,stations,service_type,phone,website,counties(name)",
  "hospitals":         "id,name,ownership_type,beds,trauma_level,health_system,ceo,phone,website,counties(name)",
  "utilities-transit": "id,name,category,county_region,service_type,customers_riders,ceo,phone,website,counties(name)",
  "state-agencies":    "id,name,category,abbreviation,director,headquarters,phone,website",
  "judiciary":         "id,judge_name,position,court_name,court_level,selection_method,jurisdiction,official_website,counties(name)",
};

// ── Public actions ─────────────────────────────────────────────────────────────

export async function getWAStateId(): Promise<string | null> {
  const { data } = await supabase.from("states").select("id").eq("abbreviation", "WA").single();
  return data?.id ?? null;
}

export async function getDirectoryCounties(): Promise<DirectoryCounty[]> {
  const stateId = await getWAStateId();
  if (!stateId) return [];
  const { data } = await supabase
    .from("counties")
    .select("id,name")
    .eq("state_id", stateId)
    .order("name");
  return (data ?? []) as DirectoryCounty[];
}

export async function getEntitiesByCategory(
  category: DirectoryCategory,
  countyId?: string | null,
): Promise<DirectoryEntity[]> {
  const stateId = await getWAStateId();
  if (!stateId) return [];

  // "courts" tab: distinct courts from judiciary table
  if (category === "courts") {
    let q = supabase
      .from("judiciary")
      .select("id,court_name,court_level,jurisdiction,official_website,counties(name)")
      .eq("state_id", stateId)
      .not("court_name", "is", null)
      .order("court_level")
      .order("court_name");
    if (countyId) q = q.eq("county_id", countyId);
    const { data } = await q.limit(300);
    if (!data) return [];
    // Deduplicate by court_name, keep first occurrence
    const seen = new Set<string>();
    return data.flatMap((row) => {
      const cn = row.court_name as string;
      if (seen.has(cn)) return [];
      seen.add(cn);
      return [normalize("courts", row)];
    });
  }

  const table  = TABLE_MAP[category];
  const select = SELECT_MAP[category];

  let q = supabase.from(table).select(select).eq("state_id", stateId);
  if (countyId) q = q.eq("county_id", countyId);

  // Meaningful default sort per category
  if (category === "state-agencies") q = q.order("category").order("name");
  else if (category === "judiciary") q = q.order("court_level").order("judge_name");
  else q = q.order("name");

  const { data } = await q.limit(500);
  return (data ?? []).map((row) => normalize(category, row));
}

export async function searchDirectory(
  query: string,
  category?: DirectoryCategory | null,
): Promise<DirectoryEntity[]> {
  const q = query.trim();
  if (!q) return [];

  const stateId = await getWAStateId();
  if (!stateId) return [];

  const categories: DirectoryCategory[] = category
    ? [category]
    : [
        "school-districts", "law-enforcement", "fire-ems", "hospitals",
        "utilities-transit", "state-agencies", "judiciary",
      ];

  const results = await Promise.all(
    categories.map(async (cat): Promise<DirectoryEntity[]> => {
      if (cat === "courts") return [];
      const table  = TABLE_MAP[cat];
      const select = SELECT_MAP[cat];
      const nameCol = cat === "judiciary" ? "judge_name" : "name";
      const { data } = await supabase
        .from(table)
        .select(select)
        .eq("state_id", stateId)
        .ilike(nameCol, `%${q}%`)
        .limit(20);
      return (data ?? []).map((row) => normalize(cat, row));
    }),
  );

  return results.flat().sort((a, b) => a.name.localeCompare(b.name));
}

export async function getEntityById(
  category: DirectoryCategory,
  id: string,
): Promise<DirectoryEntity | null> {
  if (category === "courts") {
    const { data } = await supabase
      .from("judiciary")
      .select("id,court_name,court_level,jurisdiction,official_website,counties(name)")
      .eq("id", id)
      .single();
    return data ? normalize("courts", data) : null;
  }

  const table  = TABLE_MAP[category];
  const select = SELECT_MAP[category];
  const { data } = await supabase.from(table).select(select).eq("id", id).single();
  return data ? normalize(category, data) : null;
}

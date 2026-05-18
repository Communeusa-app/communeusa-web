"use server";

import { supabase } from "@/lib/supabase";

export type DistrictType = "congressional" | "house" | "senate";
export type DistrictRep = { id: string; name: string };

export interface DistrictOfficialMap {
  congressional: Record<string, DistrictRep>;
  house: Record<string, DistrictRep[]>;
  senate: Record<string, DistrictRep>;
}

// Extract the leading integer from district strings like "2", "District 2 — Position 1 — …"
function extractDistrictNumber(district: string | null): string | null {
  if (!district) return null;
  const match = district.match(/\b(\d+)\b/);
  return match ? match[1] : null;
}

export async function getDistrictOfficials(): Promise<DistrictOfficialMap> {
  const { data, error } = await supabase
    .from("officials")
    .select("id, official_name, office_title, district, level")
    .eq("is_active", true)
    .in("level", ["federal", "state"]);

  if (error || !data) return { congressional: {}, house: {}, senate: {} };

  const congressional: Record<string, DistrictRep> = {};
  const house: Record<string, DistrictRep[]> = {};
  const senate: Record<string, DistrictRep> = {};

  for (const row of data) {
    const num = extractDistrictNumber(row.district as string | null);
    if (!num) continue;
    const rep: DistrictRep = { id: row.id as string, name: row.official_name as string };
    const title = (row.office_title as string) ?? "";

    if (title === "U.S. Representative") {
      congressional[num] = rep;
    } else if (title === "State Senate") {
      senate[num] = rep;
    } else if (title === "State House" || title === "State House of Representatives") {
      if (!house[num]) house[num] = [];
      house[num].push(rep);
    }
  }

  return { congressional, house, senate };
}

// Returns districts that changed within the last 2 years — drives the dashed
// border indicator on the map. Populated by redistricting-sync.py.
export type RecentlyRedrawn = Record<DistrictType, string[]>;

export async function getRedistrictedDistricts(): Promise<RecentlyRedrawn> {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 2);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("redistricted_districts")
    .select("district_type, district_number")
    .eq("state", "WA")
    .gte("changed_date", cutoffStr);

  const result: RecentlyRedrawn = { congressional: [], house: [], senate: [] };
  if (error || !data) return result;

  for (const row of data) {
    const type = row.district_type as DistrictType;
    if (result[type]) result[type].push(row.district_number as string);
  }
  return result;
}

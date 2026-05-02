"use server";

import { supabase } from "@/lib/supabase";

export interface Official {
  office_title: string | null;
  official_name: string;
  party: string | null;
  term_end: string | null;
}

export async function getOfficialsByCounty(
  countyName: string,
): Promise<Official[]> {
  const { data: state } = await supabase
    .from("states")
    .select("id")
    .eq("abbreviation", "WA")
    .single();

  if (!state) return [];

  const { data: county } = await supabase
    .from("counties")
    .select("id")
    .eq("name", countyName)
    .eq("state_id", state.id)
    .single();

  if (!county) return [];

  const { data, error } = await supabase
    .from("officials")
    .select("office_title, official_name, party, term_end")
    .eq("level", "county")
    .eq("county_id", county.id)
    .not("official_name", "is", null)
    .order("office_title");

  if (error) {
    console.error("getOfficialsByCounty:", error.message);
    return [];
  }

  return (data ?? []) as Official[];
}

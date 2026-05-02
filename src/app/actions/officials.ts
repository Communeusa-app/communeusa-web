"use server";

import { supabase } from "@/lib/supabase";

export interface Official {
  id: string;
  office_title: string | null;
  official_name: string;
  party: string | null;
  term_end: string | null;
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
}

export async function getOfficialById(
  id: string,
): Promise<OfficialProfile | null> {
  const { data, error } = await supabase
    .from("officials")
    .select(
      "id, official_name, office_title, office_category, level, party, district, term_start, term_end, appointed_or_elected, phone, email, official_website, ballotpedia_url, key_committees, notes",
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as OfficialProfile;
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
    .select("id, office_title, official_name, party, term_end")
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

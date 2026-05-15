"use server";

export interface GeoResult {
  lat: number;
  lng: number;
  city: string | null;
  county: string | null;
  stateAbbr: string | null;
}

export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  const url =
    `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress` +
    `?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&vintage=Current_Current&layers=Counties%2CStates&format=json`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = await res.json();

  const match = data?.result?.addressMatches?.[0];
  if (!match) return null;

  // coordinates is always present on a successful match, but guard defensively
  if (!match.coordinates) return null;
  const lat = match.coordinates.y as number;
  const lng = match.coordinates.x as number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const city = (match.addressComponents?.city as string | null | undefined) ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const county = (match.geographies?.["Counties"]?.[0] as any)?.NAME ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stateAbbr = ((match.geographies?.["States"]?.[0] as any)?.STUSAB as string)?.toUpperCase() ?? null;

  return { lat, lng, city, county, stateAbbr };
}

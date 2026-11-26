export type Level = "Federal" | "State" | "County" | "City";
export const LEVEL_ORDER: Level[] = ["Federal", "State", "County", "City"];

export interface Rep {
  name: string;
  officeName: string;
  party: string | null;
  level: Level;
  dbId: string | null;
}

/** What an address lookup sends to the map section. `null` clears it. */
export interface AddressResult {
  address: string;
  county: string | null;
  reps: Rep[];
}

export const LOOKUP_SESSION_KEY = "communeusa_lookup";
export const ADDRESS_RESULT_EVENT = "communeusa:address-result";

export function sendAddressResult(result: AddressResult | null) {
  window.dispatchEvent(new CustomEvent(ADDRESS_RESULT_EVENT, { detail: { result } }));
}

/** Remember that the person left for a profile, so coming back restores the lookup. */
export function markLookupNavigatedAway() {
  try {
    const saved = sessionStorage.getItem(LOOKUP_SESSION_KEY);
    if (saved) sessionStorage.setItem(LOOKUP_SESSION_KEY, JSON.stringify({ ...JSON.parse(saved), navigatedAway: true }));
  } catch {}
}

export function clearLookupSession() {
  try { sessionStorage.removeItem(LOOKUP_SESSION_KEY); } catch {}
}

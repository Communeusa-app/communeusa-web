/** What to show when an official has no party on record. Many local offices are nonpartisan or appointed,
 *  and for the rest we simply do not have one, so the wording stays neutral. */
export const NO_PARTY_LABEL = "No party listed";

export function partyLabel(party: string | null | undefined): string {
  const trimmed = party?.trim();
  return trimmed ? trimmed : NO_PARTY_LABEL;
}

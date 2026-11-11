/**
 * Only candidates verified against the Washington Secretary of State's official results
 * (candidates.status = 'verified') are shown. Races with none show the message below.
 */
export const CANDIDATES_PENDING_MESSAGE =
  "Candidate list is being verified against official results.";

export const UNOFFICIAL_RESULTS_LABEL =
  "Unofficial results. Counting continues until the state certifies.";

export function formatVotes(n: number | null | undefined): string | null {
  return typeof n === "number" ? n.toLocaleString("en-US") : null;
}

export function formatUpdated(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  });
}

export function formatVerified(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

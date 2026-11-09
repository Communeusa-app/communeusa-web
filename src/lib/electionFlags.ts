/**
 * Candidate lists on election pages are hidden until they are rebuilt from the Washington
 * Secretary of State's official results. The earlier Ballotpedia-based import mixed in
 * candidates from other election cycles and left eliminated primary candidates in place.
 * Set to true once the verified import is live.
 */
export const SHOW_CANDIDATES = false;

export const CANDIDATES_PENDING_MESSAGE =
  "Candidate list is being verified against official results.";

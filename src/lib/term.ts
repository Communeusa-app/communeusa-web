/** Wording for an official with no term end date. A blank is a gap in our records, not proof that
 *  the seat has no term, so the text says "not on record" and only mentions appointment when we know it. */
export function termEndFallback(appointedOrElected: string | null | undefined): string {
  const how = appointedOrElected?.trim().toLowerCase();
  if (how === "appointed") return "Appointed, no end date on record";
  if (how === "elected") return "Elected, end date not on record";
  return "End date not on record";
}

/** Short form for lists, e.g. "until Dec 2027" or "no end date on record". */
export function termEndShort(termEnd: string | null | undefined, appointedOrElected: string | null | undefined): string {
  if (termEnd?.trim()) return `until ${termEnd.trim()}`;
  return appointedOrElected?.trim().toLowerCase() === "appointed" ? "appointed, no end date on record" : "end date not on record";
}

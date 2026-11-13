"use client";

import { useRouter } from "next/navigation";
import { hasPreviousPageInApp } from "@/components/NavTracker";

interface Props {
  /** Where to go when the visitor arrived directly (no earlier page on this site). */
  fallbackHref: string;
  fallbackLabel?: string;
  className?: string;
}

/**
 * Takes the visitor back to the page they came from (the map county panel, the
 * officials search, finance, a race), instead of always sending them to the homepage map.
 */
export function BackLink({ fallbackHref, fallbackLabel = "Back", className }: Props) {
  const router = useRouter();

  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Go back to whatever page the visitor was on, however they opened this one. The link itself
    // is the fallback for visitors who arrived directly (a shared link or a new tab).
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // let "open in new tab" work
    if (hasPreviousPageInApp()) {
      e.preventDefault();
      router.back();
    }
  }

  return (
    <a href={fallbackHref} onClick={onClick} className={className}>
      ← {fallbackLabel}
    </a>
  );
}

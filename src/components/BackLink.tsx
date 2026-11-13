"use client";

import { useRouter } from "next/navigation";

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
    let cameFromSite = false;
    try {
      cameFromSite =
        window.history.length > 1 && !!document.referrer && new URL(document.referrer).origin === window.location.origin;
    } catch {
      cameFromSite = false;
    }
    if (cameFromSite) {
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

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const KEY = "communeusa:page-views";
let lastPath: string | null = null;

/**
 * Counts the pages viewed in this tab. A profile's Back link needs to know whether the visitor
 * came from another page on this site. document.referrer cannot tell it that: it keeps the value
 * from the first page load and ignores in-app navigation, which is why Back used to land in
 * different places depending on how the profile was opened.
 */
export function NavTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (lastPath === pathname) return;
    lastPath = pathname;
    try {
      const n = Number(sessionStorage.getItem(KEY) ?? "0") || 0;
      sessionStorage.setItem(KEY, String(n + 1));
    } catch {
      // storage unavailable: Back falls back to the default page
    }
  }, [pathname]);
  return null;
}

/** True when this tab has viewed at least one other page on the site before the current one. */
export function hasPreviousPageInApp(): boolean {
  try {
    return (Number(sessionStorage.getItem(KEY) ?? "0") || 0) > 1 && window.history.length > 1;
  } catch {
    return false;
  }
}

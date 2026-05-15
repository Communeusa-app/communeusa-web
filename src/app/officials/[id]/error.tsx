"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function OfficialError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[OfficialPage] Unhandled error:", error);
  }, [error]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-5xl font-bold text-brand-light-gray dark:text-brand-dark-gray mb-4">
        Error
      </p>
      <h1 className="text-xl font-semibold text-brand-navy dark:text-brand-off-white mb-2">
        Something went wrong loading this official&apos;s profile
      </h1>
      <p className="text-sm text-brand-navy/55 dark:text-brand-off-white/50 mb-8">
        This is likely a temporary issue. Try again or return to the map.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-brand-primary hover:bg-brand-navy dark:bg-brand-red text-white font-medium px-5 py-2.5 text-sm transition-colors"
        >
          Try again
        </button>
        <Link
          href="/?state=53#map"
          className="rounded-lg border border-brand-light-gray dark:border-brand-dark-gray text-brand-navy dark:text-brand-off-white hover:border-brand-primary/40 dark:hover:border-brand-red/40 font-medium px-5 py-2.5 text-sm transition-colors"
        >
          ← Back to map
        </Link>
      </div>
    </main>
  );
}

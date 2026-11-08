"use client";

import { useState } from "react";
import Link from "next/link";

export function MobileNav({ links }: { links: readonly { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-line text-fg transition-colors hover:border-fg/40 lg:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:focus-visible:outline-brand-light-blue"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      {open && (
        <div id="mobile-menu" className="order-last mt-1 flex basis-full flex-col border-t border-line pt-2 lg:hidden">
          {links.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-2 py-3.5 text-[17px] text-fg transition-colors hover:bg-fg/5"
            >
              {label}
            </Link>
          ))}
          <a
            href="#lookup"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-fg px-5 py-3.5 text-center text-base font-semibold text-on-fg sm:hidden"
          >
            Look up my reps
          </a>
        </div>
      )}
    </>
  );
}

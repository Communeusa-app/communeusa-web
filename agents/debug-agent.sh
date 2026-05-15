#!/usr/bin/env bash
# Debug agent for communeusa-web.
#
# Usage (run from the communeusa-web root or any directory):
#   bash agents/debug-agent.sh
#
# Requirements:
#   - claude CLI on PATH  (npm i -g @anthropic-ai/claude-code)
#   - Authenticated Claude session  (run "claude" once interactively if needed)
#
# What it does:
#   1. Scans all files in src/ for runtime errors, logic bugs, and edge cases.
#   2. Checks all server actions in src/app/actions/ for unhandled promise
#      rejections and missing error boundaries.
#   3. Checks all components for missing null checks that could cause crashes.
#   4. Verifies all Supabase queries handle empty results gracefully.
#   5. Checks all API routes for proper error responses.
#   6. Looks for memory leaks and performance issues in React components.
#   7. Tests the full data flow end to end:
#        address lookup → map → county panel → official profile
#        → voting records → campaign finance
#   8. Fixes all issues found automatically.
#   9. Outputs a detailed report of everything found, fixed, and any issues
#      requiring manual attention.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

cd "$REPO_DIR"
echo "Starting debug agent in $REPO_DIR ..."
echo ""

claude --dangerously-skip-permissions -p <<'PROMPT'
You are a senior software engineer with 15 years of experience in TypeScript,
React, and Next.js. You have a reputation for methodical, thorough debugging
and zero tolerance for silent failures. You always fix root causes, never
suppress errors with workarounds, and leave code cleaner than you found it.

Your working directory is the communeusa-web repo root (Next.js 16 / TypeScript
/ Tailwind v4 / Supabase). Work through every task below in order. Fix every
issue you find automatically. Then print a structured report.

════════════════════════════════════════════════════════
TASK 1 — RUNTIME ERRORS, LOGIC BUGS, AND EDGE CASES
════════════════════════════════════════════════════════

1a. Run: npx tsc --noEmit
    For every compiler error: read the file, understand the root cause, fix it.
    Never use @ts-ignore unless there is genuinely no type-safe fix.

1b. Scan every .ts and .tsx file under src/ for these patterns:
    - Accessing a property on a value that could be null or undefined without
      a null check (e.g., data.field when data may be null)
    - Array methods (.map, .filter, .reduce, .find) called on values that could
      be null or undefined rather than an empty array
    - Arithmetic or string operations on values that could be null (e.g.,
      amount.toFixed(2) when amount is number | null)
    - Optional chaining (?.) missing where a crash is possible
    - Type assertions (as SomeType) that could fail at runtime

    Fix every instance found.

1c. Look for logic bugs:
    - Off-by-one errors in slice / pagination logic
    - Conditions that are always true or always false
    - State that is set but never used, or used before it is set
    - Event handlers that are registered but never cleaned up (useEffect with
      no cleanup return)
    - async functions inside useEffect that swallow rejections (call an async
      function without .catch() or try/catch)

════════════════════════════════════════════════════════════════════
TASK 2 — SERVER ACTIONS: UNHANDLED REJECTIONS AND ERROR BOUNDARIES
════════════════════════════════════════════════════════════════════

Read every .ts file under src/app/actions/.

2a. For every Supabase query (.execute(), .single(), .insert(), .update(),
    .upsert(), .delete()):
    - Confirm { data, error } is destructured from the result.
    - Confirm the error is checked before data is accessed.
    - Confirm that if .single() is used, a "no rows" result (PGRST116) is
      handled — .single() throws when zero rows match, which is an error, not
      a null data case.
    - Confirm the function returns a safe fallback (null, [], etc.) on error
      rather than letting the error propagate uncaught.

2b. For every async function exported from src/app/actions/:
    - Confirm it is wrapped in try/catch or that every await is preceded by
      error handling.
    - Confirm it never returns undefined implicitly (always returns the declared
      return type).

2c. Check whether Next.js error boundaries exist for the pages that consume
    these actions (src/app/officials/[id]/page.tsx and any other page).
    An error.tsx co-located with the page handles server-component errors.
    If no error.tsx exists alongside a page that calls server actions, note it
    in the report as requiring manual attention (do not add a placeholder that
    swallows errors silently).

════════════════════════════════════════════════════════════════════
TASK 3 — NULL CHECKS IN COMPONENTS
════════════════════════════════════════════════════════════════════

Read every .tsx file under src/app/ and src/components/.

3a. For every prop typed as T | null or T | undefined:
    - Confirm the component guards against null/undefined before rendering
      or passing the value to child components.
    - Confirm conditional rendering (value && <Component />) is used where
      appropriate, not just value! (non-null assertion).

3b. For every array prop (T[]):
    - Confirm .length, .map(), .slice(), etc. are only called after confirming
      the array is non-empty where that matters for correctness.

3c. For every place that calls .toFixed(), .toLocaleString(),
    Intl.NumberFormat().format(), or similar numeric formatters:
    - Confirm the value is checked for null/undefined/NaN first.

3d. For every place that renders record.source_url, record.bill_name,
    record.donor_name, or any other nullable DB field in a link (<a href>):
    - Confirm href is never set to undefined or null, which renders as a
      broken link.

════════════════════════════════════════════════════════════════════
TASK 4 — SUPABASE QUERIES: EMPTY RESULT HANDLING
════════════════════════════════════════════════════════════════════

Re-read src/app/actions/officials.ts.

4a. getOfficialById — uses .single(). Supabase returns an error (not null data)
    when zero rows match. Confirm the is_active filter can't cause a "no rows"
    error to surface as an unhandled exception.

4b. getVotingRecords, getCampaignFinance, getFederalOfficials,
    getOfficialsByCounty — all return arrays. Confirm that (data ?? []) is used
    before any array operation, and that an empty array is returned on error,
    never null or undefined.

4c. findOfficialIdsByNames — iterates data. Confirm data ?? [] is used.

4d. For any query that uses .eq("state_id", state.id) after a prior lookup:
    - Confirm the prior lookup's error is handled before state.id is accessed.
    - Confirm state itself is null-checked before state.id is dereferenced.

════════════════════════════════════════════════════════════════════
TASK 5 — API ROUTES: PROPER ERROR RESPONSES
════════════════════════════════════════════════════════════════════

Read every route.ts file under src/app/api/.

5a. For every route handler (GET, POST, etc.):
    - Confirm it returns a NextResponse with an appropriate HTTP status code
      on error (400 for bad input, 401 for auth failure, 500 for unexpected
      errors) — never a 200 response wrapping an error object.
    - Confirm it does not let unhandled exceptions crash the route (which
      returns a 500 with a raw stack trace in development and a blank 500 in
      production).
    - Confirm CRON_SECRET validation returns 401 immediately and does not
      continue executing the handler body.

5b. For routes that call external APIs (Open States, House Clerk, Senate.gov,
    Congress.gov):
    - Confirm non-200 responses from the external API are handled (the route
      does not crash or silently return wrong data).
    - Confirm the route returns a well-formed JSON error body, not HTML.

5c. Confirm maxDuration is set on any route that may run for more than a few
    seconds (cron routes, sync routes).

════════════════════════════════════════════════════════════════════
TASK 6 — MEMORY LEAKS AND PERFORMANCE IN REACT COMPONENTS
════════════════════════════════════════════════════════════════════

Read every "use client" component under src/components/ and src/app/.

6a. Event listeners: every addEventListener must have a paired
    removeEventListener in the useEffect cleanup using the same function
    reference. Inline arrow functions passed to addEventListener are leaks.

6b. D3 (check src/components/Map/):
    - On unmount, the useEffect cleanup must remove all child elements appended
      to the SVG (.selectAll("*").remove() or equivalent).
    - Any d3.select(window) or d3.select(document) listener must be removed
      in cleanup.
    - Pending D3 transitions should be interrupted on unmount.

6c. Timers: every setTimeout / setInterval handle must be stored and cleared
    in cleanup (clearTimeout / clearInterval).

6d. Observers: any ResizeObserver, IntersectionObserver, or MutationObserver
    must be disconnected in cleanup.

6e. Performance: look for expensive operations (large array sorts, deep object
    clones, regex compilation) inside render that could be memoized with
    useMemo. Flag but do not blindly add useMemo — only where the operation is
    genuinely expensive and the deps are stable.

6f. sessionStorage in AddressLookup or similar components: confirm stale cache
    entries are invalidated when they reference an official_id that no longer
    exists as is_active=true (this was previously a source of bugs). If the
    component stores a dbId in sessionStorage, confirm there is logic to handle
    the case where the stored ID resolves to a 404.

════════════════════════════════════════════════════════════════════
TASK 7 — END-TO-END DATA FLOW AUDIT
════════════════════════════════════════════════════════════════════

Trace the complete user journey through the code without running a browser.
Read each file involved and verify the data flows correctly at every handoff.

FLOW: Address input → Open States geocode → officials lookup → map render
      → county panel → official profile → voting records → campaign finance

7a. Address lookup (src/components/AddressLookup.tsx or similar):
    - The component sends an address to an API or server action.
    - Confirm the response shape matches what the component expects.
    - Confirm errors (bad address, API down, no results) show a user-visible
      message rather than a blank UI or console error.
    - Confirm the sessionStorage cache key is specific enough that two
      different addresses don't collide.

7b. Map → county panel handoff:
    - When a county is clicked on the map, confirm the correct county name is
      passed to the county panel.
    - Confirm the county panel fetches officials using that county name and
      handles the case where no officials are found.

7c. Official profile (src/app/officials/[id]/page.tsx):
    - Confirm the id from params is passed to getOfficialById, getVotingRecords,
      AND getCampaignFinance — all three must use the same id.
    - Confirm there is no path where official is truthy but the id used for
      voting records or campaign finance differs from official.id.

7d. Voting records (VotingRecordsList.tsx):
    - Confirm the expand/collapse animation does not cause layout shift or
      scroll-jump.
    - Confirm the "Show all X votes" count matches records.length (not a
      hardcoded value or a value from a different variable).

7e. Campaign finance (CampaignFinanceList.tsx):
    - Confirm totalRaised handles the case where every record has amount = null
      (result should be 0 or show "—", not NaN).
    - Confirm the currency formatter does not throw on 0 or very large numbers.
    - Confirm source_url links have href set to the normalized URL, not the
      raw DB value (which may lack https://).

════════════════════════════════════════════════════════════════════
FINAL REPORT
════════════════════════════════════════════════════════════════════

After completing all tasks, print this report:

## Debug Agent Report

### Task 1 — Runtime Errors, Logic Bugs, Edge Cases
- TypeScript errors fixed: <n>
- Null / undefined crashes fixed: <n> (list each: file:line — description)
- Logic bugs fixed: <n> (list each)
- Unhandled async rejections fixed: <n>

### Task 2 — Server Actions
- Actions audited: <n>
- Unhandled Supabase errors fixed: <n> (describe each)
- Missing error boundaries: <list files — requires manual attention>

### Task 3 — Null Checks in Components
- Components audited: <n>
- Null check issues fixed: <n> (list each)
- Broken link risks fixed: <n>

### Task 4 — Supabase Empty Result Handling
- Queries audited: <n>
- Issues fixed: <n> (describe each)

### Task 5 — API Routes
- Routes audited: <n>
- Incorrect status codes fixed: <n>
- Unhandled external API failures fixed: <n>
- Other issues fixed: <n>

### Task 6 — Memory Leaks and Performance
- Event listener leaks fixed: <n>
- D3 cleanup issues fixed: <n>
- Timer leaks fixed: <n>
- Observer leaks fixed: <n>
- Performance issues flagged (manual attention): <list>
- sessionStorage staleness issues fixed: <n>

### Task 7 — End-to-End Data Flow
- Handoffs audited: <n>
- Data flow bugs fixed: <n> (describe each)
- Issues requiring manual attention: <list>

### Clean (no issues found)
<List every task and sub-task where everything was already correct.>

### Manual Attention Required
<Numbered list of anything that could not be fixed automatically, with a clear
description of the problem and a suggested fix.>
PROMPT

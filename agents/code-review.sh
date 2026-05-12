#!/usr/bin/env bash
# Code-review agent for communeusa-web.
#
# Usage (run from the communeusa-web root or any directory):
#   bash agents/code-review.sh
#
# Requirements:
#   - claude CLI on PATH  (npm i -g @anthropic-ai/claude-code)
#   - Authenticated Claude session  (run "claude" once interactively if needed)
#
# What it does:
#   1. Scans all TypeScript files in src/ for compiler errors, unused imports,
#      and unused variables.
#   2. Checks src/app/actions/ Supabase queries for missing error handling.
#   3. Checks all components for missing loading and error states.
#   4. Reviews src/components/Map/USMap.tsx specifically for memory leaks:
#      event listeners or D3 selections not cleaned up on unmount.
#   5. Fixes every issue found automatically.
#   6. Prints a structured summary of everything found and fixed.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

cd "$REPO_DIR"
echo "Starting code-review agent in $REPO_DIR ..."
echo ""

claude --dangerously-skip-permissions -p <<'PROMPT'
You are a code-quality agent for the CommuneUSA web app (Next.js 16 / TypeScript / Tailwind v4).
Your working directory is the repo root. Work through each task below in order,
fix every issue you find, then print a structured summary.

=== TASK 1: TypeScript errors, unused imports, unused variables ===

1a. Run: npx tsc --noEmit
    Capture the output. For every error reported, read the relevant file,
    understand the root cause, and fix it. Do not suppress errors with
    @ts-ignore unless there is genuinely no correct fix.

1b. Grep for unused imports: scan every .ts and .tsx file under src/ for
    import statements where the imported name never appears in the file body.
    Remove the unused imports.

1c. Grep for variables declared with const or let that are assigned but never
    read. Remove or consolidate them where safe. Do not remove function
    parameters (they may be required by an interface).

=== TASK 2: Supabase query error handling in src/app/actions/ ===

Read every .ts file under src/app/actions/. For each Supabase .execute() or
chained query call:
- Confirm that both data and error are destructured from the result.
- Confirm that if error is truthy the function either returns a safe fallback,
  throws, or logs the error.
- Confirm that data is null-checked before being accessed.
Fix any call that skips error destructuring or ignores the error value entirely.

=== TASK 3: Loading and error states in components ===

Read every .tsx file under src/components/ and src/app/.
For each client component (marked "use client") that fetches data or calls a
server action:
- Confirm it has a loading state (spinner, skeleton, or disabled UI) shown
  while the async call is in flight.
- Confirm it has an error state shown to the user when the call fails.
If either is missing, add a minimal but correct implementation that matches the
existing Tailwind styling patterns in the file.

=== TASK 4: Memory leaks in src/components/Map/USMap.tsx ===

Read src/components/Map/USMap.tsx carefully. Check for all four categories:

a) Window and document event listeners added with addEventListener: each must
   have a corresponding removeEventListener call in the same useEffect cleanup
   function, using the exact same function reference. An inline arrow function
   passed to addEventListener cannot be removed and is a leak.

b) D3 selections and transitions: verify that on unmount the useEffect cleanup
   removes all child elements appended to the SVG container (or clears it with
   .selectAll("*").remove()), cancels pending D3 transitions, and removes any
   d3.select(window) or d3.select(document) listeners.

c) Timers: any setTimeout or setInterval call must store the handle and call
   clearTimeout or clearInterval in the cleanup function.

d) Resize observers or intersection observers: must be disconnected in cleanup.

Fix every leak found. If a cleanup return already exists, add the missing lines
to it. If there is no cleanup return, add one.

=== SUMMARY ===

After completing all tasks, print a report in this exact format:

## Code Review Summary

### Task 1 -- TypeScript / Unused Imports / Unused Variables
- Compiler errors fixed: <n>
- Unused imports removed: <n> (list each file and import name)
- Unused variables removed: <n> (list each)

### Task 2 -- Supabase Error Handling
- Queries audited: <n>
- Issues fixed: <n> (describe each fix)

### Task 3 -- Loading & Error States
- Components audited: <n>
- Missing loading states added: <n>
- Missing error states added: <n>

### Task 4 -- Memory Leaks (USMap.tsx)
- Listener leaks fixed: <n>
- D3 cleanup issues fixed: <n>
- Timer leaks fixed: <n>
- Observer leaks fixed: <n>

### Clean (no issues found)
List every category where everything was already correct.
PROMPT

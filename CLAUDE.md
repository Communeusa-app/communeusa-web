# CommuneUSA Web

Civic data platform for verified American citizens.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Runtime**: Node.js / npm

## Project structure

```
src/
  app/          # App Router routes, layouts, pages
    layout.tsx  # Root layout with fonts and global metadata
    globals.css # Global styles + Tailwind directives
    page.tsx    # Home page
public/         # Static assets
```

## Dev commands

```bash
npm run dev     # Start dev server on http://localhost:3000
npm run build   # Production build
npm run start   # Serve production build
```

## Conventions

- All routes live under `src/app/` following Next.js App Router file conventions.
- Use the `@/` import alias for `src/`.
- Prefer Server Components by default; add `"use client"` only when needed.
- Tailwind utility classes for all styling — no CSS modules or styled-components.

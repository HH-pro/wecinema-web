# wecinema-web

Next.js 16 frontend for [WeCinema](https://wecinema.co) — the migration target replacing the React + Vite app under `../wecinema-frontend`.

**Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · Turbopack · Framer Motion

---

## Quick start

```bash
cp .env.example .env.local   # then edit
npm install
npm run dev                  # → http://localhost:5173
```

The backend is expected at `BACKEND_URL`. Defaults point at production (`https://wecinema.co/api`); swap to `http://localhost:3000` to develop against a local backend.

## Scripts

| Script | What it does |
|---|---|
| `dev` | Dev server on port 5173 with Turbopack + HMR |
| `build` | Production build |
| `start` | Run the production build |
| `lint` / `lint:fix` | ESLint |
| `type-check` | `tsc --noEmit`, full project type check |
| `format` / `format:check` | Prettier (with Tailwind class sorter) |

## Folder structure

```
src/
├── app/                    Next.js App Router
│   ├── layout.tsx          Root layout: fonts, metadata, ThemeProvider
│   ├── page.tsx            Homepage (RSC, ISR every 5 min)
│   ├── loading.tsx         Route-level loading UI
│   ├── error.tsx           Route-level error boundary
│   ├── not-found.tsx       404 page
│   ├── robots.ts           Generated /robots.txt
│   ├── sitemap.ts          Generated /sitemap.xml
│   └── globals.css         Design tokens + Tailwind v4
├── components/
│   ├── layout/             Header, Sidebar, Layout shell, ThemeProvider
│   ├── video/              Gallery, VideoCard, ThemePills
│   └── seo/                JsonLd helper
├── config/
│   └── env.ts              Zod-validated env (server + client)
└── lib/
    ├── api.ts              fetch helper: timeout, ApiError, ISR + tags
    ├── videos.ts           Video API functions
    ├── types.ts            Shared TS types
    └── constants.ts        Categories, themes, ratings, layout dims
```

## Architecture

- **Server Components by default** — galleries fetch on the server, stream HTML inline. Add `"use client"` only at the leaf where state/effects are needed (Header, Sidebar).
- **Streaming with Suspense** — slow gallery sections don't block faster ones; each renders as it resolves.
- **ISR** — homepage revalidates every 5 minutes (`export const revalidate = 300`). Per-fetch cache tags (`videos:category:action`) allow on-demand invalidation later.
- **No client-side data fetching for the homepage** — keeps initial JS small and SEO-friendly.

## SEO

- `metadataBase` driven by `NEXT_PUBLIC_SITE_URL` so all OG images resolve absolute.
- Canonical URLs per page via `alternates.canonical`.
- Open Graph + Twitter cards on the root layout.
- JSON-LD (`WebSite` + `Organization`) inlined on the homepage.
- `app/sitemap.ts` enumerates static + categorical routes.
- `app/robots.ts` blocks `/api/`, `/admin/`, `/_next/`.

## Performance

- Fonts via `next/font` — `display: swap`, preloaded, scoped subsets.
- AVIF + WebP via `next/image` (`formats: ["image/avif", "image/webp"]`).
- LCP image (`/wecinema.webp` logo) marked `priority`.
- Static asset cache header: `public, max-age=31536000, immutable`.
- `compress: true`, `productionBrowserSourceMaps: false`, `poweredByHeader: false`.

## Security

- `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, scoped `Permissions-Policy`.
- HSTS in production only (max-age 2 years, includeSubDomains, preload).
- Env validation throws at startup if required vars are missing.
- No tokens in `localStorage` (will live in memory + httpOnly refresh cookie when auth lands).

CSP is intentionally not set yet — it needs per-route nonces and middleware to coexist with `next/font`, `next/script`, and HMR. Add when the auth surface stabilises.

## Backend integration

The browser calls `/api/*` → Next.js rewrites to `${BACKEND_URL}/*`. Server Components call backend directly (skip the rewrite hop) via `apiFetch`.

```ts
import { apiFetch } from "@/lib/api";
const data = await apiFetch<MyResponse>("/some/endpoint", { revalidate: 60 });
```

## Tooling

- **ESLint** — `eslint-config-next/core-web-vitals` + `typescript`
- **Prettier** — Tailwind class sorter via `prettier-plugin-tailwindcss`
- **TypeScript** — `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`
- **VS Code** — recommended extensions and format-on-save in `.vscode/`

## What's not done yet

- CSP middleware
- Tests (Vitest + Playwright)

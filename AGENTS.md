<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project

`wecinema-web` is the Next.js 16 (App Router, React 19) frontend for WeCinema, replacing the older `wecinema-frontend` React SPA. It talks to the `wecinema-backend` Express API (see the monorepo root `CLAUDE.md` for backend routes/models). Dev server runs on port 5173 (not the Next.js default 3000) to match the old SPA's port.

### Commands

```bash
npm run dev          # next dev -p 5173 (Turbopack)
npm run build         # next build
npm start             # next start -p 5173
npm run lint          # eslint
npm run lint:fix       # eslint --fix
npm run type-check     # tsc --noEmit
npm run format         # prettier --write .
```

### How requests reach the backend

`next.config.ts` rewrites `/api/:path*` → `${BACKEND_URL}/:path*` (env var, defaults to `http://localhost:3000`). Client code calls `/api/...`; never call `BACKEND_URL` directly from client components.

- `src/lib/fetch/serverFetch.ts` (`apiFetch`) — server-side fetch helper for RSC/route handlers. Talks to `BACKEND_URL` directly (skips the rewrite, since Node `fetch` can't resolve relative URLs). Has AbortController timeout (default 8s), typed `ApiError`, and Next ISR via `revalidate`/`tags`.
- `src/config/env.ts` — Zod-validated env, split into `serverEnv` (server-only, e.g. `BACKEND_URL`, `INTERNAL_API_KEY`) and `clientEnv` (`NEXT_PUBLIC_*` only). Throws on startup if misconfigured. Never import `serverEnv` from a `"use client"` file.
- `INTERNAL_API_KEY` is sent as `x-internal-key` so SSR fetches bypass the backend's IP-keyed rate limiter — must match the backend's own `INTERNAL_API_KEY`.

### Structure

```
src/
  app/            App Router routes — keep route files thin (layout/page/loading/error), push logic into features/
  features/       Feature modules: auth, marketplace, admin, blog, videos, profile, scripts, watch, upload, analytics, home, search
    <feature>/components, /api, /services, /types, /lib
  components/     Shared/cross-feature UI: ui, layout, auth, chat, seo, analytics, videoeditor
  lib/             api, fetch, security, validation, toast, firebase, utils
  config/env.ts    Zod env validation (see above)
  hooks/, types/
```

Route groups: `(auth)` (login/signup), `(browse)` (explore/search/category/themes/ratings/upload/hypemode). `admin/(panel)` holds all auth-gated admin pages behind `AdminGuard`; `admin/login` is public.

### Auth

`src/features/auth/context` provides `AuthContext`. Access token lives in memory only; refresh token is an httpOnly cookie sent via `withCredentials`. Admin routes additionally check `isAdmin: true` via `AdminGuard` (`src/features/admin/components/AdminGuard.tsx`).

### Security & validation

- `src/lib/security/sanitize.ts` — DOMPurify-based sanitization for user-generated HTML/text.
- `src/lib/validation/schemas.ts` — Zod schemas for form/input validation.
- `next.config.ts` sets security headers (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS in prod) on every response. No CSP yet — intentionally deferred (dev needs `unsafe-inline`/`unsafe-eval` for Turbopack HMR); add per-route with nonces via the proxy when ready. Don't add a blanket CSP here without checking that note.
- `images.remotePatterns` in `next.config.ts` is the allowlist for `next/image` remote sources (S3, Cloudinary, Gravatar, Google avatars, wecinema.co). Add new hosts there, don't bypass `next/image`.

### Admin panel

Full admin panel at `src/app/admin/`, ported from `wecinema-frontend` with Next.js App Router patterns (dashboard, users, videos, scripts, transactions, settings, blog link-out, domain tracking, marketplace approvals). Dark purple/blue theme via dedicated `--ap-*` CSS variables in `globals.css`, independent of the main site theme. Service layer: `src/features/admin/api/adminService.ts`; types in `src/features/admin/types/admin.types.ts`.

## Skills & agents

- **seo-audit** skill (`.agents/skills/seo-audit/`) — use for any SEO audit/diagnosis request on this site (rankings drop, meta tag review, Core Web Vitals, indexing issues). Check `.agents/product-marketing.md` first if present for site context before asking the user questions.
- **Explore agent** — prefer for "where is X defined" / cross-feature searches in `src/features/*` and `src/app/*` instead of manual grepping across many directories.
- **verify / run skills** — after changing a page or feature, use the `run` skill to start the dev server (port 5173) and the `verify` skill to confirm behavior in-browser rather than relying on `type-check`/`lint` alone — those check correctness of types, not of the feature.
- **code-review / security-review skills** — run before opening a PR for anything touching auth, the admin panel, payments (Stripe/PayPal), or `next.config.ts` headers.

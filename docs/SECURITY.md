# Security

This document describes what is implemented, what was tested, and what is not present. Nothing
here should be read as a security certification.

---

## Secrets

- Only the Supabase **anon** key is exposed to the browser (`NEXT_PUBLIC_SUPABASE_ANON_KEY`). It is
  designed to be public and is constrained by RLS.
- `SUPABASE_SERVICE_ROLE_KEY`, `NASA_FIRMS_MAP_KEY`, `OPENAI_API_KEY`, and `CDSAPI_KEY` are read
  server-side only. None is referenced from a client component or from a `NEXT_PUBLIC_*` variable.
- `.env.example` contains placeholders only. `.env.local` is gitignored and was not created with
  real credentials.
- API responses never include env values. The FIRMS catch block logs only the error name and
  returns generic text, so the request URL (which contains the map key) cannot leak.

## Authentication and route protection

- Supabase Auth via `@supabase/ssr` in `src/lib/supabase/`.
- `src/middleware.ts` refreshes the session and, **when real credentials are configured**, redirects
  unauthenticated `/dashboard/*` requests to `/login?next=...` and signed-in users away from
  `/login`, `/signup`, `/register`, `/forgot-password`.
- Placeholder credentials (`your-project.supabase.co`, `your-…` keys, `demo-anon-key`) are treated
  as demo mode: the dashboard stays accessible and auth forms show a demo banner.
- There is no role-based UI gating beyond the stored `profiles.role`. The app does not enforce
  admin-only actions because it has no persisted write actions.

## API guards

Every route in `src/app/api/` calls `guardPublicRead`, which:

1. Rejects a request whose `Origin` host differs from the `Host` header (403).
2. Applies a per-IP token bucket in a 60-second window (429 when exceeded).

Mutating routes (`imports/incidents`, `assets`, `funding/evaluate`, `reports/export`,
`auth/logout`) also call `requireUserIfConfigured`. In demo mode this is a no-op; with real
credentials it returns 401 without a valid user.

The rate limiter is process-local memory. It is adequate for a single demo instance and is not a
distributed limiter.

## Input validation

- Zod schemas in `src/lib/validation/schemas.ts` validate city slugs, date ranges, imports, asset
  updates, and funding requests.
- `weather/history` rejects ranges outside 0–31 days and unknown cities.
- `risk` and `weather` reject unknown cities with 400.
- Benchmark downloads accept only the two allowlisted filenames (`C01_REPORT.md`,
  `C07_REPORT.md`), which prevents path traversal.
- Imported incidents are stored with `governmentAlert: false` and
  `verificationStatus: "user_imported"`; they are never labeled official.

## Error handling

- Upstream failures produce a status plus a human-readable note. No stack trace is returned.
- `benchmarks/results` catches malformed JSON and returns 404 rather than throwing.
- `benchmark` POST returns 501 and explains that synthetic timings are not served.

## Output encoding

React escapes all rendered strings by default. The app does not use `dangerouslySetInnerHTML`.
CSV export quotes the source field; numeric fields are inserted from typed values. PDF export is a
plain-text PDF built server-side.

## Implemented headers

`next.config.mjs` sets `X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and a restrictive
`Permissions-Policy` on every path.

## Not implemented

- No CSRF token beyond the same-origin `Origin` check.
- No Content-Security-Policy is set (an incorrect CSP would break MapLibre and Next.js inline
  hydration).
- No audit logging to durable storage.
- No rate-limit persistence across restarts or instances.
- No secret scanning or dependency audit was run as part of this build.

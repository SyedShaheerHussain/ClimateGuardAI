# Setup Guide

## Requirements

- Node.js 18.18+ (tested with Node 24)
- npm
- Optional: Python 3.9+ with scikit-learn for the C07 benchmark
- Optional: a Supabase project for authentication

## 1. Install and run

```bash
cd climateGuardAI
npm install
cp .env.example .env.local    # optional; demo mode works without it
npm run dev                   # http://localhost:3000
```

Demo mode: no Supabase credentials. The dashboard opens without login, auth forms show a demo
banner, and live weather comes from Open-Meteo.

## 2. Environment variables

| Variable | Required | Behavior when absent |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | no | demo mode |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | demo mode |
| `SUPABASE_SERVICE_ROLE_KEY` | no | unused by the app |
| `NEXT_PUBLIC_MAPLIBRE_STYLE` | no | public CARTO dark-matter style |
| `NEXT_PUBLIC_APP_URL` | no | `http://localhost:3000` |
| `NASA_FIRMS_MAP_KEY` | no | FIRMS returns "Needs API Key" |
| `OPENAI_API_KEY` | no | deterministic briefings |
| `CDSAPI_URL`, `CDSAPI_KEY` | no | offline CDS script cannot run |

Never place a server key in a `NEXT_PUBLIC_*` variable. `.env.local` is gitignored.

## 3. Supabase authentication (optional)

The app uses Supabase for **authentication only**. No runtime query reads or writes the database
tables yet; incidents, assets, and finance state stay in server memory. The migrations prepare a
schema you can build on.

1. **Create a project** at `https://supabase.com/dashboard` → *New project*. Choose the region
   closest to your users (for Pakistan, Singapore or Mumbai). Store the database password in a
   password manager — never in the repository.
2. **Copy credentials** from *Project Settings → API*:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Leave `SUPABASE_SERVICE_ROLE_KEY` empty. The runtime does not use it, and it must never be
     exposed to the browser or committed.
3. **Apply migrations** in the *SQL Editor*, in order:
   - First run `create extension if not exists postgis;`
   - Then `supabase/migrations/001_initial_schema.sql`
   - Then `supabase/migrations/002_c07_evaluations.sql`
   - Then `supabase/migrations/003_assets_profiles.sql`

   Review each file before running. They create tables, enable RLS, and seed five city centroids.
4. **Configure auth URLs** in *Authentication → URL Configuration*:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
   - Add your production domain and `/auth/callback` before deploying.
5. **Enable the Email provider** in *Authentication → Providers*. Keeping "Confirm email" on means
   the signup confirmation link returns through `/auth/callback`; turning it off lets users log in
   immediately after signup.
6. **Restart `npm run dev`.** Middleware now redirects unauthenticated `/dashboard/*` requests to
   `/login?next=...`. Signup, login, logout, and password reset (`/forgot-password` →
   `/auth/callback`) use real sessions.

RLS expectations: public read is granted only on the seed/reference tables; `profiles` is limited to
the owning user; `assets` is limited to the owner; `audit_logs` has no policy and is inaccessible to
anon/authenticated clients. There is no admin approval workflow — any visitor can create an account
while signup is enabled.

Applying migrations changes a database you own. Review them before running. Do not point them at a
production project you do not control.

## 4. Verification commands

```bash
node node_modules/typescript/bin/tsc --noEmit   # typecheck
npm test                                        # engine tests
npm run build                                   # production build
npm start                                       # serve the build
```

## 5. Benchmarks

```bash
npm run benchmark:c01          # writes reports/c01_results.json and reports/C01_REPORT.md
python scripts/benchmark/run-c07-benchmark.py   # requires pip install -r ml/requirements.txt
```

C01 measures this machine. C07 trains and evaluates on a Rajasthan ERA5 extract; it is not a
Pakistan validation. Both reports state their scope.

## 6. Deployment notes

- Vercel: import the repository, set env vars, deploy. The C01/C07 scripts do not run in serverless
  functions; run them locally or in CI and commit the generated JSON if you want the dashboard to
  display results.
- No deployment was performed as part of this build. No GitHub remote was created or pushed.

## 7. Resetting in-memory state

Portfolio assets, imported incidents, and notifications reset on process restart. There is no
persistence write path yet.

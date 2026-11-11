# ClimateGuard AI — Architecture

**Status:** demo/hackathon build, honest by construction.
**Scope:** five Pakistan cities (Karachi, Hyderabad, Sukkur, Lahore, Islamabad), three hazards
(flood, heatwave, drought), public model data only, no official government feed.

---

## 1. Runtime shape

```
Browser
  ├─ Marketing pages (server-rendered, live snapshot on /)
  ├─ Auth pages (Supabase Server Actions, demo fallback)
  └─ /dashboard/* (server components + client islands)
        │  fetch()
        ▼
Next.js 14 Route Handlers (/api/*)
  ├─ guards: origin check + in-memory rate limit (+ Supabase user when configured)
  ├─ services:
  │    src/lib/weather/service.ts     Open-Meteo forecast, GloFAS flood, archive history
  │    src/lib/risk/engine.ts         transparent weighted indices
  │    src/lib/risk/city-risks.ts     joins weather → risk → incidents → notifications
  │    src/lib/finance/model.ts       PKR expected-loss and BCR/ROI
  │    src/lib/funding/simulation.ts  simulation-only rule evaluation
  │    src/lib/incidents/store.ts     globalThis in-memory store
  │    src/lib/notifications/store.ts globalThis in-memory store
  │    src/lib/ai/briefing.ts         deterministic text; optional OpenAI narrative
  └─ persistence: none required. Optional Supabase tables exist in supabase/migrations.
```

There is no database write path in the running app. Portfolio assets, imported incidents, and
notifications live in server memory and reset when the process restarts. Supabase is used only
for authentication when real credentials are present.

## 2. Source of truth

| Concern | Single source |
|---|---|
| Cities, coordinates, aliases | `src/lib/cities/pakistan.ts` |
| Risk factors, weights, bands | `src/lib/risk/engine.ts` |
| Aggregated live city risk | `src/lib/risk/city-risks.ts` (`buildCityRisks`) |
| Finance formulas | `src/lib/finance/model.ts` |
| Illustrative portfolio | `src/lib/finance/portfolio.ts` |
| Funding simulation rules | `src/lib/funding/simulation.ts` |
| Integration catalog | `src/lib/integrations/registry.ts` |
| API validation schemas | `src/lib/validation/schemas.ts` |

No page holds its own city list or hazard score. `src/config/site.ts` is a deprecated module whose
datasets are empty; legacy components that consumed it were moved to `legacy-unused/`.

## 3. Rendering model

- Marketing and most dashboard pages are async server components with
  `export const dynamic = "force-dynamic"` where live data is used.
- Client islands: navbar refresh, charts (`daily-history-chart.tsx`), map (`PakistanMap` via
  MapLibre GL JS), benchmark console, portfolio editor, funding simulator.
- Charts read only returned data. Empty responses render an explicit empty state instead of
  synthetic series.

## 4. API routes

All 22 route files call `guardPublicRead` (origin rejection when an `Origin` header is present,
plus a per-IP in-memory token bucket). Mutating routes additionally call
`requireUserIfConfigured`, which is a no-op in demo mode and enforces a Supabase session when
credentials are configured. Inputs are parsed with Zod; unknown cities return 400.

Routes: `risk`, `risk/cities`, `weather`, `weather/[city]`, `weather/cities`, `weather/forecast`,
`weather/history`, `incidents`, `assets`, `finance/impact`, `funding/evaluate`,
`integrations/status`, `notifications`, `imports/incidents`, `reports/export`, `benchmark`,
`benchmarks/results`, `benchmarks/download`, `satellite/firms`, `climate/power`, `ai/briefing`,
`auth/logout`.

## 5. Security posture

See `docs/SECURITY.md`. Summary: no secret is returned to the client, the NASA FIRMS key is never
echoed in errors, there is no `NEXT_PUBLIC_*` key other than the Supabase anon key, and the
benchmark download route uses a filename allowlist.

## 6. Explicit non-goals

- No machine-learning inference in the live risk path. The risk engine is a documented heuristic.
- No trained model is served by the app. C07 is an offline scikit-learn evaluation on a Rajasthan
  dataset and does not validate Pakistan.
- No parametric payout execution, oracle quorum, blockchain settlement, or multi-sig workflow.
- No polling of PMD/NDMA/PDMA. Operator imports are marked `user_imported` with
  `governmentAlert: false`.

## 7. Legacy files

`legacy-unused/components/` holds three earlier components that rendered global basins,
oracle-quorum copy, and Merkle proof UI. They are not imported by any route. They are kept on disk
for reference only and are excluded from the TypeScript build path because no file imports them.
Root `PROJECT_AUDIT.md` is a design audit of the imported Stitch screens, not an implementation
status report.

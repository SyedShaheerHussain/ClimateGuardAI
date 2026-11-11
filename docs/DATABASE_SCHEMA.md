# Database Schema

Migrations live in `supabase/migrations/`. They are optional: the running app does not read or
write these tables. Auth works with Supabase when credentials are configured; portfolio, imports,
and notifications are in-memory until a persistence layer is wired.

Apply in order in the Supabase SQL editor:

1. `001_initial_schema.sql` — PostGIS, monitored city centroids, telemetry, simulation rules,
   simulation audit, C01 runs, RLS.
2. `002_c07_evaluations.sql` — C07 metadata plus C01 extended columns.
3. `003_assets_profiles.sql` — profiles, illustrative assets, audit log.

---

## 001 — Core tables

### `catchment_basins`
Monitored **city centroids** (not administrative boundaries).

| Column | Notes |
|---|---|
| `slug` | Unique; matches `src/lib/cities/pakistan.ts` |
| `region` | Province |
| `centroid` | `GEOMETRY(Point, 4326)` |
| `area_sq_km`, `population_exposed` | **NULL by design** until a verified source is loaded |
| `alert_level` | Defaults to `unassessed`; never seeded as `critical` |

Seed rows: Karachi, Hyderabad, Sukkur, Lahore, Islamabad. Coordinates match the TypeScript config.

### `telemetry_records`
Model-grid values, not station observations. Numeric fields are nullable so missing inputs remain
missing. `confidence_score` defaults to NULL; it is not prefilled with 95. `source_oracle` defaults
to `open-meteo + glofas (model grid)`.

### `parametric_rules`
`payout_amount_pkr` (PKR, not USD). `disbursement_method` defaults to `simulation_only`. The table
comment states that no funds are transferred.

### `disbursement_audits`
Simulation log only. `status` is restricted to `simulated`, `pending_review`,
`approved_simulation`, `rejected`. `simulation_ref` is a local identifier; there is no transaction
hash or blockchain settlement.

### `benchmark_runs`
Values describe the machine that ran the C01 script. They are not a hardware certification.

## 002 — C07 evaluations

`c07_evaluations.verification_status` defaults to `NOT VALIDATED` and permits only
`NOT VALIDATED | PASS | FAIL`. A PASS describes the named Rajasthan dataset, never Pakistan. The
earlier public INSERT policy was removed; writes are service-role only.

Also adds total/per-sample/p50/p95/p99 latency, pass flags, signature fields, runtime/device JSON,
and `run_id` to `benchmark_runs`.

## 003 — Profiles and assets

- `profiles`: one row per `auth.users` id, role in `admin | analyst | operator | viewer`.
- `assets`: `value_pkr`, `exposure`, `vulnerability`, `assumptions`, `provenance`.
- `audit_logs`: actor, action, entity, JSON payload.

## Row-Level Security

- Public **SELECT** on the climate tables (transparency).
- No public INSERT/UPDATE/DELETE policies. Service-role ingestion bypasses RLS.
- `profiles` SELECT limited to the owning user.
- `assets` ALL limited to `auth.uid() = owner_id`.
- `audit_logs` has RLS enabled and no policies, so it is inaccessible to anon/authenticated
  clients until an explicit policy is added.

## Not implemented

No migration is applied automatically, no seed script loads live values, and no table is used by
the risk or finance pages at runtime.

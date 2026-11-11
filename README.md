# ClimateGuard AI

Pakistan-focused climate risk **screening** and disaster-finance **simulation** demo.

Five cities — Karachi, Hyderabad, Sukkur, Lahore, Islamabad — are scored for flood, heatwave, and
drought from public model data (Open-Meteo forecast, GloFAS discharge, archive history). The risk
engine is a transparent weighted heuristic, not an ML model. Financial figures are illustrative and
no money is transferred.

**Pakistan-specific ML validation: NOT VALIDATED.**
**ILLUSTRATIVE DEMO DATA — NOT VERIFIED ASSET VALUATIONS.**
**SIMULATION — NO FUNDS ARE TRANSFERRED.**

---

## Quick start

```bash
npm install
cp .env.example .env.local   # optional; demo mode works without it
npm run dev                  # http://localhost:3000
```

Without Supabase credentials the dashboard is open in demo mode; auth forms show a demo banner.
With credentials, middleware protects `/dashboard/*`.

## What is actually wired

| Area | Behavior |
|---|---|
| Weather | Live Open-Meteo current/hourly/daily for 5 cities, 5-minute in-process cache |
| River discharge | Live Open-Meteo Flood (GloFAS), anomaly vs prior 30-day mean |
| History | Open-Meteo Archive, last 30 days, up to 31-day API ranges |
| Risk | Deterministic weighted indices with factor inputs, missing inputs, confidence |
| Finance | PKR expected loss, avoided loss, ROI/BCR, three scenarios, sensitivity |
| Funding | Simulation-only rule evaluation (`moneyTransferred: false`) |
| Incidents | In-memory; heuristic signals marked `unverified_model_signal`, imports `user_imported` |
| Map | MapLibre GL, city markers from `/api/risk/cities` |
| Reports | JSON, CSV, and a plain-text PDF export |
| Auth | Supabase Server Actions when configured; demo fallback otherwise |
| Benchmarks | C01 runtime/RSS on this host; C07 Rajasthan heatwave-day evaluation |

## What is not implemented

No ML model is served. No official PMD/NDMA feed is polled. No government alert is created. No
oracle quorum, blockchain settlement, payout rail, or disbursement workflow exists. No Sentinel SAR,
SMAP, FEWS NET, or GPM ingestion. No persistence write path — portfolio, imports, and notifications
are in-memory. See `docs/DATA_LIMITATIONS.md`.

## Routes

Public: `/`, `/about`, `/platform`, `/features`, `/climate-intelligence`, `/data-sources`,
`/methodology`, `/contact`, `/how-it-works`, `/login`, `/signup`, `/register` (redirect),
`/forgot-password`, `/privacy`, `/terms`.

Dashboard: `/dashboard`, `risk-intelligence`, `map`, `flood`, `heatwave`, `drought`, `weather`,
`satellite`, `incidents`, `analytics`, `benchmark`, `triggers`, `finance`, `financial-impact`,
`portfolio`, `reports`, `data-sources`, `notifications`, `settings`, `profile`, `monitoring`.

API: 22 route handlers under `src/app/api/`. All use the origin/rate-limit guard.

## Verification

```bash
node node_modules/typescript/bin/tsc --noEmit
npm test
npm run build
npm start
```

Last verified in this session: typecheck exit 0, 5/5 tests pass, production build succeeds, all
public and dashboard pages return 200 (except `/register` → 307), and the API smoke test passed.

## Benchmarks

ClimateGuard AI includes three officially documented benchmark suites:

1. **C01 — Low-Compute Edge Inference Hardware Profiling**
   - **Command:** `npm run benchmark:c01`
   - **Mandatory Criteria:** Batch size 100, Latency < 200 ms, Memory < 256 MB.
   - **Latest Measurement:** 3.05 ms total batch latency, 60.98 MB peak RSS, Ed25519 cryptographic attestation verified (**PASS**).
   - **Report:** `reports/C01_REPORT.md` | `reports/c01_results.json`

2. **C07 — Heuristic Baseline Showdown (Model Justification)**
   - **Command:** `npm run benchmark:c07` (or `python scripts/benchmark/run-c07-benchmark.py`)
   - **Requirement:** Relative performance delta ≥ +15% over standard linear/heuristic baselines.
   - **Dataset:** ERA5 ECMWF reanalysis (2,191 days, 2018–2023) across Rajasthan Urban Corridor (`RAJASTHAN-C`).
   - **Latest Results:** Primary Gradient Boosting F1 **0.7123** vs Logistic Baseline **0.6000** (**+18.72%** relative gain) vs 3-day Heuristic Baseline **0.5614** (**+26.88%** relative gain). 24h lead-time, zero data leakage (**PASS**).
   - **Report:** `reports/C07_REPORT.md` | `reports/c07_results.json` | `reports/c07_predictions.csv`

3. **C15 — Net Financial Impact Boardroom Calculation (Value Quantification)**
   - **Command:** `npm run benchmark:c15`
   - **Directive:** Quantify monetary value (in PKR) generated or protected across target portfolio.
   - **Portfolio:** PKR 16.55 Billion critical infrastructure across Karachi, Lahore, Faisalabad, Sukkur, and Gwadar.
   - **Latest Indicators:**
     - Annual Loss Protected: **PKR 14.52 Crore**
     - Avoided False Alarm Cost: **PKR 7.50 Crore**
     - Cloud OpEx Saved: **PKR 0.29 Crore**
     - Total Annual Gross Benefit: **PKR 22.31 Crore**
     - Net Financial Impact: **+PKR 18.81 Crore** (Net of PKR 3.50 Crore deployment cost)
     - Boardroom ROI: **+537.4%** | BCR: **6.37x** | Payback: **2.3 months** (**PASS**)
   - **Report:** `reports/C15_REPORT.md` | `reports/C15_FINANCIAL_IMPACT_REPORT.md` | `reports/c15_results.json`

## Documentation

- `IMPLEMENTATION_STATUS.md` — Complete verification status and audit proofs
- `docs/ARCHITECTURE.md`
- `docs/API_INTEGRATIONS.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/CLIMATE_RISK_METHODOLOGY.md`
- `docs/FINANCIAL_MODEL.md`
- `docs/SECURITY.md`
- `docs/SETUP_GUIDE.md`
- `docs/DATA_LIMITATIONS.md`
- `reports/C01_REPORT.md`, `reports/C07_REPORT.md`, `reports/C15_REPORT.md`, `reports/C15_FINANCIAL_IMPACT_REPORT.md`
- `PROJECT_IMPLEMENTATION_STATUS.md`

## Environment

See `.env.example`. Only the Supabase URL and anon key are needed for auth. Server-only keys:
`SUPABASE_SERVICE_ROLE_KEY`, `NASA_FIRMS_MAP_KEY`, `OPENAI_API_KEY`, `CDSAPI_KEY`. Never expose a
server key through `NEXT_PUBLIC_*`.

## License

MIT for this demo.

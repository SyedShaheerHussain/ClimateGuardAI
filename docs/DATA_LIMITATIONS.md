# Data Limitations

Read this before presenting any number from the app.

## Validation status

**Pakistan-specific ML validation: NOT VALIDATED.**

No labelled Pakistani flood, heatwave, or drought event dataset was used to fit or test the live
risk engine. The engine is a fixed weighted formula. The C07 experiment uses a Rajasthan dataset and
must not be extrapolated to Pakistan.

## Weather and hydrology

- Open-Meteo values are **model grid output**, not station observations. Grid cells can differ
  materially from conditions in a specific neighbourhood.
- GloFAS discharge is a global hydrological model. It is not a gauge reading and not a PMD flood
  warning.
- Soil moisture (0–100 cm) is displayed for context and is **not** used by the drought score.
- Archive data can lag the current day; the analytics page requests complete past days only.
- The app does not interpolate, invent, or backfill missing values. Missing inputs lower the
  confidence value.

## Official warnings

- No PMD, NDMA, or PDMA feed is polled. The app creates **no government alerts**.
- Imported records through `POST /api/imports/incidents` are marked `user_imported` with
  `governmentAlert: false`. They are operator-supplied data, not official warnings.
- Heuristic model signals are stored as `unverified_model_signal`. The incidents page distinguishes
  them from imports.

## Financial figures

- All asset values, probabilities, damage ratios, and funding amounts are illustrative demo data.
- The label `ILLUSTRATIVE DEMO DATA — NOT VERIFIED ASSET VALUATIONS` applies to every figure.
- Funding rules are a simulation. `moneyTransferred` is always `false`. No bank, wallet, oracle, or
  smart-contract settlement exists.
- No claim of government savings, payouts, or avoided losses is verified.

## Benchmarks

- **C01** measures execution time and RSS on the machine that ran the script. It uses 100
  deterministic synthetic feature vectors generated in-script. It measures runtime behavior, not
  predictive skill. Ed25519 attestation signs the local result; it is not a third-party hardware
  certification.
- **C07** trains on a Rajasthan ERA5 extract and tests on 2023. The PASS result describes that
  dataset only. It does not establish performance in Pakistan.

## Coverage

- Five cities only: Karachi, Hyderabad, Sukkur, Lahore, Islamabad. Coordinates are city-centre
  points, not administrative boundaries.
- No district-level exposure, population, or infrastructure layer is loaded.
- No Sentinel SAR flood mask, SMAP root-zone soil moisture, FEWS NET classification, or GPM IMERG
  ingestion exists.

## Persistence

- Portfolio, incidents, and notifications are in server memory and reset on restart.
- Supabase tables exist as optional migrations but are not used by runtime pages.

## Demo mode

- Without Supabase credentials, the dashboard is open and auth is simulated (no account is
  created).
- With credentials, login, signup, reset, and `/dashboard` protection are enforced by Supabase and
  middleware.

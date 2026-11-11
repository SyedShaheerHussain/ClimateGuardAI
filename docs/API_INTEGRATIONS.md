# API Integrations

Everything below reflects the code in `src/lib/` as of this build. A provider is only listed as
wired if there is a server-side call path. No key is printed here.

---

## 1. Open-Meteo Forecast API

- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Auth:** none.
- **Fields requested:** current temperature, apparent temperature, humidity, precipitation, wind,
  weather code; hourly precipitation/temperature/humidity/soil moisture (0–100 cm); daily max/min
  temperature and precipitation.
- **Derived values:** next-24h precipitation, prior-3-day precipitation, prior-7-day precipitation,
  consecutive days ≥ 40 °C, soil-moisture timestamp.
- **Caching:** in-process TTL (5 minutes for current bundles, longer for history).
- **Failure behavior:** missing values stay `null`; the UI shows "unavailable" rather than a
  substituted number.
- **Limitation:** this is a model grid, not a weather station. It is not an official PMD forecast.

## 2. Open-Meteo Flood API (GloFAS)

- **Endpoint:** `https://flood-api.open-meteo.com/v1/flood`
- **Auth:** none.
- **Fields:** daily `river_discharge`, `past_days=30`, `forecast_days=7`.
- **Derived value:** discharge anomaly versus the mean of the prior days that returned a positive
  value (requires at least 5 values; otherwise the factor is omitted and confidence falls).
- **Limitation:** GloFAS is a global hydrological model. It is not a gauge reading and not a PMD
  flood warning.

## 3. Open-Meteo Archive API

- **Endpoint:** `https://archive-api.open-meteo.com/v1/archive`
- **Used by:** `/dashboard/analytics`, `/api/weather/history`.
- **Window:** the page requests the last 30 complete days; the API accepts ranges up to 31 days.
- **Limitation:** reanalysis/archive data may lag the current day. Empty ranges return an empty
  chart with an explicit message.

## 4. NASA POWER

- **Endpoint:** `src/lib/climate/nasa-power.ts` (server-side fetch).
- **Auth:** none for the public endpoint.
- **Used by:** `/api/climate/power`, exposed on the data-sources registry as historical daily
  climate.
- **Limitation:** daily resolution, not a nowcast. Values are model/reanalysis products.

## 5. NASA FIRMS

- **Endpoint:** `src/lib/satellite/firms.ts`.
- **Auth:** server-side `NASA_FIRMS_MAP_KEY` (never `NEXT_PUBLIC_*`).
- **Window:** last 24 hours over the Pakistan bounding box, limited to 100 pixels.
- **Interpretation:** a detection is a thermal anomaly pixel, not a confirmed fire incident. Empty
  results mean no pixels in the window, not that fires cannot exist.
- **Failure behavior:** generic error text; the request URL (which contains the key) is never
  returned or logged.

## 6. Copernicus CDS / ERA5

- **Not called by the web app.**
- `scripts/ingest/copernicus_cds.py` documents an offline download path with `cdsapi`.
- The registry reports "A key alone does not download ERA5." There is no background sync and no
  claim that CDS is connected.

## 7. MapLibre GL + CARTO/OSM tiles

- **Used by:** `/dashboard/map` through `PakistanMap`.
- **Style:** `NEXT_PUBLIC_MAPLIBRE_STYLE`, defaulting to the public CARTO dark-matter style.
- **Data:** city coordinates from `src/lib/cities/pakistan.ts`; markers read `/api/risk/cities`.
- **Limitation:** basemap availability depends on the tile host. The map does not draw flood
  extents, SAR masks, or administrative risk polygons.

## 8. OpenAI (optional)

- **Used by:** `/api/ai/briefing`.
- **Auth:** server-side `OPENAI_API_KEY`, optional.
- **Fallback:** when the key is absent, the route returns a deterministic briefing built from the
  same risk and finance values. It is labeled `"mode":"deterministic"`.
- **Limitation:** narrative text only. It cannot create official alerts or change risk scores.

## 9. PMD / NDMA / PDMA

- **No official feed is polled.** No stable public JSON API is wired.
- Operators import records from `/dashboard/incidents` → **Import PMD/NDMA** (paste JSON or load a
  `.json` file), or POST directly to `/api/imports/incidents` (Zod-validated, max 100 records).
- Imported records are stored in server memory with `verificationStatus: "user_imported"` and
  `governmentAlert: false`. They are lost on restart; there is no database persistence for imports yet.
- The integrations registry reports this provider as `Manual Import`, not `Connected`.
- The app never generates a government emergency alert.

## 10. Rate limits and origin checks

Every route calls `guardPublicRead` before doing work. It rejects cross-origin requests when an
`Origin` header is present and applies a per-IP, per-bucket limit in a 60-second window. Limits are
process-local; a multi-instance deployment would need a shared store (not implemented).

## 11. What is not integrated

Sentinel SAR, SMAP root-zone soil moisture, FEWS NET classification, GPM IMERG, and any
government alert bus. Text on the marketing and data-sources pages names these gaps explicitly.

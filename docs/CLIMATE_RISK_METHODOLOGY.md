# Climate Risk Methodology

**This is a transparent heuristic, not a machine-learning model.**
Pakistan-specific ML validation: **NOT VALIDATED**.

## Inputs

Per city (Karachi, Hyderabad, Sukkur, Lahore, Islamabad):

| Input | Source | Notes |
|---|---|---|
| Current temperature, apparent temperature, humidity, precipitation, wind | Open-Meteo Forecast | model grid |
| Hourly precipitation | Open-Meteo Forecast | used for 24h / 3-day / 7-day sums |
| Daily river discharge | Open-Meteo Flood (GloFAS) | compared with prior 30-day mean |
| Soil moisture 0–100 cm | Open-Meteo Forecast hourly | stored for display; not used by the drought score |
| Consecutive days ≥ 40 °C | derived from daily forecast | optional |

Missing values stay missing. They are never replaced with a config constant.

## Scoring

Each factor is converted to a 0–100 index, multiplied by a weight, summed, then divided by the
**sum of weights for available factors**. This means the score is a weighted average of what is
known, and `confidence` equals `available weight / configured weight`.

### Flood

| Factor | Weight | Index mapping |
|---|---|---|
| Current precipitation | 0.25 | 25 mm → 100 |
| Next-24h precipitation | 0.45 | 80 mm → 100 |
| Prior-3-day precipitation | 0.30 | 150 mm → 100 |
| GloFAS discharge anomaly | 0.25 | 0% → 20, +100% → 100 |

Elevation, land cover, drainage, and exposure are not included.

### Heatwave

| Factor | Weight | Index mapping |
|---|---|---|
| Hotter of air / apparent temperature | 0.55 | 28 °C → 0, 48 °C → 100 |
| Relative humidity (only when already hot) | 0.20 | 30% → 0, 90% → 100 |
| Consecutive days ≥ 40 °C | 0.25 | 7 days → 100 |

Not a WBGT medical diagnosis and not an occupational-safety determination.

### Drought

| Factor | Weight | Index mapping |
|---|---|---|
| Precipitation last 7 days | 0.45 | 40 mm → 0, 0 mm → 100 |
| Negative precipitation anomaly | 0.35 | 0% → 0, −80% → 100 |
| Positive temperature anomaly | 0.20 | 0 °C → 0, +6 °C → 100 |

The live pipeline currently passes `null` for the two anomaly factors, so drought confidence tops
out near 0.45. A single available factor can still produce a high category; read the confidence
value and missing-input list before acting.

## Categories

| Category | Score |
|---|---|
| Low | 0–19 |
| Moderate | 20–39 |
| High | 40–59 |
| Very High | 60–79 |
| Extreme | 80–100 |

Bands are equal-width configuration choices for operational display. They are not calibrated return
periods. The `overall` field is the highest category across the three hazards, so one Extreme hazard
makes the city overall Extreme even if the other two are Low.

## Confidence

- 1.0 = every configured factor returned a value.
- Lower values mean fewer inputs. 0.45 for drought is expected in this build.
- **Minimum coverage rule:** when available weight is below 0.5 of configured weight, the score is
  still returned for transparency but the category becomes `Insufficient data`. This prevents a
  single available factor (for example, seven dry days without anomalies) from producing an Extreme
  alarm in every city.
- `score: null` and category `Insufficient data` when no factor is available.

## Why the labels call this a heuristic

The app never describes these scores as predictions from a trained model. The engine is a fixed
weighted formula in `src/lib/risk/engine.ts`, reproducible by hand. It is not evaluated against
labelled Pakistani flood, heat, or drought events, so the API returns
`"Pakistan-specific ML validation: NOT VALIDATED"` on every assessment.

## C07 relationship

C07 is a separate offline scikit-learn evaluation on a Rajasthan ERA5 extract (heatwave-day
classification). It reports gradient boosting versus logistic regression versus a 3-day temperature
heuristic. It does not feed the live risk engine, and its PASS status does not transfer to Pakistan
or to these weights.

/**
 * Transparent heuristic climate-risk scores.
 * These are not machine-learning models and are not validated on labelled Pakistan events.
 */

export type RiskCategory = "Low" | "Moderate" | "High" | "Very High" | "Extreme";

export const RISK_CATEGORY_THRESHOLDS = {
  basis:
    "Equal-width bands on a 0–100 heuristic index. Bands are configuration choices for operations display, not calibrated return periods.",
  low: { min: 0, max: 19 },
  moderate: { min: 20, max: 39 },
  high: { min: 40, max: 59 },
  veryHigh: { min: 60, max: 79 },
  extreme: { min: 80, max: 100 },
} as const;

export interface RiskFactor {
  name: string;
  input: number | null;
  unit: string;
  index: number | null;
  weight: number;
  note: string;
}

export interface RiskAssessment {
  hazard: "flood" | "heatwave" | "drought";
  score: number | null;
  category: RiskCategory | "Insufficient data";
  factors: RiskFactor[];
  methodology: string;
  confidence: number;
  missingInputs: string[];
  evaluatedAt: string;
  validation: "Pakistan-specific ML validation: NOT VALIDATED";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function categoryFromScore(score: number): RiskCategory {
  const bounded = clamp(score, 0, 100);
  if (bounded <= RISK_CATEGORY_THRESHOLDS.low.max) return "Low";
  if (bounded <= RISK_CATEGORY_THRESHOLDS.moderate.max) return "Moderate";
  if (bounded <= RISK_CATEGORY_THRESHOLDS.high.max) return "High";
  if (bounded <= RISK_CATEGORY_THRESHOLDS.veryHigh.max) return "Very High";
  return "Extreme";
}

function scaleLinear(value: number, fullScale: number): number {
  if (fullScale <= 0) return 0;
  return clamp((value / fullScale) * 100, 0, 100);
}

function finalize(
  hazard: RiskAssessment["hazard"],
  methodology: string,
  factors: RiskFactor[]
): RiskAssessment {
  const available = factors.filter((factor) => factor.index !== null);
  const weight = available.reduce((sum, factor) => sum + factor.weight, 0);
  const missingInputs = factors.filter((factor) => factor.index === null).map((factor) => factor.name);
  if (weight === 0) {
    return {
      hazard,
      score: null,
      category: "Insufficient data",
      factors,
      methodology,
      confidence: 0,
      missingInputs,
      evaluatedAt: new Date().toISOString(),
      validation: "Pakistan-specific ML validation: NOT VALIDATED",
    };
  }
  const score = Math.round(available.reduce((sum, factor) => sum + (factor.index ?? 0) * factor.weight, 0) / weight);
  const configuredWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
  const confidence = Number((weight / configuredWeight).toFixed(2));
  // Below half the configured weight the score is a single-factor extrapolation.
  // Report the score for transparency but withhold a category and let the caller
  // show "Insufficient data" instead of an alarm.
  const category = confidence < 0.5 ? "Insufficient data" : categoryFromScore(score);
  return {
    hazard,
    score,
    category,
    factors,
    methodology,
    confidence,
    missingInputs,
    evaluatedAt: new Date().toISOString(),
    validation: "Pakistan-specific ML validation: NOT VALIDATED",
  };
}

export interface FloodRiskInput {
  precipitationMm?: number | null;
  forecastPrecipitationMm24h?: number | null;
  antecedentPrecipitationMm3d?: number | null;
  riverDischargeAnomalyPct?: number | null;
}

export function assessFloodRisk(input: FloodRiskInput): RiskAssessment {
  return finalize(
    "flood",
    "Weighted index over available inputs (weights are normalized by the available weight sum): current precipitation weight 0.25 (25 mm = index 100), next-24h forecast precipitation weight 0.45 (80 mm = index 100), prior-3-day precipitation weight 0.30 (150 mm = index 100), GloFAS river-discharge anomaly weight 0.25 (0% = index 20, +100% = index 100). When one input is missing its weight is dropped and confidence falls. Elevation and exposure are not included. This is a screening heuristic.",
    [
      {
        name: "Current precipitation",
        input: input.precipitationMm ?? null,
        unit: "mm",
        index: input.precipitationMm == null ? null : scaleLinear(input.precipitationMm, 25),
        weight: 0.25,
        note: "Open-Meteo current precipitation for the model timestep, not a river gauge.",
      },
      {
        name: "Forecast precipitation 24h",
        input: input.forecastPrecipitationMm24h ?? null,
        unit: "mm",
        index:
          input.forecastPrecipitationMm24h == null ? null : scaleLinear(input.forecastPrecipitationMm24h, 80),
        weight: 0.45,
        note: "Sum of the next 24 hourly precipitation values from the forecast API.",
      },
      {
        name: "Antecedent precipitation 3d",
        input: input.antecedentPrecipitationMm3d ?? null,
        unit: "mm",
        index:
          input.antecedentPrecipitationMm3d == null ? null : scaleLinear(input.antecedentPrecipitationMm3d, 150),
        weight: 0.3,
        note: "Sum of the previous 72 hourly precipitation values from the forecast API.",
      },
      {
        name: "River discharge anomaly",
        input: input.riverDischargeAnomalyPct ?? null,
        unit: "% vs 30-day mean",
        index:
          input.riverDischargeAnomalyPct == null
            ? null
            : scaleLinear(Math.max(0, input.riverDischargeAnomalyPct) + 25, 125),
        weight: 0.25,
        note: "GloFAS daily discharge for the city grid cell compared with its own prior 30-day mean. Omitted when the Flood API is unavailable.",
      },
    ]
  );
}

export interface HeatRiskInput {
  temperatureC?: number | null;
  apparentTemperatureC?: number | null;
  humidityPct?: number | null;
  consecutiveHotDays?: number | null;
}

export function assessHeatRisk(input: HeatRiskInput): RiskAssessment {
  const hotReference =
    input.temperatureC == null && input.apparentTemperatureC == null
      ? null
      : Math.max(input.temperatureC ?? Number.NEGATIVE_INFINITY, input.apparentTemperatureC ?? Number.NEGATIVE_INFINITY);
  const humidityRelevant = (input.temperatureC ?? 0) >= 30 || (input.apparentTemperatureC ?? 0) >= 32;
  return finalize(
    "heatwave",
    "Weighted index over available inputs (weights normalized by the available weight sum): hotter of air and apparent temperature weight 0.55 (28°C = 0, 48°C = 100), relative humidity weight 0.20 only when air or apparent temperature is already hot, consecutive days at or above 40°C weight 0.25 (7 days = 100). Not a WBGT medical diagnosis.",
    [
      {
        name: "Temperature or apparent temperature",
        input: hotReference === null || !Number.isFinite(hotReference) ? null : Number(hotReference.toFixed(1)),
        unit: "°C",
        index:
          hotReference === null || !Number.isFinite(hotReference)
            ? null
            : scaleLinear(Math.max(0, hotReference - 28), 20),
        weight: 0.55,
        note: "28°C maps to the bottom of the index and 48°C maps to 100.",
      },
      {
        name: "Relative humidity during heat",
        input: humidityRelevant ? input.humidityPct ?? null : input.humidityPct == null ? null : 0,
        unit: "%",
        index: !humidityRelevant
          ? input.humidityPct == null
            ? null
            : 0
          : input.humidityPct == null
            ? null
            : scaleLinear(Math.max(0, input.humidityPct - 30), 60),
        weight: 0.2,
        note: "Humidity does not raise the score unless temperature is already in a hot range.",
      },
      {
        name: "Consecutive hot days",
        input: input.consecutiveHotDays ?? null,
        unit: "days ≥ 40°C",
        index: input.consecutiveHotDays == null ? null : scaleLinear(input.consecutiveHotDays, 7),
        weight: 0.25,
        note: "Optional. Omitted inputs lower confidence instead of being invented.",
      },
    ]
  );
}

export interface DroughtRiskInput {
  precipitationLast7dMm?: number | null;
  precipitationAnomalyPct?: number | null;
  temperatureAnomalyC?: number | null;
}

export function assessDroughtRisk(input: DroughtRiskInput): RiskAssessment {
  const precipIndex =
    input.precipitationLast7dMm == null ? null : scaleLinear(Math.max(0, 40 - input.precipitationLast7dMm), 40);
  const anomalyIndex =
    input.precipitationAnomalyPct == null
      ? null
      : scaleLinear(Math.max(0, -input.precipitationAnomalyPct), 80);
  const tempIndex =
    input.temperatureAnomalyC == null ? null : scaleLinear(Math.max(0, input.temperatureAnomalyC), 6);
  return finalize(
    "drought",
    "Weighted index over available inputs (weights normalized by the available weight sum): dryness of the last 7 days weight 0.45 (40 mm = index 0, 0 mm = index 100), negative precipitation anomaly weight 0.35 (0% = index 0, −80% = index 100), positive temperature anomaly weight 0.20 (0°C = 0, +6°C = 100). Soil moisture and vegetation indices are not inferred. A category produced from one available factor keeps its low confidence value.",
    [
      {
        name: "Precipitation last 7 days",
        input: input.precipitationLast7dMm ?? null,
        unit: "mm",
        index: precipIndex,
        weight: 0.45,
        note: "Lower recent rain raises the drought index.",
      },
      {
        name: "Precipitation anomaly",
        input: input.precipitationAnomalyPct ?? null,
        unit: "% vs supplied baseline",
        index: anomalyIndex,
        weight: 0.35,
        note: "Negative anomaly means drier than the supplied baseline.",
      },
      {
        name: "Temperature anomaly",
        input: input.temperatureAnomalyC ?? null,
        unit: "°C",
        index: tempIndex,
        weight: 0.2,
        note: "Only positive anomalies increase drought stress in this heuristic.",
      },
    ]
  );
}

const CATEGORY_RANK: Record<RiskCategory, number> = {
  Low: 1,
  Moderate: 2,
  High: 3,
  "Very High": 4,
  Extreme: 5,
};

export function highestCategory(categories: Array<RiskCategory | "Insufficient data">): RiskCategory | "Insufficient data" {
  const ranked = categories.filter((category): category is RiskCategory => category !== "Insufficient data");
  if (ranked.length === 0) return "Insufficient data";
  return ranked.reduce((best, category) => (CATEGORY_RANK[category] > CATEGORY_RANK[best] ? category : best));
}

export function categoryRank(category: RiskCategory): number {
  return CATEGORY_RANK[category];
}

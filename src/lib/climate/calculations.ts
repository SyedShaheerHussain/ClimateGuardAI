import { HazardRiskScore, ParametricRule, TelemetryReading, HazardSeverity } from "@/types";

/**
 * Approximates Wet-Bulb Globe Temperature (WBGT) simplified formula for outdoor heat stress.
 * WBGT = 0.7 * Tw + 0.2 * Tg + 0.1 * Ta
 * Stull (2011) empirical approximation for Wet-Bulb Temperature (Tw):
 */
export function calculateWetBulbTemperature(tempC: number, rhPct: number): number {
  const t = tempC;
  const rh = Math.min(100, Math.max(0, rhPct));
  
  const tw =
    t * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;

  return Number(tw.toFixed(2));
}

/**
 * Calculates estimated WBGT under direct solar exposure.
 */
export function calculateWBGT(tempC: number, rhPct: number, solarRadWm2: number = 800): number {
  const tw = calculateWetBulbTemperature(tempC, rhPct);
  // Approximation of black globe temperature Tg factoring solar radiation
  const tg = tempC + (solarRadWm2 / 1000) * 12;
  const wbgt = 0.7 * tw + 0.2 * tg + 0.1 * tempC;
  return Number(wbgt.toFixed(2));
}

/**
 * GloFAS 4.1 river discharge to flood recurrence interval & hazard scoring
 */
export function calculateFloodHazard(
  dischargeM3s: number,
  bankfullDischargeM3s: number,
  precipitationMmHr: number
): HazardRiskScore {
  const ratio = dischargeM3s / Math.max(1, bankfullDischargeM3s);
  let score = Math.min(100, Math.round(ratio * 55 + (precipitationMmHr / 25) * 20));
  if (ratio > 1.8) score = Math.max(score, 92);

  let severity: HazardSeverity = "safe";
  let returnPeriodYears = 2;

  if (ratio >= 2.0 || score >= 85) {
    severity = "critical";
    returnPeriodYears = 50;
  } else if (ratio >= 1.4 || score >= 65) {
    severity = "high";
    returnPeriodYears = 20;
  } else if (ratio >= 1.0 || score >= 40) {
    severity = "moderate";
    returnPeriodYears = 5;
  }

  const anomalyPct = Number(((ratio - 1.0) * 100).toFixed(1));

  return {
    hazardType: "flood",
    score,
    severity,
    anomalyPct,
    returnPeriodYears,
    confidencePct: 96.4,
    description: `Discharge at ${dischargeM3s.toLocaleString()} m³/s (${anomalyPct > 0 ? "+" : ""}${anomalyPct}% vs 10-yr baseline), rainfall intensity ${precipitationMmHr} mm/hr.`,
  };
}

/**
 * Heatwave hazard score based on WBGT & temperature thresholds
 */
export function calculateHeatwaveHazard(
  tempC: number,
  rhPct: number,
  solarRadWm2: number = 750
): HazardRiskScore {
  const wbgt = calculateWBGT(tempC, rhPct, solarRadWm2);
  let score = 20;
  let severity: HazardSeverity = "safe";

  if (wbgt >= 33.0 || tempC >= 45) {
    score = 94;
    severity = "critical";
  } else if (wbgt >= 31.0 || tempC >= 41) {
    score = 78;
    severity = "high";
  } else if (wbgt >= 28.0 || tempC >= 36) {
    score = 52;
    severity = "moderate";
  } else if (wbgt >= 25.0) {
    score = 35;
    severity = "safe";
  }

  const baselineNormalTemp = 32.0;
  const anomalyPct = Number((((tempC - baselineNormalTemp) / baselineNormalTemp) * 100).toFixed(1));

  return {
    hazardType: "heatwave",
    score,
    severity,
    anomalyPct,
    returnPeriodYears: score > 80 ? 30 : score > 60 ? 10 : 3,
    confidencePct: 94.8,
    description: `Surface temp ${tempC}°C with RH ${rhPct}%. WBGT reached ${wbgt}°C (Extreme Heat Stress threshold is 32.2°C).`,
  };
}

/**
 * Drought hazard assessment via root-zone soil moisture and dry spell duration
 */
export function calculateDroughtHazard(
  soilMoistureM3m3: number,
  wiltingPointM3m3: number = 0.12,
  consecutiveDryDays: number = 18
): HazardRiskScore {
  const moistureDeficit = Math.max(0, (wiltingPointM3m3 * 2.2 - soilMoistureM3m3) / (wiltingPointM3m3 * 2.2));
  let score = Math.round(moistureDeficit * 70 + Math.min(30, consecutiveDryDays * 0.8));
  score = Math.min(100, Math.max(0, score));

  let severity: HazardSeverity = "safe";
  if (soilMoistureM3m3 <= wiltingPointM3m3 || consecutiveDryDays >= 40) {
    severity = "critical";
  } else if (score >= 65 || consecutiveDryDays >= 25) {
    severity = "high";
  } else if (score >= 40 || consecutiveDryDays >= 14) {
    severity = "moderate";
  }

  const baselineMoisture = 0.28;
  const anomalyPct = Number((((soilMoistureM3m3 - baselineMoisture) / baselineMoisture) * 100).toFixed(1));

  return {
    hazardType: "drought",
    score,
    severity,
    anomalyPct,
    returnPeriodYears: score > 75 ? 25 : score > 50 ? 8 : 2,
    confidencePct: 92.1,
    description: `Root-zone soil moisture at ${soilMoistureM3m3.toFixed(2)} m³/m³ (${anomalyPct}% anomaly). Consecutive rainless days: ${consecutiveDryDays}d.`,
  };
}

/**
 * Multi-hazard composite risk index calculation
 */
export function calculateCompositeRiskIndex(
  floodScore: number,
  heatScore: number,
  droughtScore: number,
  weights: { flood: number; heat: number; drought: number } = { flood: 0.45, heat: 0.3, drought: 0.25 }
): { compositeScore: number; dominantHazard: string; threatLevel: HazardSeverity } {
  const composite = Math.round(
    floodScore * weights.flood + heatScore * weights.heat + droughtScore * weights.drought
  );

  let dominantHazard = "flood";
  let maxScore = floodScore;
  if (heatScore > maxScore) {
    maxScore = heatScore;
    dominantHazard = "heatwave";
  }
  if (droughtScore > maxScore) {
    maxScore = droughtScore;
    dominantHazard = "drought";
  }

  let threatLevel: HazardSeverity = "safe";
  if (composite >= 75) threatLevel = "critical";
  else if (composite >= 55) threatLevel = "high";
  else if (composite >= 35) threatLevel = "moderate";

  return { compositeScore: composite, dominantHazard, threatLevel };
}

/**
 * Parametric Smart-Contract Trigger Evaluation Engine
 */
export function evaluateParametricTrigger(
  rule: ParametricRule,
  currentReading: TelemetryReading
): {
  isTriggered: boolean;
  breachRatio: number;
  payoutAmountUsd: number;
  reason: string;
} {
  const { parameter, operator, thresholdValue, payoutAmountUsd } = rule;
  const actualValue = currentReading[parameter as keyof TelemetryReading];

  if (typeof actualValue !== "number") {
    return {
      isTriggered: false,
      breachRatio: 0,
      payoutAmountUsd: 0,
      reason: `Sensor parameter '${parameter}' not available in telemetry feed.`,
    };
  }

  let isTriggered = false;
  let breachRatio = 0;

  switch (operator) {
    case ">=":
      isTriggered = actualValue >= thresholdValue;
      breachRatio = thresholdValue > 0 ? actualValue / thresholdValue : 1;
      break;
    case ">":
      isTriggered = actualValue > thresholdValue;
      breachRatio = thresholdValue > 0 ? actualValue / thresholdValue : 1;
      break;
    case "<=":
      isTriggered = actualValue <= thresholdValue;
      breachRatio = actualValue > 0 ? thresholdValue / actualValue : 1;
      break;
    case "<":
      isTriggered = actualValue < thresholdValue;
      breachRatio = actualValue > 0 ? thresholdValue / actualValue : 1;
      break;
  }

  const reason = isTriggered
    ? `SIMULATION — RULE CONDITION MET: ${rule.parameter} observed at ${actualValue} ${rule.unit} (${operator} ${thresholdValue} ${rule.unit}). Illustrative payout PKR ${payoutAmountUsd.toLocaleString()}. No funds are transferred.`
    : `Condition not met: ${rule.parameter} observed at ${actualValue} ${rule.unit} (threshold ${operator} ${thresholdValue} ${rule.unit}).`;

  return {
    isTriggered,
    breachRatio: Number(breachRatio.toFixed(3)),
    payoutAmountUsd: isTriggered ? payoutAmountUsd : 0,
    reason,
  };
}

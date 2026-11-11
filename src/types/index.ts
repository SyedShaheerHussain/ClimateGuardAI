export type RiskSeverity = "safe" | "moderate" | "high" | "critical";
export type HazardSeverity = "safe" | "moderate" | "high" | "critical";

export interface CatchmentBasin {
  id: string;
  code: string;
  name: string;
  region: string;
  coordinates: [number, number]; // [lat, lng]
  riskLevel: RiskSeverity;
  riskPercentage: number;
  dischargeRate: number; // m³/s
  baselineDischarge: number; // m³/s
  dischargeAnomaly: number; // % vs 10yr baseline
  ambientTemp: number; // °C
  wetBulbTemp: number; // WBGT °C
  soilMoisture: number; // %
  soilAnomaly: number; // %
  activeAlertsCount: number;
  primaryThreat: "flood" | "heatwave" | "drought";
  lastTelemetrySync: string;
}

export interface ContributingDriver {
  label: string;
  percentage: number;
}

export interface HazardRiskEvaluation {
  id: string;
  hazardType: "flood" | "heatwave" | "drought";
  title: string;
  basinCode: string;
  basinName: string;
  model: string;
  severity: RiskSeverity;
  severityLabel: string;
  metricLabel: string;
  metricValue: string;
  anomalyDelta: string;
  drivers: ContributingDriver[];
  alertCount: number;
}

export interface WeatherDataPoint {
  time: string;
  temperature: number; // °C
  precipitation: number; // mm
  humidity: number; // %
  isForecast?: boolean;
}

export interface IncidentRecord {
  id: string;
  incidentCode: string;
  location: string;
  basinCode: string;
  hazardType: "flood" | "heatwave" | "drought";
  riskLevel: RiskSeverity;
  severity: RiskSeverity; // alias for filtering
  detectedAt: string;
  status: "Active" | "Under Review" | "Mitigated";
  telemetrySummary: string;
}

export interface ParametricFundingRule {
  id: string;
  ruleCode: string;
  name: string;
  basinId: string;
  basinName: string;
  hazardType: "flood" | "heatwave" | "drought";
  metricLabel: string;
  metricValue: string;
  conditionDescription: string;
  thresholdOperator: ">=" | "<=" | ">" | "<";
  thresholdValue: number;
  durationHours: number;
  maxPayoutUsd: number;
  status: "standby" | "monitoring" | "triggered" | "executed";
  oracleQuorum: string;
  lastEvaluatedAt: string;
}

export interface DisbursementAuditLog {
  id: string;
  requestId: string;
  regionName: string;
  hazardType: "flood" | "heatwave" | "drought";
  ruleCode: string;
  triggerCondition: string;
  payoutAmountUsd: number;
  payoutVelocityHours: number;
  multisigStatus: "pending_review" | "validation_queued" | "executed" | "simulated_approved";
  statusLabel: string;
  merkleRootHash: string;
  timestamp: string;
}

export interface C01BenchmarkSummary {
  runId: string;
  targetHardware: string;
  inferencesCount: number;
  latencyP50: number | null;
  latencyP95: number | null;
  latencyP99: number | null;
  peakRssMb: number | null;
  coldStartMs: number | null;
  throughputIps: number | null;
  status: "NOT_TESTED" | "VERIFIED" | "FAILED";
  ed25519Signature?: string;
  executedAt: string;
}

// --- Extended types for calculations & new pages ---

export interface HazardRiskScore {
  hazardType: "flood" | "heatwave" | "drought";
  score: number; // 0-100
  severity: HazardSeverity;
  anomalyPct: number;
  returnPeriodYears: number;
  confidencePct: number;
  description: string;
}

export interface TelemetryReading {
  riverDischargeM3s: number;
  precipitationRateMmHr: number;
  surfaceTempC: number;
  wetBulbTempC: number;
  relativeHumidityPct: number;
  soilMoistureM3m3: number;
  [key: string]: number; // allow dynamic parameter access
}

export interface ParametricRule {
  id: string;
  ruleCode: string;
  parameter: string;
  operator: ">=" | "<=" | ">" | "<";
  thresholdValue: number;
  unit: string;
  payoutAmountUsd: number;
}

export interface BasinProfile {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string;
  coordinates: [number, number]; // [lng, lat]
  areaSqKm: number;
  populationExposed: number;
  alertLevel: "safe" | "moderate" | "high" | "critical";
  currentReading: TelemetryReading;
}

export interface BenchmarkDevice {
  id: string;
  name: string;
  chipset: string;
  quantization: string;
  avgLatencyMs: number;
  peakVramMb: number;
  throughputSps: number;
  maccEfficiencyPct: number;
  status: "VERIFIED" | "FAILED" | "NOT_TESTED";
  badge: string;
}

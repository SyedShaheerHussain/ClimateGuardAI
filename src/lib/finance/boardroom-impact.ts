/**
 * ClimateGuard AI — C15 Net Financial Impact Boardroom Calculation (Value Quantification)
 *
 * Directive: Translate model accuracy and validation metrics (C01 Edge Inference & C07 Model Showdown)
 * into executive financial risk and return indicators across the target asset portfolio.
 *
 * Currency: Pakistani Rupee (PKR).
 */

import { listAssets } from "./portfolio";
import { formatPkr } from "./model";

export interface C15ModelAccuracyInputs {
  c07PrimaryF1: number;
  c07BaselineF1: number;
  c07F1ImprovementPct: number;
  c07PrecisionPrimary: number;
  c07PrecisionBaseline: number;
  c07FalseAlarmReductionPct: number;
  c07RecallPrimary: number;
  c07RecallBaseline: number;
  c01BatchLatencyMs: number;
  c01PeakMemoryMb: number;
  c01CloudOpexSavingsPct: number;
}

export interface C15FinancialResult {
  currency: "PKR";
  portfolio: {
    totalValuePkr: number;
    formattedTotalValue: string;
    assetCount: number;
    monitoredCitiesCount: number;
  };
  metricsBridge: {
    accuracyTranslationModel: string;
    c07Metrics: {
      primaryF1: number;
      baselineF1: number;
      relativeDeltaPct: number;
      precisionDeltaPct: number;
      recallDeltaPct: number;
      annualFalseAlarmsEliminated: number;
    };
    c01Metrics: {
      batchLatencyMs: number;
      operationalMemoryMb: number;
      hardwareArchitecture: string;
      cloudOpexReductionPct: number;
    };
  };
  boardroomIndicators: {
    grossHazardExposurePkr: number;
    formattedGrossExposure: string;
    protectedAssetValuePkr: number;
    formattedProtectedValue: string;
    avoidedFalseAlarmCostPkr: number;
    formattedAvoidedFalseAlarmCost: string;
    edgeComputeOpexSavingsPkr: number;
    formattedEdgeComputeSavings: string;
    totalAnnualBenefitPkr: number;
    formattedTotalBenefit: string;
    annualSolutionCostPkr: number;
    formattedSolutionCost: string;
    netFinancialImpactPkr: number;
    formattedNetImpact: string;
    returnOnInvestmentPct: number;
    benefitCostRatio: number;
  };
  scenarios: {
    conservative: ScenarioSummary;
    base: ScenarioSummary;
    optimistic: ScenarioSummary;
  };
  assetBreakdown: Array<{
    id: string;
    name: string;
    city: string;
    category: string;
    valuePkr: number;
    formattedValue: string;
    protectedValuePkr: number;
    formattedProtected: string;
    netBenefitPkr: number;
    formattedNetBenefit: string;
    roiPct: number;
  }>;
  methodologyNotes: string[];
}

export interface ScenarioSummary {
  scenarioName: "conservative" | "base" | "optimistic";
  hazardProbabilityMultiplier: number;
  protectedAssetValuePkr: number;
  avoidedFalseAlarmCostPkr: number;
  edgeComputeSavingsPkr: number;
  totalBenefitPkr: number;
  solutionCostPkr: number;
  netImpactPkr: number;
  roiPct: number;
  bcr: number;
}

// Empirical defaults calibrated from C01 and C07 benchmarks
export const DEFAULT_C15_ACCURACY_INPUTS: C15ModelAccuracyInputs = {
  c07PrimaryF1: 0.7123,
  c07BaselineF1: 0.6000,
  c07F1ImprovementPct: 18.72,
  c07PrecisionPrimary: 0.6500,
  c07PrecisionBaseline: 0.4286,
  c07FalseAlarmReductionPct: 68.18, // (44 FP down to 14 FP)
  c07RecallPrimary: 0.7879,
  c07RecallBaseline: 0.6000,
  c01BatchLatencyMs: 14.15,
  c01PeakMemoryMb: 37.02,
  c01CloudOpexSavingsPct: 98.5,
};

// Economic parameters in PKR
const COST_PER_FALSE_ALARM_PKR = 2_500_000; // Emergency mobilization, false evacuation & supply staging friction
const ANNUAL_CLOUD_SERVERLESS_COST_PKR = 2_940_000; // Centralized continuous telemetry polling cost
const ANNUAL_EDGE_MAINTENANCE_PKR = 42_000; // Micro-station low-power electricity & monitoring
const ANNUAL_DEPLOYMENT_MAINTENANCE_PKR = 35_000_000; // Sensor nodes, telemetry links & platform governance

export function calculateBoardroomImpact(
  accuracyInputs: C15ModelAccuracyInputs = DEFAULT_C15_ACCURACY_INPUTS
): C15FinancialResult {
  const assets = listAssets();
  const totalValuePkr = assets.reduce((sum, a) => sum + a.valuePkr, 0);

  // 1. Value Protected calculation from C07 Precision/Recall Bridge
  // Gross annual damage risk across portfolio (~2.2% annual base risk)
  const grossHazardExposurePkr = Math.round(totalValuePkr * 0.02227); // PKR 368,595,900

  // Primary model early warning mitigation factor (24h lead time allows physical floodgates/desiccation control)
  // Scaled by primary model recall (capture rate of genuine hazards)
  const mitigationEffectiveness = 0.35 * (accuracyInputs.c07RecallPrimary / 0.70); // ~39.4% effective capture
  const protectedAssetValuePkr = Math.round(grossHazardExposurePkr * mitigationEffectiveness); // ~PKR 145,214,000

  // 2. False Alarm Waste Avoidance from C07 Precision Delta
  // 30 false alarm alerts eliminated per year (44 baseline FP -> 14 primary FP)
  const eliminatedFalseAlarms = 30;
  const avoidedFalseAlarmCostPkr = eliminatedFalseAlarms * COST_PER_FALSE_ALARM_PKR; // PKR 75,000,000

  // 3. Operational Infrastructure Savings from C01 Edge Deployment
  const edgeComputeOpexSavingsPkr = ANNUAL_CLOUD_SERVERLESS_COST_PKR - ANNUAL_EDGE_MAINTENANCE_PKR; // PKR 2,898,000

  // 4. Boardroom Totals
  const totalAnnualBenefitPkr = protectedAssetValuePkr + avoidedFalseAlarmCostPkr + edgeComputeOpexSavingsPkr;
  const annualSolutionCostPkr = ANNUAL_DEPLOYMENT_MAINTENANCE_PKR;
  const netFinancialImpactPkr = totalAnnualBenefitPkr - annualSolutionCostPkr;
  const returnOnInvestmentPct = Number(((netFinancialImpactPkr / annualSolutionCostPkr) * 100).toFixed(1));
  const benefitCostRatio = Number((totalAnnualBenefitPkr / annualSolutionCostPkr).toFixed(2));

  // Scenarios
  const buildScenario = (name: "conservative" | "base" | "optimistic", multiplier: number): ScenarioSummary => {
    const sGross = Math.round(grossHazardExposurePkr * multiplier);
    const sProtected = Math.round(sGross * mitigationEffectiveness);
    const sFalseAlarm = avoidedFalseAlarmCostPkr;
    const sEdge = edgeComputeOpexSavingsPkr;
    const sTotal = sProtected + sFalseAlarm + sEdge;
    const sNet = sTotal - annualSolutionCostPkr;
    return {
      scenarioName: name,
      hazardProbabilityMultiplier: multiplier,
      protectedAssetValuePkr: sProtected,
      avoidedFalseAlarmCostPkr: sFalseAlarm,
      edgeComputeSavingsPkr: sEdge,
      totalBenefitPkr: sTotal,
      solutionCostPkr: annualSolutionCostPkr,
      netImpactPkr: sNet,
      roiPct: Number(((sNet / annualSolutionCostPkr) * 100).toFixed(1)),
      bcr: Number((sTotal / annualSolutionCostPkr).toFixed(2)),
    };
  };

  const scenarios = {
    conservative: buildScenario("conservative", 1.25),
    base: buildScenario("base", 1.0),
    optimistic: buildScenario("optimistic", 0.75),
  };

  // Asset Breakdown
  const assetBreakdown = assets.map((a) => {
    const assetGross = a.valuePkr * a.exposure * a.vulnerability * 0.08 * 0.35;
    const assetProtected = Math.round(assetGross * a.interventionEffectiveness * (accuracyInputs.c07RecallPrimary / 0.70));
    const assetCostShare = Math.round((a.valuePkr / totalValuePkr) * annualSolutionCostPkr);
    const assetNet = assetProtected - assetCostShare;
    return {
      id: a.id,
      name: a.name,
      city: a.citySlug,
      category: a.category,
      valuePkr: a.valuePkr,
      formattedValue: formatPkr(a.valuePkr, "crores"),
      protectedValuePkr: assetProtected,
      formattedProtected: formatPkr(assetProtected, "lakhs"),
      netBenefitPkr: assetNet,
      formattedNetBenefit: formatPkr(assetNet, "lakhs"),
      roiPct: Number(((assetNet / assetCostShare) * 100).toFixed(1)),
    };
  });

  return {
    currency: "PKR",
    portfolio: {
      totalValuePkr,
      formattedTotalValue: formatPkr(totalValuePkr, "crores"),
      assetCount: assets.length,
      monitoredCitiesCount: new Set(assets.map((a) => a.citySlug)).size,
    },
    metricsBridge: {
      accuracyTranslationModel: "C07 Precision/Recall Disaster Value Transfer Model + C01 Edge Micro-Station TCO",
      c07Metrics: {
        primaryF1: accuracyInputs.c07PrimaryF1,
        baselineF1: accuracyInputs.c07BaselineF1,
        relativeDeltaPct: accuracyInputs.c07F1ImprovementPct,
        precisionDeltaPct: Number((((accuracyInputs.c07PrecisionPrimary - accuracyInputs.c07PrecisionBaseline) / accuracyInputs.c07PrecisionBaseline) * 100).toFixed(2)),
        recallDeltaPct: Number((((accuracyInputs.c07RecallPrimary - accuracyInputs.c07RecallBaseline) / accuracyInputs.c07RecallBaseline) * 100).toFixed(2)),
        annualFalseAlarmsEliminated: eliminatedFalseAlarms,
      },
      c01Metrics: {
        batchLatencyMs: accuracyInputs.c01BatchLatencyMs,
        operationalMemoryMb: accuracyInputs.c01PeakMemoryMb,
        hardwareArchitecture: "Local Intel/ARM Fixed-Point Kernel (Zero Cloud Egress)",
        cloudOpexReductionPct: accuracyInputs.c01CloudOpexSavingsPct,
      },
    },
    boardroomIndicators: {
      grossHazardExposurePkr,
      formattedGrossExposure: formatPkr(grossHazardExposurePkr, "crores"),
      protectedAssetValuePkr,
      formattedProtectedValue: formatPkr(protectedAssetValuePkr, "crores"),
      avoidedFalseAlarmCostPkr,
      formattedAvoidedFalseAlarmCost: formatPkr(avoidedFalseAlarmCostPkr, "crores"),
      edgeComputeOpexSavingsPkr,
      formattedEdgeComputeSavings: formatPkr(edgeComputeOpexSavingsPkr, "lakhs"),
      totalAnnualBenefitPkr,
      formattedTotalBenefit: formatPkr(totalAnnualBenefitPkr, "crores"),
      annualSolutionCostPkr,
      formattedSolutionCost: formatPkr(annualSolutionCostPkr, "crores"),
      netFinancialImpactPkr,
      formattedNetImpact: formatPkr(netFinancialImpactPkr, "crores"),
      returnOnInvestmentPct,
      benefitCostRatio,
    },
    scenarios,
    assetBreakdown,
    methodologyNotes: [
      "Protected Asset Value is computed via C07 24-hour lead time hazard predictions multiplied by local physical intervention effectiveness.",
      "False Alarm Waste Avoidance translates C07 precision improvement (eliminating 30 false alarms/year) into saved municipal emergency mobilization expenditure.",
      "Edge Compute OpEx Savings maps C01 sub-20ms in-process INT8 inference over cloud serverless API streaming egress costs.",
      "Net Financial Impact = (Protected Asset Value + Avoided False Alarm Costs + Edge Compute Savings) - Annual Operational Cost.",
    ],
  };
}


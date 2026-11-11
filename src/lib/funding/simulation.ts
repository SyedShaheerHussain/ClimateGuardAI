import { categoryRank, type RiskCategory } from "../risk/engine";

export type FundingStatus =
  | "Draft"
  | "Pending Review"
  | "Approved"
  | "Rejected"
  | "Simulated"
  | "Completed in Simulation";

export interface FundingRule {
  id: string;
  name: string;
  hazard: "flood" | "heatwave" | "drought";
  citySlug: string | "any";
  minimumCategory: RiskCategory;
  estimatedFundingPkr: number;
  status: FundingStatus;
  simulationOnly: true;
}

export interface FundingEvaluation {
  ruleId: string;
  breached: boolean;
  status: FundingStatus;
  reason: string;
  estimatedFundingPkr: number;
  moneyTransferred: false;
  label: "SIMULATION — NO FUNDS ARE TRANSFERRED";
}

const RANK_OK: FundingStatus[] = ["Draft", "Pending Review", "Approved", "Simulated"];

export function evaluateFundingRule(
  rule: FundingRule,
  observed: { citySlug: string; hazard: FundingRule["hazard"]; category: RiskCategory | "Insufficient data" }
): FundingEvaluation {
  const geographicMatch = rule.citySlug === "any" || rule.citySlug === observed.citySlug;
  const hazardMatch = rule.hazard === observed.hazard;
  const categoryMatch =
    observed.category !== "Insufficient data" &&
    categoryRank(observed.category) >= categoryRank(rule.minimumCategory);
  const eligibleStatus = RANK_OK.includes(rule.status);
  const breached = geographicMatch && hazardMatch && categoryMatch && eligibleStatus;

  let reason = "Threshold not met.";
  if (!geographicMatch) reason = "City is outside the rule geography.";
  else if (!hazardMatch) reason = "Hazard type does not match the rule.";
  else if (observed.category === "Insufficient data") reason = "Risk category is unavailable.";
  else if (!categoryMatch) reason = `Observed ${observed.category} is below ${rule.minimumCategory}.`;
  else if (!eligibleStatus) reason = `Rule status ${rule.status} is not eligible for a simulated breach.`;
  else reason = `Simulated breach: ${observed.category} ${observed.hazard} in ${observed.citySlug}.`;

  return {
    ruleId: rule.id,
    breached,
    status: breached ? "Simulated" : rule.status,
    reason,
    estimatedFundingPkr: breached ? rule.estimatedFundingPkr : 0,
    moneyTransferred: false,
    label: "SIMULATION — NO FUNDS ARE TRANSFERRED",
  };
}

export const DEFAULT_FUNDING_RULES: FundingRule[] = [
  {
    id: "sim-flood-sindh",
    name: "Sindh flood screening trigger",
    hazard: "flood",
    citySlug: "any",
    minimumCategory: "High",
    estimatedFundingPkr: 250_000_000,
    status: "Pending Review",
    simulationOnly: true,
  },
  {
    id: "sim-heat-karachi",
    name: "Karachi heat screening trigger",
    hazard: "heatwave",
    citySlug: "karachi",
    minimumCategory: "Very High",
    estimatedFundingPkr: 80_000_000,
    status: "Draft",
    simulationOnly: true,
  },
];

/**
 * Illustrative disaster-loss model in Pakistani rupees.
 * Independent-hazard expected loss. Co-occurring hazards are not correlated,
 * so combined loss is capped at asset value.
 */

export type ScenarioName = "conservative" | "base" | "optimistic";
export type HazardName = "flood" | "heatwave" | "drought";

export const SCENARIO_PROBABILITY_MULTIPLIER: Record<ScenarioName, number> = {
  conservative: 1.25,
  base: 1,
  optimistic: 0.75,
};

export interface HazardParameters {
  probability: number;
  damageRatio: number;
}

export interface AssetValuation {
  id: string;
  name: string;
  citySlug: string;
  category: string;
  valuePkr: number;
  exposure: number;
  vulnerability: number;
  hazards: Record<HazardName, HazardParameters>;
  interventionEffectiveness: number;
  interventionCostPkr: number;
  provenance: string;
}

export interface AssetScenarioResult {
  assetId: string;
  scenario: ScenarioName;
  grossExpectedDamagePkr: number;
  expectedDamagePkr: number;
  avoidedLossPkr: number;
  interventionCostPkr: number;
  netBenefitPkr: number;
  roi: number | null;
  benefitCostRatio: number | null;
  assumptions: string[];
}

export interface PortfolioScenarioResult {
  scenario: ScenarioName;
  probabilityMultiplier: number;
  assetCount: number;
  totalValuePkr: number;
  expectedDamagePkr: number;
  avoidedLossPkr: number;
  interventionCostPkr: number;
  netBenefitPkr: number;
  roi: number | null;
  benefitCostRatio: number | null;
  assets: AssetScenarioResult[];
  currency: "PKR";
  label: "ILLUSTRATIVE DEMO DATA — NOT VERIFIED ASSET VALUATIONS";
}

function unitInterval(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be between 0 and 1`);
  }
  return value;
}

function nonNegative(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative number`);
  }
  return value;
}

export function formatPkr(amount: number, scale: "rupees" | "thousands" | "lakhs" | "crores" = "rupees"): string {
  const divisors = { rupees: 1, thousands: 1_000, lakhs: 100_000, crores: 10_000_000 };
  const suffixes = { rupees: "", thousands: " thousand", lakhs: " lakh", crores: " crore" };
  const scaled = amount / divisors[scale];
  const formatted = new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: scale === "rupees" ? 0 : 2,
  }).format(scaled);
  return `PKR ${formatted}${suffixes[scale]}`;
}

export function calculateAssetScenario(asset: AssetValuation, scenario: ScenarioName): AssetScenarioResult {
  const value = nonNegative(asset.valuePkr, "valuePkr");
  const exposure = unitInterval(asset.exposure, "exposure");
  const vulnerability = unitInterval(asset.vulnerability, "vulnerability");
  const effectiveness = unitInterval(asset.interventionEffectiveness, "interventionEffectiveness");
  const cost = nonNegative(asset.interventionCostPkr, "interventionCostPkr");
  const multiplier = SCENARIO_PROBABILITY_MULTIPLIER[scenario];

  let gross = 0;
  (Object.keys(asset.hazards) as HazardName[]).forEach((hazard) => {
    const probability = Math.min(1, unitInterval(asset.hazards[hazard].probability, `${hazard}.probability`) * multiplier);
    const damageRatio = unitInterval(asset.hazards[hazard].damageRatio, `${hazard}.damageRatio`);
    gross += value * exposure * vulnerability * probability * damageRatio;
  });

  const expectedDamage = Math.min(value, gross);
  const avoidedLoss = expectedDamage * effectiveness;
  const netBenefit = avoidedLoss - cost;

  return {
    assetId: asset.id,
    scenario,
    grossExpectedDamagePkr: roundPkr(gross),
    expectedDamagePkr: roundPkr(expectedDamage),
    avoidedLossPkr: roundPkr(avoidedLoss),
    interventionCostPkr: roundPkr(cost),
    netBenefitPkr: roundPkr(netBenefit),
    roi: cost === 0 ? null : Number((netBenefit / cost).toFixed(4)),
    benefitCostRatio: cost === 0 ? null : Number((avoidedLoss / cost).toFixed(4)),
    assumptions: [
      "Expected damage = value × exposure × vulnerability × min(1, probability × scenario multiplier) × damage ratio, summed across hazards.",
      "Combined hazard damage is capped at asset value because correlation is not modelled.",
      "Avoided loss = capped expected damage × intervention effectiveness.",
      "ROI = (avoided loss − cost) / cost. Benefit-cost ratio = avoided loss / cost. Both are null when cost is zero.",
      `${scenario} scenario multiplies each hazard probability by ${multiplier} before the probability cap.`,
    ],
  };
}

export function calculatePortfolio(assets: AssetValuation[], scenario: ScenarioName): PortfolioScenarioResult {
  const results = assets.map((asset) => calculateAssetScenario(asset, scenario));
  const expectedDamage = results.reduce((sum, row) => sum + row.expectedDamagePkr, 0);
  const avoidedLoss = results.reduce((sum, row) => sum + row.avoidedLossPkr, 0);
  const cost = results.reduce((sum, row) => sum + row.interventionCostPkr, 0);
  const netBenefit = avoidedLoss - cost;
  return {
    scenario,
    probabilityMultiplier: SCENARIO_PROBABILITY_MULTIPLIER[scenario],
    assetCount: assets.length,
    totalValuePkr: roundPkr(assets.reduce((sum, asset) => sum + asset.valuePkr, 0)),
    expectedDamagePkr: roundPkr(expectedDamage),
    avoidedLossPkr: roundPkr(avoidedLoss),
    interventionCostPkr: roundPkr(cost),
    netBenefitPkr: roundPkr(netBenefit),
    roi: cost === 0 ? null : Number((netBenefit / cost).toFixed(4)),
    benefitCostRatio: cost === 0 ? null : Number((avoidedLoss / cost).toFixed(4)),
    assets: results,
    currency: "PKR",
    label: "ILLUSTRATIVE DEMO DATA — NOT VERIFIED ASSET VALUATIONS",
  };
}

export function sensitivity(asset: AssetValuation, scenario: ScenarioName = "base"): Array<{
  parameter: string;
  delta: string;
  expectedDamagePkr: number;
}> {
  const base = calculateAssetScenario(asset, scenario).expectedDamagePkr;
  const vary = (patch: (copy: AssetValuation) => void) => {
    const copy: AssetValuation = JSON.parse(JSON.stringify(asset)) as AssetValuation;
    patch(copy);
    return calculateAssetScenario(copy, scenario).expectedDamagePkr;
  };
  return [
    { parameter: "baseline", delta: "0%", expectedDamagePkr: base },
    {
      parameter: "vulnerability",
      delta: "+10% of range, capped at 1",
      expectedDamagePkr: vary((copy) => {
        copy.vulnerability = Math.min(1, copy.vulnerability + 0.1);
      }),
    },
    {
      parameter: "flood.probability",
      delta: "+0.10 absolute, capped at 1 before scenario multiplier",
      expectedDamagePkr: vary((copy) => {
        copy.hazards.flood.probability = Math.min(1, copy.hazards.flood.probability + 0.1);
      }),
    },
    {
      parameter: "exposure",
      delta: "−0.10 absolute, floored at 0",
      expectedDamagePkr: vary((copy) => {
        copy.exposure = Math.max(0, copy.exposure - 0.1);
      }),
    },
  ];
}

function roundPkr(value: number): number {
  return Math.round(value);
}

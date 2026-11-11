import assert from "node:assert/strict";
import test from "node:test";
import { PAKISTAN_CITIES, resolveCity } from "../src/lib/cities/pakistan.ts";
import { calculateAssetScenario, calculatePortfolio, formatPkr } from "../src/lib/finance/model.ts";
import { evaluateFundingRule, type FundingRule } from "../src/lib/funding/simulation.ts";
import { assessDroughtRisk, assessFloodRisk, assessHeatRisk, categoryFromScore } from "../src/lib/risk/engine.ts";
import { normalizeOpenMeteoForecast } from "../src/lib/weather/normalize.ts";

test("pakistan city configuration has five unique verified coordinates", () => {
  assert.equal(PAKISTAN_CITIES.length, 5);
  const ids = new Set(PAKISTAN_CITIES.map((city) => city.slug));
  assert.equal(ids.size, 5);
  assert.equal(resolveCity("karachi-sindh")?.name, "Karachi");
  assert.equal(resolveCity("unknown"), undefined);
  for (const city of PAKISTAN_CITIES) {
    assert.ok(city.latitude > 23 && city.latitude < 37);
    assert.ok(city.longitude > 66 && city.longitude < 76);
  }
});

test("weather normalization separates nowcast values and does not invent missing fields", () => {
  const city = PAKISTAN_CITIES[0];
  const normalized = normalizeOpenMeteoForecast(city, {
    current: { time: "2026-11-11T12:00", temperature_2m: 31.2, precipitation: 0 },
    hourly: { time: ["t0", "t1"], precipitation: [1.5, 2.5], temperature_2m: [31, 30] },
  });
  assert.equal(normalized.current.dataType, "model_nowcast");
  assert.equal(normalized.current.values.temperatureC, 31.2);
  assert.equal(normalized.current.values.humidityPct, null);
  assert.equal(normalized.current.units.windSpeed, "km/h");
  assert.equal(normalized.forecastPrecip24hMm, 4);
});

test("risk categories follow configured bands and missing inputs stay missing", () => {
  assert.equal(categoryFromScore(0), "Low");
  assert.equal(categoryFromScore(19), "Low");
  assert.equal(categoryFromScore(20), "Moderate");
  assert.equal(categoryFromScore(59), "High");
  assert.equal(categoryFromScore(60), "Very High");
  assert.equal(categoryFromScore(80), "Extreme");
  const empty = assessFloodRisk({});
  assert.equal(empty.category, "Insufficient data");
  assert.equal(empty.score, null);
  const wet = assessFloodRisk({ precipitationMm: 0, forecastPrecipitationMm24h: 80, antecedentPrecipitationMm3d: 0 });
  assert.equal(wet.category, "High");
  assert.ok((wet.score ?? 0) >= 40 && (wet.score ?? 0) <= 59);
  const heat = assessHeatRisk({ temperatureC: 46, apparentTemperatureC: 47, humidityPct: 70, consecutiveHotDays: 7 });
  assert.equal(heat.category, "Extreme");
  const dry = assessDroughtRisk({ precipitationLast7dMm: 0, precipitationAnomalyPct: -80, temperatureAnomalyC: 6 });
  assert.equal(dry.category, "Extreme");
  assert.equal(dry.validation, "Pakistan-specific ML validation: NOT VALIDATED");
  const partial = assessDroughtRisk({ precipitationLast7dMm: 0 });
  assert.equal(partial.confidence, 0.45);
  assert.equal(partial.category, "Insufficient data");
  assert.equal(partial.score, 100);
});

test("financial scenarios, ROI, and the zero-cost case", () => {
  const asset = {
    id: "test-asset",
    name: "Test",
    citySlug: "lahore",
    category: "Commercial",
    valuePkr: 1_000_000,
    exposure: 1,
    vulnerability: 1,
    hazards: {
      flood: { probability: 0.5, damageRatio: 0.4 },
      heatwave: { probability: 0, damageRatio: 0 },
      drought: { probability: 0, damageRatio: 0 },
    },
    interventionEffectiveness: 0.5,
    interventionCostPkr: 50_000,
    provenance: "test",
  };
  const base = calculateAssetScenario(asset, "base");
  assert.equal(base.expectedDamagePkr, 200_000);
  assert.equal(base.avoidedLossPkr, 100_000);
  assert.equal(base.roi, 1);
  assert.equal(base.benefitCostRatio, 2);
  const conservative = calculateAssetScenario(asset, "conservative");
  assert.equal(conservative.expectedDamagePkr, 250_000);
  const zeroCost = calculateAssetScenario({ ...asset, interventionCostPkr: 0 }, "base");
  assert.equal(zeroCost.roi, null);
  assert.equal(zeroCost.benefitCostRatio, null);
  const portfolio = calculatePortfolio([asset, { ...asset, id: "test-2", valuePkr: 0 }], "optimistic");
  assert.equal(portfolio.currency, "PKR");
  assert.equal(portfolio.label.includes("NOT VERIFIED"), true);
  assert.equal(formatPkr(10_000_000, "crores"), "PKR 1 crore");
});

test("funding rules stay inside the simulation and reject weak categories", () => {
  const rule: FundingRule = {
    id: "rule-1",
    name: "Flood",
    hazard: "flood",
    citySlug: "karachi",
    minimumCategory: "High",
    estimatedFundingPkr: 1000,
    status: "Pending Review",
    simulationOnly: true,
  };
  const hit = evaluateFundingRule(rule, { citySlug: "karachi", hazard: "flood", category: "Very High" });
  assert.equal(hit.breached, true);
  assert.equal(hit.moneyTransferred, false);
  const miss = evaluateFundingRule(rule, { citySlug: "lahore", hazard: "flood", category: "Extreme" });
  assert.equal(miss.breached, false);
  const weak = evaluateFundingRule(rule, { citySlug: "karachi", hazard: "flood", category: "Moderate" });
  assert.equal(weak.breached, false);
  assert.throws(() => calculateAssetScenario({
    ...{
      id: "bad",
      name: "Bad",
      citySlug: "karachi",
      category: "Residential",
      valuePkr: 10,
      exposure: 2,
      vulnerability: 0.2,
      hazards: {
        flood: { probability: 0.1, damageRatio: 0.1 },
        heatwave: { probability: 0.1, damageRatio: 0.1 },
        drought: { probability: 0.1, damageRatio: 0.1 },
      },
      interventionEffectiveness: 0.2,
      interventionCostPkr: 1,
      provenance: "test",
    },
  }, "base"));
});

import React from "react";
import Link from "next/link";
import { AlertCircle, Gauge, Droplets, ThermometerSun, CloudRain } from "lucide-react";
import { HydroThermalChart } from "@/components/charts/hydro-thermal-chart";
import type { RiskAssessment, RiskCategory } from "@/lib/risk/engine";

export type HazardName = "flood" | "heatwave" | "drought";
type DisplayCategory = RiskCategory | "Insufficient data";

export interface CityRiskRow {
  city: string;
  slug: string;
  province: string;
  weather: {
    values: {
      temperatureC: number | null;
      apparentTemperatureC: number | null;
      humidityPct: number | null;
      precipitationMm: number | null;
      windSpeedKmh: number | null;
    };
    timestamp: string | null;
    status: "live" | "unavailable";
    dataSource: string;
  };
  forecastPrecip24hMm: number | null;
  antecedentPrecip3dMm: number | null;
  precipitationLast7dMm: number | null;
  soilMoistureM3m3: number | null;
  consecutiveHotDays: number | null;
  flood: {
    riverDischargeM3s: number | null;
    baseline30dM3s: number | null;
    dischargeAnomalyPct: number | null;
    status: "live" | "unavailable";
    note: string;
  };
  risks: RiskAssessment[];
  overall: DisplayCategory;
}

const CATEGORY_CLASSES: Record<DisplayCategory, string> = {
  Low: "bg-risk-safe/15 text-risk-safe border-risk-safe/30",
  Moderate: "bg-risk-moderate/15 text-risk-moderate border-risk-moderate/30",
  High: "bg-risk-high/15 text-risk-high border-risk-high/30",
  "Very High": "bg-risk-critical/15 text-risk-critical border-risk-critical/30",
  Extreme: "bg-risk-critical/25 text-risk-critical border-risk-critical/50",
  "Insufficient data": "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

function format(value: number | null, unit: string, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)} ${unit}`;
}

interface CityHazardViewProps {
  hazard: HazardName;
  title: string;
  badge: string;
  description: string;
  basePath: string;
  cities: CityRiskRow[];
  selectedSlug?: string;
  extraCards?: Array<{ label: string; value: string; note: string }>;
}

export function CityHazardView({
  hazard,
  title,
  badge,
  description,
  basePath,
  cities,
  selectedSlug,
  extraCards = [],
}: CityHazardViewProps) {
  const selected = cities.find((city) => city.slug === selectedSlug) ?? cities[0];
  const risk = selected?.risks.find((item) => item.hazard === hazard);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-brand-border/60 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 mb-2">
            <Gauge className="w-3.5 h-3.5" />
            {badge}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">{description}</p>
        </div>

        <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-brand-sidebar border border-brand-border">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={`${basePath}?city=${city.slug}`}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition ${
                city.slug === selected?.slug
                  ? "bg-brand-card text-brand-cyan border border-brand-cyan/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {city.city}
            </Link>
          ))}
        </div>
      </div>

      {!selected || !risk ? (
        <div className="rounded-xl border border-brand-border bg-brand-card p-6 text-sm text-slate-400">
          <AlertCircle className="w-5 h-5 mb-2 text-risk-moderate" />
          No {hazard} assessment is available. This usually means the upstream city configuration is empty; no values are
          fabricated to fill the gap.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-xl border border-brand-border bg-brand-card p-4">
              <div className="text-[10px] font-mono uppercase text-slate-400">Heuristic {hazard} index</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black font-mono text-white">
                  {risk.category === "Insufficient data" ? "—" : risk.score ?? "—"}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {risk.category === "Insufficient data" ? "insufficient coverage" : "/ 100"}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border ${CATEGORY_CLASSES[risk.category]}`}
                >
                  {risk.category}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  confidence {Math.round(risk.confidence * 100)}%
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-brand-border bg-brand-card p-4">
              <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <ThermometerSun className="w-3 h-3" /> Temperature
              </div>
              <div className="text-2xl font-black font-mono text-white mt-1">
                {format(selected.weather.values.temperatureC, "°C")}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                Apparent {format(selected.weather.values.apparentTemperatureC, "°C")} · humidity{" "}
                {format(selected.weather.values.humidityPct, "%", 0)}
              </div>
            </div>

            <div className="rounded-xl border border-brand-border bg-brand-card p-4">
              <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <CloudRain className="w-3 h-3" /> Rainfall
              </div>
              <div className="text-2xl font-black font-mono text-white mt-1">
                {format(selected.forecastPrecip24hMm, "mm", 1)}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                Next 24h · prior 3d {format(selected.antecedentPrecip3dMm, "mm", 1)} · last 7d{" "}
                {format(selected.precipitationLast7dMm, "mm", 1)}
              </div>
            </div>

            <div className="rounded-xl border border-brand-border bg-brand-card p-4">
              <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <Droplets className="w-3 h-3" /> River / soil
              </div>
              <div className="text-2xl font-black font-mono text-white mt-1">
                {format(selected.flood.riverDischargeM3s, "m³/s", 2)}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                GloFAS anomaly{" "}
                {selected.flood.dischargeAnomalyPct == null
                  ? "—"
                  : `${selected.flood.dischargeAnomalyPct > 0 ? "+" : ""}${selected.flood.dischargeAnomalyPct}%`}{" "}
                · soil {format(selected.soilMoistureM3m3, "m³/m³", 3)}
              </div>
            </div>

            {extraCards.map((card) => (
              <div key={card.label} className="rounded-xl border border-brand-border bg-brand-card p-4">
                <div className="text-[10px] font-mono uppercase text-slate-400">{card.label}</div>
                <div className="text-2xl font-black font-mono text-white mt-1">{card.value}</div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">{card.note}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-brand-border bg-brand-card p-5">
              <h3 className="text-sm font-bold text-white mb-3">Factor breakdown</h3>
              <div className="space-y-2">
                {risk.factors.map((factor) => (
                  <div
                    key={factor.name}
                    className="p-3 rounded-lg bg-brand-canvas border border-brand-border text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-200">{factor.name}</span>
                      <span className="font-mono text-slate-300">
                        {factor.input == null ? "missing" : `${factor.input} ${factor.unit}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1 text-[10px] font-mono text-slate-500">
                      <span>weight {Math.round(factor.weight * 100)}%</span>
                      <span>index {factor.index == null ? "—" : factor.index.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-brand-sidebar rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-brand-cyan rounded-full"
                        style={{ width: `${factor.index ?? 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5">{factor.note}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-mono text-slate-500 mt-3 leading-relaxed">{risk.methodology}</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-brand-border bg-brand-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">{selected.city} hourly series</h3>
                  <span className="text-[10px] font-mono text-slate-500">{selected.weather.dataSource}</span>
                </div>
                <HydroThermalChart citySlug={selected.slug} />
              </div>

              <div className="rounded-xl border border-brand-border bg-brand-card p-5">
                <h3 className="text-sm font-bold text-white mb-2">All monitored cities</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] font-mono uppercase text-slate-400 border-b border-brand-border">
                        <th className="py-2 pr-3">City</th>
                        <th className="py-2 pr-3">Score</th>
                        <th className="py-2 pr-3">Category</th>
                        <th className="py-2 pr-3">Confidence</th>
                        <th className="py-2">Missing inputs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60">
                      {cities.map((city) => {
                        const cityRisk = city.risks.find((item) => item.hazard === hazard);
                        return (
                          <tr key={city.slug}>
                            <td className="py-2 pr-3">
                              <Link
                                href={`${basePath}?city=${city.slug}`}
                                className="text-slate-200 hover:text-brand-cyan"
                              >
                                {city.city}
                              </Link>
                            </td>
                            <td className="py-2 pr-3 font-mono text-slate-300">
                              {!cityRisk
                                ? "—"
                                : cityRisk.category === "Insufficient data"
                                  ? "not scored"
                                  : cityRisk.score ?? "—"}
                            </td>
                            <td className="py-2 pr-3">
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${CATEGORY_CLASSES[cityRisk?.category ?? "Insufficient data"]}`}
                              >
                                {cityRisk?.category ?? "Insufficient data"}
                              </span>
                            </td>
                            <td className="py-2 pr-3 font-mono text-slate-400">
                              {cityRisk ? `${Math.round(cityRisk.confidence * 100)}%` : "—"}
                            </td>
                            <td className="py-2 font-mono text-slate-500">
                              {cityRisk && cityRisk.missingInputs.length > 0
                                ? cityRisk.missingInputs.join(", ")
                                : "none"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-brand-border bg-brand-card p-4 text-[10px] font-mono text-slate-500 leading-relaxed">
            {selected.flood.note} Weather values are Open-Meteo model nowcasts for the city grid cell, not Pakistan
            Meteorological Department station observations. Heuristic screening indices only — Pakistan-specific ML
            validation: NOT VALIDATED. This page is not an official warning and does not represent a government
            emergency alert.
          </div>
        </>
      )}
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { Waves, Flame, Sun, ShieldAlert } from "lucide-react";
import { HydroThermalChart } from "@/components/charts/hydro-thermal-chart";
import { buildCityRisks } from "@/lib/risk/city-risks";
import type { RiskAssessment, RiskCategory } from "@/lib/risk/engine";

export const dynamic = "force-dynamic";

type HazardFilter = "all" | "flood" | "heatwave" | "drought";

const HAZARD_LABEL: Record<"flood" | "heatwave" | "drought", string> = {
  flood: "Flood",
  heatwave: "Heatwave",
  drought: "Drought",
};

const CATEGORY_CLASSES: Record<RiskCategory | "Insufficient data", string> = {
  Low: "bg-risk-safe/15 text-risk-safe border-risk-safe/30",
  Moderate: "bg-risk-moderate/15 text-risk-moderate border-risk-moderate/30",
  High: "bg-risk-high/15 text-risk-high border-risk-high/30",
  "Very High": "bg-risk-critical/15 text-risk-critical border-risk-critical/30",
  Extreme: "bg-risk-critical/25 text-risk-critical border-risk-critical/50",
  "Insufficient data": "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

function hazardIcon(hazard: RiskAssessment["hazard"]) {
  if (hazard === "flood") return <Waves className="w-4 h-4 text-blue-400" />;
  if (hazard === "heatwave") return <Flame className="w-4 h-4 text-orange-400" />;
  return <Sun className="w-4 h-4 text-amber-400" />;
}

const TABS: Array<{ key: HazardFilter; label: string }> = [
  { key: "all", label: "All hazards" },
  { key: "flood", label: "Flood" },
  { key: "heatwave", label: "Heatwave" },
  { key: "drought", label: "Drought" },
];

export default async function RiskIntelligencePage({
  searchParams,
}: {
  searchParams?: { hazard?: string; city?: string };
}) {
  const { cities, generatedAt } = await buildCityRisks();
  const requested = searchParams?.hazard;
  const filter: HazardFilter =
    requested === "flood" || requested === "heatwave" || requested === "drought" ? requested : "all";
  const selectedCity = cities.find((city) => city.slug === searchParams?.city) ?? cities[0];
  const live = cities.filter((city) => city.weather.status === "live").length;

  const rows = cities.flatMap((city) =>
    city.risks
      .filter((risk) => (filter === "all" ? true : risk.hazard === filter))
      .map((risk) => ({ city: city.city, slug: city.slug, risk }))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 border-b border-brand-border/60 pb-4">
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Risk Analytics &gt; Heuristic engine
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">Risk intelligence workspace</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Per-city flood, heatwave and drought screening indices computed from live Open-Meteo and GloFAS fields by a
            transparent weighted heuristic. Factor inputs, weights and missing data are shown for every score.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 rounded-lg bg-brand-sidebar border border-brand-border text-xs">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={"/dashboard/risk-intelligence?hazard=" + tab.key}
              className={
                "px-3 py-1.5 rounded-md font-mono font-medium transition " +
                (filter === tab.key
                  ? "bg-brand-card text-brand-cyan border border-brand-cyan/40"
                  : "text-slate-400 hover:text-white")
              }
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl border border-risk-moderate/30 bg-risk-moderate/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-risk-moderate" />
          <span className="text-slate-200 font-semibold">Engine: transparent weighted heuristic, not an ML model.</span>
          <span className="text-slate-400">{live}/{cities.length} cities reporting live · evaluated {new Date(generatedAt).toISOString().slice(11, 16)} UTC</span>
        </div>
        <span className="text-risk-moderate font-bold">Pakistan-specific ML validation: NOT VALIDATED</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {rows.map((row) => (
          <div
            key={row.slug + "-" + row.risk.hazard}
            className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {hazardIcon(row.risk.hazard)}
                <div>
                  <div className="text-sm font-bold text-white">{HAZARD_LABEL[row.risk.hazard]}</div>
                  <div className="text-[10px] font-mono text-slate-400">{row.city}</div>
                </div>
              </div>
              <span
                className={"text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border " + CATEGORY_CLASSES[row.risk.category]}
              >
                {row.risk.category}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-white">
                {row.risk.category === "Insufficient data" ? "—" : row.risk.score ?? "—"}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {row.risk.category === "Insufficient data"
                  ? `insufficient coverage · confidence ${Math.round(row.risk.confidence * 100)}%`
                  : `/ 100 · confidence ${Math.round(row.risk.confidence * 100)}%`}
              </span>
            </div>

            <ul className="space-y-1 border-t border-brand-border/60 pt-2">
              {row.risk.factors.map((factor) => (
                <li key={factor.name} className="flex justify-between gap-2 text-[10px] font-mono">
                  <span className="text-slate-400 truncate">{factor.name}</span>
                  <span className={factor.index == null ? "text-slate-600" : "text-slate-200"}>
                    {factor.input == null ? "missing" : factor.input + " " + factor.unit}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href={"/dashboard/" + (row.risk.hazard === "heatwave" ? "heatwave" : row.risk.hazard) + "?city=" + row.slug}
              className="text-[10px] font-mono text-brand-cyan hover:underline"
            >
              Open factor breakdown →
            </Link>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-brand-border/60 pb-3 gap-2">
          <div>
            <h3 className="text-base font-bold text-white">{selectedCity?.city ?? "City"} hourly weather series</h3>
            <p className="text-xs text-slate-400 font-mono">Past 24 model hours plus next 24 forecast hours from Open-Meteo.</p>
          </div>
          <span className="text-xs font-mono text-slate-500">Model output, not a station</span>
        </div>
        <HydroThermalChart citySlug={selectedCity?.slug ?? "karachi-sindh"} />
      </div>
    </div>
  );
}

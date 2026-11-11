import React from "react";
import {
  Globe2,
  Waves,
  Flame,
  Sun,
  Layers,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { KpiMetricCard } from "@/components/cards/kpi-metric-card";
import { PakistanMap } from "@/components/maps/pakistan-map";
import { HydroThermalChart } from "@/components/charts/hydro-thermal-chart";
import { IncidentFeedTable } from "@/components/tables/incident-feed-table";
import { buildCityRisks } from "@/lib/risk/city-risks";
import { listAssets } from "@/lib/finance/portfolio";
import { calculatePortfolio, formatPkr } from "@/lib/finance/model";
import type { RiskAssessment, RiskCategory } from "@/lib/risk/engine";

export const dynamic = "force-dynamic";

type DisplayCategory = RiskCategory | "Insufficient data";
type BadgeVariant = "safe" | "moderate" | "high" | "critical";

const BADGE_VARIANTS: Record<DisplayCategory, BadgeVariant> = {
  Low: "safe",
  Moderate: "moderate",
  High: "high",
  "Very High": "critical",
  Extreme: "critical",
  "Insufficient data": "moderate",
};

const CHIP_CLASSES: Record<DisplayCategory, string> = {
  Low: "bg-risk-safe/15 text-risk-safe",
  Moderate: "bg-risk-moderate/15 text-risk-moderate",
  High: "bg-risk-high/15 text-risk-high",
  "Very High": "bg-risk-critical/15 text-risk-critical",
  Extreme: "bg-risk-critical/25 text-risk-critical",
  "Insufficient data": "bg-slate-500/15 text-slate-400",
};

function hazardExtreme(cities: Awaited<ReturnType<typeof buildCityRisks>>["cities"], hazard: RiskAssessment["hazard"]) {
  const rows = cities
    .map((city) => ({
      city: city.city,
      risk: city.risks.find((item) => item.hazard === hazard),
    }))
    .filter((row): row is { city: string; risk: RiskAssessment } => Boolean(row.risk));
  const scored = rows.filter((row) => row.risk.score !== null && row.risk.category !== "Insufficient data");
  const worst = scored.sort((a, b) => (b.risk.score ?? 0) - (a.risk.score ?? 0))[0];
  const elevated = rows.filter(
    (row) => row.risk.category === "High" || row.risk.category === "Very High" || row.risk.category === "Extreme"
  ).length;
  return { worst, elevated, total: rows.length };
}

function formatGeneratedAt(value: string): string {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

function HazardBar({
  label,
  textClass,
  barClass,
  elevated,
  total,
}: {
  label: string;
  textClass: string;
  barClass: string;
  elevated: number;
  total: number;
}) {
  const percent = total === 0 ? 0 : Math.round((elevated / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold">
        <span className={textClass}>{label}</span>
        <span className="font-mono text-white">
          {elevated}/{total} cities
        </span>
      </div>
      <div className="h-2 w-full bg-brand-canvas rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default async function DashboardCommandCenter() {
  const { cities, incidents, generatedAt } = await buildCityRisks();
  const portfolio = calculatePortfolio(listAssets(), "base");
  const flood = hazardExtreme(cities, "flood");
  const heat = hazardExtreme(cities, "heatwave");
  const drought = hazardExtreme(cities, "drought");
  const liveCities = cities.filter((city) => city.weather.status === "live").length;
  const openSignals = incidents.filter((incident) => incident.status !== "closed");

  return (
    <div className="space-y-6">
      {/* Page Title & Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-4">
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Operations &gt; Command Center
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
            Climate Risk Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live Open-Meteo weather, GloFAS discharge and transparent heuristic screening for five Pakistani cities.
            Indices are not official warnings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-brand-canvas border border-brand-border text-[11px] font-mono text-slate-300">
            {cities.length} cities · {liveCities} live
          </span>
          <span className="px-2.5 py-1 rounded bg-risk-moderate/10 border border-risk-moderate/30 text-[11px] font-mono text-risk-moderate font-bold">
            ML validation: NOT VALIDATED
          </span>
        </div>
      </div>

      {/* Row 1: 4 Top KPI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiMetricCard
          title="Monitored Cities"
          metric={String(cities.length)}
          unit="Pakistan"
          subtext={`${liveCities} reporting live weather`}
          icon={Globe2}
          badge={{ label: "Open-Meteo", variant: "safe" }}
          trend={{ value: formatGeneratedAt(generatedAt), positive: true }}
        />
        <KpiMetricCard
          title="Flood Screening"
          metric={flood.worst?.risk.score != null ? String(flood.worst.risk.score) : "—"}
          unit="/ 100"
          subtext={
            flood.worst
              ? `${flood.worst.city} highest · ${flood.elevated}/${flood.total} at High+`
              : "No scored cities"
          }
          icon={Waves}
          badge={{
            label: flood.worst?.risk.category ?? "Insufficient",
            variant: BADGE_VARIANTS[flood.worst?.risk.category ?? "Insufficient data"],
          }}
          trend={{ value: `${flood.elevated} at High or above`, positive: flood.elevated === 0 }}
        />
        <KpiMetricCard
          title="Heat Screening"
          metric={heat.worst?.risk.score != null ? String(heat.worst.risk.score) : "—"}
          unit="/ 100"
          subtext={
            heat.worst
              ? `${heat.worst.city} highest · ${heat.elevated}/${heat.total} at High+`
              : "No scored cities"
          }
          icon={Flame}
          badge={{
            label: heat.worst?.risk.category ?? "Insufficient",
            variant: BADGE_VARIANTS[heat.worst?.risk.category ?? "Insufficient data"],
          }}
          trend={{ value: `${heat.elevated} at High or above`, positive: heat.elevated === 0 }}
        />
        <KpiMetricCard
          title="Drought Screening"
          metric={drought.worst?.risk.score != null ? String(drought.worst.risk.score) : "—"}
          unit="/ 100"
          subtext={
            drought.worst
              ? `${drought.worst.city} highest · ${drought.elevated}/${drought.total} at High+`
              : "No scored cities"
          }
          icon={Sun}
          badge={{
            label: drought.worst?.risk.category ?? "Insufficient",
            variant: BADGE_VARIANTS[drought.worst?.risk.category ?? "Insufficient data"],
          }}
          trend={{ value: `${drought.elevated} at High or above`, positive: drought.elevated === 0 }}
        />
      </div>

      {/* Row 2: Main Analytical Grid (65% Left, 35% Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: MapLibre Viewport + 48h Weather Trends (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Map Section */}
          <div className="rounded-xl border border-brand-border bg-brand-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-cyan" />
                <span className="text-sm font-bold text-white">City Hazard Screening Map</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-cyan/15 text-brand-cyan font-bold">
                  MapLibre
                </span>
              </div>
              <Link
                href="/dashboard/map"
                className="text-xs text-brand-cyan hover:underline flex items-center gap-1 font-mono font-medium"
              >
                <span>Fullscreen map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <PakistanMap height="h-[420px]" />
          </div>

          {/* Weather Trends Chart */}
          <div className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white">Hourly Weather Series</span>
                <p className="text-xs text-slate-400 font-mono">
                  Past 24 model hours + next 24 forecast hours · Karachi grid cell
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="w-2 h-2 rounded-full bg-brand-cyan inline-block" />
                <span>Open-Meteo model, not a station</span>
              </div>
            </div>
            <HydroThermalChart citySlug="karachi-sindh" />
          </div>
        </div>

        {/* Right: Risk Categorical Breakdown & Hazard Matrix (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Hazard Summary Matrix Cards */}
          <div className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
              <span className="text-sm font-bold text-white">Elevated hazards by city</span>
              <span className="text-xs font-mono text-slate-400">{openSignals.length} open signals</span>
            </div>

            <div className="space-y-2.5">
              <HazardBar
                label="Flood screening"
                textClass="text-blue-400"
                barClass="bg-blue-500"
                elevated={flood.elevated}
                total={flood.total}
              />
              <HazardBar
                label="Heat screening"
                textClass="text-orange-400"
                barClass="bg-orange-500"
                elevated={heat.elevated}
                total={heat.total}
              />
              <HazardBar
                label="Drought screening"
                textClass="text-amber-400"
                barClass="bg-amber-500"
                elevated={drought.elevated}
                total={drought.total}
              />
            </div>

            {/* Actionable Tri-Hazard Quick-Drill Cards */}
            <div className="space-y-2.5 pt-2">
              <Link
                href="/dashboard/flood"
                className="block p-3 rounded-lg bg-brand-canvas/70 border border-brand-border hover:border-blue-500/50 transition group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                      Flood screening detail
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${CHIP_CLASSES[flood.worst?.risk.category ?? "Insufficient data"]}`}
                  >
                    {flood.worst?.risk.score ?? "—"} · {flood.worst?.risk.category ?? "Insufficient"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  {flood.worst
                    ? `${flood.worst.city} highest. Rain, antecedent rainfall and GloFAS discharge anomaly weighted.`
                    : "No city returned a scored flood index."}
                </p>
              </Link>

              <Link
                href="/dashboard/heatwave"
                className="block p-3 rounded-lg bg-brand-canvas/70 border border-brand-border hover:border-orange-500/50 transition group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                      Heat screening detail
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${CHIP_CLASSES[heat.worst?.risk.category ?? "Insufficient data"]}`}
                  >
                    {heat.worst?.risk.score ?? "—"} · {heat.worst?.risk.category ?? "Insufficient"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  {heat.worst
                    ? `${heat.worst.city} highest. Temperature, apparent temperature, humidity and hot-day streak.`
                    : "No city returned a scored heat index."}
                </p>
              </Link>

              <Link
                href="/dashboard/drought"
                className="block p-3 rounded-lg bg-brand-canvas/70 border border-brand-border hover:border-amber-500/50 transition group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                      Drought screening detail
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${CHIP_CLASSES[drought.worst?.risk.category ?? "Insufficient data"]}`}
                  >
                    {drought.worst?.risk.score ?? "—"} · {drought.worst?.risk.category ?? "Insufficient"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  {drought.worst
                    ? `${drought.worst.city} highest. Seven-day rainfall dryness; anomaly and soil-moisture inputs may be missing.`
                    : "No city returned a scored drought index."}
                </p>
              </Link>
            </div>
          </div>

          {/* Quick Parametric Finance Summary Widget */}
          <div className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-brand-border/60 pb-2.5">
              <span className="text-sm font-bold text-white">Illustrative portfolio exposure</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-risk-moderate/15 text-risk-moderate font-bold">
                DEMO DATA
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">Asset value (base)</div>
                <div className="text-xl font-black font-mono text-white">
                  {formatPkr(portfolio.totalValuePkr, "crores")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-mono text-slate-400">Expected loss (base)</div>
                <div className="text-lg font-bold font-mono text-brand-cyan">
                  {formatPkr(portfolio.expectedDamagePkr, "crores")}
                </div>
              </div>
            </div>
            <p className="text-[10px] font-mono text-slate-500">
              {portfolio.label}. ROI {portfolio.roi == null ? "n/a" : `${(portfolio.roi * 100).toFixed(1)}%`} · BCR{" "}
              {portfolio.benefitCostRatio == null ? "n/a" : portfolio.benefitCostRatio.toFixed(2)}.
            </p>
            <Link
              href="/dashboard/portfolio"
              className="w-full mt-2 py-2 rounded-lg bg-brand-canvas border border-brand-border hover:border-brand-cyan/50 text-xs text-brand-cyan font-mono font-bold flex items-center justify-center gap-2 transition"
            >
              <span>Open illustrative portfolio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Telemetry Incident Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Heuristic model signals</h3>
            <p className="text-xs text-slate-400 font-mono">
              Generated from Open-Meteo weather and GloFAS discharge. Unverified; not official emergency alerts.
            </p>
          </div>
          <Link href="/dashboard/incidents" className="text-xs text-brand-cyan font-mono hover:underline flex items-center gap-1">
            <span>View all signals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <IncidentFeedTable incidents={incidents.slice(0, 8)} />
      </div>
    </div>
  );
}

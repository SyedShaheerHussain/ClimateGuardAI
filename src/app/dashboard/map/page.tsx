import React from "react";
import { Globe2, Radio } from "lucide-react";
import { PakistanMap } from "@/components/maps/pakistan-map";
import { buildCityRisks } from "@/lib/risk/city-risks";

export const dynamic = "force-dynamic";

export default async function GeospatialMapPage() {
  const { cities, generatedAt } = await buildCityRisks();
  const liveCities = cities.filter((city) => city.weather.status === "live");
  const ranked = [...cities].sort((a, b) => {
    const scoreOf = (city: (typeof cities)[number]) =>
      Math.max(
        ...city.risks
          .filter((risk) => risk.category !== "Insufficient data")
          .map((risk) => risk.score ?? 0),
        0
      );
    return scoreOf(b) - scoreOf(a);
  });
  const worst = ranked[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-3">
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Geospatial &gt; MapLibre console
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
            Pakistan Hazard Screening Map
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            City centroids coloured by heuristic screening category from live Open-Meteo and GloFAS values. This is not
            street-level inundation mapping.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-brand-sidebar border border-brand-border text-[11px] font-mono text-slate-300">
            {liveCities.length}/{cities.length} cities live
          </span>
          <span className="px-2.5 py-1 rounded bg-brand-cyan/10 border border-brand-cyan/30 text-[11px] font-mono text-brand-cyan font-bold flex items-center gap-1.5">
            <Radio className="w-3 h-3" />
            {new Date(generatedAt).toISOString().slice(11, 16)} UTC
          </span>
        </div>
      </div>

      <PakistanMap height="h-[620px]" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-brand-border bg-brand-card">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
            <Globe2 className="w-3 h-3" />
            Coverage
          </div>
          <div className="text-base font-bold text-white mt-1">{cities.length} Pakistani cities</div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            {new Set(cities.map((city) => city.province)).size} provinces / territories
          </div>
        </div>
        <div className="p-4 rounded-xl border border-brand-border bg-brand-card">
          <div className="text-[10px] font-mono uppercase text-slate-400">Highest screening score</div>
          <div className="text-base font-bold text-white mt-1">
            {worst
              ? `${worst.city} — ${Math.max(
                  ...worst.risks
                    .filter((risk) => risk.category !== "Insufficient data")
                    .map((risk) => risk.score ?? 0),
                  0
                )}/100`
              : "—"}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            {worst ? `Overall ${worst.overall}` : "No scores returned"}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-brand-border bg-brand-card">
          <div className="text-[10px] font-mono uppercase text-slate-400">GloFAS river discharge</div>
          <div className="text-base font-bold font-mono text-white mt-1">
            {worst?.flood.riverDischargeM3s == null ? "—" : `${worst.flood.riverDischargeM3s} m³/s`}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            {worst?.flood.dischargeAnomalyPct == null
              ? "No 30-day baseline available"
              : `${worst.flood.dischargeAnomalyPct > 0 ? "+" : ""}${worst.flood.dischargeAnomalyPct}% vs 30-day mean`}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-brand-border bg-brand-card">
          <div className="text-[10px] font-mono uppercase text-slate-400">Soil moisture (0–100 cm)</div>
          <div className="text-base font-bold font-mono text-brand-cyan mt-1">
            {worst?.soilMoistureM3m3 == null ? "—" : `${worst.soilMoistureM3m3} m³/m³`}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            {worst ? `${worst.city} · Open-Meteo soil layer` : "Unavailable"}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-card p-4 text-[10px] font-mono text-slate-500 leading-relaxed">
        Basemap © CARTO © OpenStreetMap contributors. Weather from Open-Meteo Forecast API; discharge from Open-Meteo
        Flood API (GloFAS). Values are model grid-cell quantities, not local gauges. Heuristic screening indices only.
        Pakistan-specific ML validation: NOT VALIDATED. Not an official warning.
      </div>
    </div>
  );
}

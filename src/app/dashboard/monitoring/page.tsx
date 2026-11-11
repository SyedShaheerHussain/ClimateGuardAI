import React from "react";
import Link from "next/link";
import { Activity, Radio, Wifi, WifiOff, Droplets, Thermometer, Waves } from "lucide-react";
import { HydroThermalChart } from "@/components/charts/hydro-thermal-chart";
import { buildCityRisks } from "@/lib/risk/city-risks";
import { staticIntegrationStatus } from "@/lib/integrations/registry";

export const dynamic = "force-dynamic";

function value(input: number | null, unit: string, digits = 1): string {
  if (input == null || !Number.isFinite(input)) return "—";
  return input.toFixed(digits) + " " + unit;
}

export default async function MonitoringPage({
  searchParams,
}: {
  searchParams?: { city?: string };
}) {
  const { cities, generatedAt } = await buildCityRisks();
  const selected = cities.find((city) => city.slug === searchParams?.city) ?? cities[0];
  const live = cities.filter((city) => city.weather.status === "live").length;
  const integrations = staticIntegrationStatus();

  const cards = selected
    ? [
        {
          label: "River discharge",
          icon: Waves,
          value: value(selected.flood.riverDischargeM3s, "m³/s", 2),
          note:
            selected.flood.dischargeAnomalyPct == null
              ? "No 30-day baseline"
              : (selected.flood.dischargeAnomalyPct > 0 ? "+" : "") + selected.flood.dischargeAnomalyPct + "% vs 30-day mean",
        },
        {
          label: "Precipitation (now)",
          icon: Droplets,
          value: value(selected.weather.values.precipitationMm, "mm", 2),
          note: "Next 24h " + value(selected.forecastPrecip24hMm, "mm", 1),
        },
        {
          label: "Temperature",
          icon: Thermometer,
          value: value(selected.weather.values.temperatureC, "°C"),
          note: "Apparent " + value(selected.weather.values.apparentTemperatureC, "°C") + " · RH " + value(selected.weather.values.humidityPct, "%", 0),
        },
        {
          label: "Soil moisture (0-100 cm)",
          icon: Activity,
          value: value(selected.soilMoistureM3m3, "m³/m³", 3),
          note: "Open-Meteo hourly soil layer",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-[#24364B] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
            <Radio className="w-3.5 h-3.5" />
            {live}/{cities.length} cities reporting live
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">Telemetry monitor</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Live Open-Meteo model fields and GloFAS discharge for the five configured Pakistani cities. Values are model
            grid-cell quantities, not PMD station observations.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-brand-sidebar border border-brand-border">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={"/dashboard/monitoring?city=" + city.slug}
              className={
                "px-3 py-1.5 rounded-md text-xs font-mono transition " +
                (city.slug === selected?.slug
                  ? "bg-brand-card text-brand-cyan border border-brand-cyan/40"
                  : "text-slate-400 hover:text-white")
              }
            >
              {city.city}
            </Link>
          ))}
        </div>
      </div>

      {selected && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-brand-canvas border border-brand-border text-xs font-mono">
            <div className="flex items-center gap-2">
              {selected.weather.status === "live" ? (
                <Wifi className="w-4 h-4 text-emerald-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-slate-500" />
              )}
              <span className="text-slate-300">{selected.weather.dataSource}</span>
            </div>
            <span className="text-slate-500">
              Model time {selected.weather.timestamp ?? "unavailable"} · evaluated{" "}
              {new Date(generatedAt).toISOString().slice(11, 16)} UTC
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div key={card.label} className="bg-[#101F33] border border-[#24364B] rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1">
                  <span className="uppercase">{card.label}</span>
                  <card.icon className="w-4 h-4 text-brand-cyan" />
                </div>
                <div className="text-2xl font-bold text-[#F8FAFC] font-mono">{card.value}</div>
                <div className="text-xs text-slate-400 mt-1 font-mono">{card.note}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-brand-border bg-brand-card p-5">
            <h3 className="text-sm font-bold text-white mb-2">{selected.city} hourly series</h3>
            <HydroThermalChart citySlug={selected.slug} />
          </div>
        </>
      )}

      <div className="rounded-xl border border-[#24364B] bg-[#101F33] p-5">
        <h3 className="text-sm font-bold text-[#F8FAFC] mb-3">All cities — latest evaluation</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-mono uppercase text-slate-400 border-b border-[#24364B]">
                <th className="py-2 pr-3">City</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Temp</th>
                <th className="py-2 pr-3">Rain 24h</th>
                <th className="py-2 pr-3">Discharge</th>
                <th className="py-2 pr-3">Soil</th>
                <th className="py-2">Overall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24364B]/60 font-mono">
              {cities.map((city) => (
                <tr key={city.slug}>
                  <td className="py-2 pr-3 text-slate-200">{city.city}</td>
                  <td className="py-2 pr-3">
                    <span className={city.weather.status === "live" ? "text-emerald-400" : "text-slate-500"}>
                      {city.weather.status === "live" ? "LIVE" : "UNAVAILABLE"}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-slate-300">{value(city.weather.values.temperatureC, "°C")}</td>
                  <td className="py-2 pr-3 text-slate-300">{value(city.forecastPrecip24hMm, "mm", 1)}</td>
                  <td className="py-2 pr-3 text-slate-300">{value(city.flood.riverDischargeM3s, "m³/s", 2)}</td>
                  <td className="py-2 pr-3 text-slate-300">{value(city.soilMoistureM3m3, "m³/m³", 3)}</td>
                  <td className="py-2 text-slate-300">{city.overall}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-[#24364B] bg-[#101F33] p-5">
        <h3 className="text-sm font-bold text-[#F8FAFC] mb-1">Integration configuration</h3>
        <p className="text-[10px] font-mono text-slate-500 mb-3">
          Configuration is derived from environment variables. Runtime success is reported separately by each API route.
        </p>
        <div className="divide-y divide-[#24364B]">
          {integrations.map((integration) => (
            <div key={integration.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <div className="font-semibold text-[#F8FAFC]">{integration.provider}</div>
                <div className="text-[#94A3B8]">{integration.category} · {integration.note}</div>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-slate-500/30 text-slate-300">
                {integration.configuration}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

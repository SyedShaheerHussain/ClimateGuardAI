import React from "react";
import Link from "next/link";
import { BarChart3, Info } from "lucide-react";
import { DailyHistoryChart } from "@/components/charts/daily-history-chart";
import { PAKISTAN_CITIES, resolveCity } from "@/lib/cities/pakistan";
import { getCityHistory } from "@/lib/weather/service";

export const dynamic = "force-dynamic";

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function numbers(values: Array<number | null>): number[] {
  return values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number | null, digits = 1): string {
  return value === null ? "—" : value.toFixed(digits);
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: { city?: string };
}) {
  const city = resolveCity(searchParams?.city ?? "") ?? PAKISTAN_CITIES[0];
  const end = isoDaysAgo(5);
  const start = isoDaysAgo(34);
  const history = await getCityHistory(city.slug, start, end);

  const days = history.days;
  const maxTemps = numbers(days.map((day) => day.tempMaxC));
  const rainValues = numbers(days.map((day) => day.precipitationMm));
  const hottest = days.reduce<(typeof days)[number] | null>(
    (best, day) =>
      day.tempMaxC !== null && (best === null || (best.tempMaxC ?? -Infinity) < day.tempMaxC) ? day : best,
    null
  );
  const totalRain = rainValues.length === 0 ? null : rainValues.reduce((sum, value) => sum + value, 0);

  const kpis = [
    { label: "Days returned", value: `${days.length}`, note: `${start} to ${end}` },
    { label: "Mean daily max", value: `${round(average(maxTemps))} °C`, note: "Open-Meteo reanalysis" },
    { label: "Hottest day", value: hottest ? `${round(hottest.tempMaxC)} °C` : "—", note: hottest?.date ?? "no value" },
    { label: "Total rainfall", value: `${round(totalRain)} mm`, note: "Sum of daily totals" },
  ];

  return (
    <div className="space-y-6">
      <header className="border-b border-brand-border/60 pb-4 space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
          Analytics &gt; Observed reanalysis
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">30-day climate analytics</h1>
        <p className="text-sm text-slate-400 max-w-3xl">
          Daily values are fetched from the Open-Meteo historical archive for {city.name}. The archive lags recent days, so the
          window ends five days ago. This is model reanalysis, not station observations.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {PAKISTAN_CITIES.map((item) => (
          <Link
            key={item.slug}
            href={`/dashboard/analytics?city=${item.slug}`}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
              item.slug === city.slug
                ? "bg-brand-cyan text-brand-canvas border-brand-cyan"
                : "bg-brand-canvas text-slate-300 border-brand-border hover:border-brand-cyan/50"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      {history.status !== "live" && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-100">
          Historical archive did not respond: {history.note}. No chart values are filled in.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-brand-border bg-brand-card p-4 space-y-1">
            <div className="text-[11px] font-mono uppercase text-slate-400">{kpi.label}</div>
            <div className="text-2xl font-black font-mono text-white">{kpi.value}</div>
            <div className="text-[11px] font-mono text-slate-500">{kpi.note}</div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-brand-border/60 pb-3">
          <BarChart3 className="w-4 h-4 text-brand-cyan" />
          <h2 className="text-sm font-bold text-white">Daily maximum temperature and rainfall</h2>
        </div>
        <DailyHistoryChart days={days} />
        <p className="text-[10px] font-mono text-slate-500 text-center">
          Source: {history.dataSource}. {history.note}
        </p>
      </section>

      <section className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-3">
        <h2 className="text-sm font-bold text-white border-b border-brand-border/60 pb-3">Most recent archive days</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="text-slate-400">
              <tr className="border-b border-brand-border/60">
                <th className="text-left py-2">Date</th>
                <th className="text-right py-2">Min °C</th>
                <th className="text-right py-2">Max °C</th>
                <th className="text-right py-2">Rain mm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/30">
              {days.slice(-10).reverse().map((day) => (
                <tr key={day.date}>
                  <td className="py-2 text-slate-200">{day.date}</td>
                  <td className="py-2 text-right text-slate-300">{day.tempMinC ?? "—"}</td>
                  <td className="py-2 text-right text-slate-300">{day.tempMaxC ?? "—"}</td>
                  <td className="py-2 text-right text-slate-300">{day.precipitationMm ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-brand-border bg-brand-canvas/40 p-5 space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Info className="w-4 h-4 text-brand-cyan" /> Not implemented
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Return-period frequency analysis, multi-year hazard score history, and forecasting models are not implemented. Earlier
          versions of this page displayed fixed numbers as if they were analysis. They were removed rather than relabelled.
        </p>
      </section>
    </div>
  );
}

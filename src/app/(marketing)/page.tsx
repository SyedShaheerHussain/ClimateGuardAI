import React from "react";
import Link from "next/link";
import { ArrowRight, Waves, Flame, Sun, ShieldCheck, Cpu, Coins } from "lucide-react";
import { buildCityRisks } from "@/lib/risk/city-risks";
import { listAssets } from "@/lib/finance/portfolio";
import { calculatePortfolio, formatPkr } from "@/lib/finance/model";
import type { RiskCategory } from "@/lib/risk/engine";

export const dynamic = "force-dynamic";

const CATEGORY_CLASSES: Record<RiskCategory | "Insufficient data", string> = {
  Low: "bg-risk-safe/15 text-risk-safe border-risk-safe/30",
  Moderate: "bg-risk-moderate/15 text-risk-moderate border-risk-moderate/30",
  High: "bg-risk-high/15 text-risk-high border-risk-high/30",
  "Very High": "bg-risk-critical/15 text-risk-critical border-risk-critical/30",
  Extreme: "bg-risk-critical/25 text-risk-critical border-risk-critical/40",
  "Insufficient data": "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const HAZARDS = [
  {
    key: "flood" as const,
    title: "Flood screening",
    icon: Waves,
    accent: "border-t-blue-500",
    iconClass: "bg-blue-500/15 border-blue-500/30 text-blue-400",
    body: "Combines Open-Meteo forecast precipitation with GloFAS river discharge and the 30-day discharge anomaly. A missing discharge value lowers confidence instead of being replaced.",
    source: "Open-Meteo forecast + Open-Meteo Flood API (GloFAS)",
  },
  {
    key: "heatwave" as const,
    title: "Heat screening",
    icon: Flame,
    accent: "border-t-orange-500",
    iconClass: "bg-orange-500/15 border-orange-500/30 text-orange-400",
    body: "Uses 2 m temperature, relative humidity, and consecutive hot days. Wet-bulb temperature is computed with the Stull (2011) approximation; it is not a measured WBGT.",
    source: "Open-Meteo hourly and daily forecast",
  },
  {
    key: "drought" as const,
    title: "Drought screening",
    icon: Sun,
    accent: "border-t-amber-500",
    iconClass: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    body: "Uses 7-day precipitation and, when supplied, negative precipitation and positive temperature anomalies. The live pipeline has no anomaly baseline yet, so drought reports Insufficient data rather than an alarm. Root-zone assimilation, SPEI, and vegetation indices are not implemented.",
    source: "Open-Meteo 7-day precipitation",
  },
];

export default async function HomePage() {
  const { cities, generatedAt } = await buildCityRisks();
  const portfolio = calculatePortfolio(listAssets(), "base");
  const highCount = cities.reduce(
    (sum, city) =>
      sum +
      city.risks.filter(
        (risk) => risk.category === "High" || risk.category === "Very High" || risk.category === "Extreme"
      ).length,
    0
  );
  const generatedLabel = new Date(generatedAt).toISOString().slice(0, 16).replace("T", " ") + " UTC";

  return (
    <div className="space-y-20 pb-20">
      <section className="relative pt-16 px-6 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/15 border border-brand-cyan/40 text-brand-cyan text-xs font-mono font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>HEURISTIC SCREENING · FIVE PAKISTAN CITIES</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
          Climate risk screening and <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-blue-400 to-brand-teal">
            disaster-finance simulation
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
          Live Open-Meteo model weather and GloFAS river discharge feed transparent, weighted hazard screens for Karachi,
          Hyderabad, Sukkur, Lahore, and Islamabad. Financial impact uses an illustrative PKR portfolio. This is a
          decision-support demo, not an official warning system, not a validated ML forecast product, and not a payment
          channel.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-cyan text-brand-canvas font-black text-sm hover:bg-brand-cyan/90 transition shadow-lg shadow-brand-cyan/25"
          >
            <span>Open the dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/how-it-works"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-card border border-brand-border text-white font-bold text-sm hover:border-slate-400 transition"
          >
            <span>How it works</span>
          </Link>
        </div>
      </section>

      <section className="px-6 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-brand-border bg-brand-card p-6 text-left space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border/60 pb-3">
            <span className="text-xs font-mono font-bold text-white uppercase">Latest heuristic snapshot</span>
            <span className="text-[11px] font-mono text-slate-400">{generatedLabel}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cities.map((city) => {
              const worst = city.risks
                .filter((risk) => risk.category !== "Insufficient data" && risk.score !== null)
                .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
              return (
                <div key={city.slug} className="rounded-xl bg-brand-canvas border border-brand-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{city.city}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        CATEGORY_CLASSES[(worst?.category ?? "Insufficient data") as keyof typeof CATEGORY_CLASSES]
                      }`}
                    >
                      {worst?.category ?? "Insufficient data"}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                    {city.risks.map((risk) => (
                      <div key={risk.hazard} className="flex justify-between">
                        <span className="capitalize">{risk.hazard}</span>
                        <span className="text-slate-300">
                          {risk.category === "Insufficient data"
                            ? "insufficient"
                            : risk.score === null
                              ? "—"
                              : `${risk.score}/100`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] font-mono text-slate-500">
            {highCount} city-hazard screens are High or above. Scores are heuristic indices with confidence equal to
            available weight. Pakistan-specific ML validation: NOT VALIDATED.
          </p>
        </div>
      </section>

      <section className="px-6 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs font-mono font-bold uppercase text-brand-cyan tracking-wider">Hazard screens</div>
          <h2 className="text-3xl font-black text-white tracking-tight">Three transparent indices</h2>
          <p className="max-w-xl mx-auto text-xs text-slate-400">
            Every score exposes its inputs, weights, and missing data. Nothing here calls itself a trained model.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HAZARDS.map((hazard) => {
            const Icon = hazard.icon;
            const worst = cities
              .map((city) => city.risks.find((risk) => risk.hazard === hazard.key))
              .filter((risk) => Boolean(risk))
              .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))[0];
            return (
              <div key={hazard.key} className={`p-6 rounded-2xl border border-brand-border bg-brand-card space-y-3 border-t-4 ${hazard.accent}`}>
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${hazard.iconClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">{hazard.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{hazard.body}</p>
                <div className="text-[11px] font-mono text-slate-500">{hazard.source}</div>
                <Link
                  href={`/dashboard/${hazard.key}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-cyan hover:underline"
                >
                  Open detail <ArrowRight className="w-3 h-3" />
                </Link>
                <div className="text-[10px] font-mono text-slate-500 border-t border-brand-border/50 pt-2">
                  Highest current screen: {worst?.category ?? "Insufficient data"}
                  {worst && worst.category !== "Insufficient data" ? ` (${worst.score}/100)` : ""}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-6 max-w-6xl mx-auto">
        <div className="rounded-2xl border border-brand-border bg-brand-card p-8 md:p-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-border/60 pb-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-mono font-bold uppercase text-brand-cyan tracking-wider">
                Disaster finance — simulation only
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight">Expected loss in PKR, not payouts</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                The finance engine multiplies asset value, exposure, vulnerability, hazard probability, and damage ratio,
                caps combined loss at asset value, and reports avoided loss from an intervention effectiveness input.
                Portfolio values are illustrative. Funding rules produce a simulated requirement and transfer nothing.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-brand-canvas border border-brand-border text-center shrink-0">
              <div className="text-[10px] font-mono uppercase text-slate-400">Illustrative portfolio value</div>
              <div className="text-3xl font-black font-mono text-brand-cyan mt-1">
                {formatPkr(portfolio.totalValuePkr, "crores")}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">Base scenario · not verified valuations</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="flex items-start gap-3">
              <Coins className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Conservative, base, optimistic</h4>
                <p className="text-slate-400 mt-0.5">
                  Probability multipliers change the expected damage. ROI and benefit-cost ratio return n/a when
                  intervention cost is zero.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Cpu className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Rules are evaluated, not executed</h4>
                <p className="text-slate-400 mt-0.5">
                  Each rule compares live public-data hazard categories with a minimum category. Results are labelled
                  SIMULATION — NO FUNDS ARE TRANSFERRED.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">No oracle quorum</h4>
                <p className="text-slate-400 mt-0.5">
                  No satellite quorum, smart contract, or blockchain notarization is implemented. Earlier marketing text
                  claiming otherwise has been removed.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/finance" className="px-4 py-2 rounded-lg bg-brand-cyan text-brand-canvas text-xs font-bold">
              Scenario engine
            </Link>
            <Link href="/dashboard/triggers" className="px-4 py-2 rounded-lg border border-brand-border text-xs font-bold text-white">
              Trigger rules
            </Link>
            <Link href="/dashboard/financial-impact" className="px-4 py-2 rounded-lg border border-brand-border text-xs font-bold text-white">
              Financial impact
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-dashed border-brand-border bg-brand-canvas/40 p-8 space-y-3">
          <h2 className="text-xl font-black text-white">What is validated, and what is not</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            C01 times exactly 100 deterministic inference inputs and records latency and RSS on the machine that runs the
            script; the results are served from reports/c01_results.json. C07 compares a primary model with logistic and
            heuristic baselines on a Rajasthan heatwave dataset. That dataset does not establish performance for Pakistan,
            and no Pakistan-specific labelled evaluation has been run.
          </p>
          <p className="text-xs font-mono text-amber-300">Pakistan-specific ML validation: NOT VALIDATED</p>
          <Link href="/dashboard/benchmark" className="inline-flex items-center gap-1 text-xs font-bold text-brand-cyan hover:underline">
            View benchmark results <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      <section className="px-6 max-w-4xl mx-auto text-center space-y-5">
        <h2 className="text-3xl font-black text-white tracking-tight">Inspect the implementation, not a pitch</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Every dashboard page reads the same city configuration and the same risk and finance engines. Data limitations
          are printed on the pages that depend on them.
        </p>
        <Link
          href="/dashboard/risk-intelligence"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-brand-cyan text-brand-canvas font-black text-sm hover:bg-brand-cyan/90 transition"
        >
          <span>Start with risk intelligence</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}

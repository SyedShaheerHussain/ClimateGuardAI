import React from "react";
import Link from "next/link";
import { Satellite, Cpu, ShieldCheck, Coins, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    num: "01",
    title: "Fetch public climate data",
    icon: Satellite,
    desc: "Server routes call the Open-Meteo forecast API for current, hourly, and daily weather; the Open-Meteo Flood API for GloFAS river discharge; and the archive API for historical daily values. NASA POWER and NASA FIRMS are optional and shown as unavailable when not configured.",
  },
  {
    num: "02",
    title: "Normalize and derive inputs",
    icon: Cpu,
    desc: "Responses are normalized into comparable units. The heat screen uses 2 m temperature, relative humidity, and consecutive hot days, with wet-bulb computed by the Stull (2011) approximation. Flood uses 3-day antecedent rain, 7-day rain, forecast rain, discharge, and the 30-day discharge anomaly. Drought uses 0-100 cm soil moisture.",
  },
  {
    num: "03",
    title: "Score with a transparent heuristic",
    icon: ShieldCheck,
    desc: "Each factor has a published full scale and weight. Missing factors are excluded and reduce the confidence value; they are never replaced with invented data. The weighted score maps to Low, Moderate, High, Very High, or Extreme bands. This is not a trained model, and it is not validated on labelled Pakistan events.",
  },
  {
    num: "04",
    title: "Decision support and simulation",
    icon: Coins,
    desc: "Dashboard pages, CSV/PDF/JSON exports, and funding rules consume the same scores. A rule can produce a simulated funding requirement when the observed category meets its minimum. Nothing is transferred, signed, or notarized; every finance surface is labelled simulation or illustrative data.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">How ClimateGuard AI works</h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          From public weather APIs to labeled simulation outputs. Each step below maps to code in this repository.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.num} className="p-6 rounded-2xl border border-brand-border bg-brand-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-brand-canvas border border-brand-border text-brand-cyan">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-2xl font-black text-slate-500">{step.num}</span>
              </div>
              <h3 className="text-base font-bold text-white">{step.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-6 space-y-2">
        <h2 className="text-base font-bold text-white">What is not in this pipeline</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          No satellite image classification, no SAR flood mask, no SMAP or FEWS NET ingestion, no oracle quorum, no
          smart-contract execution, and no automated disbursement. Earlier marketing pages described those systems as
          live; those claims were removed.
        </p>
      </div>

      <div className="text-center">
        <Link
          href="/dashboard/risk-intelligence"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-cyan text-brand-canvas text-sm font-black"
        >
          See the scores <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

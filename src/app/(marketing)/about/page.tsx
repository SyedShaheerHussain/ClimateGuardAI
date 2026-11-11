import React from "react";
import { Shield, Target, Users, FlaskConical } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">About ClimateGuard AI</h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          A Pakistan-focused climate risk screening and disaster-finance simulation platform built on public data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-brand-border bg-brand-card space-y-3">
          <Target className="w-8 h-8 text-brand-cyan" />
          <h3 className="text-lg font-bold text-white">Purpose</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Demonstrate how public climate APIs, transparent hazard indices, an illustrative PKR portfolio, and a
            simulation-only funding workflow can be assembled into one inspectable application. The goal is clarity about
            inputs and uncertainty, not automation of emergency decisions.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-brand-border bg-brand-card space-y-3">
          <Users className="w-8 h-8 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Intended audience</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Engineers and analysts evaluating the architecture, and disaster-management or finance teams reviewing how
            screening and simulated triggers could be structured. It is decision support for demonstration, not an official
            service.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-brand-border bg-brand-card space-y-3">
          <Shield className="w-8 h-8 text-risk-moderate" />
          <h3 className="text-lg font-bold text-white">Safety boundaries</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            No government alerts are issued. No funds are transferred. No Pakistan-specific machine-learning validation
            is claimed. Risk categories are heuristic screens, and every illustrative financial value is labelled as
            unverified.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-brand-border bg-brand-card space-y-3">
          <FlaskConical className="w-8 h-8 text-brand-cyan" />
          <h3 className="text-lg font-bold text-white">Benchmarks</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            C01 measures 100 real inferences with wall-clock time and resident memory on the host machine. C07 compares a
            primary model against logistic and heuristic baselines on a Rajasthan heatwave dataset. Neither benchmark
            establishes performance for Pakistan.
          </p>
        </div>
      </div>

      <p className="text-center text-xs font-mono text-amber-300">
        Pakistan-specific ML validation: NOT VALIDATED
      </p>
    </div>
  );
}

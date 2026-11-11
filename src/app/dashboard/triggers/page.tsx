import React from "react";
import Link from "next/link";
import { Zap, Info, Shield, ArrowRight, AlertTriangle, Waves, Flame, Leaf } from "lucide-react";
import { buildCityRisks } from "@/lib/risk/city-risks";
import { DEFAULT_FUNDING_RULES, evaluateFundingRule } from "@/lib/funding/simulation";
import { formatPkr } from "@/lib/finance/model";
import { RISK_CATEGORY_THRESHOLDS } from "@/lib/risk/engine";

export const dynamic = "force-dynamic";

export default async function FundingTriggersPage() {
  const { cities } = await buildCityRisks();
  const evaluations = cities.flatMap((city) =>
    city.risks.flatMap((risk) =>
      DEFAULT_FUNDING_RULES.filter((rule) => rule.hazard === risk.hazard).map((rule) => ({
        city: city.city,
        slug: city.slug,
        category: risk.category,
        score: risk.score,
        rule,
        evaluation: evaluateFundingRule(rule, { citySlug: city.slug, hazard: risk.hazard, category: risk.category }),
      }))
    )
  );
  const breached = evaluations.filter((row) => row.evaluation.breached);
  const requirement = breached.reduce((sum, row) => sum + row.evaluation.estimatedFundingPkr, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Disaster finance &gt; Trigger configuration
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">Funding trigger rules</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Rules map a city, hazard and minimum heuristic category to an estimated funding requirement. Evaluation is a
            calculation only: no bank rail, wallet, smart contract or government account is connected.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-lg bg-risk-moderate/15 border border-risk-moderate/40 text-risk-moderate text-xs font-mono font-bold">
          SIMULATION ONLY
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-brand-border bg-brand-card">
          <div className="text-xs font-mono uppercase text-slate-400">Configured rules</div>
          <div className="text-3xl font-black font-mono text-white mt-1">{DEFAULT_FUNDING_RULES.length}</div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Defined in lib/funding/simulation.ts</div>
        </div>
        <div className="p-5 rounded-xl border border-brand-border bg-brand-card">
          <div className="text-xs font-mono uppercase text-slate-400">Simulated breaches now</div>
          <div className="text-3xl font-black font-mono text-brand-cyan mt-1">{breached.length}</div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Against current live categories</div>
        </div>
        <div className="p-5 rounded-xl border border-brand-border bg-brand-card">
          <div className="text-xs font-mono uppercase text-slate-400">Simulated requirement</div>
          <div className="text-3xl font-black font-mono text-white mt-1">{formatPkr(requirement, "crores")}</div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Not a disbursement</div>
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-brand-border/60 pb-3">
          <Info className="w-4 h-4 text-brand-cyan" />
          <span className="text-sm font-bold text-white">How evaluation actually works</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {[
            { step: "1", icon: Shield, title: "Live category", desc: "Each city gets flood, heat and drought categories from the heuristic risk engine." },
            { step: "2", icon: Zap, title: "Rule match", desc: "A rule matches when city, hazard and minimum category all match. Status must also be eligible." },
            { step: "3", icon: Info, title: "Requirement estimate", desc: "A matched rule returns its configured PKR estimate. The model does not decide eligibility." },
            { step: "4", icon: ArrowRight, title: "Human review", desc: "Any real programme would require human authorisation and financial controls outside this demo." },
          ].map((s) => (
            <div key={s.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-canvas border border-brand-border flex items-center justify-center text-xs font-mono font-bold text-slate-400 shrink-0">
                {s.step}
              </div>
              <div>
                <div className="font-bold text-white mb-1">{s.title}</div>
                <div className="text-slate-400 leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 font-mono border-t border-brand-border/40 pt-3">
          No satellite oracle quorum is implemented. No automated payout is implemented. Only the functions in
          lib/funding/simulation.ts are executed.
        </p>
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-brand-border/60 pb-3">
          <AlertTriangle className="w-4 h-4 text-risk-moderate" />
          <span className="text-sm font-bold text-white">Category thresholds used by the heuristic</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-brand-border/60">
                <th className="text-left py-2 text-slate-400">Category</th>
                <th className="text-right py-2 text-slate-400">Index range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/30">
              <tr><td className="py-2 text-risk-safe">Low</td><td className="py-2 text-right text-slate-300">{RISK_CATEGORY_THRESHOLDS.low.min}–{RISK_CATEGORY_THRESHOLDS.low.max}</td></tr>
              <tr><td className="py-2 text-risk-moderate">Moderate</td><td className="py-2 text-right text-slate-300">{RISK_CATEGORY_THRESHOLDS.moderate.min}–{RISK_CATEGORY_THRESHOLDS.moderate.max}</td></tr>
              <tr><td className="py-2 text-risk-high">High</td><td className="py-2 text-right text-slate-300">{RISK_CATEGORY_THRESHOLDS.high.min}–{RISK_CATEGORY_THRESHOLDS.high.max}</td></tr>
              <tr><td className="py-2 text-risk-critical">Very High</td><td className="py-2 text-right text-slate-300">{RISK_CATEGORY_THRESHOLDS.veryHigh.min}–{RISK_CATEGORY_THRESHOLDS.veryHigh.max}</td></tr>
              <tr><td className="py-2 text-risk-critical">Extreme</td><td className="py-2 text-right text-slate-300">{RISK_CATEGORY_THRESHOLDS.extreme.min}–{RISK_CATEGORY_THRESHOLDS.extreme.max}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10px] font-mono text-slate-500">{RISK_CATEGORY_THRESHOLDS.basis}</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Rules against live city categories</h3>
          <Link href="/dashboard/finance" className="text-xs text-brand-cyan font-mono hover:underline flex items-center gap-1">
            <span>Open finance simulation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {evaluations.map((row) => (
            <div
              key={row.rule.id + "-" + row.slug}
              className={"rounded-xl border p-4 space-y-2 " + (row.evaluation.breached ? "border-risk-high/40 bg-risk-high/5" : "border-brand-border bg-brand-card")}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-white">{row.rule.name}</div>
                  <div className="text-[10px] font-mono text-slate-400">{row.city} · {row.rule.hazard}</div>
                </div>
                <span className={"text-[10px] font-mono px-1.5 py-0.5 rounded " + (row.evaluation.breached ? "bg-risk-high/15 text-risk-high" : "bg-slate-500/10 text-slate-400")}>
                  {row.evaluation.breached ? "SIMULATED" : "NOT MET"}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Score {row.score ?? "—"} · {row.category} · requires ≥ {row.rule.minimumCategory}
              </div>
              <div className="text-[10px] font-mono text-slate-500">{row.evaluation.reason}</div>
              <div className="text-[10px] font-mono text-slate-400">
                Estimate {formatPkr(row.evaluation.estimatedFundingPkr, "crores")} · transferred none
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-card p-4 text-[10px] font-mono text-slate-500 flex items-center gap-2">
        <Waves className="w-3.5 h-3.5 text-blue-400" />
        <Flame className="w-3.5 h-3.5 text-orange-400" />
        <Leaf className="w-3.5 h-3.5 text-amber-400" />
        <span>
          Categories derive from Open-Meteo and GloFAS fields. Pakistan-specific ML validation: NOT VALIDATED. These are
          not official hazard thresholds.
        </span>
      </div>
    </div>
  );
}

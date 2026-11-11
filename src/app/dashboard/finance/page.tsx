import React from "react";
import Link from "next/link";
import { Coins, ShieldCheck, Zap, ArrowRight, AlertCircle } from "lucide-react";
import { buildCityRisks } from "@/lib/risk/city-risks";
import { listAssets } from "@/lib/finance/portfolio";
import { calculatePortfolio, formatPkr, type ScenarioName } from "@/lib/finance/model";
import { DEFAULT_FUNDING_RULES, evaluateFundingRule } from "@/lib/funding/simulation";

export const dynamic = "force-dynamic";

const SCENARIOS: ScenarioName[] = ["conservative", "base", "optimistic"];

export default async function DisasterFinancePage() {
  const { cities } = await buildCityRisks();
  const assets = listAssets();
  const scenarios = SCENARIOS.map((scenario) => ({ scenario, result: calculatePortfolio(assets, scenario) }));
  const base = scenarios.find((row) => row.scenario === "base")!.result;

  const evaluations = cities.flatMap((city) =>
    city.risks.flatMap((risk) =>
      DEFAULT_FUNDING_RULES.filter((rule) => rule.hazard === risk.hazard).map((rule) => ({
        city: city.city,
        slug: city.slug,
        category: risk.category,
        rule,
        evaluation: evaluateFundingRule(rule, { citySlug: city.slug, hazard: risk.hazard, category: risk.category }),
      }))
    )
  );
  const breached = evaluations.filter((row) => row.evaluation.breached);
  const simulatedTotal = breached.reduce((sum, row) => sum + row.evaluation.estimatedFundingPkr, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Disaster risk finance &gt; Simulation
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">Parametric finance simulation</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Scenario-based expected-loss model on an illustrative asset portfolio and rule evaluation against live city
            screening categories. Nothing on this page executes a payment, moves funds, or represents a government
            disbursement.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-lg bg-risk-moderate/15 border border-risk-moderate/40 text-risk-moderate text-xs font-mono font-bold">
          SIMULATION ONLY — NO FUNDS TRANSFERRED
        </span>
      </div>

      <div className="p-4 rounded-xl border border-risk-moderate/30 bg-risk-moderate/10 flex items-start gap-2 text-xs font-mono text-risk-moderate">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{base.label}. Asset values, hazard probabilities and intervention costs are demo parameters, not audited valuations.</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-brand-border bg-brand-card">
          <div className="text-xs font-mono uppercase text-slate-400">Portfolio asset value</div>
          <div className="text-2xl font-black font-mono text-white mt-1">{formatPkr(base.totalValuePkr, "crores")}</div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">{base.assetCount} illustrative assets</div>
        </div>
        <div className="p-5 rounded-xl border border-brand-border bg-brand-card">
          <div className="text-xs font-mono uppercase text-slate-400">Expected loss (base)</div>
          <div className="text-2xl font-black font-mono text-brand-cyan mt-1">{formatPkr(base.expectedDamagePkr, "crores")}</div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Capped at asset value</div>
        </div>
        <div className="p-5 rounded-xl border border-brand-border bg-brand-card">
          <div className="text-xs font-mono uppercase text-slate-400">Avoided loss / net benefit</div>
          <div className="text-2xl font-black font-mono text-white mt-1">{formatPkr(base.avoidedLossPkr, "crores")}</div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Net {formatPkr(base.netBenefitPkr, "crores")}</div>
        </div>
        <div className="p-5 rounded-xl border border-brand-border bg-brand-card">
          <div className="text-xs font-mono uppercase text-slate-400">Return on intervention</div>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {base.roi == null ? "n/a" : (base.roi * 100).toFixed(1) + "%"}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">
            BCR {base.benefitCostRatio == null ? "n/a" : base.benefitCostRatio.toFixed(2)} · cost {formatPkr(base.interventionCostPkr, "crores")}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-card p-5">
        <div className="flex items-center justify-between border-b border-brand-border/60 pb-3 mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-brand-cyan" /> Scenario comparison
          </h3>
          <Link href="/dashboard/portfolio" className="text-xs text-brand-cyan font-mono hover:underline">
            Open portfolio detail →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-mono uppercase text-slate-400 border-b border-brand-border">
                <th className="py-2 pr-3">Scenario</th>
                <th className="py-2 pr-3">Probability multiplier</th>
                <th className="py-2 pr-3">Expected loss</th>
                <th className="py-2 pr-3">Avoided loss</th>
                <th className="py-2 pr-3">Net benefit</th>
                <th className="py-2 pr-3">ROI</th>
                <th className="py-2">BCR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60 font-mono">
              {scenarios.map((row) => (
                <tr key={row.scenario}>
                  <td className="py-2 pr-3 capitalize text-slate-200">{row.scenario}</td>
                  <td className="py-2 pr-3 text-slate-400">×{row.result.probabilityMultiplier}</td>
                  <td className="py-2 pr-3 text-slate-300">{formatPkr(row.result.expectedDamagePkr, "lakhs")}</td>
                  <td className="py-2 pr-3 text-slate-300">{formatPkr(row.result.avoidedLossPkr, "lakhs")}</td>
                  <td className="py-2 pr-3 text-slate-300">{formatPkr(row.result.netBenefitPkr, "lakhs")}</td>
                  <td className="py-2 pr-3 text-slate-300">{row.result.roi == null ? "n/a" : (row.result.roi * 100).toFixed(1) + "%"}</td>
                  <td className="py-2 text-slate-300">{row.result.benefitCostRatio == null ? "n/a" : row.result.benefitCostRatio.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl border border-brand-border bg-brand-card p-5">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3 mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-cyan" /> Funding rule evaluation (simulation)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">{breached.length} simulated breach(es)</span>
          </div>
          <div className="space-y-2">
            {evaluations.map((row) => (
              <div
                key={row.rule.id + "-" + row.slug}
                className={"p-3 rounded-lg border text-xs " + (row.evaluation.breached ? "border-risk-high/40 bg-risk-high/5" : "border-brand-border bg-brand-canvas")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-200">{row.rule.name}</span>
                  <span className={"font-mono text-[10px] px-1.5 py-0.5 rounded " + (row.evaluation.breached ? "bg-risk-high/15 text-risk-high" : "bg-slate-500/10 text-slate-400")}>
                    {row.evaluation.breached ? "SIMULATED BREACH" : "NOT MET"}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  {row.city} · {row.rule.hazard} · observed {row.category} · required ≥ {row.rule.minimumCategory}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">{row.evaluation.reason}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Estimated requirement if triggered: {formatPkr(row.evaluation.estimatedFundingPkr, "crores")} · transferred: none
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-brand-border bg-brand-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-cyan" /> Simulation controls
            </h3>
            <span className="text-[10px] font-mono text-slate-400">{DEFAULT_FUNDING_RULES.length} rules</span>
          </div>
          <p className="text-xs text-slate-400">
            Total estimated requirement across simulated breaches:{" "}
            <span className="font-mono text-white">{formatPkr(simulatedTotal, "crores")}</span>. This figure is a
            calculation, not a payout.
          </p>
          <ul className="text-[11px] font-mono text-slate-400 space-y-1.5 list-disc pl-4">
            <li>Rules evaluate live heuristic categories from the risk engine.</li>
            <li>No wallet, contract, bank rail or government account is connected.</li>
            <li>POST /api/funding/evaluate returns the same simulation payload.</li>
          </ul>
          <Link
            href="/dashboard/triggers"
            className="w-full py-2 rounded-lg bg-brand-canvas border border-brand-border hover:border-brand-cyan/50 text-xs text-brand-cyan font-mono font-bold flex items-center justify-center gap-2 transition"
          >
            <span>View trigger rules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

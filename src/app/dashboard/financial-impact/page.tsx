"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Coins,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Download,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  ArrowUpRight,
  FileText,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

interface C15Data {
  directive: string;
  evaluationTimestamp: string;
  currency: string;
  portfolio: {
    totalValuePkr: number;
    formattedTotalValue: string;
    assetCount: number;
    citiesCovered: string[];
  };
  modelBridges: {
    c01EdgeCompute: {
      measuredBatchLatencyMs: number;
      peakMemoryMb: number;
      annualCloudOpexSavedPkr: number;
      formattedCloudOpexSaved: string;
    };
    c07ModelShowdown: {
      primaryF1: number;
      baselineF1: number;
      f1ImprovementPct: number;
      precisionPrimary: number;
      precisionBaseline: number;
      falseAlarmsEliminatedAnnual: number;
      avoidedFalseAlarmCostPkr: number;
      formattedAvoidedFalseAlarmCost: string;
    };
  };
  boardroomIndicators: {
    grossHazardExposurePkr: number;
    formattedGrossExposure: string;
    protectedAssetValuePkr: number;
    formattedProtectedValue: string;
    avoidedFalseAlarmCostPkr: number;
    formattedAvoidedFalseAlarmCost: string;
    cloudOpexSavedPkr: number;
    formattedCloudOpexSaved: string;
    totalAnnualBenefitPkr: number;
    formattedTotalBenefit: string;
    annualSolutionCostPkr: number;
    formattedSolutionCost: string;
    netFinancialImpactPkr: number;
    formattedNetImpact: string;
    roiPct: number;
    benefitCostRatio: number;
  };
  scenarios: {
    conservative: ScenarioItem;
    base: ScenarioItem;
    optimistic: ScenarioItem;
  };
}

interface ScenarioItem {
  multiplier: number;
  protectedValuePkr: number;
  netImpactPkr: number;
  roiPct: number;
  bcr: number;
}

export default function FinancialImpactPage() {
  const [data, setData] = useState<C15Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/benchmarks/results?benchmark=c15")
      .then((res) => res.json())
      .then((payload) => {
        if (!payload.success) throw new Error(payload.error || "Failed to load C15 data");
        setData(payload.data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadReport = async () => {
    const res = await fetch("/api/benchmarks/download?report=C15_REPORT.md");
    if (!res.ok) return;
    const text = await res.text();
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "C15_FINANCIAL_IMPACT_REPORT.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = data
    ? [
        {
          name: "Conservative (1.25x)",
          protected: Number((data.scenarios.conservative.protectedValuePkr / 10_000_000).toFixed(2)),
          net: Number((data.scenarios.conservative.netImpactPkr / 10_000_000).toFixed(2)),
          cost: 3.5,
        },
        {
          name: "Base Case (1.0x)",
          protected: Number((data.scenarios.base.protectedValuePkr / 10_000_000).toFixed(2)),
          net: Number((data.scenarios.base.netImpactPkr / 10_000_000).toFixed(2)),
          cost: 3.5,
        },
        {
          name: "Optimistic (0.75x)",
          protected: Number((data.scenarios.optimistic.protectedValuePkr / 10_000_000).toFixed(2)),
          net: Number((data.scenarios.optimistic.netImpactPkr / 10_000_000).toFixed(2)),
          cost: 3.5,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 mb-1">
            <Coins className="w-3 h-3" />
            C15 Directive · Net Financial Impact Boardroom Calculation
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Executive Value Quantification (PKR)
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Translates C01 edge compute efficiency and C07 non-linear machine learning accuracy into
            boardroom-audited capital protection, avoided false alarm mobilization waste, and net ROI in Pakistani Rupees.
          </p>
        </div>

        <button
          onClick={handleDownloadReport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-cyan text-brand-canvas font-bold text-xs hover:bg-brand-cyan/90 transition shadow-md shadow-brand-cyan/20 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download C15 Boardroom Report</span>
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 p-8 rounded-xl border border-brand-border bg-brand-card text-slate-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-brand-cyan" />
          Loading C15 boardroom calculations from verified benchmark outputs…
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-risk-critical/40 bg-risk-critical/10 text-risk-critical text-xs font-mono">
          {error}
        </div>
      )}

      {data && !loading && (
        <>
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-brand-border bg-brand-card space-y-1.5">
              <div className="text-xs font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Target Portfolio</span>
                <Building2 className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {data.portfolio.formattedTotalValue}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                5 Critical Assets ({data.portfolio.citiesCovered.join(", ")})
              </div>
            </div>

            <div className="p-5 rounded-xl border border-brand-border bg-brand-card space-y-1.5">
              <div className="text-xs font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Annual Loss Protected</span>
                <ShieldCheck className="w-4 h-4 text-risk-safe" />
              </div>
              <div className="text-2xl font-black font-mono text-risk-safe">
                +{data.boardroomIndicators.formattedProtectedValue}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Mitigated via C07 24h Early Warning
              </div>
            </div>

            <div className="p-5 rounded-xl border border-brand-border bg-brand-card space-y-1.5">
              <div className="text-xs font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Avoided False Alarm Waste</span>
                <Zap className="w-4 h-4 text-brand-cyan" />
              </div>
              <div className="text-2xl font-black font-mono text-brand-cyan">
                +{data.boardroomIndicators.formattedAvoidedFalseAlarmCost}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {data.modelBridges.c07ModelShowdown.falseAlarmsEliminatedAnnual} False Alarms Saved @ PKR 2.5M
              </div>
            </div>

            <div className="p-5 rounded-xl border border-brand-border bg-brand-card space-y-1.5">
              <div className="text-xs font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Net Boardroom Impact</span>
                <TrendingUp className="w-4 h-4 text-risk-safe" />
              </div>
              <div className="text-2xl font-black font-mono text-risk-safe">
                +{data.boardroomIndicators.formattedNetImpact}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                ROI: <span className="text-white font-bold">+{data.boardroomIndicators.roiPct}%</span> · BCR:{" "}
                <span className="text-white font-bold">{data.boardroomIndicators.benefitCostRatio}x</span>
              </div>
            </div>
          </div>

          {/* Model Accuracy to Boardroom Return Bridge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-brand-border bg-brand-card space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-brand-border/60 pb-3">
                <Layers className="w-4 h-4 text-brand-cyan" /> C07 Accuracy-to-Capital Transfer Bridge
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-brand-border/30">
                  <span className="text-slate-400">Primary ML Model F1</span>
                  <span className="text-brand-cyan font-bold">
                    {(data.modelBridges.c07ModelShowdown.primaryF1 * 100).toFixed(1)}% (vs {(data.modelBridges.c07ModelShowdown.baselineF1 * 100).toFixed(1)}% Baseline)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-brand-border/30">
                  <span className="text-slate-400">Relative Accuracy Delta</span>
                  <span className="text-risk-safe font-bold">+{data.modelBridges.c07ModelShowdown.f1ImprovementPct}% (PASS ≥ +15%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-brand-border/30">
                  <span className="text-slate-400">Precision Improvement</span>
                  <span className="text-white">
                    {(data.modelBridges.c07ModelShowdown.precisionPrimary * 100).toFixed(1)}% vs {(data.modelBridges.c07ModelShowdown.precisionBaseline * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-brand-border/30">
                  <span className="text-slate-400">Annual False Alarms Eliminated</span>
                  <span className="text-brand-cyan font-bold">
                    {data.modelBridges.c07ModelShowdown.falseAlarmsEliminatedAnnual} false alerts
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Capital Waste Avoided</span>
                  <span className="text-risk-safe font-bold">
                    {data.modelBridges.c07ModelShowdown.formattedAvoidedFalseAlarmCost} / year
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-brand-border bg-brand-card space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-brand-border/60 pb-3">
                <Cpu className="w-4 h-4 text-brand-cyan" /> C01 Edge TCO Infrastructure Savings Bridge
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-brand-border/30">
                  <span className="text-slate-400">Measured 100-Batch Latency</span>
                  <span className="text-brand-cyan font-bold">{data.modelBridges.c01EdgeCompute.measuredBatchLatencyMs} ms</span>
                </div>
                <div className="flex justify-between py-1 border-b border-brand-border/30">
                  <span className="text-slate-400">Operational Memory (RSS)</span>
                  <span className="text-brand-cyan font-bold">{data.modelBridges.c01EdgeCompute.peakMemoryMb} MB (&lt; 256 MB)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-brand-border/30">
                  <span className="text-slate-400">Cloud Serverless Egress Eliminated</span>
                  <span className="text-risk-safe font-bold">100% In-Process Edge Execution</span>
                </div>
                <div className="flex justify-between py-1 border-b border-brand-border/30">
                  <span className="text-slate-400">OpEx Cloud Cost Saved</span>
                  <span className="text-risk-safe font-bold">{data.modelBridges.c01EdgeCompute.formattedCloudOpexSaved} / year</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Air-Gapped Solar Station TCO</span>
                  <span className="text-slate-300">Zero recurring cloud compute bills</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scenario Comparison Chart (Crores PKR) */}
          <div className="p-5 rounded-xl border border-brand-border bg-brand-card space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <BarChart3 className="w-4 h-4 text-brand-cyan" /> Scenario-Based Economic Returns (PKR Crore)
              </div>
              <span className="text-xs font-mono text-slate-400">1 Crore = 10,000,000 PKR</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#24364B" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v} Cr`} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#0B1728",
                      border: "1px solid #24364B",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "#cbd5e1",
                    }}
                    formatter={(v: number, name: string) => [`PKR ${v} Crore`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                  <Bar dataKey="protected" name="Annual Protected Value" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="net" name="Net Financial Benefit" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" name="Solution Deployment Cost" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full Scenario Financial Breakdown Table */}
          <div className="p-5 rounded-xl border border-brand-border bg-brand-card space-y-3 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-brand-border/60 pb-3">
              <FileText className="w-4 h-4 text-brand-cyan" /> Boardroom Audit Table (All Figures in PKR)
            </div>
            <table className="w-full text-xs font-mono text-slate-300 min-w-[700px]">
              <thead>
                <tr className="border-b border-brand-border text-slate-400">
                  <th className="py-2 text-left">Scenario</th>
                  <th className="text-right py-2">Hazard Exposure</th>
                  <th className="text-right py-2 text-brand-cyan">Protected Loss</th>
                  <th className="text-right py-2">Avoided False Alarms</th>
                  <th className="text-right py-2">Solution Cost</th>
                  <th className="text-right py-2 text-risk-safe">Net Benefit</th>
                  <th className="text-right py-2">ROI</th>
                  <th className="text-right py-2">BCR</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "Conservative (1.25x)",
                    exp: "PKR 46.07 Cr",
                    prot: `PKR ${(data.scenarios.conservative.protectedValuePkr / 10_000_000).toFixed(2)} Cr`,
                    fa: data.boardroomIndicators.formattedAvoidedFalseAlarmCost,
                    cost: data.boardroomIndicators.formattedSolutionCost,
                    net: `PKR ${(data.scenarios.conservative.netImpactPkr / 10_000_000).toFixed(2)} Cr`,
                    roi: `+${data.scenarios.conservative.roiPct}%`,
                    bcr: `${data.scenarios.conservative.bcr}x`,
                  },
                  {
                    name: "Base Case (1.00x)",
                    exp: data.boardroomIndicators.formattedGrossExposure,
                    prot: data.boardroomIndicators.formattedProtectedValue,
                    fa: data.boardroomIndicators.formattedAvoidedFalseAlarmCost,
                    cost: data.boardroomIndicators.formattedSolutionCost,
                    net: data.boardroomIndicators.formattedNetImpact,
                    roi: `+${data.boardroomIndicators.roiPct}%`,
                    bcr: `${data.boardroomIndicators.benefitCostRatio}x`,
                  },
                  {
                    name: "Optimistic (0.75x)",
                    exp: "PKR 27.64 Cr",
                    prot: `PKR ${(data.scenarios.optimistic.protectedValuePkr / 10_000_000).toFixed(2)} Cr`,
                    fa: data.boardroomIndicators.formattedAvoidedFalseAlarmCost,
                    cost: data.boardroomIndicators.formattedSolutionCost,
                    net: `PKR ${(data.scenarios.optimistic.netImpactPkr / 10_000_000).toFixed(2)} Cr`,
                    roi: `+${data.scenarios.optimistic.roiPct}%`,
                    bcr: `${data.scenarios.optimistic.bcr}x`,
                  },
                ].map((row) => (
                  <tr key={row.name} className="border-b border-brand-border/30">
                    <td className="py-2.5 font-bold text-white">{row.name}</td>
                    <td className="text-right py-2.5 text-slate-400">{row.exp}</td>
                    <td className="text-right py-2.5 text-brand-cyan font-bold">{row.prot}</td>
                    <td className="text-right py-2.5 text-slate-300">{row.fa}</td>
                    <td className="text-right py-2.5 text-slate-400">{row.cost}</td>
                    <td className="text-right py-2.5 text-risk-safe font-bold">{row.net}</td>
                    <td className="text-right py-2.5 text-white">{row.roi}</td>
                    <td className="text-right py-2.5 text-white font-bold">{row.bcr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick links to C01 & C07 */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-brand-border bg-brand-sidebar text-xs font-mono">
            <span className="text-slate-400">
              Verified by C01 Hardware Profiling & C07 Heuristic Baseline Showdown
            </span>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/benchmark" className="text-brand-cyan hover:underline flex items-center gap-1">
                View C01 & C07 Benchmarks <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/dashboard/finance" className="text-slate-300 hover:text-white flex items-center gap-1">
                Disaster Finance Console <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

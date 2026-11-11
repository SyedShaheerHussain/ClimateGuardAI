import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContributingDriver, RiskSeverity } from "@/types";

interface HazardRiskCardProps {
  title: string;
  model: string;
  severity: RiskSeverity;
  severityLabel: string;
  metricLabel: string;
  metricValue: string;
  anomalyDelta: string;
  drivers: ContributingDriver[];
  icon: LucideIcon;
}

const severityBorderColors = {
  safe: "border-l-risk-safe",
  moderate: "border-l-risk-moderate",
  high: "border-l-risk-high",
  critical: "border-l-risk-critical",
};

export function HazardRiskCard({
  title,
  model,
  severity,
  severityLabel,
  metricLabel,
  metricValue,
  anomalyDelta,
  drivers,
  icon: Icon,
}: HazardRiskCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-brand-border bg-brand-card p-5 border-l-4 transition-all hover:bg-brand-cardElevated/50",
        severityBorderColors[severity]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-brand-canvas border border-brand-border text-brand-cyan">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white leading-tight">{title}</h4>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{model}</p>
          </div>
        </div>
        <span
          className={cn(
            "text-xs font-bold uppercase px-2.5 py-1 rounded-md border",
            severity === "critical" && "bg-risk-critical/15 text-risk-critical border-risk-critical/30",
            severity === "high" && "bg-risk-high/15 text-risk-high border-risk-high/30",
            severity === "moderate" && "bg-risk-moderate/15 text-risk-moderate border-risk-moderate/30",
            severity === "safe" && "bg-risk-safe/15 text-risk-safe border-risk-safe/30"
          )}
        >
          {severityLabel}
        </span>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-brand-canvas/60 border border-brand-border/60">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
          {metricLabel}
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-black font-mono text-white">{metricValue}</span>
          <span className="text-xs font-mono font-medium text-slate-300">{anomalyDelta}</span>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
          Contributing Drivers & Physical Stressors
        </div>
        {drivers.map((driver) => (
          <div key={driver.label} className="space-y-1">
            <div className="flex justify-between text-xs text-slate-300">
              <span>{driver.label}</span>
              <span className="font-mono font-medium">{driver.percentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-brand-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-cyan rounded-full transition-all duration-500"
                style={{ width: `${driver.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

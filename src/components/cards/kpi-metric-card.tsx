import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiMetricCardProps {
  title: string;
  metric: string;
  unit?: string;
  subtext?: string;
  icon: LucideIcon;
  badge?: {
    label: string;
    variant: "safe" | "moderate" | "high" | "critical";
  };
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
}

const badgeVariants = {
  safe: "text-risk-safe bg-risk-safe/10 border-risk-safe/30",
  moderate: "text-risk-moderate bg-risk-moderate/10 border-risk-moderate/30",
  high: "text-risk-high bg-risk-high/10 border-risk-high/30",
  critical: "text-risk-critical bg-risk-critical/10 border-risk-critical/30",
};

export function KpiMetricCard({
  title,
  metric,
  unit,
  subtext,
  icon: Icon,
  badge,
  trend,
  className,
}: KpiMetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-brand-border bg-brand-card p-5 relative overflow-hidden transition-all hover:border-brand-cyan/40",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-mono">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {badge && (
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                badgeVariants[badge.variant]
              )}
            >
              {badge.label}
            </span>
          )}
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
          {metric}
        </span>
        {unit && <span className="text-sm text-slate-400 font-medium">{unit}</span>}
      </div>

      {(subtext || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-brand-border/60 pt-2.5">
          <span>{subtext}</span>
          {trend && (
            <span
              className={cn(
                "font-mono font-semibold",
                trend.positive ? "text-risk-safe" : "text-risk-high"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

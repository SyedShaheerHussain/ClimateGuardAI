import React from "react";
import { Coins, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { ParametricFundingRule } from "@/types";

interface ParametricRuleCardProps {
  rule: ParametricFundingRule;
  onAuditClick?: (rule: ParametricFundingRule) => void;
}

export function ParametricRuleCard({ rule, onAuditClick }: ParametricRuleCardProps) {
  const isTriggered = rule.status === "triggered";
  const isMonitoring = rule.status === "monitoring";

  return (
    <div
      className={cn(
        "rounded-xl border bg-brand-card p-5 relative overflow-hidden transition-all",
        isTriggered
          ? "border-risk-critical/60 shadow-lg shadow-risk-critical/10"
          : "border-brand-border hover:border-brand-cyan/40"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand-canvas border border-brand-border text-slate-300">
              {rule.ruleCode}
            </span>
            <span
              className={cn(
                "text-[10px] font-bold uppercase px-2 py-0.5 rounded border",
                isTriggered && "bg-risk-critical/20 text-risk-critical border-risk-critical/40",
                isMonitoring && "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40",
                !isTriggered && !isMonitoring && "bg-risk-safe/15 text-risk-safe border-risk-safe/40"
              )}
            >
              {rule.status.toUpperCase()}
            </span>
          </div>
          <h4 className="text-base font-bold text-white mt-1.5">{rule.name}</h4>
          <p className="text-xs text-slate-400 font-medium">{rule.basinName}</p>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase font-mono text-slate-400">Max Payout Cap</div>
          <div className="text-lg font-black font-mono text-brand-cyan">
            {formatCurrency(rule.maxPayoutUsd)}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-brand-canvas/70 border border-brand-border/60">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold font-mono flex items-center justify-between">
          <span>Trigger Condition</span>
          <span className="text-white font-mono">{rule.metricValue}</span>
        </div>
        <div className="text-xs font-mono text-slate-200 mt-1 font-semibold">
          {rule.conditionDescription}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-brand-border/60 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan" />
          <span>{rule.oracleQuorum}</span>
        </div>

        <button
          onClick={() => onAuditClick?.(rule)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold transition font-mono",
            isTriggered
              ? "bg-risk-critical text-white hover:bg-risk-critical/90 shadow-md shadow-risk-critical/20"
              : "bg-brand-cardElevated hover:bg-brand-cardElevated/80 text-brand-cyan border border-brand-border"
          )}
        >
          {isTriggered ? "Audit Trigger Condition" : "Configure Parameters"}
        </button>
      </div>
    </div>
  );
}

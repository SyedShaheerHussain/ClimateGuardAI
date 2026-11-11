"use client";

import React, { useState } from "react";
import { X, ShieldAlert, Sparkles, Waves, Flame, Sun, CheckCircle } from "lucide-react";
import { MONITORED_BASINS } from "@/config/site";
import { ParametricFundingRule } from "@/types";

interface CreateTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRuleCreated?: (newRule: ParametricFundingRule) => void;
}

export function CreateTriggerModal({ isOpen, onClose, onRuleCreated }: CreateTriggerModalProps) {
  const [ruleName, setRuleName] = useState("");
  const [hazardType, setHazardType] = useState<"flood" | "heatwave" | "drought">("flood");
  const [basinId, setBasinId] = useState(MONITORED_BASINS[0]?.id || "basin-1");
  const [thresholdValue, setThresholdValue] = useState("12000");
  const [durationHours, setDurationHours] = useState("6");
  const [payoutCap, setPayoutCap] = useState("5000000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedBasin = MONITORED_BASINS.find((b) => b.id === basinId);

    const newRule: ParametricFundingRule = {
      id: `rule-${Date.now()}`,
      ruleCode: `RULE-${Math.floor(1000 + Math.random() * 9000)}`,
      name: ruleName || `${selectedBasin?.name || "Catchment"} Protocol v1.0`,
      basinId,
      basinName: selectedBasin?.name || "Catchment Basin",
      hazardType,
      metricLabel: hazardType === "flood" ? "Discharge Rate" : hazardType === "heatwave" ? "WBGT Temp" : "Soil Moisture",
      metricValue: `${thresholdValue} ${hazardType === "flood" ? "m³/s" : hazardType === "heatwave" ? "°C" : "%"}`,
      conditionDescription: `${hazardType.toUpperCase()} threshold ${thresholdValue} sustained for ${durationHours}h`,
      thresholdOperator: ">=",
      thresholdValue: parseFloat(thresholdValue) || 12000,
      durationHours: parseInt(durationHours) || 6,
      maxPayoutUsd: parseFloat(payoutCap) || 5000000,
      status: "monitoring",
      oracleQuorum: "Not configured — simulation only",
      lastEvaluatedAt: "Just now",
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onRuleCreated?.(newRule);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg rounded-2xl border border-brand-border bg-brand-sidebar shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-canvas border border-brand-cyan/40 flex items-center justify-center text-brand-cyan">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Create Parametric Funding Rule</h3>
              <p className="text-xs text-slate-400 font-mono">Autonomous Multi-Sig Telemetry Contract</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-brand-canvas transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1.5">
              Rule Name
            </label>
            <input
              type="text"
              required
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="e.g. Paraná River Delta Flood Surge Protocol"
              className="w-full px-3.5 py-2 rounded-lg bg-brand-canvas border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1.5">
              Hazard Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setHazardType("flood")}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  hazardType === "flood"
                    ? "bg-brand-card border-brand-cyan text-brand-cyan"
                    : "border-brand-border text-slate-400 hover:text-white"
                }`}
              >
                <Waves className="w-3.5 h-3.5" />
                <span>Flood</span>
              </button>
              <button
                type="button"
                onClick={() => setHazardType("heatwave")}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  hazardType === "heatwave"
                    ? "bg-brand-card border-brand-cyan text-brand-cyan"
                    : "border-brand-border text-slate-400 hover:text-white"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Heatwave</span>
              </button>
              <button
                type="button"
                onClick={() => setHazardType("drought")}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  hazardType === "drought"
                    ? "bg-brand-card border-brand-cyan text-brand-cyan"
                    : "border-brand-border text-slate-400 hover:text-white"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Drought</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1.5">
              Catchment Basin
            </label>
            <select
              value={basinId}
              onChange={(e) => setBasinId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-brand-canvas border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none"
            >
              {MONITORED_BASINS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.region})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1.5">
                Trigger Threshold
              </label>
              <input
                type="number"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-brand-canvas border border-brand-border text-white text-xs font-mono focus:border-brand-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1.5">
                Duration (Hours)
              </label>
              <input
                type="number"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-brand-canvas border border-brand-border text-white text-xs font-mono focus:border-brand-cyan focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1.5">
              Maximum Liquidity Payout Cap ($ USD)
            </label>
            <input
              type="number"
              value={payoutCap}
              onChange={(e) => setPayoutCap(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-brand-canvas border border-brand-border text-brand-cyan text-xs font-mono font-bold focus:border-brand-cyan focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-brand-border text-xs text-slate-300 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-brand-cyan text-brand-canvas font-bold text-xs hover:bg-brand-cyan/90 transition shadow-md shadow-brand-cyan/20"
            >
              {isSubmitting ? "Deploying Protocol..." : "Deploy Parametric Rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

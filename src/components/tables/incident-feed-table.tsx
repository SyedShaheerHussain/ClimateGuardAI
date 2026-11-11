import React from "react";
import { Waves, Flame, Sun, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ManagedIncident } from "@/lib/incidents/store";

const SEVERITY_CLASSES: Record<string, string> = {
  Extreme: "bg-risk-critical/25 text-risk-critical border-risk-critical/50",
  "Very High": "bg-risk-critical/15 text-risk-critical border-risk-critical/30",
  High: "bg-risk-high/15 text-risk-high border-risk-high/30",
  Moderate: "bg-risk-moderate/15 text-risk-moderate border-risk-moderate/30",
  Low: "bg-risk-safe/15 text-risk-safe border-risk-safe/30",
};

const VERIFICATION_LABELS: Record<ManagedIncident["verificationStatus"], string> = {
  unverified_model_signal: "Model signal · unverified",
  user_imported: "User imported",
  illustrative: "Illustrative",
};

function hazardIcon(hazard: ManagedIncident["hazardType"]) {
  if (hazard === "flood") return <Waves className="w-3.5 h-3.5 text-blue-400" />;
  if (hazard === "heatwave") return <Flame className="w-3.5 h-3.5 text-orange-400" />;
  if (hazard === "drought") return <Sun className="w-3.5 h-3.5 text-amber-400" />;
  return <CircleDashed className="w-3.5 h-3.5 text-slate-400" />;
}

function formatDetected(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

interface IncidentFeedTableProps {
  incidents: ManagedIncident[];
  emptyMessage?: string;
}

export function IncidentFeedTable({
  incidents,
  emptyMessage = "No model signals currently meet the High threshold. Absence of a signal is not evidence of absence of hazard.",
}: IncidentFeedTableProps) {
  if (incidents.length === 0) {
    return (
      <div className="w-full rounded-xl border border-brand-border bg-brand-card p-8 text-center text-xs font-mono text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-brand-border bg-brand-card">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-brand-border bg-brand-sidebar text-[11px] font-mono uppercase text-slate-400">
            <th className="py-3 px-4">Hazard</th>
            <th className="py-3 px-4">City</th>
            <th className="py-3 px-4">Severity</th>
            <th className="py-3 px-4">Signal</th>
            <th className="py-3 px-4">Source</th>
            <th className="py-3 px-4">Evaluated</th>
            <th className="py-3 px-4">Verification</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border/60 font-sans">
          {incidents.map((incident) => (
            <tr key={incident.id} className="hover:bg-brand-cardElevated/50 transition">
              <td className="py-3.5 px-4">
                <span className="flex items-center gap-1.5 font-medium">
                  {hazardIcon(incident.hazardType)}
                  <span className="capitalize text-slate-300">{incident.hazardType}</span>
                </span>
              </td>
              <td className="py-3.5 px-4 font-medium text-slate-200">{incident.city}</td>
              <td className="py-3.5 px-4">
                <span
                  className={cn(
                    "text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border",
                    SEVERITY_CLASSES[incident.severity] ?? SEVERITY_CLASSES.Moderate
                  )}
                >
                  {incident.severity}
                </span>
              </td>
              <td className="py-3.5 px-4 text-slate-300 max-w-[320px]">{incident.description}</td>
              <td className="py-3.5 px-4 font-mono text-slate-400">{incident.source}</td>
              <td className="py-3.5 px-4 font-mono text-slate-400">{formatDetected(incident.detectedAt)}</td>
              <td className="py-3.5 px-4">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-500/10 text-slate-300 border border-slate-500/30">
                  {VERIFICATION_LABELS[incident.verificationStatus]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2 border-t border-brand-border/60 text-[10px] font-mono text-slate-500">
        Heuristic model signals only. Not government alerts. Verify with PMD, NDMA, or provincial authorities before acting.
      </div>
    </div>
  );
}

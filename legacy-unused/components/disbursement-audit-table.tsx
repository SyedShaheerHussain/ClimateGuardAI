import React from "react";
import { ShieldCheck, ExternalLink, Hash, CheckCircle2 } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { DisbursementAuditLog } from "@/types";
import { INITIAL_DISBURSEMENTS } from "@/config/site";

interface DisbursementAuditTableProps {
  disbursements?: DisbursementAuditLog[];
  onViewProof?: (log: DisbursementAuditLog) => void;
}

export function DisbursementAuditTable({
  disbursements = INITIAL_DISBURSEMENTS,
  onViewProof,
}: DisbursementAuditTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-brand-border bg-brand-card">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-brand-border bg-brand-sidebar text-[11px] font-mono uppercase text-slate-400">
            <th className="py-3 px-4">Request ID</th>
            <th className="py-3 px-4">Target Region</th>
            <th className="py-3 px-4">Hazard Trigger</th>
            <th className="py-3 px-4">Calculated Payout</th>
            <th className="py-3 px-4">Payout Velocity</th>
            <th className="py-3 px-4">Multisig Consensus</th>
            <th className="py-3 px-4">Merkle Proof Hash</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border/60 font-sans">
          {disbursements.map((log) => (
            <tr key={log.id} className="hover:bg-brand-cardElevated/50 transition">
              <td className="py-3.5 px-4 font-mono font-bold text-white">{log.requestId}</td>
              <td className="py-3.5 px-4 font-medium text-slate-200">{log.regionName}</td>
              <td className="py-3.5 px-4">
                <div className="font-mono text-xs text-slate-300 font-semibold">{log.triggerCondition}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.ruleCode}</div>
              </td>
              <td className="py-3.5 px-4 font-mono font-bold text-brand-cyan text-sm">
                {formatCurrency(log.payoutAmountUsd)}
              </td>
              <td className="py-3.5 px-4 font-mono text-slate-300">
                <span className="text-risk-safe font-bold">{log.payoutVelocityHours} Hours</span>
                <span className="text-[10px] text-slate-400 block">vs 45-day traditional</span>
              </td>
              <td className="py-3.5 px-4">
                <span
                  className={cn(
                    "text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border inline-flex items-center gap-1",
                    log.multisigStatus === "executed" && "bg-risk-safe/15 text-risk-safe border-risk-safe/30",
                    log.multisigStatus === "validation_queued" && "bg-risk-moderate/15 text-risk-moderate border-risk-moderate/30",
                    log.multisigStatus === "simulated_approved" && "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30"
                  )}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {log.statusLabel}
                </span>
              </td>
              <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                <div className="flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-400" />
                  <span>{log.merkleRootHash.slice(0, 10)}...{log.merkleRootHash.slice(-8)}</span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-right">
                <button
                  onClick={() => onViewProof ? onViewProof(log) : alert(`Simulation record:\nRequest ID: ${log.requestId}\nLocal reference: ${log.merkleRootHash}\nNo on-chain transaction exists and no funds were transferred.`)}
                  className="px-2.5 py-1 rounded bg-brand-canvas border border-brand-border text-slate-300 hover:text-brand-cyan hover:border-brand-cyan/50 text-[11px] font-mono font-semibold transition"
                >
                  Inspect Proof
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { Settings, ShieldAlert, Database, Bell } from "lucide-react";
import { RISK_CATEGORY_THRESHOLDS } from "@/lib/risk/engine";
import { isSupabaseConfigured } from "@/lib/security/guards";
import { staticIntegrationStatus } from "@/lib/integrations/registry";

export const dynamic = "force-dynamic";

const BANDS = [
  { label: "Low", range: RISK_CATEGORY_THRESHOLDS.low },
  { label: "Moderate", range: RISK_CATEGORY_THRESHOLDS.moderate },
  { label: "High", range: RISK_CATEGORY_THRESHOLDS.high },
  { label: "Very High", range: RISK_CATEGORY_THRESHOLDS.veryHigh },
  { label: "Extreme", range: RISK_CATEGORY_THRESHOLDS.extreme },
];

export default function SettingsPage() {
  const supabase = isSupabaseConfigured();
  const integrations = staticIntegrationStatus();

  return (
    <div className="space-y-6">
      <header className="border-b border-brand-border/60 pb-4 space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
          <Settings className="w-3.5 h-3.5" />
          System &gt; Configuration
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Workspace configuration</h1>
        <p className="text-sm text-slate-400 max-w-3xl">
          This page reports configuration that actually exists. There is no saved-settings store, no outbound webhook
          dispatch, and no multi-signature key registry in this build.
        </p>
      </header>

      <section className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-3">
        <h2 className="text-sm font-bold text-white border-b border-brand-border/60 pb-3">
          Risk category bands (compiled constants)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="text-slate-400">
              <tr className="border-b border-brand-border/60">
                <th className="text-left py-2">Category</th>
                <th className="text-right py-2">Index range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/30">
              {BANDS.map((band) => (
                <tr key={band.label}>
                  <td className="py-2 text-slate-200">{band.label}</td>
                  <td className="py-2 text-right text-slate-300">
                    {band.range.min}–{band.range.max}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{RISK_CATEGORY_THRESHOLDS.basis}</p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Database className="w-4 h-4 text-brand-cyan" /> Data source configuration
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5">
            {integrations.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 border-b border-brand-border/30 pb-1.5">
                <span>{item.provider}</span>
                <span className="font-mono text-brand-cyan text-right shrink-0">{item.configuration}</span>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/data-sources" className="inline-block text-xs font-bold text-brand-cyan hover:underline pt-1">
            Open data source registry
          </Link>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Bell className="w-4 h-4 text-brand-cyan" /> Notifications
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Alerts are generated in-app from the latest heuristic risk pull and exposed at{" "}
              <Link href="/dashboard/notifications" className="text-brand-cyan hover:underline">/dashboard/notifications</Link>.
              No email, SMS, Slack, or webhook delivery is implemented.
            </p>
          </div>

          <div className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <ShieldAlert className="w-4 h-4 text-brand-cyan" /> Authentication
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {supabase
                ? "Supabase environment variables are present. Dashboard routes are guarded by middleware; row-level security depends on the migrations in supabase/migrations."
                : "Demo mode. Supabase is not configured, so dashboard routes are reachable without a signed-in user. Do not deploy this mode to production with real data."}
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-brand-border bg-brand-canvas/40 p-5 space-y-1">
            <div className="text-sm font-bold text-slate-200">Not implemented</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Editable thresholds, saved preferences, outbound webhooks, smart-contract keys, and disbursement authorization
              quorums. Funding evaluation is a simulation and moves no funds.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

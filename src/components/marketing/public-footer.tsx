import React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-brand-border bg-brand-sidebar text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-cyan" />
            <span className="font-bold text-white text-sm">ClimateGuard AI</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Transparent climate risk screening and simulation-only disaster finance for five Pakistan cities. Built on
            public model data. Not an official warning service and not a payment channel.
          </p>
          <div className="text-[10px] font-mono text-slate-400">
            © 2026 ClimateGuard AI. Demo build.
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider font-mono">Platform</h4>
          <ul className="space-y-2">
            <li><Link href="/dashboard" className="hover:text-brand-cyan transition">Command Center</Link></li>
            <li><Link href="/dashboard/risk-intelligence" className="hover:text-brand-cyan transition">Hazard Screening</Link></li>
            <li><Link href="/dashboard/map" className="hover:text-brand-cyan transition">Geospatial Console</Link></li>
            <li><Link href="/dashboard/finance" className="hover:text-brand-cyan transition">Finance Scenarios</Link></li>
            <li><Link href="/dashboard/benchmark" className="hover:text-brand-cyan transition">C01 / C07 Benchmarks</Link></li>
            <li><Link href="/privacy" className="hover:text-brand-cyan transition">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-brand-cyan transition">Terms</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider font-mono">Wired Public Feeds</h4>
          <ul className="space-y-2">
            <li><span className="text-slate-300">Open-Meteo Forecast API</span></li>
            <li><span className="text-slate-300">Open-Meteo Flood API (GloFAS discharge)</span></li>
            <li><span className="text-slate-300">Open-Meteo Historical Archive</span></li>
            <li><span className="text-slate-300">NASA POWER (optional)</span></li>
            <li><span className="text-slate-300">NASA FIRMS (server key required)</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider font-mono">Limitations</h4>
          <ul className="space-y-2">
            <li><span className="text-slate-300">Heuristic indices, not ML forecasts</span></li>
            <li><span className="text-slate-300">Pakistan ML validation: NOT VALIDATED</span></li>
            <li><span className="text-slate-300">Funding is simulated; no funds move</span></li>
            <li><span className="text-slate-300">No official PMD / NDMA feed is polled</span></li>
            <li><Link href="/methodology" className="hover:text-brand-cyan transition">Methodology</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

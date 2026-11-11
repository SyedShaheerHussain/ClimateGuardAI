"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, Play, MapPin, Bell } from "lucide-react";
import { PAKISTAN_CITIES } from "@/lib/cities/pakistan";

interface IncidentsResponse {
  incidents?: Array<{ severity?: string }>;
}

export function DashboardNavbar() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"ok" | "error">("ok");
  const [elevatedIncidents, setElevatedIncidents] = useState(0);

  useEffect(() => {
    fetch("/api/incidents", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: IncidentsResponse) => {
        const elevated = (payload.incidents ?? []).filter(
          (item) => item.severity === "critical" || item.severity === "high"
        ).length;
        setElevatedIncidents(elevated);
      })
      .catch(() => setElevatedIncidents(0));
  }, []);

  async function handleRefresh() {
    setIsSyncing(true);
    setStatus(null);
    try {
      const response = await fetch("/api/risk/cities", { cache: "no-store" });
      const payload = await response.json();
      const count = Array.isArray(payload.cities) ? payload.cities.length : 0;
      if (!response.ok || count === 0) {
        setStatusTone("error");
        setStatus(`Refresh failed (HTTP ${response.status})`);
      } else {
        setStatusTone("ok");
        setStatus(
          `${count}/${PAKISTAN_CITIES.length} city feeds reached · ${new Date().toLocaleTimeString("en-PK", { hour12: false })}`
        );
        router.refresh();
      }
    } catch {
      setStatusTone("error");
      setStatus("Refresh failed: network error");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="w-full flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-canvas border border-brand-border text-xs text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
          <span className="font-semibold text-white">Pakistan</span>
          <span className="font-mono text-slate-400">{PAKISTAN_CITIES.length} cities</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-mono truncate">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              statusTone === "error" ? "bg-risk-critical" : "bg-brand-cyan"
            }`}
          />
          <span>{status ?? "Open-Meteo nowcast · GloFAS discharge · heuristic screening"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={handleRefresh}
          disabled={isSyncing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-canvas border border-brand-border text-xs text-slate-300 hover:text-white hover:border-brand-cyan/50 transition-all font-mono disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-brand-cyan ${isSyncing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{isSyncing ? "Refreshing…" : "Refresh data"}</span>
        </button>

        <Link
          href="/dashboard/financial-impact"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-cyan/15 hover:bg-brand-cyan/25 border border-brand-cyan/40 text-brand-cyan text-xs font-bold transition-all shadow-sm shadow-brand-cyan/10"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Financial scenarios</span>
        </Link>

        <div className="relative">
          <Link
            href="/dashboard/incidents"
            title="Unverified model signals"
            className="p-2 rounded-lg bg-brand-canvas border border-brand-border text-slate-300 hover:text-white transition inline-flex"
          >
            <Bell className="w-4 h-4" />
          </Link>
          {elevatedIncidents > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-risk-critical rounded-full border-2 border-brand-navbar text-[9px] font-bold text-white flex items-center justify-center">
              {elevatedIncidents}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IncidentFeedTable } from "@/components/tables/incident-feed-table";
import type { ManagedIncident } from "@/lib/incidents/store";
import {
  AlertTriangle,
  Filter,
  Search,
  Download,
  RefreshCw,
  Loader2,
  Upload,
  X,
} from "lucide-react";

type HazardFilter = "all" | "flood" | "heatwave" | "drought" | "fire" | "other";

interface IncidentsResponse {
  success: boolean;
  incidents: ManagedIncident[];
  generatedAt?: string;
  error?: string;
}

interface ImportResponse {
  success?: boolean;
  note?: string;
  incidents?: ManagedIncident[];
  error?: string;
  details?: unknown;
}

const IMPORT_TEMPLATE = JSON.stringify(
  {
    incidents: [
      {
        id: "pmd-manual-2026-11-12-karachi-01",
        hazardType: "flood",
        city: "Karachi",
        latitude: 24.8607,
        longitude: 67.0011,
        severity: "High",
        description: "REPLACE — short summary copied from the imported bulletin",
        source: "PMD bulletin (manually imported)",
        detectedAt: "2026-11-12T06:00:00Z",
        status: "monitoring",
      },
    ],
  },
  null,
  2
);

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<ManagedIncident[]>([]);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [hazardFilter, setHazardFilter] = useState<HazardFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importFeedback, setImportFeedback] = useState<
    { kind: "success" | "error"; message: string } | null
  >(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/incidents")
      .then((response) => {
        if (!response.ok) throw new Error(`Incidents API returned HTTP ${response.status}`);
        return response.json() as Promise<IncidentsResponse>;
      })
      .then((json) => {
        if (!json.success || !Array.isArray(json.incidents)) {
          throw new Error(json.error ?? "Unexpected incidents payload");
        }
        setIncidents(json.incidents);
        setGeneratedAt(json.generatedAt ?? null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load incidents");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      incidents.filter((incident) => {
        if (severityFilter !== "all" && incident.severity !== severityFilter) return false;
        if (hazardFilter !== "all" && incident.hazardType !== hazardFilter) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (
            !incident.city.toLowerCase().includes(query) &&
            !incident.description.toLowerCase().includes(query)
          ) {
            return false;
          }
        }
        return true;
      }),
    [incidents, severityFilter, hazardFilter, searchQuery]
  );

  const counts = useMemo(
    () => ({
      extreme: incidents.filter((item) => item.severity === "Extreme").length,
      veryHigh: incidents.filter((item) => item.severity === "Very High").length,
      high: incidents.filter((item) => item.severity === "High").length,
      active: incidents.filter((item) => item.status !== "closed").length,
    }),
    [incidents]
  );

  const exportCsv = () => {
    const header = ["hazard", "city", "severity", "description", "source", "detectedAt", "status", "verification"];
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = filtered.map((item) =>
      [
        item.hazardType,
        item.city,
        item.severity,
        item.description,
        item.source,
        item.detectedAt,
        item.status,
        item.verificationStatus,
      ]
        .map((value) => escape(String(value)))
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `climateguard-model-signals-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setImportText(text);
    setImportFileName(file.name);
    setImportFeedback(null);
  };

  const submitImport = async () => {
    setImportFeedback(null);
    let payload: unknown;
    try {
      payload = JSON.parse(importText);
    } catch {
      setImportFeedback({ kind: "error", message: "That is not valid JSON. Fix the syntax and try again." });
      return;
    }
    const count = Array.isArray((payload as { incidents?: unknown[] })?.incidents)
      ? (payload as { incidents: unknown[] }).incidents.length
      : 0;
    setImportBusy(true);
    try {
      const response = await fetch("/api/imports/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as ImportResponse | null;
      if (!response.ok || !body?.success) {
        const details = body?.details ? ` ${JSON.stringify(body.details)}` : "";
        throw new Error(`${body?.error ?? `HTTP ${response.status}`}${details}`);
      }
      setImportFeedback({
        kind: "success",
        message: `Imported ${count} record(s). Stored in server memory as user_imported, not official alerts.`,
      });
      setImportText("");
      setImportFileName(null);
      load();
    } catch (err) {
      setImportFeedback({
        kind: "error",
        message: err instanceof Error ? err.message : "Import failed",
      });
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#24364B] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            {counts.active} open model signals
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
            Model Signal Log
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Heuristic hazard signals generated from live Open-Meteo and GloFAS fields. These are not official
            emergency alerts and have not been verified in the field.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowImport((open) => !open);
              setImportFeedback(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#101F33] border border-[#24364B] text-sm text-[#F8FAFC] hover:border-[#22D3EE] transition-colors"
          >
            <Upload className="w-4 h-4 text-[#22D3EE]" />
            Import PMD/NDMA
          </button>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#101F33] border border-[#24364B] text-sm text-[#F8FAFC] hover:border-[#22D3EE] transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#22D3EE]" />
            Export CSV
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#101F33] border border-[#24364B] text-sm text-[#F8FAFC] hover:border-[#22D3EE] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[#22D3EE] ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#101F33] border border-rose-500/40 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-rose-400">{counts.extreme}</div>
          <div className="text-xs text-[#94A3B8]">Extreme</div>
        </div>
        <div className="bg-[#101F33] border border-red-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-red-400">{counts.veryHigh}</div>
          <div className="text-xs text-[#94A3B8]">Very High</div>
        </div>
        <div className="bg-[#101F33] border border-orange-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-orange-400">{counts.high}</div>
          <div className="text-xs text-[#94A3B8]">High</div>
        </div>
        <div className="bg-[#101F33] border border-[#24364B] rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-[#F8FAFC]">{incidents.length}</div>
          <div className="text-xs text-[#94A3B8]">Total Signals</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search by city or signal description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#101F33] border border-[#24364B] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#94A3B8] outline-none focus:border-[#22D3EE]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#94A3B8]" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#101F33] text-sm text-[#F8FAFC] border border-[#24364B] rounded-lg px-3 py-2.5 outline-none focus:border-[#22D3EE]"
          >
            <option value="all">All severities</option>
            <option value="Extreme">Extreme</option>
            <option value="Very High">Very High</option>
            <option value="High">High</option>
          </select>

          <select
            value={hazardFilter}
            onChange={(e) => setHazardFilter(e.target.value as HazardFilter)}
            className="bg-[#101F33] text-sm text-[#F8FAFC] border border-[#24364B] rounded-lg px-3 py-2.5 outline-none focus:border-[#22D3EE]"
          >
            <option value="all">All hazards</option>
            <option value="flood">Flood</option>
            <option value="heatwave">Heatwave</option>
            <option value="drought">Drought</option>
            <option value="fire">Fire</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {showImport && (
        <div className="rounded-xl border border-[#24364B] bg-[#101F33] p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-[#F8FAFC]">Import an operator file</h2>
              <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl">
                Paste or load a JSON file of bulletin records. There is no live PMD/NDMA/PDMA feed wired, so nothing
                arrives here automatically. Imported rows are tagged <span className="font-mono">user_imported</span>,
                are not government alerts, and are lost when the server restarts.
              </p>
            </div>
            <button
              onClick={() => setShowImport(false)}
              aria-label="Close import panel"
              className="p-1.5 rounded-lg border border-[#24364B] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#22D3EE] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#24364B] bg-[#0B1626] text-[#F8FAFC] cursor-pointer hover:border-[#22D3EE] transition-colors">
              <Upload className="w-3.5 h-3.5 text-[#22D3EE]" />
              Choose JSON file
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => onImportFile(e.target.files?.[0])}
              />
            </label>
            {importFileName && <span className="font-mono text-[#94A3B8]">{importFileName}</span>}
            <button
              onClick={() => {
                setImportText(IMPORT_TEMPLATE);
                setImportFileName(null);
                setImportFeedback(null);
              }}
              className="px-3 py-2 rounded-lg border border-[#24364B] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#22D3EE] transition-colors"
            >
              Load template
            </button>
          </div>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={10}
            spellCheck={false}
            placeholder='{ "incidents": [ { "id": "...", "hazardType": "flood", ... } ] }'
            className="w-full font-mono text-xs bg-[#0B1626] border border-[#24364B] rounded-lg p-3 text-[#F8FAFC] placeholder:text-[#64748B] outline-none focus:border-[#22D3EE]"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[10px] font-mono text-[#64748B]">
              Max 100 records per request · id, hazardType, city, latitude, longitude, severity, description, source,
              detectedAt, status
            </p>
            <button
              onClick={submitImport}
              disabled={importBusy || importText.trim().length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22D3EE] text-[#06121F] text-sm font-bold hover:bg-[#67E8F9] transition-colors disabled:opacity-50"
            >
              {importBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Import records
            </button>
          </div>

          {importFeedback && (
            <div
              className={
                "rounded-lg border p-3 text-xs font-mono " +
                (importFeedback.kind === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300")
              }
            >
              {importFeedback.message}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-risk-moderate/30 bg-risk-moderate/10 p-4 text-xs font-mono text-risk-moderate">
          Unable to load model signals: {error}. No placeholder data is shown.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs font-mono text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-brand-cyan" />
          Evaluating live city signals…
        </div>
      ) : (
        <IncidentFeedTable incidents={filtered} />
      )}

      {generatedAt && !loading && (
        <p className="text-[10px] font-mono text-slate-500">
          Evaluated {new Date(generatedAt).toISOString().slice(0, 16).replace("T", " ")} UTC · Pakistan-specific ML
          validation: NOT VALIDATED.
        </p>
      )}
    </div>
  );
}

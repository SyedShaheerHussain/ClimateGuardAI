import React from "react";
import Link from "next/link";
import { Satellite, Cloud, Waves, Database, Globe2, KeyRound, FileUp, Bot } from "lucide-react";
import { staticIntegrationStatus } from "@/lib/integrations/registry";

export const dynamic = "force-dynamic";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "open-meteo": Cloud,
  "nasa-power": Database,
  "nasa-firms": Satellite,
  "copernicus-cds": Waves,
  maplibre: Globe2,
  openai: Bot,
  "pmd-ndma": FileUp,
};

const DETAILS: Record<string, { summary: string; usedFor: string; limitation: string }> = {
  "open-meteo": {
    summary: "Public forecast, archive, and flood endpoints. No account is required for the default host.",
    usedFor: "Current and hourly weather, 7-day daily forecast, 30-day archive, soil moisture, and GloFAS river discharge.",
    limitation: "Model grid values, not surface station observations. Availability depends on the public API.",
  },
  "nasa-power": {
    summary: "NASA POWER point API for historical daily climate parameters.",
    usedFor: "Optional historical daily point values on the satellite page.",
    limitation: "Not merged into the risk engine. Sparse or missing parameters are returned as unavailable.",
  },
  "nasa-firms": {
    summary: "NASA FIRMS active-fire detections. Requires a server-side map key.",
    usedFor: "Fire pixel listing on the satellite page when a key is configured.",
    limitation: "Without a key the route returns a needs-key status. No detections are fabricated.",
  },
  "copernicus-cds": {
    summary: "Copernicus Climate Data Store ERA5 access through the cdsapi client.",
    usedFor: "Nothing automatically. scripts/ingest/copernicus_cds.py documents a manual ingestion path.",
    limitation: "Credentials alone do not sync data. No CDS job is scheduled by this application.",
  },
  maplibre: {
    summary: "MapLibre GL JS with public CARTO/OSM raster tiles.",
    usedFor: "The geospatial console basemap and city markers.",
    limitation: "No satellite flood extent or raster analytics layer is rendered.",
  },
  openai: {
    summary: "Optional narrative briefing model, called server-side only.",
    usedFor: "Executive briefing text when OPENAI_API_KEY is present.",
    limitation: "Without a key the briefing endpoint returns a deterministic template, not a model response.",
  },
  "pmd-ndma": {
    summary: "Pakistan Meteorological Department and NDMA/PDMA official products.",
    usedFor: "Operator-driven import from the Incidents page (/dashboard/incidents) or POST /api/imports/incidents. Nothing is fetched automatically.",
    limitation: "No stable public JSON feed is wired, so this is a manual path, not a live official feed. Imported records are marked user_imported, are not government alerts, and are lost when the server restarts.",
  },
};

export default function DataSourcesPage() {
  const sources = staticIntegrationStatus();

  return (
    <div className="pt-6 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 mb-4">
            <Database className="w-3.5 h-3.5" />
            Data source registry
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            What the platform actually reads
          </h1>
          <p className="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Seven providers are described in code. Four work without credentials, two require a server key or manual
            ingestion, and no official Pakistani government feed is polled. Status below is configuration, not uptime.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sources.map((source) => {
            const Icon = ICONS[source.id] ?? Database;
            const detail = DETAILS[source.id];
            return (
              <div key={source.id} className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-brand-canvas border border-brand-border text-brand-cyan">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-black text-white text-base">{source.provider}</div>
                      <div className="text-xs text-slate-400">{source.category}</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded border border-brand-border bg-brand-canvas text-[10px] font-mono font-bold text-brand-cyan shrink-0">
                    {source.configuration}
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">{detail?.summary}</p>

                <div className="space-y-2 pt-3 border-t border-brand-border/60 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold">Used for: </span>
                    <span className="text-slate-300">{detail?.usedFor}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Limitation: </span>
                    <span className="text-slate-300">{detail?.limitation}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-400 pt-1">
                    <span className="inline-flex items-center gap-1">
                      <KeyRound className="w-3 h-3" />
                      {source.auth}
                    </span>
                    <span>{source.envVars.length > 0 ? source.envVars.join(", ") : "no server secret"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-8 space-y-3">
          <h2 className="text-xl font-black text-white">Claims this build does not make</h2>
          <ul className="text-sm text-slate-400 leading-relaxed space-y-1.5 list-disc pl-5">
            <li>No uptime SLA, API latency figure, or detection-accuracy percentage is claimed for any provider.</li>
            <li>No Sentinel SAR flood mask, SMAP root-zone assimilation, FEWS NET classification, or GPM ingestion is implemented.</li>
            <li>No parametric trigger is verified by an oracle quorum. Triggers are evaluated against heuristic categories.</li>
            <li>No funding is transferred. Financial outputs are labelled illustrative or simulated on every page.</li>
          </ul>
          <p className="text-xs font-mono text-amber-300">Pakistan-specific ML validation: NOT VALIDATED</p>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard/data-sources"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-cyan text-brand-canvas text-sm font-bold"
          >
            Open the dashboard registry
          </Link>
        </div>
      </div>
    </div>
  );
}

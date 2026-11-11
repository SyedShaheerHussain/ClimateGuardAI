import React from "react";
import {
  Database,
  Satellite,
  Waves,
  Cloud,
  Map as MapIcon,
  KeyRound,
  FileUp,
  Bot,
  AlertTriangle,
  Terminal,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { IntegrationStatusPanel } from "@/components/dashboard/integration-status-panel";
import { INTEGRATIONS, staticIntegrationStatus } from "@/lib/integrations/registry";

export const dynamic = "force-dynamic";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "open-meteo": Cloud,
  "nasa-power": Database,
  "nasa-firms": Satellite,
  "copernicus-cds": Waves,
  maplibre: MapIcon,
  openai: Bot,
  "pmd-ndma": FileUp,
};

const USAGE: Record<string, string> = {
  "open-meteo":
    "Current, hourly, daily, and archive weather for the five city centroids. The same provider's flood endpoint supplies GloFAS river discharge.",
  "nasa-power":
    "Optional historical daily point climate used on the satellite page. Requested server-side only.",
  "nasa-firms":
    "Active fire pixels. The route returns a needs-key status instead of inventing detections when NASA_FIRMS_MAP_KEY is absent.",
  "copernicus-cds":
    "Not polled by the app. scripts/ingest/copernicus_cds.py documents manual ERA5 ingestion; it is not run automatically.",
  maplibre:
    "Basemap for the geospatial console. Marker positions come from the central city config; no flood extent is drawn.",
  openai:
    "Optional narrative briefing. Without a key the briefing endpoint returns a deterministic template instead.",
  "pmd-ndma":
    "No official PMD or NDMA feed is polled. Operator-supplied records enter through POST /api/imports/incidents and are marked user_imported.",
};

// Step-by-step setup instructions for integrations that need manual setup
const SETUP_STEPS: Record<string, { title: string; steps: string[]; links: { label: string; url: string }[] }> = {
  "copernicus-cds": {
    title: "Copernicus CDS ERA5 Setup — Windows & Linux Instructions",
    steps: [
      "Register a free account at cds.climate.copernicus.eu",
      "Log in and open the ERA5 Single Levels dataset page",
      "Accept the ERA5 dataset Terms of Use (mandatory before any download)",
      "Copy your Personal Access Token from your CDS profile page",
      "Install client via pip: pip install \"cdsapi>=0.7.7\"  OR via conda: conda config --add channels conda-forge && conda install cdsapi",
      "Windows setup: create %USERPROFILE%\\.cdsapirc with url: https://cds.climate.copernicus.eu/api and key: <TOKEN> (or set in PowerShell $env:CDSAPI_KEY)",
      "Linux/macOS setup: create ~/.cdsapirc with url: https://cds.climate.copernicus.eu/api and key: <TOKEN> (or set export CDSAPI_KEY)",
      "Verify configuration without downloading: python scripts/ingest/copernicus_cds.py --dry-run",
      "Run ingestion when ready: python scripts/ingest/copernicus_cds.py --year 2023",
      "Verify output NetCDF file: dir output\\era5_*.nc (Windows) or ls -lh output/era5_*.nc (Linux)",
    ],
    links: [
      { label: "ECMWF Windows CDS API Guide", url: "https://confluence.ecmwf.int/spaces/CKB/pages/121847376/How+to+install+and+use+CDS+API+on+Windows" },
      { label: "CDS Registration", url: "https://cds.climate.copernicus.eu/" },
      { label: "ERA5 Single Levels Dataset", url: "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels" },
    ],
  },
  "nasa-firms": {
    title: "NASA FIRMS Setup",
    steps: [
      "Register at firms.modaps.eosdis.nasa.gov/api/area/",
      "Request a MAP_KEY (free, requires NASA Earthdata account)",
      "Set NASA_FIRMS_MAP_KEY in your .env.local",
    ],
    links: [
      { label: "FIRMS API Registration", url: "https://firms.modaps.eosdis.nasa.gov/api/" },
    ],
  },
};

export default function DataSourcesDashboardPage() {
  const rows = staticIntegrationStatus();
  const keyRequired = INTEGRATIONS.filter((item) => !item.worksWithoutKey).length;
  const noKey = INTEGRATIONS.filter((item) => item.worksWithoutKey).length;

  return (
    <div className="space-y-6">
      <header className="border-b border-brand-border/60 pb-4 space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30">
          <Database className="w-3.5 h-3.5" />
          Reference catalog — configuration status, not uptime
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Data source registry</h1>
        <p className="text-sm text-slate-400 max-w-3xl">
          Each entry lists what the codebase actually calls and which secret it needs. Status comes from environment
          configuration at request time. No uptime percentage, latency figure, or accuracy score is claimed.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-brand-border bg-brand-card p-4">
          <div className="text-2xl font-black font-mono text-white">{INTEGRATIONS.length}</div>
          <div className="text-[11px] font-mono text-slate-400">Integrations described</div>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-card p-4">
          <div className="text-2xl font-black font-mono text-brand-cyan">{noKey}</div>
          <div className="text-[11px] font-mono text-slate-400">Work without a key</div>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-card p-4">
          <div className="text-2xl font-black font-mono text-risk-moderate">{keyRequired}</div>
          <div className="text-[11px] font-mono text-slate-400">Require credentials or a file</div>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-card p-4">
          <div className="text-2xl font-black font-mono text-white">0</div>
          <div className="text-[11px] font-mono text-slate-400">Official government feeds polled</div>
        </div>
      </div>

      <IntegrationStatusPanel />

      {/* Copernicus CDS Special Notice */}
      <div className="rounded-xl border border-risk-moderate/50 bg-risk-moderate/5 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-risk-moderate shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-sm font-bold text-risk-moderate">
              Copernicus CDS — ERA5 climate reanalysis
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A CDS account and API key alone do <strong className="text-white">not</strong> download ERA5.
              You must also <strong className="text-white">accept the dataset Terms of Use</strong> on the CDS website
              while logged in, then run the ingestion script manually. This app never calls the CDS API automatically
              and never presents synthetic ERA5 data.
            </p>
          </div>
        </div>

        {SETUP_STEPS["copernicus-cds"] && (
          <div className="space-y-3 pl-8">
            <div className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
              {SETUP_STEPS["copernicus-cds"].title}
            </div>
            <ol className="space-y-2">
              {SETUP_STEPS["copernicus-cds"].steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-mono text-slate-300">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand-canvas border border-brand-border text-brand-cyan text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">
                    {step.includes("cdsapi") || step.includes("scripts/ingest") ? (
                      <code className="bg-brand-canvas px-1.5 py-0.5 rounded border border-brand-border/60 text-brand-cyan">
                        {step.startsWith("Install") || step.startsWith("Set") || step.startsWith("Run") || step.startsWith("Verify")
                          ? step
                          : step}
                      </code>
                    ) : (
                      step
                    )}
                  </span>
                </li>
              ))}
            </ol>

            <div className="flex items-center gap-3 pt-1">
              {SETUP_STEPS["copernicus-cds"].links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-brand-cyan hover:text-white transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  {link.label}
                </a>
              ))}
            </div>

            <div className="p-3.5 rounded-lg bg-brand-canvas border border-brand-border font-mono text-xs space-y-2">
              <div className="text-slate-400 font-bold">Quick Setup Commands:</div>
              <div className="space-y-1">
                <div className="text-slate-500"># Windows (CMD) — Creates %USERPROFILE%\.cdsapirc:</div>
                <div className="text-brand-cyan select-all">echo url: https://cds.climate.copernicus.eu/api &gt; %USERPROFILE%\.cdsapirc</div>
                <div className="text-brand-cyan select-all">echo key: &lt;YOUR_PERSONAL_ACCESS_TOKEN&gt; &gt;&gt; %USERPROFILE%\.cdsapirc</div>
              </div>
              <div className="space-y-1 pt-1 border-t border-brand-border/40">
                <div className="text-slate-500"># Windows (PowerShell):</div>
                <div className="text-brand-cyan select-all">$env:CDSAPI_URL = "https://cds.climate.copernicus.eu/api"</div>
                <div className="text-brand-cyan select-all">$env:CDSAPI_KEY = "&lt;YOUR_PERSONAL_ACCESS_TOKEN&gt;"</div>
              </div>
              <div className="space-y-1 pt-1 border-t border-brand-border/40">
                <div className="text-slate-500"># Step 1: Validate configuration without downloading (dry-run):</div>
                <div className="text-white font-bold select-all">python scripts/ingest/copernicus_cds.py --dry-run</div>
                <div className="text-slate-500 pt-1"># Step 2: Download ERA5 NetCDF archive:</div>
                <div className="text-white font-bold select-all">python scripts/ingest/copernicus_cds.py --year 2023</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {rows.map((item) => {
          const Icon = ICONS[item.id] ?? Database;
          const setup = SETUP_STEPS[item.id];
          const statusColor =
            item.configuration === "Connected" || item.configuration === "Key Set — Not Auto-Polled"
              ? "text-brand-cyan"
              : item.configuration === "Needs API Key"
              ? "text-risk-moderate"
              : item.configuration === "Manual Import"
              ? "text-slate-400"
              : "text-slate-400";

          return (
            <div key={item.id} className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-brand-canvas border border-brand-border text-brand-cyan">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{item.provider}</div>
                    <div className="text-xs text-slate-400">{item.category}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded bg-brand-canvas border border-brand-border text-[11px] font-mono shrink-0 ${statusColor}`}>
                  {item.configuration}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{USAGE[item.id] ?? item.documentation}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-brand-border/50 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500">Auth: </span>
                  <span className="text-slate-300">{item.auth}</span>
                </div>
                <div>
                  <span className="text-slate-500">Server env: </span>
                  <span className="text-slate-300">
                    {item.envVars.length > 0 ? item.envVars.join(", ") : "none"}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500">Note: </span>
                  <span className="text-slate-300">{item.note}</span>
                </div>
                <div className="sm:col-span-2 flex items-center gap-1 text-slate-500">
                  <KeyRound className="w-3 h-3" />
                  Secret values are never returned by the API.
                </div>
              </div>

              {/* Inline setup steps for integrations that need them */}
              {setup && item.id !== "copernicus-cds" && (
                <details className="text-[11px] font-mono">
                  <summary className="cursor-pointer text-brand-cyan hover:text-white transition py-1">
                    Setup steps
                  </summary>
                  <ol className="mt-2 space-y-1 pl-2">
                    {setup.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-400">
                        <span className="text-brand-cyan shrink-0">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  {setup.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-brand-cyan hover:text-white transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {link.label}
                    </a>
                  ))}
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

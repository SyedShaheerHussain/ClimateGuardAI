export type ConnectionStatus =
  | "Connected"
  | "Needs API Key"
  | "Key Set — Not Auto-Polled"
  | "Temporarily Unavailable"
  | "Manual Import"
  | "Demo Mode"
  | "Not configured";

export interface IntegrationDescriptor {
  id: string;
  provider: string;
  category: string;
  auth: "none" | "server API key" | "CDS credentials" | "manual file";
  envVars: string[];
  worksWithoutKey: boolean;
  documentation: string;
}

export const INTEGRATIONS: IntegrationDescriptor[] = [
  {
    id: "open-meteo",
    provider: "Open-Meteo",
    category: "Weather forecast and history",
    auth: "none",
    envVars: [],
    worksWithoutKey: true,
    documentation: "https://open-meteo.com/",
  },
  {
    id: "nasa-power",
    provider: "NASA POWER",
    category: "Historical daily climate",
    auth: "none",
    envVars: [],
    worksWithoutKey: true,
    documentation: "https://power.larc.nasa.gov/",
  },
  {
    id: "nasa-firms",
    provider: "NASA FIRMS",
    category: "Active fire pixels",
    auth: "server API key",
    envVars: ["NASA_FIRMS_MAP_KEY"],
    worksWithoutKey: false,
    documentation: "https://firms.modaps.eosdis.nasa.gov/api/",
  },
  {
    id: "copernicus-cds",
    provider: "Copernicus Climate Data Store",
    category: "ERA5 and climate reanalysis",
    auth: "CDS credentials",
    envVars: ["CDSAPI_URL", "CDSAPI_KEY"],
    worksWithoutKey: false,
    documentation: "https://cds.climate.copernicus.eu/",
  },
  {
    id: "maplibre",
    provider: "MapLibre GL with CARTO/OSM tiles",
    category: "Basemap",
    auth: "none",
    envVars: ["NEXT_PUBLIC_MAPLIBRE_STYLE"],
    worksWithoutKey: true,
    documentation: "https://maplibre.org/",
  },
  {
    id: "openai",
    provider: "OpenAI",
    category: "Optional narrative briefing",
    auth: "server API key",
    envVars: ["OPENAI_API_KEY"],
    worksWithoutKey: true,
    documentation: "https://platform.openai.com/docs",
  },
  {
    id: "pmd-ndma",
    provider: "PMD / NDMA / PDMA",
    category: "Official Pakistan warnings",
    auth: "manual file",
    envVars: [],
    worksWithoutKey: false,
    documentation: "No stable public JSON API is wired. Use POST /api/imports/incidents for an operator file.",
  },
];

export function staticIntegrationStatus(): Array<IntegrationDescriptor & { configuration: ConnectionStatus; note: string }> {
  const firms = Boolean(process.env.NASA_FIRMS_MAP_KEY || process.env.NASA_FIRMS_API_KEY);
  const openai = Boolean(process.env.OPENAI_API_KEY);

  let cds = Boolean(process.env.CDSAPI_KEY);
  if (!cds && typeof window === "undefined") {
    try {
      // Also check ~/.cdsapirc (%USERPROFILE%\.cdsapirc on Windows)
      const os = require("os");
      const fs = require("fs");
      const path = require("path");
      const rcPath = path.join(os.homedir(), ".cdsapirc");
      if (fs.existsSync(rcPath)) {
        const content = fs.readFileSync(rcPath, "utf-8");
        if (content.toLowerCase().includes("key:")) {
          cds = true;
        }
      }
    } catch {
      // ignore
    }
  }
  return INTEGRATIONS.map((item) => {
    if (item.id === "nasa-firms") {
      return { ...item, configuration: firms ? "Connected" : "Needs API Key", note: firms ? "Key present. Live status is confirmed only after a successful FIRMS request." : "Server key missing." };
    }
    if (item.id === "openai") {
      return { ...item, configuration: openai ? "Connected" : "Demo Mode", note: openai ? "Key present. Briefings can call OpenAI." : "Deterministic briefings remain available." };
    }
    if (item.id === "copernicus-cds") {
      return {
        ...item,
        configuration: (cds ? "Key Set — Not Auto-Polled" : "Needs API Key") as ConnectionStatus,
        note: cds
          ? "CDSAPI_KEY is present. ERA5 data is NOT polled automatically. Run scripts/ingest/copernicus_cds.py to ingest a dataset after accepting the ERA5 licence at cds.climate.copernicus.eu."
          : "A key alone does not download ERA5. Create a free account, accept the ERA5 dataset licence, then set CDSAPI_KEY and run scripts/ingest/copernicus_cds.py. This app does not pretend CDS is synced.",
      };
    }
    if (item.id === "pmd-ndma") {
      return { ...item, configuration: "Manual Import", note: "No official feed is polled. Operators import a PMD/NDMA/PDMA file on the Incidents page; records stay user_imported and are never marked government alerts." };
    }
    return { ...item, configuration: "Connected" as ConnectionStatus, note: "No secret required for the default public endpoint or tile style." };
  });
}

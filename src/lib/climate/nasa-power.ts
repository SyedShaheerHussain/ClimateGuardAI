import { requireCity } from "../cities/pakistan";
import { fetchJson } from "../http/fetch-json";

export interface NasaPowerPoint {
  parameter: string;
  unit: string | null;
  values: Array<{ date: string; value: number | null }>;
}

export interface NasaPowerResult {
  city: string;
  slug: string;
  coordinates: { latitude: number; longitude: number };
  dataSource: string;
  dataType: "historical_daily";
  status: "live" | "unavailable";
  retrievedAt: string;
  parameters: NasaPowerPoint[];
  note: string;
}

function yyyymmdd(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export async function getNasaPowerDaily(slug: string): Promise<NasaPowerResult> {
  const city = requireCity(slug);
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 7);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 13);
  const params = new URLSearchParams({
    parameters: "T2M,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN",
    community: "RE",
    longitude: String(city.longitude),
    latitude: String(city.latitude),
    start: yyyymmdd(start),
    end: yyyymmdd(end),
    format: "JSON",
  });
  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?${params.toString()}`;
  const empty = {
    city: city.name,
    slug: city.slug,
    coordinates: { latitude: city.latitude, longitude: city.longitude },
    dataSource: "NASA POWER daily point API",
    dataType: "historical_daily" as const,
    retrievedAt: new Date().toISOString(),
    parameters: [] as NasaPowerPoint[],
  };
  try {
    const payload = await fetchJson<{
      properties?: { parameter?: Record<string, Record<string, number>> };
      parameters?: Record<string, { units?: string }>;
    }>(url, { timeoutMs: 15000, retries: 1, cacheTtlMs: 6 * 60 * 60 * 1000 });
    const table = payload.properties?.parameter ?? {};
    const parameters = Object.entries(table).map(([name, series]) => ({
      parameter: name,
      unit: payload.parameters?.[name]?.units ?? null,
      values: Object.entries(series)
        .filter(([date]) => date !== "units")
        .map(([date, value]) => ({
          date,
          value: value === -999 ? null : value,
        })),
    }));
    return {
      ...empty,
      status: parameters.length ? "live" : "unavailable",
      parameters,
      note: "NASA POWER daily values lag real time. They are not current weather observations. Fill value -999 is returned as null.",
    };
  } catch (error) {
    return {
      ...empty,
      status: "unavailable",
      note: error instanceof Error ? error.message : "NASA POWER request failed",
    };
  }
}

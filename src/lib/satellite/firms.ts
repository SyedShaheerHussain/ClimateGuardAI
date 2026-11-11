export interface FireDetection {
  latitude: number;
  longitude: number;
  brightTi4: number | null;
  confidence: string | null;
  acqDate: string | null;
  acqTime: string | null;
  satellite: string | null;
  instrument: string | null;
}

export interface FirmsResult {
  status: "Connected" | "Needs API Key" | "Temporarily Unavailable";
  dataSource: "NASA FIRMS";
  satellite: "VIIRS SNPP NRT";
  detections: FireDetection[];
  retrievedAt: string;
  bbox: [number, number, number, number];
  note: string;
  fabricated: false;
}

const PAKISTAN_BBOX: [number, number, number, number] = [60.8, 23.5, 77.8, 37.1];

export async function getFirmsDetections(): Promise<FirmsResult> {
  const key = process.env.NASA_FIRMS_MAP_KEY || process.env.NASA_FIRMS_API_KEY;
  const base = {
    dataSource: "NASA FIRMS" as const,
    satellite: "VIIRS SNPP NRT" as const,
    retrievedAt: new Date().toISOString(),
    bbox: PAKISTAN_BBOX,
    fabricated: false as const,
    detections: [] as FireDetection[],
  };
  if (!key) {
    return {
      ...base,
      status: "Needs API Key",
      note: "Set NASA_FIRMS_MAP_KEY on the server. No fire detections are invented when the key is missing. Register at https://firms.modaps.eosdis.nasa.gov/api/",
    };
  }

  const [west, south, east, north] = PAKISTAN_BBOX;
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(key)}/VIIRS_SNPP_NRT/${west},${south},${east},${north}/1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (response.status === 401 || response.status === 403) {
      return { ...base, status: "Needs API Key", note: "NASA FIRMS rejected the MAP_KEY." };
    }
    if (!response.ok) {
      return { ...base, status: "Temporarily Unavailable", note: `FIRMS HTTP ${response.status}` };
    }
    const text = await response.text();
    const lines = text.trim().split(/\r?\n/);
    const header = (lines.shift() ?? "").split(",");
    const index = (name: string) => header.indexOf(name);
    const detections = lines.slice(0, 100).map((line) => {
      const cells = line.split(",");
      const numberAt = (name: string) => {
        const value = Number(cells[index(name)]);
        return Number.isFinite(value) ? value : null;
      };
      return {
        latitude: numberAt("latitude") ?? 0,
        longitude: numberAt("longitude") ?? 0,
        brightTi4: numberAt("bright_ti4"),
        confidence: cells[index("confidence")] ?? null,
        acqDate: cells[index("acq_date")] ?? null,
        acqTime: cells[index("acq_time")] ?? null,
        satellite: cells[index("satellite")] ?? "VIIRS SNPP",
        instrument: cells[index("instrument")] ?? null,
      };
    }).filter((row) => row.latitude !== 0 && row.longitude !== 0);
    return {
      ...base,
      status: "Connected",
      detections,
      note: "Active-fire pixels for the last day over the Pakistan bounding box. A detection is a thermal anomaly pixel, not a confirmed incident report. Empty results mean no pixels in the window, not that fires cannot exist.",
    };
  } catch (error) {
    // Never surface the upstream request URL: it contains NASA_FIRMS_MAP_KEY.
    console.error("FIRMS request failed", error instanceof Error ? error.name : "unknown");
    return {
      ...base,
      status: "Temporarily Unavailable",
      note: "The FIRMS request did not complete. Check NASA_FIRMS_MAP_KEY on the server. No detection data is shown.",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Verified city centroids used by weather, maps, risk, finance, and reports.
 * Coordinates are WGS84 decimal degrees (latitude, longitude), sourced from
 * widely published city-centre positions. They are not administrative boundaries.
 */
export interface MonitoredCity {
  id: string;
  slug: string;
  name: string;
  province: string;
  country: "Pakistan";
  latitude: number;
  longitude: number;
  timezone: "Asia/Karachi";
}

export const PAKISTAN_CITIES: readonly MonitoredCity[] = [
  {
    id: "karachi",
    slug: "karachi",
    name: "Karachi",
    province: "Sindh",
    country: "Pakistan",
    latitude: 24.8607,
    longitude: 67.0011,
    timezone: "Asia/Karachi",
  },
  {
    id: "hyderabad",
    slug: "hyderabad",
    name: "Hyderabad",
    province: "Sindh",
    country: "Pakistan",
    latitude: 25.396,
    longitude: 68.3578,
    timezone: "Asia/Karachi",
  },
  {
    id: "sukkur",
    slug: "sukkur",
    name: "Sukkur",
    province: "Sindh",
    country: "Pakistan",
    latitude: 27.7052,
    longitude: 68.8574,
    timezone: "Asia/Karachi",
  },
  {
    id: "lahore",
    slug: "lahore",
    name: "Lahore",
    province: "Punjab",
    country: "Pakistan",
    latitude: 31.5204,
    longitude: 74.3587,
    timezone: "Asia/Karachi",
  },
  {
    id: "islamabad",
    slug: "islamabad",
    name: "Islamabad",
    province: "Islamabad Capital Territory",
    country: "Pakistan",
    latitude: 33.6844,
    longitude: 73.0479,
    timezone: "Asia/Karachi",
  },
] as const;

const ALIASES: Record<string, string> = {
  karachi: "karachi",
  "karachi-sindh": "karachi",
  hyderabad: "hyderabad",
  "hyderabad-sindh": "hyderabad",
  sukkur: "sukkur",
  "sukkur-sindh": "sukkur",
  lahore: "lahore",
  "lahore-punjab": "lahore",
  islamabad: "islamabad",
  "islamabad-federal": "islamabad",
};

export function resolveCity(slugOrName: string): MonitoredCity | undefined {
  const key = slugOrName.trim().toLowerCase();
  const slug = ALIASES[key];
  if (!slug) return undefined;
  return PAKISTAN_CITIES.find((city) => city.slug === slug);
}

export function requireCity(slugOrName: string): MonitoredCity {
  const city = resolveCity(slugOrName);
  if (!city) {
    throw new Error(`Unknown city '${slugOrName}'. Expected one of: ${PAKISTAN_CITIES.map((c) => c.slug).join(", ")}`);
  }
  return city;
}

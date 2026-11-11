import { PAKISTAN_CITIES, requireCity, type MonitoredCity } from "../cities/pakistan";
import { fetchJson } from "../http/fetch-json";
import { emptyWeather, normalizeOpenMeteoForecast, type NormalizedWeather } from "./normalize";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
const FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood";

interface ForecastPayload {
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    wind_speed_10m?: number;
    weather_code?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    apparent_temperature?: number[];
    relative_humidity_2m?: number[];
    precipitation?: number[];
    wind_speed_10m?: number[];
    weather_code?: number[];
    soil_moisture_0_to_100cm?: number[];
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
    weather_code?: number[];
  };
}

interface FloodPayload {
  daily?: {
    time?: string[];
    river_discharge?: Array<number | null>;
  };
}

export interface FloodSignal {
  riverDischargeM3s: number | null;
  baseline30dM3s: number | null;
  dischargeAnomalyPct: number | null;
  observationDate: string | null;
  source: string;
  status: "live" | "unavailable";
  note: string;
}

export interface HourlyPoint {
  time: string;
  temperatureC: number | null;
  precipitationMm: number | null;
  humidityPct: number | null;
}

export interface CityWeatherBundle {
  current: NormalizedWeather;
  hourly: HourlyPoint[];
  hourlyPast24: HourlyPoint[];
  daily: Array<{ date: string; tempMaxC: number | null; tempMinC: number | null; precipitationMm: number | null }>;
  forecastPrecip24hMm: number | null;
  antecedentPrecip3dMm: number | null;
  precipitationLast7dMm: number | null;
  soilMoistureM3m3: number | null;
  soilMoistureTimestamp: string | null;
  consecutiveHotDays: number | null;
  flood: FloodSignal;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function karachiToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
}

function emptyFloodSignal(reason: string): FloodSignal {
  return {
    riverDischargeM3s: null,
    baseline30dM3s: null,
    dischargeAnomalyPct: null,
    observationDate: null,
    source: "Open-Meteo Flood API (GloFAS)",
    status: "unavailable",
    note: reason,
  };
}

async function getFloodSignal(city: MonitoredCity, today: string): Promise<FloodSignal> {
  try {
    const params = new URLSearchParams({
      latitude: String(city.latitude),
      longitude: String(city.longitude),
      daily: "river_discharge",
      past_days: "30",
      forecast_days: "7",
      timezone: "Asia/Karachi",
    });
    const payload = await fetchJson<FloodPayload>(`${FLOOD_URL}?${params.toString()}`, {
      timeoutMs: 8000,
      retries: 1,
      cacheTtlMs: 30 * 60 * 1000,
    });
    const times = payload.daily?.time ?? [];
    const values = payload.daily?.river_discharge ?? [];
    const todayIndex = times.indexOf(today);
    if (todayIndex < 0) return emptyFloodSignal("No discharge value returned for today.");

    const current = num(values[todayIndex]);
    const baselineValues = values
      .slice(0, todayIndex)
      .map(num)
      .filter((value): value is number => value !== null && value > 0);
    const baseline =
      baselineValues.length >= 5
        ? round(baselineValues.reduce((sum, value) => sum + value, 0) / baselineValues.length)
        : null;

    return {
      riverDischargeM3s: current,
      baseline30dM3s: baseline,
      dischargeAnomalyPct: current !== null && baseline ? round(((current - baseline) / baseline) * 100, 1) : null,
      observationDate: times[todayIndex] ?? null,
      source: "Open-Meteo Flood API (GloFAS river discharge, no API key)",
      status: current === null ? "unavailable" : "live",
      note: "Daily GloFAS river discharge for the grid cell containing the city centroid. Not a local gauge reading.",
    };
  } catch (error) {
    return emptyFloodSignal(error instanceof Error ? error.message : "Flood API request failed");
  }
}

function sumRange(
  times: string[],
  values: Array<number | null | undefined>,
  startExclusive: string,
  endInclusive: string
): number | null {
  let total = 0;
  let seen = 0;
  for (let index = 0; index < times.length; index += 1) {
    const time = times[index];
    if (time > startExclusive && time <= endInclusive) {
      const value = num(values[index]);
      if (value !== null) {
        total += value;
        seen += 1;
      }
    }
  }
  return seen === 0 ? null : round(total);
}

function latestBefore(
  times: string[],
  values: Array<number | null | undefined>,
  cutoff: string
): { value: number | null; time: string | null } {
  for (let index = times.length - 1; index >= 0; index -= 1) {
    if (times[index] <= cutoff) {
      return { value: num(values[index]), time: times[index] };
    }
  }
  return { value: null, time: null };
}

function consecutiveHotDays(
  daily: { time: string[]; max: Array<number | null | undefined> },
  today: string
): number | null {
  let count = 0;
  let foundBelow = false;
  for (let index = 0; index < daily.time.length; index += 1) {
    const date = daily.time[index];
    if (date >= today) break;
    const max = num(daily.max[index]);
    if (max === null) return null;
    if (max >= 40) {
      if (foundBelow) return count;
      count += 1;
    } else if (count > 0) {
      foundBelow = true;
    }
  }
  return count;
}

function forecastUrl(city: MonitoredCity): string {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "temperature_2m,relative_humidity_2m,precipitation,apparent_temperature,wind_speed_10m,weather_code",
    hourly:
      "temperature_2m,relative_humidity_2m,precipitation,apparent_temperature,wind_speed_10m,weather_code,soil_moisture_0_to_100cm",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
    past_days: "7",
    forecast_days: "7",
    timezone: "Asia/Karachi",
    wind_speed_unit: "kmh",
  });
  return `${FORECAST_URL}?${params.toString()}`;
}

export async function getCityWeather(slug: string): Promise<CityWeatherBundle> {
  const city = requireCity(slug);
  const today = karachiToday();
  const floodPromise = getFloodSignal(city, today);

  try {
    const payload = await fetchJson<ForecastPayload>(forecastUrl(city), {
      timeoutMs: 8000,
      retries: 1,
      cacheTtlMs: 5 * 60 * 1000,
    });
    const now = payload.current?.time ?? `${today}T12:00`;
    const hourlyTimes = payload.hourly?.time ?? [];
    const hourlyPrecip = payload.hourly?.precipitation ?? [];
    const hourlyTemp = payload.hourly?.temperature_2m ?? [];
    const hourlyHumidity = payload.hourly?.relative_humidity_2m ?? [];
    const hourlySoil = payload.hourly?.soil_moisture_0_to_100cm ?? [];

    const normalized = normalizeOpenMeteoForecast(city, payload);
    const futureIndexes = hourlyTimes
      .map((time, index) => ({ time, index }))
      .filter((entry) => entry.time > now)
      .slice(0, 48);

    const hourly = futureIndexes.map(({ time, index }) => ({
      time,
      temperatureC: num(hourlyTemp[index]),
      precipitationMm: num(hourlyPrecip[index]),
      humidityPct: num(hourlyHumidity[index]),
    }));

    const nowPlus24 = new Date(new Date(now).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    const nowMinus24 = new Date(new Date(now).getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    const nowMinus72 = new Date(new Date(now).getTime() - 72 * 60 * 60 * 1000).toISOString().slice(0, 16);

    const hourlyPast24 = hourlyTimes
      .map((time, index) => ({ time, index }))
      .filter((entry) => entry.time > nowMinus24 && entry.time <= now)
      .map(({ time, index }) => ({
        time,
        temperatureC: num(hourlyTemp[index]),
        precipitationMm: num(hourlyPrecip[index]),
        humidityPct: num(hourlyHumidity[index]),
      }));

    const dailyTimes = payload.daily?.time ?? [];
    const dailyPrecip = payload.daily?.precipitation_sum ?? [];
    const last7Values = dailyPrecip.slice(0, 7);
    const last7Sum = last7Values.every((value) => num(value) === null)
      ? null
      : round(last7Values.reduce((sum, value) => sum + (num(value) ?? 0), 0));

    const soil = latestBefore(hourlyTimes, hourlySoil, now);

    return {
      current: normalized.current,
      hourly,
      hourlyPast24,
      daily: normalized.daily,
      forecastPrecip24hMm: sumRange(hourlyTimes, hourlyPrecip, now, nowPlus24),
      antecedentPrecip3dMm: sumRange(hourlyTimes, hourlyPrecip, nowMinus72, now),
      precipitationLast7dMm: last7Sum,
      soilMoistureM3m3: soil.value,
      soilMoistureTimestamp: soil.time,
      consecutiveHotDays: consecutiveHotDays(
        { time: dailyTimes.slice(0, 7), max: (payload.daily?.temperature_2m_max ?? []).slice(0, 7) },
        today
      ),
      flood: await floodPromise,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Open-Meteo request failed";
    return {
      current: emptyWeather(city, reason),
      hourly: [],
      hourlyPast24: [],
      daily: [],
      forecastPrecip24hMm: null,
      antecedentPrecip3dMm: null,
      precipitationLast7dMm: null,
      soilMoistureM3m3: null,
      soilMoistureTimestamp: null,
      consecutiveHotDays: null,
      flood: await floodPromise,
    };
  }
}

export async function getAllCityWeather(): Promise<CityWeatherBundle[]> {
  return Promise.all(PAKISTAN_CITIES.map((city) => getCityWeather(city.slug)));
}

export interface HistoricalDay {
  date: string;
  tempMaxC: number | null;
  tempMinC: number | null;
  precipitationMm: number | null;
}

export async function getCityHistory(slug: string, startDate: string, endDate: string): Promise<{
  city: string;
  slug: string;
  dataSource: string;
  dataType: "historical_model" | "unavailable";
  days: HistoricalDay[];
  status: "live" | "unavailable";
  note: string;
}> {
  const city = requireCity(slug);
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    start_date: startDate,
    end_date: endDate,
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
    timezone: "Asia/Karachi",
  });
  try {
    const payload = await fetchJson<{
      daily?: {
        time?: string[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_sum?: number[];
      };
    }>(`${ARCHIVE_URL}?${params.toString()}`, { timeoutMs: 12000, retries: 1, cacheTtlMs: 60 * 60 * 1000 });
    const days = (payload.daily?.time ?? []).map((date, index) => ({
      date,
      tempMaxC: payload.daily?.temperature_2m_max?.[index] ?? null,
      tempMinC: payload.daily?.temperature_2m_min?.[index] ?? null,
      precipitationMm: payload.daily?.precipitation_sum?.[index] ?? null,
    }));
    return {
      city: city.name,
      slug: city.slug,
      dataSource: "Open-Meteo Historical Weather API (ERA5/ERA5-Land blend)",
      dataType: "historical_model",
      days,
      status: "live",
      note: "Historical model reanalysis. Not equivalent to a current station observation.",
    };
  } catch (error) {
    return {
      city: city.name,
      slug: city.slug,
      dataSource: "Open-Meteo Historical Weather API",
      dataType: "unavailable",
      days: [],
      status: "unavailable",
      note: error instanceof Error ? error.message : "History request failed",
    };
  }
}

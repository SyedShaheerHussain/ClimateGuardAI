import type { MonitoredCity } from "../cities/pakistan";

export type WeatherDataType = "model_nowcast" | "forecast" | "historical_model" | "unavailable";

export interface WeatherValues {
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  humidityPct: number | null;
  precipitationMm: number | null;
  windSpeedKmh: number | null;
  weatherCode: number | null;
}

export interface NormalizedWeather {
  city: string;
  slug: string;
  province: string;
  coordinates: { latitude: number; longitude: number };
  values: WeatherValues;
  units: {
    temperature: "°C";
    apparentTemperature: "°C";
    humidity: "%";
    precipitation: "mm";
    windSpeed: "km/h";
    weatherCode: "WMO";
  };
  timestamp: string | null;
  retrievedAt: string;
  dataSource: string;
  dataType: WeatherDataType;
  status: "live" | "unavailable";
  note: string;
}

export const WEATHER_UNITS = {
  temperature: "°C",
  apparentTemperature: "°C",
  humidity: "%",
  precipitation: "mm",
  windSpeed: "km/h",
  weatherCode: "WMO",
} as const;

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function emptyWeather(city: MonitoredCity, reason: string): NormalizedWeather {
  return {
    city: city.name,
    slug: city.slug,
    province: city.province,
    coordinates: { latitude: city.latitude, longitude: city.longitude },
    values: {
      temperatureC: null,
      apparentTemperatureC: null,
      humidityPct: null,
      precipitationMm: null,
      windSpeedKmh: null,
      weatherCode: null,
    },
    units: WEATHER_UNITS,
    timestamp: null,
    retrievedAt: new Date().toISOString(),
    dataSource: "Open-Meteo",
    dataType: "unavailable",
    status: "unavailable",
    note: reason,
  };
}

interface OpenMeteoCurrent {
  time?: string;
  temperature_2m?: number;
  apparent_temperature?: number;
  relative_humidity_2m?: number;
  precipitation?: number;
  wind_speed_10m?: number;
  weather_code?: number;
}

export function normalizeOpenMeteoForecast(city: MonitoredCity, payload: {
  current?: OpenMeteoCurrent;
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    apparent_temperature?: number[];
    relative_humidity_2m?: number[];
    precipitation?: number[];
    wind_speed_10m?: number[];
    weather_code?: number[];
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
    weather_code?: number[];
  };
}): {
  current: NormalizedWeather;
  hourly: Array<{ time: string; temperatureC: number | null; precipitationMm: number | null; humidityPct: number | null }>;
  daily: Array<{ date: string; tempMaxC: number | null; tempMinC: number | null; precipitationMm: number | null }>;
  forecastPrecip24hMm: number | null;
} {
  const current = payload.current;
  const normalizedCurrent: NormalizedWeather = {
    city: city.name,
    slug: city.slug,
    province: city.province,
    coordinates: { latitude: city.latitude, longitude: city.longitude },
    values: {
      temperatureC: num(current?.temperature_2m),
      apparentTemperatureC: num(current?.apparent_temperature),
      humidityPct: num(current?.relative_humidity_2m),
      precipitationMm: num(current?.precipitation),
      windSpeedKmh: num(current?.wind_speed_10m),
      weatherCode: num(current?.weather_code),
    },
    units: WEATHER_UNITS,
    timestamp: current?.time ?? null,
    retrievedAt: new Date().toISOString(),
    dataSource: "Open-Meteo Forecast API (IFS/GFS blend, no API key)",
    dataType: current ? "model_nowcast" : "unavailable",
    status: current ? "live" : "unavailable",
    note: "Open-Meteo current fields are model nowcasts, not Pakistan Meteorological Department station observations.",
  };

  const hourly = (payload.hourly?.time ?? []).slice(0, 48).map((time, index) => ({
    time,
    temperatureC: num(payload.hourly?.temperature_2m?.[index]),
    precipitationMm: num(payload.hourly?.precipitation?.[index]),
    humidityPct: num(payload.hourly?.relative_humidity_2m?.[index]),
  }));

  const forecastPrecip24hMm = hourly.length
    ? Number(
        hourly
          .slice(0, 24)
          .reduce((sum, row) => sum + (row.precipitationMm ?? 0), 0)
          .toFixed(2)
      )
    : null;

  const daily = (payload.daily?.time ?? []).map((date, index) => ({
    date,
    tempMaxC: num(payload.daily?.temperature_2m_max?.[index]),
    tempMinC: num(payload.daily?.temperature_2m_min?.[index]),
    precipitationMm: num(payload.daily?.precipitation_sum?.[index]),
  }));

  return { current: normalizedCurrent, hourly, daily, forecastPrecip24hMm };
}

export function sumSeries(values: Array<number | null | undefined>): number | null {
  const present = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (present.length === 0) return null;
  return Number(present.reduce((sum, value) => sum + value, 0).toFixed(2));
}

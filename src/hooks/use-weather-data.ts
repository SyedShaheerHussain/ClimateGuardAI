"use client";

import { useState, useEffect, useCallback } from "react";

export interface WeatherReading {
  surfaceTempC: number;
  relativeHumidityPct: number;
  precipitationMmHr: number;
  riverDischargeM3s: number;
  soilMoistureM3m3: number;
}

export interface WeatherDataResult {
  data: WeatherReading | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  source: string;
  refetch: () => void;
}

export function useWeatherData(basinSlug: string): WeatherDataResult {
  const [data, setData] = useState<WeatherReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [source, setSource] = useState("Loading...");

  const fetchData = useCallback(async () => {
    if (!basinSlug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/weather?basin=${encodeURIComponent(basinSlug)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error(`API responded with status ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setData(json.current);
        setSource(json.source ?? "Open-Meteo");
        setLastUpdated(
          json.timestamp
            ? new Date(json.timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : null
        );
      } else {
        setError(json.error ?? "Failed to load weather data.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Network error loading weather data."
      );
    } finally {
      setLoading(false);
    }
  }, [basinSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, lastUpdated, source, refetch: fetchData };
}

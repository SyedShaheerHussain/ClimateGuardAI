"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface ChartPoint {
  time: string;
  temperature: number | null;
  precipitation: number | null;
  humidity: number | null;
  isForecast?: boolean;
}

interface HourlyPoint {
  time: string;
  temperatureC: number | null;
  precipitationMm: number | null;
  humidityPct: number | null;
}

interface WeatherResponse {
  success?: boolean;
  current?: { city?: string; status?: string; dataSource?: string };
  hourly?: HourlyPoint[];
  hourlyPast24?: HourlyPoint[];
  error?: string;
}

interface HydroThermalChartProps {
  citySlug?: string;
}

function toPoint(point: HourlyPoint, isForecast: boolean): ChartPoint {
  return {
    time: point.time.slice(11, 16),
    temperature: point.temperatureC,
    precipitation: point.precipitationMm,
    humidity: point.humidityPct,
    isForecast,
  };
}

export function HydroThermalChart({ citySlug = "karachi-sindh" }: HydroThermalChartProps) {
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/weather?city=${encodeURIComponent(citySlug)}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Weather API returned HTTP ${response.status}`);
        return response.json() as Promise<WeatherResponse>;
      })
      .then((json) => {
        if (cancelled) return;
        const past = (json.hourlyPast24 ?? []).map((point) => toPoint(point, false));
        const future = (json.hourly ?? []).slice(0, 24).map((point) => toPoint(point, true));
        setPoints([...past, ...future]);
        setSource(json.current?.dataSource ?? null);
        if (past.length + future.length === 0) {
          setError(json.error ?? "No hourly values were returned for this city.");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load hourly weather data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [citySlug]);

  const maxRain = points.reduce((max, point) => Math.max(max, point.precipitation ?? 0), 0);

  if (loading) {
    return (
      <div className="w-full h-[320px] flex items-center justify-center text-xs font-mono text-slate-400 gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-brand-cyan" />
        Loading hourly Open-Meteo series…
      </div>
    );
  }

  if (error || points.length === 0) {
    return (
      <div className="w-full h-[320px] flex items-center justify-center text-xs font-mono text-slate-400 text-center px-6">
        Live hourly weather data unavailable for {citySlug}: {error ?? "empty series"}. No synthetic series is shown.
      </div>
    );
  }

  return (
    <div className="w-full h-[320px] pt-4 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#24364B" opacity={0.5} />
          <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} fontFamily="monospace" interval={5} />
          <YAxis yAxisId="left" stroke="#22D3EE" fontSize={11} fontFamily="monospace" domain={["auto", "auto"]} />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#3B82F6"
            fontSize={11}
            fontFamily="monospace"
            domain={[0, Math.max(5, Math.ceil(maxRain))]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0B1728",
              borderColor: "#24364B",
              borderRadius: "8px",
              fontSize: "12px",
              fontFamily: "monospace",
              color: "#F8FAFC",
            }}
            labelFormatter={(label) => `${label}`}
          />
          <Legend
            wrapperStyle={{
              fontSize: "11px",
              fontFamily: "monospace",
              paddingTop: "8px",
            }}
          />
          <Bar
            yAxisId="right"
            dataKey="precipitation"
            name="Rainfall (mm)"
            fill="url(#rainGradient)"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="temperature"
            name="Temp (°C)"
            stroke="#22D3EE"
            strokeWidth={2.5}
            dot={false}
            connectNulls
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="humidity"
            name="Humidity (%)"
            stroke="#94A3B8"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="text-[10px] font-mono text-slate-500 text-center">
        Past 24h and next 24h model hours. {source ?? "Open-Meteo"}.
      </p>
    </div>
  );
}

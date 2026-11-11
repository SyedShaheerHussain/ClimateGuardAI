"use client";

import React, { useEffect, useState } from "react";

interface CityRisk {
  city: string;
  slug: string;
  overall: string;
  forecastPrecip24hMm: number | null;
  weather: {
    status: string;
    dataType: string;
    dataSource: string;
    timestamp: string | null;
    values: {
      temperatureC: number | null;
      apparentTemperatureC: number | null;
      humidityPct: number | null;
      precipitationMm: number | null;
      windSpeedKmh: number | null;
    };
  };
}

export default function WeatherIntelligencePage() {
  const [cities, setCities] = useState<CityRisk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState("karachi");
  const [forecast, setForecast] = useState<string>("");

  useEffect(() => {
    fetch("/api/risk/cities")
      .then((response) => response.json())
      .then((payload) => setCities(payload.cities ?? []))
      .catch(() => setError("Weather service did not respond."));
  }, []);

  useEffect(() => {
    fetch(`/api/weather/forecast?city=${selected}`)
      .then((response) => response.json())
      .then((payload) => {
        const first = payload.daily?.[0];
        setForecast(first ? `${first.date}: max ${first.tempMaxC ?? "n/a"}°C, rain ${first.precipitationMm ?? "n/a"} mm` : payload.status ?? "No forecast");
      })
      .catch(() => setForecast("Forecast unavailable"));
  }, [selected]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-white">Weather intelligence</h1>
        <p className="text-sm text-slate-400 mt-1">
          Open-Meteo model nowcasts for five Pakistan cities. These are not Pakistan Meteorological Department station observations.
        </p>
      </header>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {!cities.length && !error && <p className="text-sm text-slate-400">Loading live weather…</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cities.map((city) => (
          <button
            key={city.slug}
            type="button"
            onClick={() => setSelected(city.slug)}
            className={`text-left p-4 rounded-xl border bg-brand-card ${selected === city.slug ? "border-brand-cyan" : "border-brand-border"}`}
          >
            <div className="flex justify-between text-sm">
              <span className="font-bold text-white">{city.city}</span>
              <span className="font-mono text-xs text-brand-cyan">{city.weather.status}</span>
            </div>
            <p className="text-3xl font-black text-white mt-2">{city.weather.values.temperatureC ?? "—"}°C</p>
            <p className="text-xs text-slate-400 mt-2">Humidity {city.weather.values.humidityPct ?? "—"}% · Wind {city.weather.values.windSpeedKmh ?? "—"} km/h</p>
            <p className="text-xs text-slate-400">Precip {city.weather.values.precipitationMm ?? "—"} mm · Next 24h {city.forecastPrecip24hMm ?? "—"} mm</p>
            <p className="text-xs text-slate-500 mt-2">{city.weather.dataType} · {city.weather.timestamp ?? "no timestamp"}</p>
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-300">Selected forecast day: {forecast}</p>
    </div>
  );
}

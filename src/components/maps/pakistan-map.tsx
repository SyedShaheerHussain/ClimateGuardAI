"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskAssessment, RiskCategory } from "@/lib/risk/engine";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";

type HazardName = "flood" | "heatwave" | "drought";
type HazardFilter = "all" | HazardName;
type DisplayCategory = RiskCategory | "Insufficient data";

interface FloodSignalView {
  riverDischargeM3s: number | null;
  baseline30dM3s: number | null;
  dischargeAnomalyPct: number | null;
  observationDate: string | null;
  source: string;
  status: "live" | "unavailable";
  note: string;
}

interface CityWeatherView {
  values: {
    temperatureC: number | null;
    apparentTemperatureC: number | null;
    humidityPct: number | null;
    precipitationMm: number | null;
    windSpeedKmh: number | null;
  };
  timestamp: string | null;
  retrievedAt: string;
  dataSource: string;
  status: "live" | "unavailable";
  note: string;
}

interface CityRiskItem {
  city: string;
  slug: string;
  province: string;
  coordinates: { latitude: number; longitude: number };
  weather: CityWeatherView;
  forecastPrecip24hMm: number | null;
  antecedentPrecip3dMm: number | null;
  precipitationLast7dMm: number | null;
  soilMoistureM3m3: number | null;
  soilMoistureTimestamp: string | null;
  consecutiveHotDays: number | null;
  flood: FloodSignalView;
  risks: RiskAssessment[];
  overall: DisplayCategory;
}

interface RiskCitiesResponse {
  success: boolean;
  generatedAt: string;
  cities: CityRiskItem[];
  validation?: string;
  error?: string;
}

const CATEGORY_COLORS: Record<DisplayCategory, string> = {
  Low: "#22C55E",
  Moderate: "#EAB308",
  High: "#F97316",
  "Very High": "#EF4444",
  Extreme: "#B91C1C",
  "Insufficient data": "#64748B",
};

const CATEGORY_CLASSES: Record<DisplayCategory, string> = {
  Low: "bg-risk-safe/15 text-risk-safe border-risk-safe/30",
  Moderate: "bg-risk-moderate/15 text-risk-moderate border-risk-moderate/30",
  High: "bg-risk-high/15 text-risk-high border-risk-high/30",
  "Very High": "bg-risk-critical/15 text-risk-critical border-risk-critical/30",
  Extreme: "bg-risk-critical/25 text-risk-critical border-risk-critical/50",
  "Insufficient data": "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const HAZARD_LABELS: Record<HazardName, string> = {
  flood: "Flood",
  heatwave: "Heatwave",
  drought: "Drought",
};

function categoryFor(city: CityRiskItem, filter: HazardFilter): DisplayCategory {
  if (filter === "all") return city.overall;
  const risk = city.risks.find((item) => item.hazard === filter);
  return risk?.category ?? "Insufficient data";
}

function formatValue(value: number | null, unit: string, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)} ${unit}`;
}

interface PakistanMapProps {
  height?: string;
}

export function PakistanMap({ height = "h-[600px]" }: PakistanMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [cities, setCities] = useState<CityRiskItem[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [hazardFilter, setHazardFilter] = useState<HazardFilter>("all");

  const loadRisks = useCallback(() => {
    setDataLoading(true);
    setDataError(null);
    fetch("/api/risk/cities")
      .then((response) => {
        if (!response.ok) throw new Error(`Risk API returned HTTP ${response.status}`);
        return response.json() as Promise<RiskCitiesResponse>;
      })
      .then((json) => {
        if (!json.success || !Array.isArray(json.cities)) {
          throw new Error(json.error ?? "Risk API returned an unexpected payload");
        }
        setCities(json.cities);
        setGeneratedAt(json.generatedAt);
      })
      .catch((error: unknown) => {
        setDataError(error instanceof Error ? error.message : "Failed to load live risk data");
      })
      .finally(() => setDataLoading(false));
  }, []);

  useEffect(() => {
    loadRisks();
  }, [loadRisks]);

  const initMap = useCallback(async () => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      // Dynamic import ensures this only runs in browser
      const maplibregl = (await import("maplibre-gl")).default;
      await import("maplibre-gl/dist/maplibre-gl.css");

      const styleUrl =
        process.env.NEXT_PUBLIC_MAPLIBRE_STYLE ||
        "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

      const map = new maplibregl.Map({
        container: mapContainerRef.current!,
        style: styleUrl,
        center: [69.3451, 30.3753], // Pakistan center [lng, lat]
        zoom: 5.2,
        attributionControl: false,
      });

      // Attribution
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: "© <a href='https://carto.com' target='_blank'>CARTO</a> © <a href='https://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a>",
        }),
        "bottom-right"
      );

      // Navigation controls
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      let loadTimeout: number | undefined;

      map.on("load", () => {
        if (loadTimeout !== undefined) window.clearTimeout(loadTimeout);
        setIsLoaded(true);
        setMapError(null);
      });

      map.on("error", (e: { error?: { message?: string } }) => {
        if (loadTimeout !== undefined) window.clearTimeout(loadTimeout);
        console.error("MapLibre error:", e);
        setMapError(
          "Map tiles failed to load. The map style URL may be unavailable. Geographic coordinates and hazard data are still displayed below."
        );
        setIsLoaded(true); // allow fallback UI
      });

      mapRef.current = map;

      // A hidden tab or a blocked tile host can prevent the load event indefinitely.
      // Stop the spinner and keep the textual hazard data usable.
      loadTimeout = window.setTimeout(() => {
        setIsLoaded(true);
        setMapError(
          "Basemap tiles did not finish loading. City markers and hazard values below remain available."
        );
      }, 10000);

      return () => {
        if (loadTimeout !== undefined) window.clearTimeout(loadTimeout);
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.error("MapLibre init error:", err);
      setMapError(
        "MapLibre GL failed to initialize. This may occur in environments without WebGL support."
      );
      setIsLoaded(true);
    }
  }, []);

  // Render city markers and re-render when the hazard filter changes
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    const map = mapRef.current;

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];

    let cancelled = false;
    import("maplibre-gl").then(({ Marker }) => {
      if (cancelled) return;
      for (const city of cities) {
        const category = categoryFor(city, hazardFilter);
        const marker = new Marker({ color: CATEGORY_COLORS[category], scale: 1.05 })
          .setLngLat([city.coordinates.longitude, city.coordinates.latitude])
          .addTo(map);

        const element = marker.getElement();
        element.style.cursor = "pointer";
        element.title = `${city.city} — ${category}`;
        element.addEventListener("click", () => setSelectedSlug(city.slug));
        markersRef.current.push(marker);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cities, hazardFilter, isLoaded]);

  // Initialize map on mount
  useEffect(() => {
    initMap();
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [initMap]);

  const resetView = useCallback(() => {
    mapRef.current?.flyTo({ center: [69.3451, 30.3753], zoom: 5.2, duration: 1000 });
    setSelectedSlug(null);
  }, []);

  const selectedCity = cities.find((city) => city.slug === selectedSlug) ?? null;
  const liveCount = cities.filter((city) => city.weather.status === "live").length;

  return (
    <div className="space-y-3">
      {/* Map Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Hazard Layer Filter */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-brand-sidebar border border-brand-border text-xs">
          {(["all", "flood", "heatwave", "drought"] as HazardFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setHazardFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md font-mono font-medium transition capitalize",
                hazardFilter === f
                  ? "bg-brand-card text-brand-cyan border border-brand-cyan/40"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {f === "all" ? "Worst hazard" : f}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadRisks}
            disabled={dataLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-sidebar border border-brand-border text-xs text-slate-300 hover:text-white hover:border-brand-cyan/40 transition font-mono disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", dataLoading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={resetView}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-sidebar border border-brand-border text-xs text-slate-300 hover:text-white hover:border-brand-cyan/40 transition font-mono"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset View</span>
          </button>
        </div>
      </div>

      {dataError && (
        <div className="p-3 rounded-xl bg-risk-moderate/10 border border-risk-moderate/30 flex items-start gap-2 text-xs font-mono text-risk-moderate">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Live risk data unavailable: {dataError}. Nothing is substituted in its place.</span>
        </div>
      )}

      {/* Map Canvas */}
      <div className={cn("relative w-full rounded-xl border border-brand-border overflow-hidden", height)}>
        {/* Loading overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-brand-canvas flex items-center justify-center z-10">
            <div className="flex items-center gap-3 text-brand-cyan font-mono text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Initializing MapLibre GL WebGL Engine…</span>
            </div>
          </div>
        )}

        {/* Error overlay — still shows city markers below */}
        {mapError && isLoaded && (
          <div className="absolute top-3 left-3 right-3 z-20 p-3 rounded-xl bg-risk-moderate/10 border border-risk-moderate/30 flex items-start gap-2 text-xs font-mono text-risk-moderate">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{mapError}</span>
          </div>
        )}

        {/* MapLibre container */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Attribution notice */}
        <div className="absolute bottom-2 left-2 z-10 text-[10px] font-mono text-slate-500 bg-brand-canvas/80 px-2 py-0.5 rounded">
          © CARTO © OpenStreetMap contributors | Weather: Open-Meteo | Discharge: GloFAS
        </div>
      </div>

      {/* Selected City Panel */}
      {selectedCity && (
        <div className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[selectedCity.overall] }}
                />
                <h3 className="text-base font-bold text-white">{selectedCity.city}</h3>
                <span className="text-xs font-mono text-slate-400">{selectedCity.province}</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {selectedCity.coordinates.latitude.toFixed(4)}°N,{" "}
                {selectedCity.coordinates.longitude.toFixed(4)}°E
              </p>
            </div>
            <span
              className={cn(
                "text-xs font-bold uppercase px-2.5 py-1 rounded border font-mono",
                CATEGORY_CLASSES[selectedCity.overall]
              )}
            >
              Overall: {selectedCity.overall}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {selectedCity.risks.map((risk) => (
              <div
                key={risk.hazard}
                className="p-3 rounded-lg bg-brand-canvas border border-brand-border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    {HAZARD_LABELS[risk.hazard]}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border font-mono"
                    style={{
                      color: CATEGORY_COLORS[risk.category],
                      borderColor: `${CATEGORY_COLORS[risk.category]}55`,
                      backgroundColor: `${CATEGORY_COLORS[risk.category]}14`,
                    }}
                  >
                    {risk.category}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-mono text-white">
                    {risk.category === "Insufficient data" ? "—" : risk.score == null ? "—" : risk.score}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {risk.category === "Insufficient data"
                      ? `insufficient · confidence ${Math.round(risk.confidence * 100)}%`
                      : `/ 100 · confidence ${Math.round(risk.confidence * 100)}%`}
                  </span>
                </div>
                <ul className="space-y-1">
                  {risk.factors.map((factor) => (
                    <li
                      key={factor.name}
                      className="text-[10px] font-mono text-slate-400 flex justify-between gap-2"
                    >
                      <span className="truncate">{factor.name}</span>
                      <span className="text-slate-300 shrink-0">
                        {factor.input == null ? "missing" : `${factor.input} ${factor.unit}`}
                      </span>
                    </li>
                  ))}
                </ul>
                {risk.missingInputs.length > 0 && (
                  <div className="text-[10px] font-mono text-slate-500 border-t border-brand-border/50 pt-1.5">
                    Missing inputs lower confidence: {risk.missingInputs.join(", ")}.
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-brand-canvas border border-brand-border space-y-2">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-400 tracking-wider">
                <span>Live observations</span>
                <span
                  className={
                    selectedCity.weather.status === "live"
                      ? "text-emerald-400 font-bold"
                      : "text-slate-500"
                  }
                >
                  {selectedCity.weather.status === "live" ? "LIVE" : "UNAVAILABLE"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-slate-500 font-mono">Temperature</div>
                  <div className="font-bold text-white font-mono">
                    {formatValue(selectedCity.weather.values.temperatureC, "°C")}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-mono">Apparent</div>
                  <div className="font-bold text-white font-mono">
                    {formatValue(selectedCity.weather.values.apparentTemperatureC, "°C")}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-mono">Humidity</div>
                  <div className="font-bold text-white font-mono">
                    {formatValue(selectedCity.weather.values.humidityPct, "%", 0)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-mono">Precipitation</div>
                  <div className="font-bold text-white font-mono">
                    {formatValue(selectedCity.weather.values.precipitationMm, "mm", 2)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-mono">Wind</div>
                  <div className="font-bold text-white font-mono">
                    {formatValue(selectedCity.weather.values.windSpeedKmh, "km/h", 0)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-mono">Soil moisture</div>
                  <div className="font-bold text-white font-mono">
                    {formatValue(selectedCity.soilMoistureM3m3, "m³/m³", 3)}
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono border-t border-brand-border/40 pt-1.5">
                {selectedCity.weather.dataSource}
                {selectedCity.weather.timestamp
                  ? ` · model time ${selectedCity.weather.timestamp}`
                  : ""}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-brand-canvas border border-brand-border space-y-2">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-400 tracking-wider">
                <span>River discharge (GloFAS)</span>
                <span
                  className={
                    selectedCity.flood.status === "live"
                      ? "text-emerald-400 font-bold"
                      : "text-slate-500"
                  }
                >
                  {selectedCity.flood.status === "live" ? "LIVE" : "UNAVAILABLE"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-slate-500 font-mono">Discharge</div>
                  <div className="font-bold text-white font-mono">
                    {formatValue(selectedCity.flood.riverDischargeM3s, "m³/s", 2)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-mono">30-day baseline</div>
                  <div className="font-bold text-white font-mono">
                    {formatValue(selectedCity.flood.baseline30dM3s, "m³/s", 2)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-mono">Anomaly</div>
                  <div className="font-bold text-white font-mono">
                    {selectedCity.flood.dischargeAnomalyPct == null
                      ? "—"
                      : `${selectedCity.flood.dischargeAnomalyPct > 0 ? "+" : ""}${selectedCity.flood.dischargeAnomalyPct}%`}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-mono">Rain next 24h</div>
                  <div className="font-bold text-white font-mono">
                    {formatValue(selectedCity.forecastPrecip24hMm, "mm", 1)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-mono">Prior 3-day rain</div>
                  <div className="font-bold text-white font-mono">
                    {formatValue(selectedCity.antecedentPrecip3dMm, "mm", 1)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-mono">Days ≥ 40°C</div>
                  <div className="font-bold text-white font-mono">
                    {selectedCity.consecutiveHotDays ?? "—"}
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono border-t border-brand-border/40 pt-1.5">
                {selectedCity.flood.note}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono leading-relaxed">
            Heuristic screening indices, not an ML model. Pakistan-specific ML validation: NOT VALIDATED.
            Not an official warning; consult PMD, NDMA, and provincial authorities.
          </div>

          <button
            onClick={() => setSelectedSlug(null)}
            className="text-xs text-slate-400 hover:text-white font-mono transition"
          >
            Close ✕
          </button>
        </div>
      )}

      {/* City marker legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 px-1">
        <span className="font-semibold text-slate-300">
          Marker color = {hazardFilter === "all" ? "worst hazard" : HAZARD_LABELS[hazardFilter]}:
        </span>
        {(Object.keys(CATEGORY_COLORS) as DisplayCategory[]).map((category) => (
          <span key={category} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: CATEGORY_COLORS[category] }}
            />
            {category}
          </span>
        ))}
        <span className="text-slate-500 ml-auto">
          {dataLoading ? "Loading live data…" : `${liveCount}/${cities.length} cities reporting`}
          {generatedAt ? ` · evaluated ${new Date(generatedAt).toLocaleTimeString()}` : ""}
        </span>
      </div>

      {/* Textual fallback when the map fails */}
      {mapError && cities.length > 0 && (
        <div className="rounded-xl border border-brand-border bg-brand-card p-4">
          <div className="text-xs font-mono font-bold text-slate-300 mb-3 uppercase tracking-wider">
            Pakistan cities — textual fallback
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {cities.map((city) => {
              const category = categoryFor(city, hazardFilter);
              return (
                <button
                  key={city.slug}
                  onClick={() => setSelectedSlug(city.slug)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition hover:border-brand-cyan/40",
                    selectedCity?.slug === city.slug
                      ? "border-brand-cyan/60 bg-brand-cardElevated"
                      : "border-brand-border bg-brand-canvas"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[category] }}
                    />
                    <span className="text-xs font-bold text-white">{city.city}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">{city.province}</div>
                  <div className="text-[10px] font-mono text-brand-cyan mt-0.5">{category}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

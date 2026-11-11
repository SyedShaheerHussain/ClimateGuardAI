"use client";

import React, { useState, useEffect, useRef } from "react";
import { Layers, Maximize2, Radio, Sliders, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { MONITORED_BASINS } from "@/config/site";
import { cn } from "@/lib/utils";

interface MapViewportProps {
  height?: string;
  activeBasinCode?: string;
  onBasinSelect?: (basinCode: string) => void;
}

export function MapLibreViewport({
  height = "h-[480px]",
  activeBasinCode,
  onBasinSelect,
}: MapViewportProps) {
  const [activeLayers, setActiveLayers] = useState({
    flood: true,
    thermal: true,
    soil: false,
    firms: true,
  });
  const [opacity, setOpacity] = useState(85);
  const [selectedNode, setSelectedNode] = useState<string | null>(activeBasinCode || "PARANA-S1");

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-xl border border-brand-border bg-[#050B14] overflow-hidden flex flex-col shadow-inner select-none",
        height
      )}
    >
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-brand-sidebar/95 border border-brand-border text-[11px] font-mono text-brand-cyan backdrop-blur shadow-md">
            <Radio className="w-3 h-3 text-brand-cyan animate-pulse" />
            <span>MAPLIBRE GL V3 • EPSG:3857</span>
          </div>

          <div className="flex items-center gap-1 bg-brand-sidebar/95 border border-brand-border rounded p-1 text-xs text-slate-300 backdrop-blur shadow-md">
            <button
              onClick={() => toggleLayer("flood")}
              className={cn(
                "px-2.5 py-0.5 rounded text-[11px] font-mono font-medium transition",
                activeLayers.flood ? "bg-brand-card text-brand-cyan border border-brand-cyan/40" : "text-slate-400 hover:text-white"
              )}
            >
              Flood Extent
            </button>
            <button
              onClick={() => toggleLayer("thermal")}
              className={cn(
                "px-2.5 py-0.5 rounded text-[11px] font-mono font-medium transition",
                activeLayers.thermal ? "bg-brand-card text-brand-cyan border border-brand-cyan/40" : "text-slate-400 hover:text-white"
              )}
            >
              Thermal IR
            </button>
            <button
              onClick={() => toggleLayer("soil")}
              className={cn(
                "px-2.5 py-0.5 rounded text-[11px] font-mono font-medium transition",
                activeLayers.soil ? "bg-brand-card text-brand-cyan border border-brand-cyan/40" : "text-slate-400 hover:text-white"
              )}
            >
              Soil Moisture
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-brand-sidebar/95 border border-brand-border rounded px-2.5 py-1 text-[11px] font-mono text-slate-300 backdrop-blur">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Opacity: {opacity}%</span>
          </div>
          <button
            onClick={() => alert("Full cartographic canvas view initialized.")}
            className="p-1.5 rounded bg-brand-sidebar/95 border border-brand-border text-slate-300 hover:text-white transition backdrop-blur shadow-md"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cartographic Visual Plane */}
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
        {/* Synthetic Tactical Radar Grid Pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="tactical-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#22D3EE" strokeWidth="0.4" />
                <circle cx="25" cy="25" r="1" fill="#22D3EE" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tactical-grid)" />
          </svg>
        </div>

        {/* Global Continental Basemap Contours (Stylized SVG Dark Vector) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <svg viewBox="0 0 1000 500" className="w-full h-full object-contain">
            <path
              d="M150,120 Q180,90 220,110 T320,130 T400,100 T500,120 T650,80 T800,130 T920,160 L920,400 L850,420 T700,380 T550,420 T400,380 T200,430 Z"
              fill="#0E1B2D"
              stroke="#24364B"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Active Threat Hotspots (Pulsing GeoJSON simulation nodes) */}
        {/* 1. Rio Paraná Basin (South America) */}
        <div
          onClick={() => {
            setSelectedNode("PARANA-S1");
            onBasinSelect?.("PARANA-S1");
          }}
          className="absolute top-[58%] left-[26%] flex items-center gap-2 cursor-pointer group z-10"
        >
          <div className="relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-critical opacity-75"></span>
            <div className="relative w-4 h-4 rounded-full bg-risk-critical border-2 border-white shadow-lg shadow-risk-critical/80" />
          </div>
          <div
            className={cn(
              "bg-brand-sidebar/95 border px-2.5 py-1 rounded text-xs backdrop-blur transition-all",
              selectedNode === "PARANA-S1"
                ? "border-risk-critical shadow-lg shadow-risk-critical/30 scale-105"
                : "border-brand-border group-hover:border-slate-300"
            )}
          >
            <div className="font-semibold text-white">Rio Paraná Delta</div>
            <div className="font-mono text-[11px] text-risk-critical font-bold">88% FL-CRITICAL • 14,200 m³/s</div>
          </div>
        </div>

        {/* 2. Rajasthan Corridor (South Asia) */}
        <div
          onClick={() => {
            setSelectedNode("RAJASTHAN-C");
            onBasinSelect?.("RAJASTHAN-C");
          }}
          className="absolute top-[38%] left-[64%] flex items-center gap-2 cursor-pointer group z-10"
        >
          <div className="relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-high opacity-75"></span>
            <div className="relative w-3.5 h-3.5 rounded-full bg-risk-high border-2 border-white shadow-lg shadow-risk-high/80" />
          </div>
          <div
            className={cn(
              "bg-brand-sidebar/95 border px-2.5 py-1 rounded text-xs backdrop-blur transition-all",
              selectedNode === "RAJASTHAN-C"
                ? "border-risk-high shadow-lg shadow-risk-high/30 scale-105"
                : "border-brand-border group-hover:border-slate-300"
            )}
          >
            <div className="font-semibold text-white">Rajasthan Sector</div>
            <div className="font-mono text-[11px] text-risk-high font-bold">76% HEAT-HIGH • 46.2°C</div>
          </div>
        </div>

        {/* 3. Horn of Africa (East Africa) */}
        <div
          onClick={() => {
            setSelectedNode("HORN-Z4");
            onBasinSelect?.("HORN-Z4");
          }}
          className="absolute top-[52%] left-[54%] flex items-center gap-2 cursor-pointer group z-10"
        >
          <div className="relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-moderate opacity-75"></span>
            <div className="relative w-3.5 h-3.5 rounded-full bg-risk-moderate border-2 border-white shadow-lg shadow-risk-moderate/80" />
          </div>
          <div
            className={cn(
              "bg-brand-sidebar/95 border px-2.5 py-1 rounded text-xs backdrop-blur transition-all",
              selectedNode === "HORN-Z4"
                ? "border-risk-moderate shadow-lg shadow-risk-moderate/30 scale-105"
                : "border-brand-border group-hover:border-slate-300"
            )}
          >
            <div className="font-semibold text-white">Horn of Africa Z4</div>
            <div className="font-mono text-[11px] text-risk-moderate font-bold">64% DROUGHT • -41% Soil Anomaly</div>
          </div>
        </div>
      </div>

      {/* Sensor Verification Status Footer */}
      <div className="absolute bottom-0 inset-x-0 bg-brand-sidebar/95 border-t border-brand-border px-4 py-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <span>SENSORS: SENTINEL-2C SAR • GPM IMERG • ERA5 REANALYSIS</span>
          <span className="hidden sm:inline text-brand-cyan">CROSS-VALIDATION: 99.4% SYNCHRONIZED</span>
        </div>
        <div className="text-slate-300">
          COORDINATES: <span className="text-brand-cyan font-bold">25.54° S, 54.51° W</span>
        </div>
      </div>
    </div>
  );
}

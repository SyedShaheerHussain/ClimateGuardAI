# ClimateGuard AI — Production Next.js Architecture & Implementation Blueprint

This specification details the production codebase architecture for **ClimateGuard AI**, translating the approved Stitch UI screens and design tokens directly into a high-performance **Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Lucide Icons** stack.

---

## 1. Directory Structure (`app/` and `components/`)

```
climateguard-ai/
├── app/
│   ├── (public)/                      # Marketing & Public Landing Flow
│   │   ├── layout.tsx                 # Public header, navigation, and footer
│   │   └── page.tsx                   # Public landing page (Screen 17)
│   ├── (dashboard)/                   # Authenticated Enterprise Telemetry Shell
│   │   ├── layout.tsx                 # Master Dashboard Layout (Sidebar + Topbar)
│   │   ├── overview/                  # Main Overview / Command Center (Screen 11)
│   │   │   └── page.tsx
│   │   ├── risk-intelligence/         # Tri-Hazard Predictive Intelligence (Screen 9)
│   │   │   └── page.tsx
│   │   ├── disaster-finance/          # Parametric Triggers & Liquidity Pools (Screen 5)
│   │   │   └── page.tsx
│   │   ├── geospatial-map/            # MapLibre GL Cartographic Console (Screen 15)
│   │   │   └── page.tsx
│   │   └── benchmarks/                # C01 Edge Low-Compute Benchmarks (Screen 3)
│   │       └── page.tsx
│   ├── api/                           # Route Handlers ready for Supabase / Edge
│   │   ├── telemetry/route.ts
│   │   ├── triggers/route.ts
│   │   └── benchmarks/route.ts
│   ├── globals.css                    # Tailwind + CSS Custom Properties
│   └── layout.tsx                     # Root HTML/Metadata wrapper with Manrope font
├── components/
│   ├── ui/                            # shadcn/ui primitives
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── table.tsx
│   │   └── tabs.tsx
│   ├── navigation/                    # Shell Navigation
│   │   ├── dashboard-sidebar.tsx
│   │   ├── dashboard-navbar.tsx
│   │   ├── mobile-tabbar.tsx
│   │   └── public-navbar.tsx
│   ├── cards/                         # Domain Cards
│   │   ├── kpi-metric-card.tsx
│   │   ├── hazard-risk-card.tsx
│   │   └── parametric-trigger-card.tsx
│   ├── charts/                        # Telemetry Visualizations
│   │   ├── hydro-thermal-chart.tsx
│   │   ├── risk-donut-chart.tsx
│   │   └── latency-envelope-chart.tsx
│   ├── maps/                          # Geospatial Components
│   │   ├── maplibre-viewport.tsx
│   │   └── layer-controls.tsx
│   ├── tables/                        # Data Grids & Logs
│   │   ├── incident-feed-table.tsx
│   │   ├── disbursement-audit-table.tsx
│   │   └── benchmark-history-table.tsx
│   ├── forms/                         # Modals & Input Forms
│   │   ├── create-trigger-modal.tsx
│   │   └── run-benchmark-dialog.tsx
│   └── feedback/                      # Notifications & Banners
│       ├── testnet-disclaimer-banner.tsx
│       └── system-status-badge.tsx
├── lib/
│   ├── utils.ts                       # cn() helper
│   ├── supabase/                      # Supabase client & types
│   │   ├── client.ts
│   │   └── server.ts
│   └── types/                         # Enterprise Domain Types
│       ├── climate.ts
│       ├── finance.ts
│       └── benchmark.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 2. Global Styles & Tailwind Configuration

### `tailwind.config.ts`
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        brand: {
          canvas: "#07111F",
          sidebar: "#0B1728",
          navbar: "#0B1728",
          card: "#101F33",
          cardElevated: "#162840",
          border: "#24364B",
          cyan: "#22D3EE",
          blue: "#3B82F6",
          darkBlue: "#2563EB",
          teal: "#14B8A6",
          purple: "#A78BFA",
        },
        risk: {
          safe: "#22C55E",
          moderate: "#EAB308",
          high: "#F97316",
          critical: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### `app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 215 62% 7%;      /* #07111F */
    --foreground: 210 40% 98%;     /* #F8FAFC */
    --card: 216 52% 13%;           /* #101F33 */
    --card-foreground: 210 40% 98%;
    --popover: 216 48% 17%;        /* #162840 */
    --popover-foreground: 210 40% 98%;
    --primary: 189 88% 54%;        /* #22D3EE */
    --primary-foreground: 215 62% 7%;
    --secondary: 217 33% 22%;      /* #24364B */
    --secondary-foreground: 210 40% 98%;
    --muted: 215 25% 27%;
    --muted-foreground: 215 20% 65%; /* #94A3B8 */
    --border: 214 35% 22%;         /* #24364B */
    --input: 214 35% 22%;
    --ring: 189 88% 54%;
  }

  body {
    @apply bg-brand-canvas text-slate-100 font-sans antialiased selection:bg-brand-cyan/20 selection:text-brand-cyan;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11", "tnum";
  }
}
```

---

## 3. Core Shell Layouts

### Master Dashboard Shell (`app/(dashboard)/layout.tsx`)
```tsx
import React from "react";
import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";
import { DashboardNavbar } from "@/components/navigation/dashboard-navbar";
import { MobileTabBar } from "@/components/navigation/mobile-tabbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-canvas flex flex-col md:flex-row text-slate-100">
      {/* 250px Fixed Left Sidebar (Desktop) */}
      <aside className="hidden md:block w-[250px] shrink-0 border-r border-brand-border bg-brand-sidebar sticky top-0 h-screen overflow-y-auto">
        <DashboardSidebar />
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* 72px Top Navigation */}
        <header className="h-[72px] shrink-0 border-b border-brand-border bg-brand-navbar/95 backdrop-blur sticky top-0 z-30 px-6 flex items-center justify-between">
          <DashboardNavbar />
        </header>

        {/* Dynamic Inner Page Content */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Touch-Optimized Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-navbar/95 backdrop-blur border-t border-brand-border h-16">
        <MobileTabBar />
      </nav>
    </div>
  );
}
```

---

## 4. Reusable Telemetry & Risk Components

### A. Climate KPI Metric Card (`components/cards/kpi-metric-card.tsx`)
```tsx
import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiMetricCardProps {
  title: string;
  metric: string;
  unit?: string;
  subtext?: string;
  icon: LucideIcon;
  badge?: {
    label: string;
    variant: "safe" | "moderate" | "high" | "critical";
  };
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
}

const badgeVariants = {
  safe: "text-risk-safe bg-risk-safe/10 border-risk-safe/30",
  moderate: "text-risk-moderate bg-risk-moderate/10 border-risk-moderate/30",
  high: "text-risk-high bg-risk-high/10 border-risk-high/30",
  critical: "text-risk-critical bg-risk-critical/10 border-risk-critical/30",
};

export function KpiMetricCard({
  title,
  metric,
  unit,
  subtext,
  icon: Icon,
  badge,
  trend,
  className,
}: KpiMetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-brand-border bg-brand-card p-5 relative overflow-hidden transition-all hover:border-brand-cyan/40",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {badge && (
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                badgeVariants[badge.variant]
              )}
            >
              {badge.label}
            </span>
          )}
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
          {metric}
        </span>
        {unit && <span className="text-sm text-slate-400 font-medium">{unit}</span>}
      </div>

      {(subtext || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-brand-border/60 pt-2.5">
          <span>{subtext}</span>
          {trend && (
            <span
              className={cn(
                "font-mono font-semibold",
                trend.positive ? "text-risk-safe" : "text-risk-high"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

### B. Hazard Risk Evaluation Card (`components/cards/hazard-risk-card.tsx`)
```tsx
import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ContributingDriver {
  label: string;
  percentage: number;
}

interface HazardRiskCardProps {
  title: string;
  model: string;
  severity: "safe" | "moderate" | "high" | "critical";
  severityLabel: string;
  metricLabel: string;
  metricValue: string;
  anomalyDelta: string;
  drivers: ContributingDriver[];
  icon: LucideIcon;
}

const severityBorderColors = {
  safe: "border-l-risk-safe",
  moderate: "border-l-risk-moderate",
  high: "border-l-risk-high",
  critical: "border-l-risk-critical",
};

export function HazardRiskCard({
  title,
  model,
  severity,
  severityLabel,
  metricLabel,
  metricValue,
  anomalyDelta,
  drivers,
  icon: Icon,
}: HazardRiskCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-brand-border bg-brand-card p-5 border-l-4 transition-all hover:bg-brand-cardElevated/50",
        severityBorderColors[severity]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-brand-canvas border border-brand-border text-brand-cyan">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white leading-tight">{title}</h4>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{model}</p>
          </div>
        </div>
        <span
          className={cn(
            "text-xs font-bold uppercase px-2.5 py-1 rounded-md border",
            severity === "critical" && "bg-risk-critical/15 text-risk-critical border-risk-critical/30",
            severity === "high" && "bg-risk-high/15 text-risk-high border-risk-high/30",
            severity === "moderate" && "bg-risk-moderate/15 text-risk-moderate border-risk-moderate/30",
            severity === "safe" && "bg-risk-safe/15 text-risk-safe border-risk-safe/30"
          )}
        >
          {severityLabel}
        </span>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-brand-canvas/60 border border-brand-border/60">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
          {metricLabel}
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-black font-mono text-white">{metricValue}</span>
          <span className="text-xs font-mono font-medium text-slate-300">{anomalyDelta}</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
          Contributing Factors
        </div>
        {drivers.map((driver) => (
          <div key={driver.label} className="space-y-1">
            <div className="flex justify-between text-xs text-slate-300">
              <span>{driver.label}</span>
              <span className="font-mono font-medium">{driver.percentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-brand-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-cyan rounded-full transition-all duration-500"
                style={{ width: `${driver.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. MapLibre GL Integration Wrapper (`components/maps/maplibre-viewport.tsx`)

```tsx
"use client";

import React, { useEffect, useRef } from "react";
import { Layers, Maximize2, ShieldAlert } from "lucide-react";

interface MapViewportProps {
  center?: [number, number];
  zoom?: number;
  activeLayers?: string[];
  onMarkerClick?: (basinId: string) => void;
}

export function MapLibreViewport({
  center = [25.5, 54.8],
  zoom = 5.4,
}: MapViewportProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In production, initialize MapLibre GL instance with custom dark-matter style
    // e.g., const map = new maplibregl.Map({ container: mapContainerRef.current, style: '...' });
  }, []);

  return (
    <div className="relative w-full h-[460px] rounded-xl border border-brand-border bg-[#050B14] overflow-hidden flex flex-col">
      {/* Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="px-2.5 py-1 rounded bg-brand-sidebar/90 border border-brand-border text-[11px] font-mono text-brand-cyan backdrop-blur">
            MAPLIBRE GL V3 • EPSG:3857
          </span>
          <div className="flex items-center gap-1 bg-brand-sidebar/90 border border-brand-border rounded p-0.5 text-xs text-slate-300 backdrop-blur">
            <button className="px-2 py-0.5 rounded bg-brand-card text-brand-cyan font-medium">
              Flood Extent
            </button>
            <button className="px-2 py-0.5 rounded hover:text-white transition">
              Thermal IR
            </button>
            <button className="px-2 py-0.5 rounded hover:text-white transition">
              Soil Moisture
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button className="p-1.5 rounded bg-brand-sidebar/90 border border-brand-border text-slate-300 hover:text-white backdrop-blur">
            <Layers className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded bg-brand-sidebar/90 border border-brand-border text-slate-300 hover:text-white backdrop-blur">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full relative">
        {/* Visual Fallback / Coordinate Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#24364B" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Dynamic Telemetry Markers */}
        <div className="absolute top-[48%] left-[45%] flex items-center gap-2 pointer-events-auto">
          <div className="relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-critical opacity-75"></span>
            <div className="relative w-3.5 h-3.5 rounded-full bg-risk-critical border-2 border-white shadow-lg shadow-risk-critical/50" />
          </div>
          <div className="bg-brand-sidebar/95 border border-brand-border px-2.5 py-1 rounded text-xs backdrop-blur">
            <span className="font-semibold text-white">Paraná Delta: </span>
            <span className="font-mono text-risk-critical font-bold">88% FL-CRIT</span>
          </div>
        </div>
      </div>

      {/* Sensor Verification Status Footer */}
      <div className="absolute bottom-0 inset-x-0 bg-brand-sidebar/90 border-t border-brand-border px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400 backdrop-blur">
        <span>SENSORS: SENTINEL-2C SAR, GPM IMERG, ERA5</span>
        <span className="text-brand-cyan">CROSS-VALIDATION: 99.4% SYNCHRONIZED</span>
      </div>
    </div>
  );
}
```

---

## 6. Real API & Supabase Integration Types (`lib/types/climate.ts`)

```typescript
export type RiskSeverity = "safe" | "moderate" | "high" | "critical";

export interface HydroTelemetryRecord {
  id: string;
  catchment_id: string;
  catchment_name: string;
  recorded_at: string;
  discharge_rate_m3s: number;
  precipitation_24h_mm: number;
  gauge_anomaly_meters: number;
  soil_moisture_rzsm: number;
  ambient_temp_c: number;
  wbgt_temp_c: number;
}

export interface ParametricTriggerRule {
  id: string;
  contract_address: string;
  region_name: string;
  hazard_type: "flood" | "heatwave" | "drought";
  metric_threshold: number;
  target_payout_usd: number;
  quorum_required: number;
  status: "standby" | "monitoring" | "triggered" | "executed";
  last_evaluated_at: string;
}

export interface C01BenchmarkResult {
  run_id: string;
  timestamp: string;
  target_hardware: string;
  inferences_count: 100;
  total_latency_ms: number | null; // null represents "NOT TESTED" state
  peak_rss_mb: number | null;
  status: "NOT_TESTED" | "VERIFIED" | "FAILED";
  ed25519_signature?: string;
}
```

---

## 7. Migration & Implementation Checklist

1. **Setup Dependencies**:
   ```bash
   npx create-next-app@latest climateguard --typescript --tailwind --app
   npx shadcn-ui@latest init
   npm install lucide-react maplibre-gl @supabase/supabase-js clsx tailwind-merge
   ```
2. **Apply Design Tokens**: Copy `globals.css` and `tailwind.config.ts` into root.
3. **Assemble Component Tree**: Integrate provided layout, KPI cards, and data tables.
4. **Wire Supabase Realtime**: Connect `app/api/telemetry/route.ts` to Supabase Realtime Channels for sub-second sensor stream updates.
5. **Enforce Air-Gapped Benchmarking**: Keep benchmark screens connected strictly to local hardware profiling endpoints with default neutral **"Not Tested"** state.

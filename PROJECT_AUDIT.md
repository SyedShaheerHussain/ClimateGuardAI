# ClimateGuard AI — Comprehensive Project Audit & Screen Inventory

> **Historical design audit (not implementation status).** This document reviews the imported
> Google Stitch screen designs and their intended route mapping. It predates the implementation and
> contains design-stage ideas such as global basins and oracle payouts that the current build does
> not implement. For current status see `PROJECT_IMPLEMENTATION_STATUS.md`.

**Author:** Lead Software Architect & Senior Full-Stack Engineer  
**Project:** ClimateGuard AI Design System  
**Source Platform:** Google Stitch (Project ID: `14887812630545724297`)  
**Target Architecture:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase  
**Date of Audit:** November 11, 2026  

---

## Executive Summary

A full forensic audit was conducted on the 10 screens and assets imported from Google Stitch into `c:\Users\SnK\Downloads\climateGuardAI`. The designs represent an **enterprise-grade, dark-themed responsive Web SaaS platform** engineered for government authorities, climate risk analysts, and humanitarian disaster finance teams.

The visual fidelity, color palette, typography scales, layout grids, and domain terminology are fully defined across the imported HTML, high-resolution PNG renders, and JSON metadata tokens. 

This document provides:
1. **Audit of Existing Technical Foundation** (frameworks, dependencies, assets, routing, code quality).
2. **Screen-by-Screen Inventory** with intended Next.js App Router route mappings.
3. **Component Taxonomy & Extraction Strategy** (reusable components vs. page-specific layouts).
4. **Identification of Gaps, Broken Code, and Missing Production Infrastructure**.

---

## 1. Technical Audit of Existing Files

### 1.1 Existing Framework & Runtime Environment
- **Current Imported State:** Standalone static HTML5 documents (`.html`), accompanied by metadata JSON manifests (`.json`) and raster PNG captures (`.png`).
- **CSS Engine:** Tailwind CSS v3 delivered via runtime client-side script (`https://cdn.tailwindcss.com`) with embedded custom `tailwind.config` blocks injecting custom color definitions and spacing.
- **Typography & Icons:**
  - Google Fonts: `Manrope` (headlines, 600/700 weight), `Inter` (body, metadata, labels, 400/500/600/700 weight).
  - Iconography: Google `Material Symbols Outlined` via Google Fonts stylesheet.
- **Client Scripting:** Inline `<script>` tags handling isolated DOM interactions (e.g., spin state on refresh buttons, slider track drag mocks).
- **Target Target Stack:** Production Next.js 14+/15 (App Router), React 19, TypeScript, native compiled Tailwind CSS with `tailwind.config.ts`, `shadcn/ui`, `lucide-react`, `MapLibre GL JS`, `Recharts`, and `Supabase PostgreSQL`.

### 1.2 Existing Dependencies (Imported vs. Target Required)

| Component Area | Current Imported Form | Target Next.js Production Dependency | Status / Action Required |
|---|---|---|---|
| **Styling** | `cdn.tailwindcss.com` | `tailwindcss`, `postcss`, `autoprefixer`, `tailwindcss-animate` | Migrate inline configs to `tailwind.config.ts` |
| **Typography** | External CDN link tags | `next/font/google` (`Manrope`, `Inter`) | Zero layout-shift self-hosted Next.js fonts |
| **Icons** | Material Symbols CDN font | `lucide-react` | 1-to-1 conversion of symbol glyphs to Lucide SVG components |
| **UI Primitives** | Hardcoded HTML tags | `shadcn/ui` (Radix UI primitives: Dialog, Dropdown, Tabs, Table) | Wrap into accessible composable primitives |
| **Class Merging** | Raw template strings | `clsx`, `tailwind-merge` (`cn()` helper) | Implement standard `lib/utils.ts` |
| **Geospatial Map** | Static SVG vector illustration | `maplibre-gl`, `@types/maplibre-gl` | Initialize WebGL canvas with dark cartographic basemap |
| **Telemetry Charts** | Static SVG path curves | `recharts` | Replace hardcoded SVG paths with dynamic reactive series |
| **Backend & Auth** | None (static client only) | `@supabase/supabase-js`, `@supabase/ssr` | Build auth session handling and PostgreSQL schema |
| **Validation** | None | `zod` | Schema validation for triggers, telemetry, benchmarks |

### 1.3 Existing Pages & Screen Inventory

The imported repository contains 10 structured deliverables:

```
c:\Users\SnK\Downloads\climateGuardAI\
├── 01-climate-intelligence-overview.html / .png / .json
├── 02-climateguard-ai-home.html / .png / .json
├── 03-geospatial-monitoring-map.html / .png / .json
├── 04-disaster-finance-parametric-triggers.html / .png / .json
├── 05-climateguard-ai-main-dashboard.html / .png / .json
├── 06-climate-risk-intelligence.html / .png / .json
├── 07-climate-risk-intelligence-mobile.html / .png / .json
├── 08-disaster-finance-parametric-triggers-alt.html / .png / .json
├── 09-c01-low-compute-edge-inference-benchmark.html / .png / .json
├── 10-climateguard-ai-production-next-js-architecture-spec.html / .md / .json
└── manifest.json
```

---

## 2. Screen-by-Screen Inventory & Route Mapping

| # | Screen Name | Screen ID | Resolution / Device | Intended App Router Route | Purpose & Key Features |
|---|---|---|---|---|---|
| **01** | **Climate Intelligence Overview** | `9be960a0c416413e9084ad8f424df64e` | 2560 × 4644 (Desktop) | `/overview` *(V1 Prototype Reference)* | 4 Top KPIs, 2/3 Map viewport, Risk donut, 48h Weather Trends, Incident table, Mini Funding cards. |
| **02** | **ClimateGuard AI - Home** | `dbec315114eb469fa6503073cc8a5854` | 2560 × 13044 (Desktop) | `/` *(Public Landing Page)* | Public landing page: Hero with live telemetry preview, Tri-Hazard Engine breakdown, Disaster Finance Explainer, C01 Benchmark proof, Architecture/Security credentials, Cost/Speed calculator, Enterprise Footer. |
| **03** | **Geospatial Monitoring Map** | `deffbf1a2f7d4dc38f5a45cac33ae695` | 2560 × 2048 (Desktop) | `/geospatial-map` | Fullscreen cartographic workspace: MapLibre GL WebGL viewport, layer toggles (Flood, Thermal IR, Soil Desiccation, FIRMS Fires), temporal scrub bar, coordinate telemetry, basin inspection side-drawers. |
| **04** | **Disaster Finance & Parametric Triggers** | `da6b0f85af4d4445a453a1106b3dbbe6` | 2560 × 3640 (Desktop) | `/disaster-finance` *(V1 Concept)* | Earlier iteration of the finance view: Liquidity pool metrics, trigger thresholds, payout simulation ledger. |
| **05** | **ClimateGuard AI - Main Dashboard** | `468587b89ebc462ba2686e0f8112fbd3` | 2560 × 4490 (Desktop) | `/overview` *(Flagship Production)* | Production Command Center: Breadcrumbs, 4 Telemetry KPIs (Paraná, Indus, Rajasthan, Horn of Africa), MapLibre WebGL Viewport, Hydro-Meteorological 48h chart, Tri-Hazard matrix, Multisig audit ledger. |
| **06** | **Climate Risk Intelligence** | `793ff1ff846f484bb504b9b8e46c1017` | 2560 × 4276 (Desktop) | `/risk-intelligence` *(Desktop)* | Deep-dive analytical workspace: Tri-Hazard predictive modeling (Flood, Heatwave, Drought), root-cause anomaly deltas, sensor cross-validation (Sentinel-2, GPM IMERG, ERA5), active warnings list. |
| **07** | **Climate Risk Intelligence - Mobile** | `1a2e2bd5e73e4fada723a844cef42e12` | 780 × 5814 (Mobile) | `/risk-intelligence` *(Mobile Layout)* | Mobile responsive viewport: Touch-optimized bottom tab navigation, compact severity cards, accordion factor breakdowns, mobile telemetry metrics. |
| **08** | **Disaster Finance & Parametric Triggers (Alt)** | `77e6394916c644ba876254f1cc8add62` | 2560 × 4598 (Desktop) | `/disaster-finance` *(Flagship Production)* | Comprehensive finance console: $42.5M Liquidity pool KPIs, Payout Velocity comparative metrics (4.2h vs 45d), Active Rule configurations, "Create New Parametric Funding Rule" Modal, Cryptographic Merkle audit log. |
| **09** | **C01 Low-Compute Edge Inference Benchmark** | `7504176f8f754e579af1f2dad60698b1` | 2560 × 4070 (Desktop) | `/benchmarks` | Low-compute hardware profiling: 100-run latency envelopes (p50/p95/p99), peak RSS memory usage, cold start verification, air-gapped cryptographic signature validation, zero external runtime dependencies. |
| **10** | **Next.js Architecture Spec** | `8b8fc521100246678ccf58bcafd5fcb5` | Markdown Specification | `/docs/architecture` | Complete Next.js App Router implementation guide, TypeScript models, Tailwind CSS variables, and component blueprint generated in Stitch. |

---

## 3. Component Extraction & Reusability Audit

From the 9 visual HTML screens, the following modular, reusable component hierarchy is identified:

### 3.1 App Shell & Navigation
1. **`DashboardSidebar` (`components/navigation/dashboard-sidebar.tsx`)**
   - 250px fixed left sidebar with brand logo, telemetry connection beacon, primary navigation links with active indicators, system status widget, and user profile pill.
2. **`DashboardNavbar` (`components/navigation/dashboard-navbar.tsx`)**
   - 72px sticky top bar with breadcrumbs, basin/location selector dropdown, time-horizon filter, live sync trigger with timestamp, notifications popover, and scenario simulation CTA.
3. **`MobileTabBar` (`components/navigation/mobile-tabbar.tsx`)**
   - Fixed bottom tab bar with 5 primary touch targets (`Overview`, `Map`, `Risk Intel`, `Finance`, `Benchmarks`) and active highlight indicators.
4. **`PublicNavbar` & `PublicFooter` (`components/navigation/public-*.tsx`)**
   - Marketing shell with hero CTA, product nav links, platform status badge, documentation links, and regulatory disclaimers.

### 3.2 Telemetry & Domain Cards
1. **`KpiMetricCard` (`components/cards/kpi-metric-card.tsx`)**
   - High-contrast card displaying numeric metric in tabular figures (`font-mono`), status badge (`safe`, `moderate`, `high`, `critical`), icon, and 24h baseline trend comparison.
2. **`HazardRiskCard` (`components/cards/hazard-risk-card.tsx`)**
   - Multi-metric card with color-coded left border, active threat index, anomaly delta, and contributing environmental factors percentage progress bars.
3. **`ParametricRuleCard` (`components/cards/parametric-rule-card.tsx`)**
   - Rule card displaying trigger threshold conditions, current live telemetry status, maximum payout cap, oracle quorum indicator, and configuration actions.
4. **`BenchmarkResultCard` (`components/cards/benchmark-result-card.tsx`)**
   - Hardware test score card displaying target CPU/SoC, 100-run latency envelope, peak RSS memory, and Ed25519 signature verification badge.

### 3.3 Visualizations & Cartography
1. **`MapLibreViewport` (`components/maps/maplibre-viewport.tsx`)**
   - Interactive WebGL cartographic map with custom dark tiles, raster/vector overlays for flood polygons and thermal heatmaps, pulsating threat nodes, and coordinate HUD.
2. **`LayerControls` (`components/maps/layer-controls.tsx`)**
   - Floating map control pill with layer toggles (Flood, Heatwave, Drought, FIRMS active fires), opacity slider, and projection modes (EPSG:3857 vs. 3D Globe).
3. **`HydroThermalChart` (`components/charts/hydro-thermal-chart.tsx`)**
   - Dual-axis time-series visualization plotting Temperature (°C) line curve, Rainfall (mm) bar/area series, and Relative Humidity (%) with 48h historical vs. 24h forecast dividing line.
4. **`RiskDistributionDonut` (`components/charts/risk-donut-chart.tsx`)**
   - Donut chart displaying categorical hazard split (e.g. 42% Flood, 31% Heatwave, 27% Drought) with interactive legends.
5. **`LatencyEnvelopeChart` (`components/charts/latency-envelope-chart.tsx`)**
   - Benchmark distribution histogram showing p50, p95, and p99 millisecond inference latencies.

### 3.4 Data Grids, Modals & Feedback
1. **`IncidentFeedTable` (`components/tables/incident-feed-table.tsx`)**
   - Dense telemetry table with incident IDs, catchment locations, hazard tags, severity badges, detection timestamps, and quick drill-down triggers.
2. **`DisbursementAuditTable` (`components/tables/disbursement-audit-table.tsx`)**
   - Enterprise audit log with request IDs, target basins, threshold telemetry, calculated payout amounts, multi-sig consensus status, and cryptographic Merkle proof hashes.
3. **`CreateTriggerModal` (`components/forms/create-trigger-modal.tsx`)**
   - Modal dialog for configuring parametric disaster rules with hazard selector, catchment dropdown, threshold operator, duration, and maximum liquidity payout cap.
4. **`TestnetDisclaimerBanner` (`components/feedback/testnet-disclaimer-banner.tsx`)**
   - Notice banner emphasizing parametric simulation mode and testnet cryptographic attestation.

---

## 4. Gaps, Missing Infrastructure & Code Quality Issues

The following gaps must be resolved during implementation:

1. **Icons & Styling Separation:**
   - *Issue:* HTML files load Material Symbols via CDN and rely on hardcoded text strings (e.g. `<span class="material-symbols-outlined">water_drop</span>`).
   - *Resolution:* Replace with standardized, tree-shaken `lucide-react` SVG components (`Droplets`, `Flame`, `SunMedium`, `MapPin`, `Activity`, `Layers`).
2. **Static Mock SVGs vs. Dynamic Interactive Charts:**
   - *Issue:* The weather trends and benchmark graphs in the static HTML are static, non-interactive SVG shapes that cannot respond to real-time data or window resize events.
   - *Resolution:* Implement responsive Recharts components powered by typed data models.
3. **Mock Map vs. Interactive MapLibre GL Canvas:**
   - *Issue:* The map in screens 1, 3, and 5 is simulated with SVG grid lines and static glowing circles.
   - *Resolution:* Integrate MapLibre GL JS with custom dark vector basemap tiles (CartoDB Dark Matter or MapTiler) and dynamically rendered GeoJSON hazard layers.
4. **Absence of Backend State & Authentication:**
   - *Issue:* The imported files are purely client-side templates without API endpoints, database persistence, or role-based user sessions.
   - *Resolution:* Connect Supabase PostgreSQL, row-level security (RLS), Supabase Auth middleware, and Next.js Route Handlers.
5. **Screen Duplication Reconciliation:**
   - Screen 1 is the V1 prototype; Screen 5 is the enhanced flagship Main Dashboard. **Recommendation:** Implement Screen 5 as `/overview`, preserving Screen 1's incident matrix cards as supplementary modular widgets.
   - Screen 4 is the V1 finance prototype; Screen 8 is the comprehensive production Disaster Finance screen with the modal dialog. **Recommendation:** Implement Screen 8 as `/disaster-finance`.
   - Screen 6 (Desktop) and Screen 7 (Mobile) represent the same route (`/risk-intelligence`). **Recommendation:** Build a single responsive page that automatically switches between the desktop multi-column analytical grid and the mobile touch-optimized view using Tailwind responsive breakpoints.

---

## 5. Audit Conclusion & Next Steps

The Stitch design export is complete and self-consistent. The design system tokens (`#07111F` canvas, `#0B1728` shell, `#101F33` cards, `#22D3EE` cyan accent, `#EF4444` critical alert) provide an authoritative visual blueprint. 

Proceeding to **Task 3 (ARCHITECTURE.md)** and **Task 5 (Implementation Plan)**.

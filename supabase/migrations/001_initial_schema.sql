-- ==============================================================================
-- ClimateGuard AI — Initial Schema (Pakistan five-city monitoring)
-- ==============================================================================
-- Additive decision-support schema. It does not execute payouts. Monetary
-- columns are PKR. The web app currently runs from server memory plus live
-- public feeds; these tables are for optional persistence once Supabase is set.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Monitored locations (city centres, not administrative boundaries)
CREATE TABLE IF NOT EXISTS public.catchment_basins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    area_sq_km NUMERIC(10, 2),
    population_exposed INTEGER,
    centroid GEOMETRY(Point, 4326) NOT NULL,
    boundary GEOMETRY(Polygon, 4326),
    alert_level VARCHAR(20) NOT NULL DEFAULT 'unassessed'
        CHECK (alert_level IN ('unassessed', 'safe', 'moderate', 'high', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.catchment_basins IS
    'Monitored city centroids. population_exposed and area_sq_km are NULL until a verified source is loaded; do not treat them as census figures.';

CREATE INDEX IF NOT EXISTS idx_catchment_basins_centroid ON public.catchment_basins USING GIST (centroid);
CREATE INDEX IF NOT EXISTS idx_catchment_basins_slug ON public.catchment_basins (slug);

-- 2. Telemetry records (model-grid values, not station observations)
CREATE TABLE IF NOT EXISTS public.telemetry_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    basin_id UUID NOT NULL REFERENCES public.catchment_basins(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    river_discharge_m3s NUMERIC(10, 2),
    precipitation_rate_mm_hr NUMERIC(8, 2),
    surface_temp_c NUMERIC(5, 2),
    wet_bulb_temp_c NUMERIC(5, 2),
    relative_humidity_pct NUMERIC(5, 2),
    soil_moisture_m3m3 NUMERIC(5, 3),
    source_oracle VARCHAR(100) NOT NULL DEFAULT 'open-meteo + glofas (model grid)',
    confidence_score NUMERIC(5, 2),
    raw_payload JSONB
);

COMMENT ON COLUMN public.telemetry_records.source_oracle IS
    'Provenance label of the upstream feed. Values are model output unless the row says otherwise.';
COMMENT ON COLUMN public.telemetry_records.confidence_score IS
    'NULL unless the writer can justify a score. Do not default to a fabricated number.';

CREATE INDEX IF NOT EXISTS idx_telemetry_basin_time ON public.telemetry_records (basin_id, recorded_at DESC);

-- 3. Parametric rules (evaluation only — nothing is disbursed)
CREATE TABLE IF NOT EXISTS public.parametric_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_code VARCHAR(32) UNIQUE NOT NULL,
    basin_id UUID REFERENCES public.catchment_basins(id) ON DELETE SET NULL,
    hazard_type VARCHAR(32) NOT NULL CHECK (hazard_type IN ('flood', 'heatwave', 'drought', 'storm')),
    parameter VARCHAR(64) NOT NULL,
    operator VARCHAR(4) NOT NULL CHECK (operator IN ('>=', '<=', '>', '<', '==')),
    threshold_value NUMERIC(12, 2) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    payout_amount_pkr NUMERIC(18, 2) NOT NULL,
    insured_beneficiary VARCHAR(255),
    disbursement_method VARCHAR(64) NOT NULL DEFAULT 'simulation_only',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.parametric_rules IS
    'SIMULATION — NO FUNDS ARE TRANSFERRED. payout_amount_pkr is an illustrative model input, not a commitment.';

CREATE INDEX IF NOT EXISTS idx_parametric_rules_basin ON public.parametric_rules (basin_id);

-- 4. Simulation audit log (no blockchain settlement, no transfers)
CREATE TABLE IF NOT EXISTS public.disbursement_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID REFERENCES public.parametric_rules(id) ON DELETE SET NULL,
    basin_id UUID REFERENCES public.catchment_basins(id) ON DELETE SET NULL,
    trigger_timestamp TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    payout_amount_pkr NUMERIC(18, 2) NOT NULL,
    beneficiary VARCHAR(255),
    simulation_ref VARCHAR(128) UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'simulated'
        CHECK (status IN ('simulated', 'pending_review', 'approved_simulation', 'rejected')),
    audit_proof JSONB NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.disbursement_audits IS
    'SIMULATION LOG. No money moves and no on-chain transaction exists. simulation_ref is a local identifier.';

CREATE INDEX IF NOT EXISTS idx_disbursement_audits_time ON public.disbursement_audits (executed_at DESC);

-- 5. C01 edge inference benchmark runs
CREATE TABLE IF NOT EXISTS public.benchmark_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_model VARCHAR(100) NOT NULL,
    quantization VARCHAR(20) NOT NULL,
    batch_size INTEGER NOT NULL DEFAULT 1,
    avg_latency_ms NUMERIC(8, 3) NOT NULL,
    peak_vram_mb NUMERIC(8, 2) NOT NULL,
    throughput_samples_sec NUMERIC(10, 2) NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.benchmark_runs IS
    'Values describe the machine that ran scripts/benchmark/run-c01-benchmark.mjs. They are not a certified hardware claim.';

-- 6. Row-Level Security
ALTER TABLE public.catchment_basins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametric_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursement_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_runs ENABLE ROW LEVEL SECURITY;

-- Public read-only access. Writes are service-role only (service role bypasses RLS).
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['catchment_basins', 'telemetry_records', 'parametric_rules', 'disbursement_audits', 'benchmark_runs']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t AND policyname = t || '_public_select'
    ) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', t || '_public_select', t);
    END IF;
  END LOOP;
END $$;

-- 7. Seed the five monitored Pakistan city centroids
--    Coordinates match src/lib/cities/pakistan.ts. Area/population remain NULL.
INSERT INTO public.catchment_basins (slug, name, country, region, centroid)
VALUES
    ('karachi',   'Karachi',   'Pakistan', 'Sindh',                      ST_SetSRID(ST_MakePoint(67.0011, 24.8607), 4326)),
    ('hyderabad', 'Hyderabad', 'Pakistan', 'Sindh',                      ST_SetSRID(ST_MakePoint(68.3578, 25.3960), 4326)),
    ('sukkur',    'Sukkur',    'Pakistan', 'Sindh',                      ST_SetSRID(ST_MakePoint(68.8574, 27.7052), 4326)),
    ('lahore',    'Lahore',    'Pakistan', 'Punjab',                     ST_SetSRID(ST_MakePoint(74.3587, 31.5204), 4326)),
    ('islamabad', 'Islamabad', 'Pakistan', 'Islamabad Capital Territory', ST_SetSRID(ST_MakePoint(73.0479, 33.6844), 4326))
ON CONFLICT (slug) DO NOTHING;

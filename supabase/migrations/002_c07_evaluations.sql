-- ==============================================================================
-- ClimateGuard AI — Migration 002: C07 evaluation records
-- ==============================================================================
-- The C07 run evaluates a Rajasthan dataset. It is NOT a Pakistan validation.
-- Rows default to 'NOT VALIDATED' so an unevaluated model is never presented
-- as a pass. Writes are service-role only; no public INSERT policy exists.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.c07_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(255) NOT NULL,
    baseline_name VARCHAR(255) NOT NULL,
    dataset_identifier VARCHAR(128) NOT NULL,
    dataset_version VARCHAR(32) NOT NULL DEFAULT '1.0',
    evaluation_metric VARCHAR(32) NOT NULL DEFAULT 'F1-Score',
    primary_score NUMERIC(6, 4) NOT NULL,
    baseline_score NUMERIC(6, 4) NOT NULL,
    improvement_pct NUMERIC(8, 2) NOT NULL,
    heuristic_score NUMERIC(6, 4),
    heuristic_improvement_pct NUMERIC(8, 2),
    training_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    test_sample_count INTEGER NOT NULL DEFAULT 365,
    heatwave_count INTEGER NOT NULL DEFAULT 0,
    evaluation_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verification_status VARCHAR(20) NOT NULL DEFAULT 'NOT VALIDATED'
        CHECK (verification_status IN ('NOT VALIDATED', 'PASS', 'FAIL')),
    report_location VARCHAR(512) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.c07_evaluations IS
    'Benchmark metadata only. A PASS here describes the named dataset, not Pakistan.';

CREATE INDEX IF NOT EXISTS idx_c07_evaluations_timestamp ON public.c07_evaluations (evaluation_timestamp DESC);

-- C01 benchmark runs — extended columns (safe upsert)
ALTER TABLE public.benchmark_runs
    ADD COLUMN IF NOT EXISTS total_latency_ms NUMERIC(10, 3),
    ADD COLUMN IF NOT EXISTS avg_latency_ms_per_sample NUMERIC(8, 4),
    ADD COLUMN IF NOT EXISTS p50_latency_ms NUMERIC(8, 4),
    ADD COLUMN IF NOT EXISTS p95_latency_ms NUMERIC(8, 4),
    ADD COLUMN IF NOT EXISTS p99_latency_ms NUMERIC(8, 4),
    ADD COLUMN IF NOT EXISTS batch_latency_pass BOOLEAN,
    ADD COLUMN IF NOT EXISTS memory_pass BOOLEAN,
    ADD COLUMN IF NOT EXISTS overall_status VARCHAR(8),
    ADD COLUMN IF NOT EXISTS cryptographic_signature TEXT,
    ADD COLUMN IF NOT EXISTS signature_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS runtime_info JSONB,
    ADD COLUMN IF NOT EXISTS device_info JSONB,
    ADD COLUMN IF NOT EXISTS run_id VARCHAR(32);

-- RLS: public read-only. The service role bypasses RLS for ingestion.
ALTER TABLE public.c07_evaluations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'c07_evaluations' AND policyname = 'c07_evaluations_public_select'
  ) THEN
    CREATE POLICY c07_evaluations_public_select ON public.c07_evaluations FOR SELECT USING (true);
  END IF;
END $$;

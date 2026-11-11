import {
  CatchmentBasin,
  HazardRiskEvaluation,
  ParametricFundingRule,
  DisbursementAuditLog,
  BasinProfile,
  IncidentRecord,
  BenchmarkDevice,
} from "@/types";

// Historical module retained only because legacy components still import the
// symbols. Every dataset is intentionally empty: live values come from
// src/lib/risk/city-risks.ts, src/lib/finance, and /api/*. Do not add
// illustrative rows here — an imported constant is indistinguishable from a
// verified record at the call site.

export const SITE_CONFIG = {
  name: "ClimateGuard AI",
  description:
    "Pakistan-focused climate risk screening and disaster-finance simulation (demo build)",
};

export const MONITORED_BASINS: CatchmentBasin[] = [];
export const HAZARD_EVALUATIONS: HazardRiskEvaluation[] = [];
export const INITIAL_PARAMETRIC_RULES: ParametricFundingRule[] = [];
export const INITIAL_DISBURSEMENTS: DisbursementAuditLog[] = [];
export const BASIN_DATA: BasinProfile[] = [];
export const INCIDENT_FEED: IncidentRecord[] = [];
export const BENCHMARK_DEVICES: BenchmarkDevice[] = [];

import React from "react";
import { CityHazardView } from "@/components/risk/city-hazard-view";
import { buildCityRisks } from "@/lib/risk/city-risks";

export const dynamic = "force-dynamic";

export default async function FloodRiskPage({
  searchParams,
}: {
  searchParams?: { city?: string };
}) {
  const { cities } = await buildCityRisks();

  return (
    <CityHazardView
      hazard="flood"
      title="Flood screening"
      badge="Heuristic · Open-Meteo + GloFAS"
      description="Rainfall, antecedent wetness and the GloFAS river-discharge anomaly are combined into a transparent 0-100 screening index for each monitored city. This is a screening heuristic, not a hydraulic flood forecast."
      basePath="/dashboard/flood"
      cities={cities}
      selectedSlug={searchParams?.city}
    />
  );
}

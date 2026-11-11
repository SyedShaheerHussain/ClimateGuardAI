import React from "react";
import { CityHazardView } from "@/components/risk/city-hazard-view";
import { buildCityRisks } from "@/lib/risk/city-risks";

export const dynamic = "force-dynamic";

export default async function DroughtRiskPage({
  searchParams,
}: {
  searchParams?: { city?: string };
}) {
  const { cities } = await buildCityRisks();

  return (
    <CityHazardView
      hazard="drought"
      title="Drought screening"
      badge="Heuristic · rainfall dryness"
      description="Seven-day rainfall dryness drives a transparent 0-100 screening index. Baseline precipitation and temperature anomalies are not available from the configured APIs, so they are reported as missing and lower confidence rather than being invented."
      basePath="/dashboard/drought"
      cities={cities}
      selectedSlug={searchParams?.city}
      extraCards={[
        {
          label: "Anomaly inputs",
          value: "Not supplied",
          note: "Precipitation and temperature anomalies require a baseline dataset that is not configured. Confidence is reduced instead.",
        },
      ]}
    />
  );
}

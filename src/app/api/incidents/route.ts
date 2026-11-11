import { NextRequest, NextResponse } from "next/server";
import { buildCityRisks } from "@/lib/risk/city-risks";
import { guardPublicRead } from "@/lib/security/guards";

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "incidents", 30);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const severityFilter = searchParams.get("severity");
  const hazardFilter = searchParams.get("hazard");
  const cityFilter = searchParams.get("city");

  const { incidents, generatedAt } = await buildCityRisks();
  let filtered = incidents;

  if (severityFilter && severityFilter !== "all") {
    filtered = filtered.filter((item) => item.severity.toLowerCase() === severityFilter.toLowerCase());
  }
  if (hazardFilter && hazardFilter !== "all") {
    filtered = filtered.filter((item) => item.hazardType === hazardFilter);
  }
  if (cityFilter && cityFilter !== "all") {
    filtered = filtered.filter((item) => item.city.toLowerCase() === cityFilter.toLowerCase());
  }

  return NextResponse.json({
    success: true,
    totalCount: filtered.length,
    incidents: filtered,
    generatedAt,
    verificationNote:
      "Model signals are heuristic outputs from Open-Meteo and GloFAS fields. They are unverified and are not government emergency alerts.",
  });
}

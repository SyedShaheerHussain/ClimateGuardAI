import { NextRequest, NextResponse } from "next/server";
import { buildCityRisks } from "@/lib/risk/city-risks";
import { guardPublicRead } from "@/lib/security/guards";

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "risk-cities", 20);
  if (blocked) return blocked;

  const payload = await buildCityRisks();
  return NextResponse.json({
    success: true,
    validation: "Pakistan-specific ML validation: NOT VALIDATED",
    methodology:
      "Heuristic indices in src/lib/risk/engine.ts using live Open-Meteo weather, GloFAS discharge, and soil moisture. Not an ML model and not an official warning.",
    ...payload,
  });
}

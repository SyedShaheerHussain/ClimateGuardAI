import { NextRequest, NextResponse } from "next/server";
import { buildCityRisks } from "@/lib/risk/city-risks";
import { resolveCity } from "@/lib/cities/pakistan";
import { guardPublicRead } from "@/lib/security/guards";

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "risk", 30);
  if (blocked) return blocked;

  const requested = request.nextUrl.searchParams.get("city");
  if (requested && !resolveCity(requested)) {
    return NextResponse.json({ error: "Unknown city" }, { status: 400 });
  }

  const snapshot = await buildCityRisks();
  const cities = requested
    ? snapshot.cities.filter((city) => city.slug === resolveCity(requested)?.slug)
    : snapshot.cities;

  return NextResponse.json({
    success: true,
    validation: "Pakistan-specific ML validation: NOT VALIDATED",
    methodology: "Heuristic indices in src/lib/risk/engine.ts. Not an ML model.",
    cities,
    generatedAt: snapshot.generatedAt,
  });
}

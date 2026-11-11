import { NextRequest, NextResponse } from "next/server";
import { climateBriefing } from "@/lib/ai/briefing";
import { guardPublicRead, requireUserIfConfigured } from "@/lib/security/guards";
import { buildCityRisks } from "@/lib/risk/city-risks";

export async function POST(request: NextRequest) {
  const blocked = guardPublicRead(request, "ai", 8);
  if (blocked) return blocked;
  const unauthorized = await requireUserIfConfigured();
  if (unauthorized) return unauthorized;
  const body = (await request.json().catch(() => ({}))) as { city?: string };
  const snapshot = await buildCityRisks();
  const selected = snapshot.cities.find((city) => city.slug === (body.city ?? "karachi")) ?? snapshot.cities[0];
  if (!selected) return NextResponse.json({ error: "No city data" }, { status: 503 });
  const weather = selected.weather.values;
  const briefing = await climateBriefing({
    city: selected.city,
    weatherSummary: `Model nowcast temperature ${weather.temperatureC ?? "missing"} C, humidity ${weather.humidityPct ?? "missing"}%, precipitation ${weather.precipitationMm ?? "missing"} mm, source ${selected.weather.dataSource}, timestamp ${selected.weather.timestamp ?? "missing"}.`,
    risks: selected.risks,
    financialNote: "Portfolio values are illustrative demo data and are not verified valuations.",
  });
  return NextResponse.json({ success: true, briefing, snapshotCity: selected.slug });
}

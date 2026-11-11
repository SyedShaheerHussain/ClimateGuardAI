import { NextRequest, NextResponse } from "next/server";
import { resolveCity } from "@/lib/cities/pakistan";
import { guardPublicRead } from "@/lib/security/guards";
import { getCityWeather } from "@/lib/weather/service";

export async function GET(request: NextRequest, { params }: { params: { city: string } }) {
  const blocked = guardPublicRead(request, "weather-city");
  if (blocked) return blocked;
  if (!resolveCity(params.city)) {
    return NextResponse.json({ error: "Unknown city" }, { status: 400 });
  }
  const bundle = await getCityWeather(params.city);
  return NextResponse.json({
    success: bundle.current.status === "live",
    ...bundle,
  });
}

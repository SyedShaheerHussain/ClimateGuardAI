import { NextRequest, NextResponse } from "next/server";
import { resolveCity } from "@/lib/cities/pakistan";
import { guardPublicRead } from "@/lib/security/guards";
import { getCityWeather, getAllCityWeather } from "@/lib/weather/service";

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "weather-forecast");
  if (blocked) return blocked;
  const city = request.nextUrl.searchParams.get("city");
  if (city) {
    if (!resolveCity(city)) return NextResponse.json({ error: "Unknown city" }, { status: 400 });
    const bundle = await getCityWeather(city);
    return NextResponse.json({
      success: bundle.current.status === "live",
      city: bundle.current.city,
      dataType: "forecast",
      hourly: bundle.hourly,
      daily: bundle.daily,
      forecastPrecip24hMm: bundle.forecastPrecip24hMm,
      dataSource: bundle.current.dataSource,
      timestamp: bundle.current.timestamp,
      status: bundle.current.status,
    });
  }
  const all = await getAllCityWeather();
  return NextResponse.json({
    success: true,
    dataType: "forecast",
    cities: all.map((bundle) => ({
      city: bundle.current.city,
      slug: bundle.current.slug,
      daily: bundle.daily,
      forecastPrecip24hMm: bundle.forecastPrecip24hMm,
      status: bundle.current.status,
      dataSource: bundle.current.dataSource,
    })),
  });
}

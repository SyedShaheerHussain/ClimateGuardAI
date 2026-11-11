import { NextRequest, NextResponse } from "next/server";
import { guardPublicRead } from "@/lib/security/guards";
import { getAllCityWeather } from "@/lib/weather/service";

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "weather-cities", 30);
  if (blocked) return blocked;

  const bundles = await getAllCityWeather();
  const cities = bundles.map((bundle) => ({
    name: bundle.current.city,
    slug: bundle.current.slug,
    province: bundle.current.province,
    lat: bundle.current.coordinates.latitude,
    lng: bundle.current.coordinates.longitude,
    available: bundle.current.status === "live",
    temperature: bundle.current.values.temperatureC,
    apparentTemperature: bundle.current.values.apparentTemperatureC,
    humidity: bundle.current.values.humidityPct,
    precipitation: bundle.current.values.precipitationMm,
    windSpeed: bundle.current.values.windSpeedKmh,
    soilMoisture: bundle.soilMoistureM3m3,
    riverDischarge: bundle.flood.riverDischargeM3s,
    timestamp: bundle.current.timestamp,
    dataSource: bundle.current.dataSource,
  }));

  return NextResponse.json(
    {
      success: true,
      source: "Open-Meteo Forecast API + Flood API (GloFAS)",
      region: "Pakistan",
      timezone: "Asia/Karachi",
      citiesAvailable: cities.filter((city) => city.available).length,
      citiesTotal: cities.length,
      timestamp: new Date().toISOString(),
      cities,
    },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
  );
}

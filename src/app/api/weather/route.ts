import { NextRequest, NextResponse } from "next/server";
import { PAKISTAN_CITIES, resolveCity } from "@/lib/cities/pakistan";
import { calculateWetBulbTemperature } from "@/lib/climate/calculations";
import { guardPublicRead } from "@/lib/security/guards";
import { getAllCityWeather, getCityWeather } from "@/lib/weather/service";

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "weather", 60);
  if (blocked) return blocked;

  const cityParam = request.nextUrl.searchParams.get("city");
  const basinParam = request.nextUrl.searchParams.get("basin");
  const requested = cityParam ?? basinParam;

  if (requested) {
    const city = resolveCity(requested);
    if (!city) {
      return NextResponse.json(
        { error: "Unknown city", allowed: PAKISTAN_CITIES.map((item) => item.slug) },
        { status: 400 }
      );
    }
    const bundle = await getCityWeather(city.slug);

    if (basinParam && !cityParam) {
      return NextResponse.json(legacyBasinShape(city.slug, bundle));
    }

    return NextResponse.json({
      success: bundle.current.status === "live",
      source: bundle.current.dataSource,
      ...bundle,
    });
  }

  const bundles = await getAllCityWeather();
  return NextResponse.json({
    success: true,
    source: "Open-Meteo Forecast API + Open-Meteo Flood API (GloFAS)",
    dataType: "model_nowcast",
    note: "Current values are model nowcasts and GloFAS discharge for the city grid cell. They are not Pakistan Meteorological Department station observations.",
    retrievedAt: new Date().toISOString(),
    cities: bundles.map((bundle) => ({
      city: bundle.current.city,
      slug: bundle.current.slug,
      province: bundle.current.province,
      coordinates: bundle.current.coordinates,
      values: bundle.current.values,
      units: bundle.current.units,
      timestamp: bundle.current.timestamp,
      status: bundle.current.status,
      dataSource: bundle.current.dataSource,
      dataType: bundle.current.dataType,
      forecastPrecip24hMm: bundle.forecastPrecip24hMm,
      soilMoistureM3m3: bundle.soilMoistureM3m3,
      flood: bundle.flood,
    })),
  });
}

function legacyBasinShape(slug: string, bundle: Awaited<ReturnType<typeof getCityWeather>>) {
  const values = bundle.current.values;
  const wetBulb =
    values.temperatureC !== null && values.humidityPct !== null
      ? calculateWetBulbTemperature(values.temperatureC, values.humidityPct)
      : null;

  return {
    success: bundle.current.status === "live",
    basin: bundle.current.city,
    slug,
    country: "Pakistan",
    coordinates: [bundle.current.coordinates.latitude, bundle.current.coordinates.longitude],
    source: `${bundle.current.dataSource}${bundle.flood.status === "live" ? " + Open-Meteo Flood API" : ""}`,
    current: {
      surfaceTempC: values.temperatureC,
      apparentTempC: values.apparentTemperatureC,
      relativeHumidityPct: values.humidityPct,
      precipitationMmHr: values.precipitationMm,
      windSpeedMs: values.windSpeedKmh === null ? null : Number((values.windSpeedKmh / 3.6).toFixed(1)),
      windSpeedKmh: values.windSpeedKmh,
      wetBulbTempC: wetBulb,
      riverDischargeM3s: bundle.flood.riverDischargeM3s,
      soilMoistureM3m3: bundle.soilMoistureM3m3,
    },
    forecast: bundle.hourly,
    forecastPrecip24hMm: bundle.forecastPrecip24hMm,
    dataAvailability: {
      weather: bundle.current.status,
      riverDischarge: bundle.flood.status,
      soilMoisture: bundle.soilMoistureM3m3 === null ? "unavailable" : "live",
    },
    timestamp: bundle.current.timestamp ?? new Date().toISOString(),
  };
}

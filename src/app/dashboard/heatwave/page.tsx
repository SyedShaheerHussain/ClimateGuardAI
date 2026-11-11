import React from "react";
import { CityHazardView } from "@/components/risk/city-hazard-view";
import { buildCityRisks } from "@/lib/risk/city-risks";
import { calculateWetBulbTemperature } from "@/lib/climate/calculations";

export const dynamic = "force-dynamic";

export default async function HeatwaveRiskPage({
  searchParams,
}: {
  searchParams?: { city?: string };
}) {
  const { cities } = await buildCityRisks();
  const selected = cities.find((city) => city.slug === searchParams?.city) ?? cities[0];
  const temp = selected?.weather.values.temperatureC ?? null;
  const humidity = selected?.weather.values.humidityPct ?? null;
  const wetBulb = temp !== null && humidity !== null ? calculateWetBulbTemperature(temp, humidity) : null;
  const hotDays = selected?.consecutiveHotDays ?? null;

  return (
    <CityHazardView
      hazard="heatwave"
      title="Heatwave screening"
      badge="Heuristic · Open-Meteo"
      description="Air temperature, apparent temperature, humidity and the consecutive-day streak at or above 40°C are combined into a transparent 0-100 screening index. It is not a medical WBGT diagnosis or an official heat alert."
      basePath="/dashboard/heatwave"
      cities={cities}
      selectedSlug={searchParams?.city}
      extraCards={[
        {
          label: "Wet-bulb estimate",
          value: wetBulb === null ? "—" : wetBulb.toFixed(1) + " °C",
          note: "Stull (2011) approximation from temperature and humidity. Not WBGT.",
        },
        {
          label: "Consecutive hot days",
          value: hotDays === null ? "—" : String(hotDays),
          note: "Daily maxima at or above 40°C from the Open-Meteo daily series.",
        },
      ]}
    />
  );
}

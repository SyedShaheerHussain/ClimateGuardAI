import { PAKISTAN_CITIES } from "@/lib/cities/pakistan";
import { listIncidents, replaceModelSignals, type ManagedIncident } from "@/lib/incidents/store";
import { syncRiskNotifications } from "@/lib/notifications/store";
import { assessDroughtRisk, assessFloodRisk, assessHeatRisk, highestCategory } from "@/lib/risk/engine";
import { getAllCityWeather } from "@/lib/weather/service";

export async function buildCityRisks() {
  const bundles = await getAllCityWeather();
  const cities = bundles.map((bundle) => {
    const city = PAKISTAN_CITIES.find((item) => item.slug === bundle.current.slug);
    const flood = assessFloodRisk({
      precipitationMm: bundle.current.values.precipitationMm,
      forecastPrecipitationMm24h: bundle.forecastPrecip24hMm,
      antecedentPrecipitationMm3d: bundle.antecedentPrecip3dMm,
      riverDischargeAnomalyPct: bundle.flood.dischargeAnomalyPct,
    });
    const heat = assessHeatRisk({
      temperatureC: bundle.current.values.temperatureC,
      apparentTemperatureC: bundle.current.values.apparentTemperatureC,
      humidityPct: bundle.current.values.humidityPct,
      consecutiveHotDays: bundle.consecutiveHotDays,
    });
    const drought = assessDroughtRisk({
      precipitationLast7dMm: bundle.precipitationLast7dMm,
      precipitationAnomalyPct: null,
      temperatureAnomalyC: null,
    });
    return {
      city: bundle.current.city,
      slug: bundle.current.slug,
      province: bundle.current.province,
      coordinates: city ? { latitude: city.latitude, longitude: city.longitude } : bundle.current.coordinates,
      weather: bundle.current,
      forecastPrecip24hMm: bundle.forecastPrecip24hMm,
      antecedentPrecip3dMm: bundle.antecedentPrecip3dMm,
      precipitationLast7dMm: bundle.precipitationLast7dMm,
      soilMoistureM3m3: bundle.soilMoistureM3m3,
      soilMoistureTimestamp: bundle.soilMoistureTimestamp,
      consecutiveHotDays: bundle.consecutiveHotDays,
      flood: bundle.flood,
      risks: [flood, heat, drought],
      overall: highestCategory([flood.category, heat.category, drought.category]),
    };
  });

  syncRiskNotifications(cities.map((city) => ({ city: city.city, slug: city.slug, risks: city.risks })));
  const signals: ManagedIncident[] = cities.flatMap((city) =>
    city.risks
      .filter((risk) => risk.category === "High" || risk.category === "Very High" || risk.category === "Extreme")
      .map((risk) => ({
        id: `model-${city.slug}-${risk.hazard}`,
        hazardType: risk.hazard,
        city: city.city,
        latitude: city.coordinates.latitude,
        longitude: city.coordinates.longitude,
        severity: risk.category,
        description: `Heuristic ${risk.hazard} index ${risk.score} from Open-Meteo and GloFAS fields. Not an official warning.`,
        source: "ClimateGuard heuristic on Open-Meteo",
        detectedAt: risk.evaluatedAt,
        updatedAt: risk.evaluatedAt,
        status: "monitoring" as const,
        verificationStatus: "unverified_model_signal" as const,
        governmentAlert: false,
      }))
  );
  replaceModelSignals(signals);
  return { cities, incidents: listIncidents(), generatedAt: new Date().toISOString() };
}

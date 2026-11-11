import { NextRequest, NextResponse } from "next/server";
import { calculatePortfolio } from "@/lib/finance/model";
import { listAssets } from "@/lib/finance/portfolio";
import { buildTextPdf } from "@/lib/reports/pdf";
import { guardPublicRead, requireUserIfConfigured } from "@/lib/security/guards";
import { buildCityRisks } from "@/lib/risk/city-risks";

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "reports", 20);
  if (blocked) return blocked;
  const unauthorized = await requireUserIfConfigured();
  if (unauthorized) return unauthorized;
  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const risks = await buildCityRisks();
  const finance = calculatePortfolio(listAssets(), "base");
  const lines = [
    "ClimateGuard executive report",
    `Generated ${risks.generatedAt}`,
    "Pakistan-specific ML validation: NOT VALIDATED",
    "ILLUSTRATIVE DEMO DATA — NOT VERIFIED ASSET VALUATIONS",
    ...risks.cities.map((city) => `${city.city} overall ${city.overall}; temp ${city.weather.values.temperatureC ?? "n/a"} C; 24h precip ${city.forecastPrecip24hMm ?? "n/a"} mm`),
    `Portfolio base expected damage PKR ${finance.expectedDamagePkr}`,
    `Avoided loss PKR ${finance.avoidedLossPkr}; BCR ${finance.benefitCostRatio ?? "undefined"}`,
    "Funding workflow is a simulation and transfers no money.",
    "Limitations: heuristic risk, model weather, no official PMD/NDMA feed.",
  ];

  if (format === "csv") {
    const header = "city,overall,temperature_c,humidity_pct,precip_mm,forecast_24h_mm,data_type,source";
    const rows = risks.cities.map((city) =>
      [city.city, city.overall, city.weather.values.temperatureC ?? "", city.weather.values.humidityPct ?? "", city.weather.values.precipitationMm ?? "", city.forecastPrecip24hMm ?? "", city.weather.dataType, `"${city.weather.dataSource}"`].join(",")
    );
    return new NextResponse([header, ...rows].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=climateguard-report.csv",
      },
    });
  }

  if (format === "pdf") {
    const pdf = buildTextPdf("ClimateGuard AI report", lines);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=climateguard-report.pdf",
      },
    });
  }

  return NextResponse.json({ success: true, lines, finance, cities: risks.cities });
}

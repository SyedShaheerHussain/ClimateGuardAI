import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_FUNDING_RULES, evaluateFundingRule } from "@/lib/funding/simulation";
import { addNotification } from "@/lib/notifications/store";
import { guardPublicRead, requireUserIfConfigured } from "@/lib/security/guards";
import { assessFloodRisk, type RiskCategory } from "@/lib/risk/engine";

export async function POST(request: NextRequest) {
  const blocked = guardPublicRead(request, "funding", 30);
  if (blocked) return blocked;
  const unauthorized = await requireUserIfConfigured();
  if (unauthorized) return unauthorized;
  const body = (await request.json().catch(() => null)) as {
    citySlug?: string;
    hazard?: "flood" | "heatwave" | "drought";
    category?: RiskCategory | "Insufficient data";
  } | null;
  if (!body?.citySlug || !body.hazard || !body.category) {
    return NextResponse.json({ error: "citySlug, hazard, and category are required" }, { status: 400 });
  }
  const evaluations = DEFAULT_FUNDING_RULES.map((rule) =>
    evaluateFundingRule(rule, { citySlug: body.citySlug!, hazard: body.hazard!, category: body.category! })
  );
  evaluations
    .filter((item) => item.breached)
    .forEach((item) => {
      addNotification({
        id: `funding-${item.ruleId}-${body.citySlug}`,
        kind: "funding",
        title: "Simulated funding trigger",
        body: `${item.reason} Estimated requirement PKR ${item.estimatedFundingPkr}. No transfer.`,
        createdAt: new Date().toISOString(),
        href: "/dashboard/funding",
      });
    });
  return NextResponse.json({
    success: true,
    label: "SIMULATION — NO FUNDS ARE TRANSFERRED",
    rules: DEFAULT_FUNDING_RULES,
    evaluations,
    referenceCheck: assessFloodRisk({ precipitationMm: 0, forecastPrecipitationMm24h: 0, antecedentPrecipitationMm3d: 0 }).methodology,
  });
}

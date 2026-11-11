import { NextRequest, NextResponse } from "next/server";
import { calculatePortfolio, sensitivity } from "@/lib/finance/model";
import { listAssets } from "@/lib/finance/portfolio";
import { calculateBoardroomImpact } from "@/lib/finance/boardroom-impact";
import { guardPublicRead, requireUserIfConfigured } from "@/lib/security/guards";

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "finance", 30);
  if (blocked) return blocked;
  const unauthorized = await requireUserIfConfigured();
  if (unauthorized) return unauthorized;
  const assets = listAssets();
  const city = request.nextUrl.searchParams.get("city");
  const filtered = city ? assets.filter((asset) => asset.citySlug === city) : assets;
  const boardroom = calculateBoardroomImpact();
  return NextResponse.json({
    success: true,
    directive: "C15 — Net Financial Impact Boardroom Calculation (Value Quantification)",
    label: "ILLUSTRATIVE DEMO DATA — NOT VERIFIED ASSET VALUATIONS",
    boardroom,
    scenarios: {
      conservative: calculatePortfolio(filtered, "conservative"),
      base: calculatePortfolio(filtered, "base"),
      optimistic: calculatePortfolio(filtered, "optimistic"),
    },
    sensitivity: filtered.slice(0, 3).map((asset) => ({
      assetId: asset.id,
      rows: sensitivity(asset, "base"),
    })),
  });
}

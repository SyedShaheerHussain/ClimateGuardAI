import { NextRequest, NextResponse } from "next/server";
import { staticIntegrationStatus } from "@/lib/integrations/registry";
import { guardPublicRead } from "@/lib/security/guards";

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "integrations");
  if (blocked) return blocked;
  return NextResponse.json({
    success: true,
    checkedAt: new Date().toISOString(),
    note: "Configuration status is based on environment variables. Open-Meteo and NASA POWER are confirmed only when their data routes return live.",
    integrations: staticIntegrationStatus(),
  });
}

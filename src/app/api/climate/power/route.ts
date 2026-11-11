import { NextRequest, NextResponse } from "next/server";
import { guardPublicRead } from "@/lib/security/guards";
import { resolveCity } from "@/lib/cities/pakistan";
import { getNasaPowerDaily } from "@/lib/climate/nasa-power";

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "nasa-power", 20);
  if (blocked) return blocked;
  const city = request.nextUrl.searchParams.get("city") ?? "karachi";
  if (!resolveCity(city)) return NextResponse.json({ error: "Unknown city" }, { status: 400 });
  const result = await getNasaPowerDaily(city);
  return NextResponse.json({ success: result.status === "live", ...result });
}

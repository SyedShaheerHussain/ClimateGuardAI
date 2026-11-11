import { NextRequest, NextResponse } from "next/server";
import { resolveCity } from "@/lib/cities/pakistan";
import { guardPublicRead } from "@/lib/security/guards";
import { daysBetween, historyQuerySchema } from "@/lib/validation/schemas";
import { getCityHistory } from "@/lib/weather/service";

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "weather-history");
  if (blocked) return blocked;
  const parsed = historyQuerySchema.safeParse({
    city: request.nextUrl.searchParams.get("city") ?? "",
    start: request.nextUrl.searchParams.get("start") ?? "",
    end: request.nextUrl.searchParams.get("end") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "city, start, and end (YYYY-MM-DD) are required" }, { status: 400 });
  }
  if (!resolveCity(parsed.data.city)) {
    return NextResponse.json({ error: "Unknown city" }, { status: 400 });
  }
  const span = daysBetween(parsed.data.start, parsed.data.end);
  if (span === null || span < 0 || span > 31) {
    return NextResponse.json({ error: "Date range must be 0 to 31 days" }, { status: 400 });
  }
  const history = await getCityHistory(parsed.data.city, parsed.data.start, parsed.data.end);
  return NextResponse.json({ success: history.status === "live", ...history });
}

import { NextRequest, NextResponse } from "next/server";
import { getFirmsDetections } from "@/lib/satellite/firms";
import { guardPublicRead } from "@/lib/security/guards";

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "firms", 20);
  if (blocked) return blocked;
  const result = await getFirmsDetections();
  return NextResponse.json({ success: result.status === "Connected", ...result });
}

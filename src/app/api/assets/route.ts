import { NextRequest, NextResponse } from "next/server";
import { listAssets, removeAsset, upsertAsset } from "@/lib/finance/portfolio";
import { calculatePortfolio } from "@/lib/finance/model";
import { guardPublicRead, requireUserIfConfigured } from "@/lib/security/guards";
import { assetSchema } from "@/lib/validation/schemas";
import { ILLUSTRATIVE_LABEL } from "@/lib/finance/portfolio";

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "assets");
  if (blocked) return blocked;
  const unauthorized = await requireUserIfConfigured();
  if (unauthorized) return unauthorized;
  const assets = listAssets();
  const q = (request.nextUrl.searchParams.get("q") ?? "").toLowerCase();
  const city = request.nextUrl.searchParams.get("city");
  const category = request.nextUrl.searchParams.get("category");
  const filtered = assets.filter((asset) => {
    if (city && asset.citySlug !== city) return false;
    if (category && asset.category !== category) return false;
    if (q && !`${asset.name} ${asset.id}`.toLowerCase().includes(q)) return false;
    return true;
  });
  return NextResponse.json({
    success: true,
    label: ILLUSTRATIVE_LABEL,
    persistence: "In-memory for this server process. Not a verified register.",
    summary: calculatePortfolio(filtered, "base"),
    assets: filtered,
  });
}

export async function POST(request: NextRequest) {
  const blocked = guardPublicRead(request, "assets-write", 30);
  if (blocked) return blocked;
  const unauthorized = await requireUserIfConfigured();
  if (unauthorized) return unauthorized;
  const body = await request.json().catch(() => null);
  const parsed = assetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid asset", details: parsed.error.flatten() }, { status: 400 });
  }
  const saved = upsertAsset({ ...parsed.data, provenance: ILLUSTRATIVE_LABEL });
  return NextResponse.json({ success: true, asset: saved, label: ILLUSTRATIVE_LABEL }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const blocked = guardPublicRead(request, "assets-write", 30);
  if (blocked) return blocked;
  const unauthorized = await requireUserIfConfigured();
  if (unauthorized) return unauthorized;
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!/^[a-z0-9-]{2,64}$/.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const removed = removeAsset(id);
  if (!removed) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  return NextResponse.json({ success: true, deleted: id });
}

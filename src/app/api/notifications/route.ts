import { NextRequest, NextResponse } from "next/server";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/notifications/store";
import { buildCityRisks } from "@/lib/risk/city-risks";
import { guardPublicRead } from "@/lib/security/guards";

export async function GET(request: NextRequest) {
  const blocked = guardPublicRead(request, "notifications");
  if (blocked) return blocked;
  await buildCityRisks();
  const items = listNotifications();
  return NextResponse.json({ success: true, unread: items.filter((item) => !item.read).length, items });
}

export async function POST(request: NextRequest) {
  const blocked = guardPublicRead(request, "notifications");
  if (blocked) return blocked;
  const body = (await request.json().catch(() => ({}))) as { id?: string; all?: boolean };
  if (body.all) markAllNotificationsRead();
  else if (body.id) markNotificationRead(body.id);
  else return NextResponse.json({ error: "id or all is required" }, { status: 400 });
  return NextResponse.json({ success: true, items: listNotifications() });
}

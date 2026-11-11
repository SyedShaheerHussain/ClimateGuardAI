import { NextRequest, NextResponse } from "next/server";
import { importIncidentSchema } from "@/lib/validation/schemas";
import { importIncidents, type ManagedIncident } from "@/lib/incidents/store";
import { guardPublicRead, requireUserIfConfigured } from "@/lib/security/guards";

export async function POST(request: NextRequest) {
  const blocked = guardPublicRead(request, "imports", 10);
  if (blocked) return blocked;
  const unauthorized = await requireUserIfConfigured();
  if (unauthorized) return unauthorized;
  const body = await request.json().catch(() => null);
  const parsed = importIncidentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid import", details: parsed.error.flatten() }, { status: 400 });
  }
  const now = new Date().toISOString();
  const records: ManagedIncident[] = parsed.data.incidents.map((incident) => ({
    ...incident,
    updatedAt: now,
    verificationStatus: "user_imported",
    governmentAlert: false,
  }));
  return NextResponse.json({
    success: true,
    note: "Imported records are stored in server memory and are not treated as official government alerts.",
    incidents: importIncidents(records),
  });
}

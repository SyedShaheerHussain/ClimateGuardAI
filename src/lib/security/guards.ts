import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return false;
  if (url.includes("your-project") || url.includes("demo-project")) return false;
  if (key.startsWith("your-") || key === "demo-anon-key") return false;
  return true;
}

export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "local";
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function rejectCrossOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const host = request.headers.get("host");
  try {
    if (host && new URL(origin).host !== host) {
      return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 400 });
  }
  return null;
}

export async function requireUserIfConfigured(): Promise<NextResponse | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  return null;
}

export function guardPublicRead(request: NextRequest, bucket: string, limit = 60): NextResponse | null {
  const origin = rejectCrossOrigin(request);
  if (origin) return origin;
  if (!rateLimit(`${bucket}:${clientIp(request)}`, limit, 60_000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  return null;
}

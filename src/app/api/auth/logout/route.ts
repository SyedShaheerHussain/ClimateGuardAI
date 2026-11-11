import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { guardPublicRead } from "@/lib/security/guards";

export async function POST(request: NextRequest) {
  const blocked = guardPublicRead(request, "auth-logout", 20);
  if (blocked) return blocked;
  const supabase = createClient();
  await supabase.auth.signOut();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.redirect(new URL("/login", appUrl));
}

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIX = "/dashboard";
const PUBLIC_AUTH_PATHS = ["/login", "/signup", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // Treat placeholder credentials as demo mode: no real auth is possible.
  const isDemoMode =
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("demo-project") ||
    supabaseUrl === "https://your-project.supabase.co" ||
    supabaseAnonKey === "demo-anon-key" ||
    supabaseAnonKey.startsWith("your-");

  const supabase = createServerClient(
    isDemoMode ? "https://demo-project.supabase.co" : supabaseUrl,
    isDemoMode ? "demo-anon-key" : supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  if (!isDemoMode) {
    // With real credentials — enforce auth protection
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Redirect unauthenticated users away from /dashboard/*
    if (pathname.startsWith(PROTECTED_PREFIX) && !user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect already-authenticated users away from auth pages
    if (PUBLIC_AUTH_PATHS.includes(pathname) && user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } else {
    // Demo mode — still refresh session cookie silently if one exists
    // (won't fail even with demo credentials)
    try {
      await supabase.auth.getUser();
    } catch {
      // silent — demo mode, ignore errors
    }
  }

  return response;
}

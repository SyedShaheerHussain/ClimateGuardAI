"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const resetSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export type ResetState = {
  error: string | null;
  success: boolean;
};

export async function forgotPasswordAction(
  _prevState: ResetState,
  formData: FormData
): Promise<ResetState> {
  const parsed = resetSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid email.", success: false };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (
    !supabaseUrl ||
    supabaseUrl.includes("demo-project") ||
    supabaseUrl === "https://your-project.supabase.co"
  ) {
    return {
      error:
        "DEMO_MODE: Password reset requires Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL in .env.local.",
      success: false,
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/dashboard/settings`,
  });

  if (error) {
    return { error: error.message, success: false };
  }

  return { error: null, success: true };
}

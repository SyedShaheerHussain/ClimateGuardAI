"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Please enter a valid email address."),
  organization: z.string().min(2, "Organization name is required."),
  role: z.string().min(1, "Please select a role."),
  password: z.string().min(12, "Password must be at least 12 characters."),
  confirmPassword: z.string(),
});

export type SignupState = {
  error: string | null;
  success: boolean;
  message: string | null;
};

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    organization: formData.get("organization"),
    role: formData.get("role"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? "Please check your entries.",
      success: false,
      message: null,
    };
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { error: "Passwords do not match.", success: false, message: null };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (
    !supabaseUrl ||
    supabaseUrl.includes("demo-project") ||
    supabaseUrl === "https://your-project.supabase.co"
  ) {
    return {
      error:
        "DEMO_MODE: Account creation requires Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      success: false,
      message: null,
    };
  }

  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=/dashboard`,
      data: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        organization: parsed.data.organization,
        role: parsed.data.role,
      },
    },
  });

  if (error) {
    return { error: error.message, success: false, message: null };
  }

  return {
    error: null,
    success: true,
    message:
      "Account request submitted. Check your email for the Supabase confirmation link. No administrator review workflow runs in this build.",
  };
}

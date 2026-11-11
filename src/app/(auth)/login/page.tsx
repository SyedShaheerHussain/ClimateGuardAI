"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, ChevronRight, Eye, EyeOff, AlertCircle, Info } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#22D3EE] text-slate-950 font-black text-sm hover:bg-cyan-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? <span className="animate-pulse">Signing in…</span> : (
        <><span>Sign In</span><ChevronRight className="w-4 h-4" /></>
      )}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, { error: null });
  const [showPassword, setShowPassword] = useState(false);

  const isDemoMode = state?.error?.startsWith("DEMO_MODE:");
  const errorMessage = isDemoMode ? state.error?.replace("DEMO_MODE: ", "") : state?.error;

  return (
    <div className="min-h-screen bg-[#07111F] flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#22D3EE] to-[#3B82F6] flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-black text-white tracking-tight">
          ClimateGuard <span className="text-[#22D3EE]">AI</span>
        </span>
      </Link>

      <div className="w-full max-w-md bg-[#0B1728] border border-[#24364B] rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white mb-2">Sign in</h1>
          <p className="text-sm text-[#94A3B8]">
            Supabase Auth signs users in when configured. Without credentials the dashboard opens in demo mode.
          </p>
        </div>

        {isDemoMode && (
          <div className="mb-5 p-4 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex gap-3">
            <Info className="w-5 h-5 text-[#22D3EE] shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-[#22D3EE] mb-1">Demo Mode Active</div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{errorMessage}</p>
              <Link href="/dashboard" className="inline-flex items-center gap-1 mt-2 text-xs text-[#22D3EE] hover:underline font-semibold">
                Continue to Dashboard (Demo) <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {errorMessage && !isDemoMode && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">{errorMessage}</p>
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
              Government / Organization Email
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required
              placeholder="you@ndma.gov.pk"
              className="w-full bg-[#101F33] border border-[#24364B] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#22D3EE] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Password</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? "text" : "password"}
                autoComplete="current-password" required placeholder="••••••••••••"
                className="w-full bg-[#101F33] border border-[#24364B] rounded-lg px-4 py-3 pr-10 text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#22D3EE] transition-colors"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-end mt-1.5">
              <Link href="/forgot-password" className="text-xs text-[#22D3EE] hover:underline">Forgot password?</Link>
            </div>
          </div>

          <SubmitButton />
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-[#24364B]" />
          <span className="text-xs text-[#475569]">or continue with</span>
          <div className="flex-1 h-px bg-[#24364B]" />
        </div>

        <div className="space-y-3">
          <button type="button" onClick={() => alert("Google SSO requires Supabase OAuth configuration.")}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-[#101F33] border border-[#24364B] text-sm text-white font-semibold hover:border-[#22D3EE] transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google (SSO)
          </button>
          <button type="button" onClick={() => alert("Microsoft Entra ID SSO requires Supabase OAuth configuration.")}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-[#101F33] border border-[#24364B] text-sm text-white font-semibold hover:border-[#22D3EE] transition-colors">
            <Shield className="w-5 h-5 text-blue-400" />
            Continue with Microsoft Entra ID
          </button>
        </div>

        <p className="text-center text-xs text-[#94A3B8] mt-6">
          Need access? <Link href="/signup" className="text-[#22D3EE] hover:underline">Request an account</Link>
        </p>
      </div>

      <p className="mt-6 text-xs text-[#475569] text-center max-w-xs">
        Demo build. Public model data; no official government warnings and no funding transfers.
      </p>
    </div>
  );
}

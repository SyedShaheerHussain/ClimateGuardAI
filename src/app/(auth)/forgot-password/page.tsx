"use client";

import React from "react";
import Link from "next/link";
import { Shield, ChevronRight, Mail, ArrowLeft, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";
import { forgotPasswordAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#22D3EE] text-slate-950 font-black text-sm hover:bg-cyan-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
      {pending ? <span className="animate-pulse">Sending…</span> : (
        <><span>Send Reset Link</span><ChevronRight className="w-4 h-4" /></>
      )}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(forgotPasswordAction, { error: null, success: false });

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
          <div className="w-14 h-14 rounded-full bg-[#22D3EE]/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-[#22D3EE]" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Reset your password</h1>
          <p className="text-sm text-[#94A3B8]">
            Enter your registered email address. When Supabase Auth is configured, Supabase sends the reset link. In demo
            mode no email is sent.
          </p>
        </div>

        {/* Success State */}
        {state.success && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-emerald-400 mb-1">Reset Link Sent</div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                If that email is registered, a password reset link has been sent. Check your inbox and spam folder.
              </p>
            </div>
          </div>
        )}

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="mb-5 p-4 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex gap-3">
            <Info className="w-5 h-5 text-[#22D3EE] shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-[#22D3EE] mb-1">Demo Mode Active</div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Regular Error */}
        {errorMessage && !isDemoMode && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">{errorMessage}</p>
          </div>
        )}

        {!state.success && (
          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                Registered Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@ndma.gov.pk"
                className="w-full bg-[#101F33] border border-[#24364B] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#22D3EE] transition-colors"
              />
            </div>

            <SubmitButton />
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </div>

      <p className="mt-6 text-xs text-[#475569] text-center max-w-xs">
        Demo mode does not send email and does not store accounts. No support inbox is configured for this build.
      </p>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { Shield, ChevronRight, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";
import { signupAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#22D3EE] text-slate-950 font-black text-sm hover:bg-cyan-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
      {pending ? <span className="animate-pulse">Submitting Request…</span> : (
        <><span>Submit Access Request</span><ChevronRight className="w-4 h-4" /></>
      )}
    </button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signupAction, { error: null, success: false, message: null });

  const isDemoMode = state?.error?.startsWith("DEMO_MODE:");
  const errorMessage = isDemoMode ? state.error?.replace("DEMO_MODE: ", "") : state?.error;

  return (
    <div className="min-h-screen bg-[#07111F] flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#22D3EE] to-[#3B82F6] flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-black text-white tracking-tight">
          ClimateGuard <span className="text-[#22D3EE]">AI</span>
        </span>
      </Link>

      <div className="w-full max-w-lg bg-[#0B1728] border border-[#24364B] rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white mb-2">Request platform access</h1>
          <p className="text-sm text-[#94A3B8]">
            With Supabase Auth configured, this form registers a user and stores the requested role in user metadata. No
            approval or review workflow is implemented. In demo mode no account is created.
          </p>
        </div>

        {/* Success State */}
        {state.success && state.message && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-emerald-400 mb-1">Request Submitted</div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{state.message}</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1 mt-2 text-xs text-[#22D3EE] hover:underline font-semibold"
              >
                Go to Sign In <ChevronRight className="w-3 h-3" />
              </Link>
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
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 mt-2 text-xs text-[#22D3EE] hover:underline font-semibold"
              >
                Continue to Dashboard (Demo) <ChevronRight className="w-3 h-3" />
              </Link>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="firstName" className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  placeholder="Fatima"
                  className="w-full bg-[#101F33] border border-[#24364B] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#22D3EE] transition-colors"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  placeholder="Khan"
                  className="w-full bg-[#101F33] border border-[#24364B] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#22D3EE] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                Government / Organization Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="f.khan@ndma.gov.pk"
                className="w-full bg-[#101F33] border border-[#24364B] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#22D3EE] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="organization" className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                Organization Name *
              </label>
              <input
                id="organization"
                name="organization"
                type="text"
                required
                placeholder="National Disaster Management Authority (NDMA)"
                className="w-full bg-[#101F33] border border-[#24364B] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#22D3EE] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                Your Role *
              </label>
              <select
                id="role"
                name="role"
                required
                className="w-full bg-[#101F33] border border-[#24364B] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-[#22D3EE] transition-colors"
              >
                <option value="">Select your role...</option>
                <option value="government_authority">Government Authority / Ministry</option>
                <option value="climate_analyst">Climate / Meteorological Analyst</option>
                <option value="disaster_director">Disaster Management Director</option>
                <option value="humanitarian_coordinator">Humanitarian Response Coordinator</option>
                <option value="finance_professional">Insurance / Parametric Finance Professional</option>
                <option value="researcher">Academic / Research Institution</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={12}
                placeholder="Minimum 12 characters"
                className="w-full bg-[#101F33] border border-[#24364B] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#22D3EE] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="Confirm your password"
                className="w-full bg-[#101F33] border border-[#24364B] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#22D3EE] transition-colors"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                required
                className="mt-1 accent-[#22D3EE]"
              />
              <label htmlFor="terms" className="text-xs text-[#94A3B8]">
                I agree to the{" "}
                <Link href="/terms" className="text-[#22D3EE] hover:underline">terms and conditions</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-[#22D3EE] hover:underline">privacy policy</Link>
                {" "}for use of this demo.
              </label>
            </div>

            <SubmitButton />
          </form>
        )}

        <p className="text-center text-xs text-[#94A3B8] mt-6">
          Already have access?{" "}
          <Link href="/login" className="text-[#22D3EE] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

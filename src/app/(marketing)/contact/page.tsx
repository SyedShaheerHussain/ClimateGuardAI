import React from "react";
import Link from "next/link";
import { Mail, FileText, ShieldAlert } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="pt-6 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 mb-4">
            <Mail className="w-3.5 h-3.5" />
            Contact
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Get in touch</h1>
          <p className="text-base text-slate-400 leading-relaxed">
            This demo build has no contact form backend, no staffed hotline, and no office address configured. The form
            that previously appeared on this page did not submit anywhere, so it was removed.
          </p>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-card p-6 space-y-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-white">Project documentation</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Setup, architecture, API integration, security, and data-limitation notes live in the repository under
                README.md and docs/. Start there for deployment questions.
              </p>
              <Link href="/dashboard/data-sources" className="inline-block text-xs text-brand-cyan mt-2 hover:underline">
                Review the data-source registry
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-brand-border/50 pt-4">
            <ShieldAlert className="w-5 h-5 text-risk-moderate shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-white">Emergency use</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Do not use this application to issue public warnings or to authorize payments. It consumes public model
                data, does not poll official Pakistani warning feeds, and does not transfer money.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-brand-border bg-brand-canvas/40 p-6">
          <h2 className="text-sm font-bold text-white">Not configured in this build</h2>
          <ul className="text-xs text-slate-400 leading-relaxed list-disc pl-5 mt-2 space-y-1">
            <li>Contact inbox, phone line, and mailing address</li>
            <li>Inquiry storage, CRM integration, or email delivery</li>
            <li>Procurement or emergency response service-level agreements</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";

export function PublicNavbar() {
  return (
    <header className="h-[72px] shrink-0 border-b border-brand-border bg-brand-sidebar/95 backdrop-blur sticky top-0 z-50 px-6 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 rounded-lg bg-brand-canvas border border-brand-cyan/40 flex items-center justify-center text-brand-cyan shadow-sm shadow-brand-cyan/20 group-hover:border-brand-cyan transition-all">
          <Shield className="w-5 h-5 text-brand-cyan" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-white">ClimateGuard</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-brand-cyan/15 text-brand-cyan font-bold rounded">AI</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono tracking-wider">CLIMATE RISK SCREENING</p>
        </div>
      </Link>

      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
        <Link href="/about" className="hover:text-brand-cyan transition">About</Link>
        <Link href="/platform" className="hover:text-brand-cyan transition">Platform</Link>
        <Link href="/features" className="hover:text-brand-cyan transition">Features</Link>
        <Link href="/climate-intelligence" className="hover:text-brand-cyan transition">Climate</Link>
        <Link href="/methodology" className="hover:text-brand-cyan transition">Methodology</Link>
        <Link href="/data-sources" className="hover:text-brand-cyan transition">Data</Link>
        <Link href="/dashboard/benchmark" className="hover:text-brand-cyan transition">Edge Benchmarks</Link>
        <Link href="/contact" className="hover:text-brand-cyan transition">Contact</Link>
      </nav>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition"
        >
          Sign In
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-cyan text-brand-canvas font-bold text-xs hover:bg-brand-cyan/90 transition shadow-md shadow-brand-cyan/20"
        >
          <span>Launch Platform</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  );
}

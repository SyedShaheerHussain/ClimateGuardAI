"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Activity,
  Coins,
  Cpu,
  Database,
  Bell,
  Settings,
  Shield,
  Radio,
  FileCode2,
  Waves,
  Flame,
  Leaf,
  TrendingUp,
  BarChart3,
  Zap,
  Satellite,
  LogOut,
  CloudSun,
  Wallet,
  FileText,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    category: "OPERATIONS",
    items: [
      { name: "Command Center", href: "/dashboard", icon: LayoutDashboard },
      { name: "Risk Intelligence", href: "/dashboard/risk-intelligence", icon: Activity },
      { name: "Geospatial Console", href: "/dashboard/map", icon: Map },
      { name: "Catchment Monitoring", href: "/dashboard/monitoring", icon: Satellite },
      { name: "Weather Intelligence", href: "/dashboard/weather", icon: CloudSun },
      { name: "Satellite Intelligence", href: "/dashboard/satellite", icon: Satellite },
    ],
  },
  {
    category: "HAZARD INTELLIGENCE",
    items: [
      { name: "Flood Intelligence", href: "/dashboard/flood", icon: Waves },
      { name: "Heatwave Intelligence", href: "/dashboard/heatwave", icon: Flame },
      { name: "Drought Intelligence", href: "/dashboard/drought", icon: Leaf },
    ],
  },
  {
    category: "DISASTER FINANCE",
    items: [
      { name: "Parametric Triggers", href: "/dashboard/finance", icon: Coins },
      { name: "Funding Triggers", href: "/dashboard/triggers", icon: Zap },
      { name: "Funding Simulation", href: "/dashboard/funding", icon: Wallet },
      { name: "Financial Impact", href: "/dashboard/financial-impact", icon: Coins },
      { name: "Asset Portfolio", href: "/dashboard/portfolio", icon: Wallet },
      { name: "Incident Audit Log", href: "/dashboard/incidents", icon: Bell },
    ],
  },
  {
    category: "ANALYTICS & BENCHMARKS",
    items: [
      { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
      { name: "C01/C07 Benchmarks", href: "/dashboard/benchmark", icon: BarChart3 },
      { name: "Reports", href: "/dashboard/reports", icon: FileText },
      { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ],
  },
  {
    category: "SYSTEM & EDGE",
    items: [
      { name: "Data Sources & Sensors", href: "/dashboard/data-sources", icon: Database },
      { name: "System Settings", href: "/dashboard/settings", icon: Settings },
      { name: "Profile", href: "/dashboard/profile", icon: UserRound },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-brand-sidebar text-slate-100 select-none">
      {/* Brand Header */}
      <div className="h-[72px] px-6 flex items-center justify-between border-b border-brand-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-brand-canvas border border-brand-cyan/40 flex items-center justify-center text-brand-cyan shadow-sm shadow-brand-cyan/20 group-hover:border-brand-cyan transition-all">
            <Shield className="w-5 h-5 text-brand-cyan" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">ClimateGuard</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-brand-cyan/15 text-brand-cyan font-bold rounded">AI</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">PAKISTAN CLIMATE OPS</p>
          </div>
        </Link>
      </div>

      {/* Public Data Channels */}
      <div className="mx-4 mt-4 p-3 rounded-lg bg-brand-canvas/80 border border-brand-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-cyan"></span>
          </span>
          <div className="text-left">
            <div className="text-[11px] font-bold text-white tracking-wide">PUBLIC DATA CHANNELS</div>
            <div className="text-[10px] font-mono text-slate-400">Open-Meteo · GloFAS · 5 cities</div>
          </div>
        </div>
        <Radio className="w-3.5 h-3.5 text-brand-cyan" />
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_ITEMS.map((section) => (
          <div key={section.category} className="space-y-1">
            <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              {section.category}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all relative group",
                    isActive
                      ? "bg-brand-canvas text-brand-cyan border border-brand-border shadow-sm shadow-brand-cyan/10"
                      : "text-slate-400 hover:text-white hover:bg-brand-canvas/50"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand-cyan rounded-r" />
                  )}
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-brand-cyan" : "text-slate-400 group-hover:text-white"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User & Version Footer */}
      <div className="p-4 border-t border-brand-border bg-brand-canvas/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-cardElevated border border-brand-border flex items-center justify-center font-bold text-xs text-brand-cyan font-mono">
            PK
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white leading-tight">Pakistan Workspace</div>
            <div className="text-[10px] text-slate-400 font-mono">Demo · not an official feed</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard/data-sources"
            title="Data Sources"
            className="p-1.5 text-slate-400 hover:text-brand-cyan hover:bg-brand-canvas rounded transition"
          >
            <FileCode2 className="w-4 h-4" />
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-risk-critical hover:bg-brand-canvas rounded transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, Activity, Coins, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Risk Intel", href: "/dashboard/risk-intelligence", icon: Activity },
  { name: "Map", href: "/dashboard/map", icon: Map },
  { name: "Finance", href: "/dashboard/finance", icon: Coins },
  { name: "Edge", href: "/dashboard/benchmark", icon: Cpu },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <div className="h-full flex items-center justify-around px-2">
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all text-[10px] font-semibold",
              isActive ? "text-brand-cyan" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <div className="relative">
              <Icon className="w-5 h-5 mb-0.5" />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-cyan rounded-full" />
              )}
            </div>
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

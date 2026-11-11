import React from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar";
import { MobileTabBar } from "@/components/dashboard/mobile-tabbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-canvas flex flex-col md:flex-row text-slate-100">
      {/* 250px Fixed Left Sidebar (Desktop) */}
      <aside className="hidden md:block w-[250px] shrink-0 border-r border-brand-border bg-brand-sidebar sticky top-0 h-screen overflow-y-auto">
        <DashboardSidebar />
      </aside>

      {/* Main Operational Workspace */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* 72px Top Navigation Bar */}
        <header className="h-[72px] shrink-0 border-b border-brand-border bg-brand-navbar/95 backdrop-blur sticky top-0 z-30 px-6 flex items-center justify-between">
          <DashboardNavbar />
        </header>

        {/* Dynamic Inner Workspace Content */}
        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Touch-Optimized Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-navbar/95 backdrop-blur border-t border-brand-border h-16">
        <MobileTabBar />
      </nav>
    </div>
  );
}

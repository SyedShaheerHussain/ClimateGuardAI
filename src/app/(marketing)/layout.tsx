import React from "react";
import { PublicNavbar } from "@/components/marketing/public-navbar";
import { PublicFooter } from "@/components/marketing/public-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-canvas flex flex-col text-slate-100">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}

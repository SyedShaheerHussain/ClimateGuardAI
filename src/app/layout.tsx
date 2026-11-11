import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClimateGuard AI — Multi-Hazard Climate Risk & Disaster Finance",
  description:
    "Enterprise AI platform for predictive flood, heatwave, and drought intelligence with automated parametric disaster liquidity disbursements.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${manrope.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-brand-canvas text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

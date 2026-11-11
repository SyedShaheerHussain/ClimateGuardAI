import React from "react";
import { notFound } from "next/navigation";

const PAGES: Record<string, { title: string; paragraphs: string[] }> = {
  platform: {
    title: "Platform",
    paragraphs: [
      "ClimateGuard AI combines live model weather, heuristic hazard screening, an illustrative asset portfolio, and a simulated funding workflow for five Pakistan cities.",
      "Karachi, Hyderabad, Sukkur, Lahore, and Islamabad share one coordinate configuration used by the weather client, map, and reports.",
    ],
  },
  features: {
    title: "Features",
    paragraphs: [
      "Weather intelligence reads Open-Meteo. Historical daily climate can be read from NASA POWER. Active-fire pixels are requested from NASA FIRMS only when a server key is configured.",
      "Risk scores are documented heuristics. Financial figures are labelled illustrative. Funding triggers do not move money.",
    ],
  },
  "climate-intelligence": {
    title: "Climate intelligence",
    paragraphs: [
      "Current conditions come from the Open-Meteo forecast API and are labelled model nowcasts. They are not official Pakistan Meteorological Department observations.",
      "Pakistan-specific machine-learning validation is not claimed. The C07 benchmark, when present, uses a Rajasthan heatwave dataset and does not validate Pakistan predictions.",
    ],
  },
  methodology: {
    title: "Methodology",
    paragraphs: [
      "Flood, heat, and drought indices are weighted linear screens with published full-scale inputs in the risk engine. Missing inputs reduce confidence instead of being filled with invented values.",
      "Financial expected damage is value × exposure × vulnerability × capped probability × damage ratio, summed across hazards and capped at asset value. Avoided loss applies an intervention effectiveness factor. ROI and benefit-cost ratio are undefined when intervention cost is zero.",
    ],
  },
  privacy: {
    title: "Privacy policy",
    paragraphs: [
      "Demo mode does not create a user account. If you connect Supabase, authentication cookies are handled by the Supabase SSR client.",
      "API keys for OpenAI and NASA FIRMS are read on the server only. They are not placed in NEXT_PUBLIC variables.",
    ],
  },
  terms: {
    title: "Terms and conditions",
    paragraphs: [
      "ClimateGuard outputs are decision-support screens for demonstration. They are not government warnings, insurance certificates, or payment instructions.",
      "Illustrative portfolio values must not be quoted as official asset valuations or as government savings.",
    ],
  },
};

export default function MarketingInfoPage({ params }: { params: { slug: string } }) {
  const page = PAGES[params.slug];
  if (!page) notFound();
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-4">
      <h1 className="text-3xl font-black text-white">{page.title}</h1>
      {page.paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-sm text-slate-300 leading-relaxed">{paragraph}</p>
      ))}
    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

"use client";

import React, { useEffect, useState } from "react";

interface FirmsPayload {
  status?: string;
  note?: string;
  detections?: Array<{ latitude: number; longitude: number; acqDate: string | null; satellite: string | null; confidence: string | null }>;
}

export default function SatellitePage() {
  const [firms, setFirms] = useState<FirmsPayload | null>(null);
  const [power, setPower] = useState<string>("");

  useEffect(() => {
    fetch("/api/satellite/firms").then((response) => response.json()).then(setFirms).catch(() => setFirms({ status: "Temporarily Unavailable", note: "Request failed", detections: [] }));
    fetch("/api/climate/power?city=karachi")
      .then((response) => response.json())
      .then((payload) => setPower(`${payload.status}: ${payload.parameters?.length ?? 0} NASA POWER parameters. ${payload.note ?? ""}`))
      .catch(() => setPower("NASA POWER unavailable"));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-white">Satellite and climate archives</h1>
        <p className="text-sm text-slate-400 mt-1">Fire pixels appear only when NASA FIRMS returns them. Empty or missing keys are shown as such.</p>
      </header>
      <section className="p-4 rounded-xl border border-brand-border bg-brand-card space-y-2">
        <h2 className="text-sm font-bold text-white">NASA FIRMS — {firms?.status ?? "Loading"}</h2>
        <p className="text-xs text-slate-300">{firms?.note}</p>
        <p className="text-xs text-slate-400">{firms?.detections?.length ?? 0} detections in the latest response.</p>
        <ul className="text-xs font-mono text-slate-300 space-y-1">
          {(firms?.detections ?? []).slice(0, 8).map((row, index) => (
            <li key={`${row.latitude}-${row.longitude}-${index}`}>{row.acqDate} {row.satellite} {row.latitude}, {row.longitude} confidence {row.confidence}</li>
          ))}
        </ul>
      </section>
      <section className="p-4 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10">
        <h2 className="text-sm font-bold text-amber-100">Illustrative layer — not an observation</h2>
        <p className="text-xs text-amber-50/80 mt-1">No flood-extent polygon is drawn from satellite imagery in this build. A demo rectangle would be misleading, so none is shown.</p>
      </section>
      <section className="p-4 rounded-xl border border-brand-border bg-brand-card">
        <h2 className="text-sm font-bold text-white">NASA POWER</h2>
        <p className="text-xs text-slate-300 mt-2">{power || "Loading historical daily point…"}</p>
      </section>
    </div>
  );
}

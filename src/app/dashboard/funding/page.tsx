"use client";

import React, { useState } from "react";

interface Evaluation {
  ruleId: string;
  breached: boolean;
  reason: string;
  estimatedFundingPkr: number;
  label: string;
}

export default function FundingSimulationPage() {
  const [rows, setRows] = useState<Evaluation[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function evaluate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/funding/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        citySlug: form.get("city"),
        hazard: form.get("hazard"),
        category: form.get("category"),
      }),
    });
    const payload = await response.json();
    if (!response.ok) setError(payload.error || "Evaluation failed");
    else {
      setError(null);
      setRows(payload.evaluations ?? []);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold text-amber-300">SIMULATION — NO FUNDS ARE TRANSFERRED</p>
        <h1 className="text-2xl font-black text-white">Funding trigger simulation</h1>
      </header>
      <form onSubmit={evaluate} className="flex flex-col md:flex-row gap-3">
        <select name="city" className="rounded-lg bg-brand-canvas border border-brand-border px-3 py-2 text-sm">
          {["karachi", "hyderabad", "sukkur", "lahore", "islamabad"].map((city) => <option key={city}>{city}</option>)}
        </select>
        <select name="hazard" className="rounded-lg bg-brand-canvas border border-brand-border px-3 py-2 text-sm">
          <option value="flood">flood</option>
          <option value="heatwave">heatwave</option>
          <option value="drought">drought</option>
        </select>
        <select name="category" className="rounded-lg bg-brand-canvas border border-brand-border px-3 py-2 text-sm">
          {["Low", "Moderate", "High", "Very High", "Extreme"].map((category) => <option key={category}>{category}</option>)}
        </select>
        <button className="rounded-lg bg-brand-cyan text-brand-canvas px-4 py-2 text-sm font-bold" type="submit">Evaluate rules</button>
      </form>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.ruleId} className="rounded-xl border border-brand-border p-4 text-sm">
            <div className="font-bold text-white">{row.ruleId} · {row.breached ? "Simulated breach" : "Not breached"}</div>
            <p className="text-slate-300">{row.reason}</p>
            <p className="text-xs text-slate-400">Estimated requirement PKR {row.estimatedFundingPkr.toLocaleString("en-PK")}. {row.label}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { PAKISTAN_CITIES } from "@/lib/cities/pakistan";
import { calculateAssetScenario, formatPkr, type AssetValuation, type PortfolioScenarioResult } from "@/lib/finance/model";

const EMPTY = {
  id: "",
  name: "",
  citySlug: PAKISTAN_CITIES[0].slug,
  category: "Commercial",
  valuePkr: 100000000,
  exposure: 0.5,
  vulnerability: 0.4,
};

export default function PortfolioPage() {
  const [assets, setAssets] = useState<AssetValuation[]>([]);
  const [summary, setSummary] = useState<PortfolioScenarioResult | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(EMPTY);

  async function load(search = query) {
    const response = await fetch("/api/assets?q=" + encodeURIComponent(search));
    const payload = await response.json();
    setAssets(payload.assets ?? []);
    setSummary(payload.summary ?? null);
    if (payload.label) setMessage(payload.label);
  }

  useEffect(() => {
    load("").catch(() => setMessage("Portfolio API unavailable"));
  }, []);

  async function createAsset(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        hazards: {
          flood: { probability: 0.1, damageRatio: 0.2 },
          heatwave: { probability: 0.1, damageRatio: 0.05 },
          drought: { probability: 0.1, damageRatio: 0.05 },
        },
        interventionEffectiveness: 0.3,
        interventionCostPkr: Math.round(form.valuePkr * 0.01),
      }),
    });
    const payload = await response.json();
    setMessage(payload.error ? "Asset was rejected by validation." : "Asset saved in server memory for this process.");
    if (response.ok) {
      setForm(EMPTY);
      await load();
    }
  }

  async function deleteAsset(id: string) {
    if (!window.confirm("Delete illustrative asset " + id + "?")) return;
    await fetch("/api/assets?id=" + encodeURIComponent(id), { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-black text-white">Asset portfolio</h1>
        <p className="text-xs font-mono text-risk-moderate">{message || "ILLUSTRATIVE DEMO DATA - NOT VERIFIED ASSET VALUATIONS"}</p>
        <p className="text-xs text-slate-400">
          Assets are held in server memory for this process only. Values are demo inputs, not audited valuations.
        </p>
      </header>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-xl border border-brand-border bg-brand-card p-4">
            <div className="text-[10px] font-mono uppercase text-slate-400">Assets</div>
            <div className="text-xl font-black font-mono text-white">{summary.assetCount}</div>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-card p-4">
            <div className="text-[10px] font-mono uppercase text-slate-400">Total value</div>
            <div className="text-xl font-black font-mono text-white">{formatPkr(summary.totalValuePkr, "crores")}</div>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-card p-4">
            <div className="text-[10px] font-mono uppercase text-slate-400">Expected loss (base)</div>
            <div className="text-xl font-black font-mono text-brand-cyan">{formatPkr(summary.expectedDamagePkr, "lakhs")}</div>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-card p-4">
            <div className="text-[10px] font-mono uppercase text-slate-400">Avoided loss / net benefit</div>
            <div className="text-xl font-black font-mono text-white">{formatPkr(summary.avoidedLossPkr, "lakhs")}</div>
            <div className="text-[10px] font-mono text-slate-500">Net {formatPkr(summary.netBenefitPkr, "lakhs")}</div>
          </div>
        </div>
      )}

      <form className="flex flex-col sm:flex-row gap-2" onSubmit={(event) => { event.preventDefault(); load(query); }}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets" className="flex-1 rounded-lg bg-brand-canvas border border-brand-border px-3 py-2 text-sm" />
        <button className="rounded-lg bg-brand-cyan text-brand-canvas px-4 py-2 text-sm font-bold" type="submit">Search</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-brand-border bg-brand-card">
        <table className="w-full text-xs">
          <thead className="text-slate-400 text-left font-mono uppercase text-[10px]">
            <tr>
              <th className="p-3">Name</th>
              <th>City</th>
              <th>Category</th>
              <th>Value</th>
              <th>Expected loss</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const result = calculateAssetScenario(asset, "base");
              return (
                <tr key={asset.id} className="border-t border-brand-border">
                  <td className="p-3 text-white">{asset.name}</td>
                  <td className="font-mono text-slate-400">{asset.citySlug}</td>
                  <td className="text-slate-400">{asset.category}</td>
                  <td className="font-mono text-slate-300">{formatPkr(asset.valuePkr, "crores")}</td>
                  <td className="font-mono text-brand-cyan">{formatPkr(result.expectedDamagePkr, "lakhs")}</td>
                  <td><button type="button" className="text-red-300" onClick={() => deleteAsset(asset.id)}>Delete</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form onSubmit={createAsset} className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-brand-border bg-brand-card p-4">
        <input required placeholder="id-using-lowercase" value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} className="rounded-lg bg-brand-canvas border border-brand-border px-3 py-2 text-sm" />
        <input required placeholder="Asset name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-lg bg-brand-canvas border border-brand-border px-3 py-2 text-sm" />
        <select value={form.citySlug} onChange={(event) => setForm({ ...form, citySlug: event.target.value })} className="rounded-lg bg-brand-canvas border border-brand-border px-3 py-2 text-sm">
          {PAKISTAN_CITIES.map((city) => <option key={city.slug} value={city.slug}>{city.name} - {city.province}</option>)}
        </select>
        <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="rounded-lg bg-brand-canvas border border-brand-border px-3 py-2 text-sm">
          {["Residential", "Commercial", "Industrial", "Agriculture", "Warehouses", "Public facilities", "Critical infrastructure", "Water infrastructure", "Energy infrastructure"].map((category) => <option key={category}>{category}</option>)}
        </select>
        <button className="md:col-span-2 rounded-lg bg-brand-cyan text-brand-canvas px-4 py-2 text-sm font-bold" type="submit">Add illustrative asset</button>
      </form>
    </div>
  );
}

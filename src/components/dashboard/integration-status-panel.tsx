"use client";

import React, { useEffect, useState } from "react";

interface IntegrationRow {
  id: string;
  provider: string;
  category: string;
  configuration: string;
  auth: string;
  note: string;
  worksWithoutKey: boolean;
}

export function IntegrationStatusPanel() {
  const [rows, setRows] = useState<IntegrationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/integrations/status")
      .then((response) => response.json())
      .then((payload) => setRows(payload.integrations ?? []))
      .catch(() => setError("Connection status could not be loaded."));
  }, []);

  return (
    <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
      <h2 className="text-sm font-bold text-amber-200">Live configuration status</h2>
      <p className="text-xs text-amber-100/80">
        The catalog cards on this page describe reference sources. They are not proof that ClimateGuard is connected to those providers. This table is the configuration check.
      </p>
      {error && <p className="text-xs text-red-300">{error}</p>}
      {!rows && !error && <p className="text-xs text-slate-300">Checking configuration…</p>}
      {rows && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400">
              <tr>
                <th className="py-2 pr-3">Provider</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-white/10">
                  <td className="py-2 pr-3 text-white">{row.provider}</td>
                  <td className="py-2 pr-3">{row.category}</td>
                  <td className="py-2 pr-3 font-mono text-brand-cyan">{row.configuration}</td>
                  <td className="py-2 text-slate-300">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-white">Executive reports</h1>
      <p className="text-sm text-slate-400 max-w-2xl">
        Exports combine the latest Open-Meteo risk snapshot with the illustrative portfolio. Asset values are labelled as unverified demo data inside the file.
      </p>
      <div className="flex flex-wrap gap-3">
        <a className="rounded-lg bg-brand-cyan text-brand-canvas px-4 py-2 text-sm font-bold" href="/api/reports/export?format=csv">Download CSV</a>
        <a className="rounded-lg border border-brand-border px-4 py-2 text-sm font-bold" href="/api/reports/export?format=pdf">Download PDF</a>
        <a className="rounded-lg border border-brand-border px-4 py-2 text-sm font-bold" href="/api/reports/export?format=json">View JSON</a>
      </div>
    </div>
  );
}

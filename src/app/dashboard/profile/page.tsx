import { isSupabaseConfigured } from "@/lib/security/guards";

export default function ProfilePage() {
  const configured = isSupabaseConfigured();
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-black text-white">Profile</h1>
      <p className="text-sm text-slate-300">
        {configured
          ? "Supabase credentials are present. The signed-in user is enforced by middleware on dashboard routes."
          : "Demo mode. No Supabase user is loaded because NEXT_PUBLIC_SUPABASE_URL is not a real project URL."}
      </p>
      <dl className="text-sm space-y-2 rounded-xl border border-brand-border p-4">
        <div><dt className="text-slate-400">Display</dt><dd>Pakistan operations demo</dd></div>
        <div><dt className="text-slate-400">Roles available in schema notes</dt><dd>Admin, Analyst, Operator, Viewer — enforced only after Supabase Auth and the profiles migration are applied.</dd></div>
        <div><dt className="text-slate-400">Session</dt><dd>{configured ? "Cookie session via Supabase SSR" : "Not authenticated"}</dd></div>
      </dl>
    </div>
  );
}

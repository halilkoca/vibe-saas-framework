import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  // RLS zaten tenant_id filtresini otomatik uyguluyor — burada elle
  // "where tenant_id = ..." yazmıyoruz, yazmaya da gerek yok.
  const [{ count: leadCount }, { count: openDealCount }, { data: recentLeads }] =
    await Promise.all([
      supabase.from("vibe_leads").select("*", { count: "exact", head: true }),
      supabase
        .from("vibe_deals")
        .select("*", { count: "exact", head: true })
        .not("stage", "in", "(won,lost)"),
      supabase
        .from("vibe_leads")
        .select("id, full_name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Panel</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-border rounded-xl p-5">
          <p className="text-sm text-muted mb-1">Toplam müşteri adayı</p>
          <p className="text-3xl font-semibold">{leadCount ?? 0}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-5">
          <p className="text-sm text-muted mb-1">Açık fırsat</p>
          <p className="text-3xl font-semibold">{openDealCount ?? 0}</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Son eklenen müşteri adayları</h2>
        </div>
        {recentLeads && recentLeads.length > 0 ? (
          <ul className="divide-y divide-border">
            {recentLeads.map((lead) => (
              <li key={lead.id} className="px-5 py-3 flex items-center justify-between">
                <span className="text-sm">{lead.full_name}</span>
                <span className="text-xs text-muted capitalize">{lead.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-sm text-muted text-center">
            Henüz müşteri adayı eklenmemiş.
          </p>
        )}
      </div>
    </div>
  );
}

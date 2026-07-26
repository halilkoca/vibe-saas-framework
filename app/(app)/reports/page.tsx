import { createClient } from "@/lib/supabase/server";
import { LeadsByStatusChart } from "./leads-by-status-chart";
import { DealsByStageChart } from "./deals-by-stage-chart";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = await createClient();

  const [{ data: leads }, { data: deals }] = await Promise.all([
    supabase.from("vibe_leads").select("status"),
    supabase.from("vibe_deals").select("stage, amount"),
  ]);

  const leadCounts = ["new", "contacted", "won", "lost"].map((status) => ({
    status:
      { new: "Yeni", contacted: "İletişimde", won: "Kazanıldı", lost: "Kayıp" }[status] ??
      status,
    count: (leads ?? []).filter((l) => l.status === status).length,
  }));

  const dealTotals = ["prospecting", "proposal", "negotiation", "won", "lost"].map(
    (stage) => ({
      stage:
        {
          prospecting: "Ön Görüşme",
          proposal: "Teklif",
          negotiation: "Pazarlık",
          won: "Kazanıldı",
          lost: "Kayıp",
        }[stage] ?? stage,
      amount: (deals ?? [])
        .filter((d) => d.stage === stage)
        .reduce((sum, d) => sum + Number(d.amount), 0),
    })
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Raporlar</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Durum bazında müşteri adayları</h2>
          <LeadsByStatusChart data={leadCounts} />
        </div>
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Aşama bazında satış tutarı (₺)</h2>
          <DealsByStageChart data={dealTotals} />
        </div>
      </div>
    </div>
  );
}

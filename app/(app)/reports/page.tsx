import { getLeadStatusCounts, getDealStageTotals } from "@/lib/data/reports";
import { LeadsByStatusChart } from "./leads-by-status-chart";
import { DealsByStageChart } from "./deals-by-stage-chart";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [leadCounts, dealTotals] = await Promise.all([
    getLeadStatusCounts(),
    getDealStageTotals(),
  ]);

  const leadCountsWithLabels = leadCounts.map((item) => ({
    status:
      { new: "Yeni", contacted: "İletişimde", won: "Kazanıldı", lost: "Kayıp" }[
        item.status
      ] ?? item.status,
    count: item.count,
  }));

  const dealTotalsWithLabels = dealTotals.map((item) => ({
    stage:
      {
        prospecting: "Ön Görüşme",
        proposal: "Teklif",
        negotiation: "Pazarlık",
        won: "Kazanıldı",
        lost: "Kayıp",
      }[item.stage] ?? item.stage,
    amount: item.amount,
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Raporlar</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Durum bazında müşteri adayları</h2>
          <LeadsByStatusChart data={leadCountsWithLabels} />
        </div>
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Aşama bazında satış tutarı (₺)</h2>
          <DealsByStageChart data={dealTotalsWithLabels} />
        </div>
      </div>
    </div>
  );
}
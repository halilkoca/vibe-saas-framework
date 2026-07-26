import { getAllDeals } from "@/lib/data/deals";
import { NewDealForm } from "./new-deal-form";
import { DealCard } from "./deal-card";

export const dynamic = "force-dynamic";

const STAGES = [
  { key: "prospecting", label: "Ön Görüşme" },
  { key: "proposal", label: "Teklif" },
  { key: "negotiation", label: "Pazarlık" },
  { key: "won", label: "Kazanıldı" },
  { key: "lost", label: "Kayıp" },
] as const;

export default async function SalesPage() {
  const deals = await getAllDeals();

  const dealsByStage = STAGES.map((stage) => ({
    ...stage,
    deals: (deals ?? []).filter((d) => d.stage === stage.key),
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Satışlar</h1>

      <NewDealForm />

      <div className="grid grid-cols-5 gap-4 mt-6">
        {dealsByStage.map((stage) => (
          <div key={stage.key} className="bg-white border border-border rounded-xl">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wide">
                {stage.label}
              </h2>
              <p className="text-xs text-muted mt-0.5">{stage.deals.length} fırsat</p>
            </div>
            <div className="p-3 space-y-2 min-h-[100px]">
              {stage.deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} stages={STAGES} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
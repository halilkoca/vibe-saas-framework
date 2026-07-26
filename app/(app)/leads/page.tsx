import { getAllLeads } from "@/lib/data/leads";
import { NewLeadForm } from "./new-lead-form";
import { LeadRow } from "./lead-row";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await getAllLeads();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Müşteri Adayları</h1>
      </div>

      <NewLeadForm />

      <div className="bg-white border border-border rounded-xl overflow-hidden mt-6">
        {leads && leads.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="px-5 py-3 font-medium">İsim</th>
                <th className="px-5 py-3 font-medium">İletişim</th>
                <th className="px-5 py-3 font-medium">Kaynak</th>
                <th className="px-5 py-3 font-medium">Durum</th>
                <th className="px-5 py-3 font-medium sr-only">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-10 text-sm text-muted text-center">
            Henüz müşteri adayı eklenmemiş. Yukarıdaki formdan ilk kaydını ekle.
          </p>
        )}
      </div>
    </div>
  );
}
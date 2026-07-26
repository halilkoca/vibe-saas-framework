import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  owner: "Sahip",
  admin: "Yönetici",
  member: "Üye",
};

export default async function TeamPage() {
  const supabase = await createClient();

  // RLS "profiles_select_same_tenant" policy'si sayesinde sadece kendi
  // tenant'ındaki üyeler dönüyor — başka tenant'ın kullanıcıları görünmez.
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Takım</h1>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-5 py-3 font-medium">İsim</th>
              <th className="px-5 py-3 font-medium">Rol</th>
              <th className="px-5 py-3 font-medium">Katılım</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(members ?? []).map((member) => (
              <tr key={member.id}>
                <td className="px-5 py-3 font-medium">{member.full_name ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className="text-xs bg-black/5 rounded-full px-2 py-1">
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted">
                  {new Date(member.created_at).toLocaleDateString("tr-TR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted mt-4">
        Davet sistemi henüz eklenmedi — bu framework'ün "boş" bırakıldığı
        yerlerden biri, kendi davet akışını buraya ekleyebilirsin
        (bkz. <code className="text-xs bg-black/5 px-1 py-0.5 rounded">docs/MODULES.md</code>).
      </p>
    </div>
  );
}

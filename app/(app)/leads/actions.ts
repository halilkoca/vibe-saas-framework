"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const STATUSES = ["new", "contacted", "lost", "won"] as const;

export type CreateLeadState = { error: string | null; success?: boolean };

export async function createLead(
  _prevState: CreateLeadState,
  formData: FormData
): Promise<CreateLeadState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();

  if (!fullName) {
    return { error: "İsim alanı zorunlu." };
  }

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();

  // tenant_id burada YOK — kolonun DB default'u current_tenant_id() ile
  // otomatik doluyor, "with check" politikası bunu ikinci kez doğruluyor.
  // Client'tan hiçbir zaman tenant_id parametresi almıyoruz/göndermiyoruz.
  const { error } = await supabase.from("vibe_leads").insert({
    full_name: fullName,
    email: email || null,
    phone: phone || null,
    source: source || null,
    created_by: userRes.user!.id,
  });

  if (error) {
    return { error: "Kayıt oluşturulamadı: " + error.message };
  }

  revalidatePath("/leads");
  return { error: null, success: true };
}

export async function updateLeadStatus(leadId: string, status: string) {
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    throw new Error("Geçersiz durum");
  }

  const supabase = await createClient();
  // RLS otomatik olarak sadece kendi tenant'ının satırını güncellemesine izin veriyor.
  const { error } = await supabase
    .from("vibe_leads")
    .update({ status })
    .eq("id", leadId);

  if (error) throw new Error(error.message);

  revalidatePath("/leads");
}

export async function deleteLead(leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("vibe_leads").delete().eq("id", leadId);

  if (error) throw new Error(error.message);

  revalidatePath("/leads");
}

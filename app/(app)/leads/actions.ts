"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createLead, updateLeadStatus, deleteLead as deleteLeadFromDB } from "@/lib/data/leads";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/get-client-ip";
import { sanitizeText, isValidEmail, LIMITS } from "@/lib/validation";

const STATUSES = ["new", "contacted", "lost", "won"] as const;

export type CreateLeadState = { error: string | null; success?: boolean };

export async function createLeadAction(
  _prevState: CreateLeadState,
  formData: FormData
): Promise<CreateLeadState> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    return { error: "Oturum süren dolmuş. Lütfen tekrar giriş yap." };
  }

  const headerList = await headers();
  const ip = getClientIp(headerList);

  // Per-user rate limit: 30 leads per minute
  const { success: rateOk } = await rateLimit(userRes.user.id, "create_lead", 30, 60_000);
  if (!rateOk) {
    return { error: "Çok fazla kayıt eklediniz. Bir dakika bekleyin." };
  }

  const fullName = sanitizeText(String(formData.get("full_name") ?? ""), LIMITS.fullName.max);
  const email = sanitizeText(String(formData.get("email") ?? ""), LIMITS.email.max);
  const phone = sanitizeText(String(formData.get("phone") ?? ""), LIMITS.phone.max);
  const source = sanitizeText(String(formData.get("source") ?? ""), LIMITS.source.max);

  if (!fullName) {
    return { error: "İsim alanı zorunlu." };
  }

  if (email && !isValidEmail(email)) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }

  const result = await createLead({
    full_name: fullName,
    email: email || null,
    phone: phone || null,
    source: source || null,
    created_by: userRes.user.id,
  });

  if (result.error) {
    console.error("[createLeadAction] DB error:", result.error);
    return { error: "Kayıt oluşturulamadı." };
  }

  revalidatePath("/leads");
  return { error: null, success: true };
}

export async function updateLeadStatusAction(leadId: string, status: string) {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    throw new Error("Oturum süren dolmuş.");
  }

  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    throw new Error("Geçersiz durum");
  }

  const result = await updateLeadStatus(leadId, status);
  if (result.error) {
    console.error("[updateLeadStatusAction] DB error:", result.error);
    throw new Error("Status güncellenemedi.");
  }

  revalidatePath("/leads");
}

export async function deleteLeadAction(leadId: string) {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    throw new Error("Oturum süren dolmuş.");
  }

  const result = await deleteLeadFromDB(leadId);
  if (result.error) {
    console.error("[deleteLeadAction] DB error:", result.error);
    throw new Error("Silinemedi.");
  }

  revalidatePath("/leads");
}
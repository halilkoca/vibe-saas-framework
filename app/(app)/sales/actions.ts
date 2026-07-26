"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createDeal, updateDealStage } from "@/lib/data/deals";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/get-client-ip";
import { sanitizeText, isValidAmount, LIMITS } from "@/lib/validation";

export type CreateDealState = { error: string | null; success?: boolean };

export async function createDealAction(
  _prevState: CreateDealState,
  formData: FormData
): Promise<CreateDealState> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    return { error: "Oturum süren dolmuş. Lütfen tekrar giriş yap." };
  }

  const headerList = await headers();
  const ip = getClientIp(headerList);

  // Per-user rate limit: 30 deals per minute
  const { success: rateOk } = await rateLimit(userRes.user.id, "create_deal", 30, 60_000);
  if (!rateOk) {
    return { error: "Çok fazla kayıt eklediniz. Bir dakika bekleyin." };
  }

  const title = sanitizeText(String(formData.get("title") ?? ""), LIMITS.title.max);
  const rawAmount = Number(formData.get("amount") ?? 0);
  const amount = isNaN(rawAmount) ? 0 : rawAmount;

  if (!title) {
    return { error: "Fırsat başlığı zorunlu." };
  }

  if (!isValidAmount(amount)) {
    return { error: "Geçersiz tutar." };
  }

  const result = await createDeal({
    title,
    amount,
    created_by: userRes.user.id,
  });

  if (result.error) {
    console.error("[createDealAction] DB error:", result.error);
    return { error: "Kayıt oluşturulamadı." };
  }

  revalidatePath("/sales");
  return { error: null, success: true };
}

export async function updateDealStageAction(dealId: string, stage: string) {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    throw new Error("Oturum süren dolmuş.");
  }

  const result = await updateDealStage(dealId, stage);
  if (result.error) {
    console.error("[updateDealStageAction] DB error:", result.error);
    throw new Error("Aşama güncellenemedi.");
  }

  revalidatePath("/sales");
}
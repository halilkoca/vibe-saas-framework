"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CreateDealState = { error: string | null; success?: boolean };

export async function createDeal(
  _prevState: CreateDealState,
  formData: FormData
): Promise<CreateDealState> {
  const title = String(formData.get("title") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);

  if (!title) {
    return { error: "Fırsat başlığı zorunlu." };
  }

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();

  const { error } = await supabase.from("vibe_deals").insert({
    title,
    amount: isNaN(amount) ? 0 : amount,
    created_by: userRes.user!.id,
  });

  if (error) {
    return { error: "Kayıt oluşturulamadı: " + error.message };
  }

  revalidatePath("/sales");
  return { error: null, success: true };
}

export async function updateDealStage(dealId: string, stage: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("vibe_deals").update({ stage }).eq("id", dealId);
  if (error) throw new Error(error.message);
  revalidatePath("/sales");
}

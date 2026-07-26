// Data layer for sales module.
// All Supabase queries for vibe_deals table are centralized here.

import { createClient } from "@/lib/supabase/server";

export type Deal = {
  id: string;
  title: string;
  amount: number;
  stage: string;
  close_date: string | null;
  created_at: string;
};

export async function getAllDeals(): Promise<Deal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vibe_deals")
    .select("id, title, amount, stage, close_date, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getOpenDealCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("vibe_deals")
    .select("*", { count: "exact", head: true })
    .not("stage", "in", "(won,lost)");
  return count ?? 0;
}

export async function createDeal(input: {
  title: string;
  amount: number;
  created_by: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("vibe_deals").insert({
    title: input.title,
    amount: input.amount,
    created_by: input.created_by,
  });
  return { error: error?.message ?? null };
}

export async function updateDealStage(dealId: string, stage: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vibe_deals")
    .update({ stage })
    .eq("id", dealId);
  return { error: error?.message ?? null };
}
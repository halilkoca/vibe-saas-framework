// Data layer for reports module.
// Aggregation queries for dashboard/reports charts.

import { createClient } from "@/lib/supabase/server";

export type LeadCountByStatus = {
  status: string;
  count: number;
};

export type DealTotalByStage = {
  stage: string;
  amount: number;
};

export async function getLeadStatusCounts(): Promise<LeadCountByStatus[]> {
  const supabase = await createClient();
  const { data: leads } = await supabase.from("vibe_leads").select("status");
  const raw = (leads ?? []) as { status: string }[];
  return ["new", "contacted", "won", "lost"].map((status) => ({
    status,
    count: raw.filter((l) => l.status === status).length,
  }));
}

export async function getDealStageTotals(): Promise<DealTotalByStage[]> {
  const supabase = await createClient();
  const { data: deals } = await supabase.from("vibe_deals").select("stage, amount");
  const raw = (deals ?? []) as { stage: string; amount: number }[];
  return ["prospecting", "proposal", "negotiation", "won", "lost"].map((stage) => ({
    stage,
    amount: raw
      .filter((d) => d.stage === stage)
      .reduce((sum, d) => sum + Number(d.amount), 0),
  }));
}
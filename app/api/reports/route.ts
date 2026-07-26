// API route for reports — GET (lead status counts + deal stage totals).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLeadStatusCounts, getDealStageTotals } from "@/lib/data/reports";

export async function GET() {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [leadCounts, dealTotals] = await Promise.all([
      getLeadStatusCounts(),
      getDealStageTotals(),
    ]);

    return NextResponse.json({ leadCounts, dealTotals });
  } catch (err) {
    console.error("[GET /api/reports]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
// API route for dashboard — GET (lead count, open deal count, recent leads).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLeadsCount, getRecentLeads } from "@/lib/data/leads";
import { getOpenDealCount } from "@/lib/data/deals";

export async function GET() {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [leadCount, openDealCount, recentLeads] = await Promise.all([
      getLeadsCount(),
      getOpenDealCount(),
      getRecentLeads(5),
    ]);

    return NextResponse.json({ leadCount, openDealCount, recentLeads });
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
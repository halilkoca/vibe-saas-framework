// API route for single deal operations — PATCH (update stage).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateDealStage } from "@/lib/data/deals";
import { parseJSON } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  {
    const parsed = parseJSON(await request.text());
    if (!parsed.ok) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    body = parsed.data as Record<string, unknown>;
  }

  const stage = String(body.stage ?? "");

  if (!stage || typeof stage !== "string") {
    return NextResponse.json({ error: "stage is required" }, { status: 400 });
  }

  try {
    const result = await updateDealStage(id, stage);
    if (result.error) {
      console.error("[PATCH /api/deals/:id] DB error:", result.error);
      return NextResponse.json({ error: "Failed to update deal." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/deals/:id]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
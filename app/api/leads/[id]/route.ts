// API route for single lead operations — PATCH (update status) and DELETE.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateLeadStatus, deleteLead } from "@/lib/data/leads";
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

  const status = String(body.status ?? "");

  if (!status || typeof status !== "string") {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  try {
    const result = await updateLeadStatus(id, status);
    if (result.error) {
      console.error("[PATCH /api/leads/:id] DB error:", result.error);
      return NextResponse.json({ error: "Failed to update lead." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/leads/:id]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await deleteLead(id);
    if (result.error) {
      console.error("[DELETE /api/leads/:id] DB error:", result.error);
      return NextResponse.json({ error: "Failed to delete lead." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/leads/:id]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
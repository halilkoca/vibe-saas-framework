// API route for deals — GET (list) and POST (create).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllDeals, createDeal } from "@/lib/data/deals";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/get-client-ip";
import { sanitizeText, isValidAmount, parseJSON, LIMITS } from "@/lib/validation";

export async function GET() {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deals = await getAllDeals();
    return NextResponse.json(deals);
  } catch (err) {
    console.error("[GET /api/deals]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headerList = await headers();
  const ip = getClientIp(headerList);

  const { success: rateOk } = await rateLimit(ip, "api_create_deal", 30, 60_000);
  if (!rateOk) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  {
    const parsed = parseJSON(await request.text());
    if (!parsed.ok) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    body = parsed.data as Record<string, unknown>;
  }

  const title = sanitizeText(String(body.title ?? ""), LIMITS.title.max);
  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount ?? 0);

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  if (!isValidAmount(amount)) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  try {
    const result = await createDeal({
      title,
      amount,
      created_by: userRes.user.id,
    });

    if (result.error) {
      console.error("[POST /api/deals] DB error:", result.error);
      return NextResponse.json({ error: "Failed to create deal." }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/deals]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
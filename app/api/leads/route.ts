// API route for leads — GET (list) and POST (create).
// RLS is enforced via the server client (cookie-based session).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllLeads, createLead } from "@/lib/data/leads";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/get-client-ip";
import { sanitizeText, isValidEmail, parseJSON, LIMITS } from "@/lib/validation";

export async function GET() {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const leads = await getAllLeads();
    return NextResponse.json(leads);
  } catch (err) {
    console.error("[GET /api/leads]", err);
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

  const { success: rateOk } = await rateLimit(ip, "api_create_lead", 30, 60_000);
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

  const fullName = sanitizeText(String(body.full_name ?? ""), LIMITS.fullName.max);
  const email = sanitizeText(String(body.email ?? ""), LIMITS.email.max);
  const phone = sanitizeText(String(body.phone ?? ""), LIMITS.phone.max);
  const source = sanitizeText(String(body.source ?? ""), LIMITS.source.max);

  if (!fullName) {
    return NextResponse.json({ error: "full_name is required" }, { status: 400 });
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
  }

  try {
    const result = await createLead({
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      source: source || null,
      created_by: userRes.user.id,
    });

    if (result.error) {
      console.error("[POST /api/leads] DB error:", result.error);
      return NextResponse.json({ error: "Failed to create lead." }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
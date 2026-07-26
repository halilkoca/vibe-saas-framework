// API route for current user profile — GET (profile + tenant name).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data/profiles";

export async function GET() {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await getProfile(userRes.user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...profile,
      email: userRes.user.email,
    });
  } catch (err) {
    console.error("[GET /api/profile]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
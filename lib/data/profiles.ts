// Data layer for user profiles and tenant info.

import { createClient } from "@/lib/supabase/server";

export type ProfileWithTenant = {
  full_name: string | null;
  role: string;
  tenant_name: string | null;
};

type ProfileQueryResult = {
  full_name: string | null;
  role: string;
  vibe_tenants: { name: string } | null;
};

export async function getProfile(userId: string): Promise<ProfileWithTenant | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vibe_profiles")
    .select("full_name, role, vibe_tenants(name)")
    .eq("id", userId)
    .single();

  if (!data) return null;

  const row = data as unknown as ProfileQueryResult;

  return {
    full_name: row.full_name ?? null,
    role: row.role ?? "member",
    tenant_name: row.vibe_tenants?.name ?? null,
  };
}

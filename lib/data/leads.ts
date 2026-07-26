// Data layer for leads module.
// All Supabase queries for vibe_leads table are centralized here.
// Server Components and Server Actions call these functions instead of
// calling supabase.from("vibe_leads") directly.

import { createClient } from "@/lib/supabase/server";

export type Lead = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

export type LeadRow = Pick<Lead, "id" | "full_name" | "email" | "phone" | "source" | "status" | "created_at">;

export async function getAllLeads(): Promise<LeadRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vibe_leads")
    .select("id, full_name, email, phone, source, status, created_at")
    .order("created_at", { ascending: false });
  // RLS tenant izolasyonu arkada çalışır, bu yüzden data layer'da
  // tenant_id filtresi eklenmez — RLS zorunlu kılar.
  // NOT: createServiceRoleClient() kullanılan yerlerde RLS bypass
  // olur; o çağrılarda elle tenant_id filtresi eklenmelidir.
  return data ?? [];
}

export async function getLeadsCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("vibe_leads")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

export async function getRecentLeads(limit = 5): Promise<Pick<Lead, "id" | "full_name" | "status" | "created_at">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vibe_leads")
    .select("id, full_name, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function createLead(input: {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  created_by: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("vibe_leads").insert({
    full_name: input.full_name,
    email: input.email || null,
    phone: input.phone || null,
    source: input.source || null,
    created_by: input.created_by,
  });
  return { error: error?.message ?? null };
}

export async function updateLeadStatus(leadId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vibe_leads")
    .update({ status })
    .eq("id", leadId);
  return { error: error?.message ?? null };
}

export async function deleteLead(leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("vibe_leads").delete().eq("id", leadId);
  return { error: error?.message ?? null };
}
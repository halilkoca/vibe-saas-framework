-- ═══════════════════════════════════════════════════════════════
-- 0004_security_hardening.sql
-- Input validation constraints + security-definer function access hardening.
--
-- Uygulama:
--   1. CHECK constraints ile tüm text kolonlarında max uzunluk sınırı
--   2. vibe_deals.amount için geçerli aralık kontrolü
--   3. SECURITY DEFINER fonksiyonların public/anon tarafından çalıştırılmasını kısıtlama
-- ═══════════════════════════════════════════════════════════════

-- ── 1. CHECK constraints: vibe_tenants ──────────────────────────
alter table public.vibe_tenants
  drop constraint if exists vibe_tenants_name_len;
alter table public.vibe_tenants
  add constraint vibe_tenants_name_len
  check (char_length(name) between 1 and 100);

-- ── 2. CHECK constraints: vibe_profiles ─────────────────────────
alter table public.vibe_profiles
  drop constraint if exists vibe_profiles_full_name_len;
alter table public.vibe_profiles
  add constraint vibe_profiles_full_name_len
  check (full_name is null or char_length(full_name) between 1 and 100);

-- ── 3. CHECK constraints: vibe_leads ────────────────────────────
alter table public.vibe_leads
  drop constraint if exists vibe_leads_full_name_len;
alter table public.vibe_leads
  add constraint vibe_leads_full_name_len
  check (char_length(full_name) between 1 and 100);

alter table public.vibe_leads
  drop constraint if exists vibe_leads_email_len;
alter table public.vibe_leads
  add constraint vibe_leads_email_len
  check (email is null or char_length(email) between 1 and 254);

alter table public.vibe_leads
  drop constraint if exists vibe_leads_phone_len;
alter table public.vibe_leads
  add constraint vibe_leads_phone_len
  check (phone is null or char_length(phone) <= 30);

alter table public.vibe_leads
  drop constraint if exists vibe_leads_source_len;
alter table public.vibe_leads
  add constraint vibe_leads_source_len
  check (source is null or char_length(source) <= 50);

alter table public.vibe_leads
  drop constraint if exists vibe_leads_notes_len;
alter table public.vibe_leads
  add constraint vibe_leads_notes_len
  check (notes is null or char_length(notes) <= 2000);

-- ── 4. CHECK constraints: vibe_deals ────────────────────────────
alter table public.vibe_deals
  drop constraint if exists vibe_deals_title_len;
alter table public.vibe_deals
  add constraint vibe_deals_title_len
  check (char_length(title) between 1 and 150);

alter table public.vibe_deals
  drop constraint if exists vibe_deals_amount_range;
alter table public.vibe_deals
  add constraint vibe_deals_amount_range
  check (amount >= 0 and amount <= 999999999.99);

-- ── 5. SECURITY DEFINER fonksiyon erişimini kısıtla ─────────────
-- vibe_current_tenant_id: policy'lerde auth.uid() olan kullanıcılar tarafından
-- çağrılır. Anon/public'ın doğrudan çağırmasına gerek yoktur.
-- (Trigger fonksiyonu vibe_handle_new_user trigger context'inde çalışır,
--  onun EXECUTE'ini kısıtlamıyoruz — security definer zaten RLS bypass eder
--  ve sadece auth.users insert trigger'ı ile çalışır.)
revoke execute on function public.vibe_current_tenant_id from public, anon;
grant execute on function public.vibe_current_tenant_id to authenticated;

-- ÖNEMLİ: vibe_handle_new_user trigger'ı auth.users tablosundan tetiklenir
-- ve security definer olarak çalışır. EXECUTE yetkisini kısıtlamıyoruz
-- çünkü trigger sistemi gereği ihtiyaç duyar (trigger owner tarafından
-- çalıştırılır, normal kullanıcı değil).
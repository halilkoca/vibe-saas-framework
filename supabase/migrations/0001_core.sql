-- ═══════════════════════════════════════════════════════════════
-- 0001_core.sql
-- Çekirdek: vibe_tenants, vibe_profiles, signup trigger, RLS temel pattern.
-- BU MİGRATION SİLİNEMEZ / KAPATILAMAZ — tüm diğer modüller buna bağlı.
--
-- Tüm framework tabloları "vibe_" prefix'i ile adlandırılır.
-- ═══════════════════════════════════════════════════════════════

-- updated_at kolonlarını otomatik güncelleyen trigger fonksiyonu için gerekli.
-- leads/sales modülleri bunu kullanıyor.
create extension if not exists moddatetime schema extensions;

-- ── vibe_tenants ──────────────────────────────────────────────────
create table public.vibe_tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.vibe_tenants enable row level security;

-- ── vibe_profiles (auth.users'a 1-1 bağlı) ────────────────────────
create table public.vibe_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.vibe_tenants(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.vibe_profiles enable row level security;

-- Kullanıcı sadece kendi tenant'ındaki profilleri görebilir.
create policy "vibe_profiles_select_same_tenant" on public.vibe_profiles
  for select
  using (tenant_id = (select tenant_id from public.vibe_profiles where id = auth.uid()));

-- Kullanıcı sadece kendi profilini güncelleyebilir.
create policy "vibe_profiles_update_own" on public.vibe_profiles
  for update
  using (id = auth.uid());

-- vibe_tenants tablosuna sadece kendi tenant'ını görebilir.
create policy "vibe_tenants_select_own" on public.vibe_tenants
  for select
  using (id = (select tenant_id from public.vibe_profiles where id = auth.uid()));

-- ── Signup trigger: yeni kullanıcı kayıt olunca otomatik tenant + profile ──
-- ÖNEMLİ: Bu işlem bilerek CLIENT TARAFINDA DEĞİL, DB trigger'ında yapılıyor.
-- Client'ta yapılsaydı kullanıcı isteğe bağlı tenant_id gönderip başka bir
-- tenant'a "sızabilirdi". Trigger, security definer ile RLS'i bypass ederek
-- güvenli şekilde çalışır — bu framework'ün en kritik güvenlik kararlarından biri.
create or replace function public.vibe_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
begin
  insert into public.vibe_tenants (name)
  values (coalesce(new.raw_user_meta_data->>'company_name', 'Yeni Şirket'))
  returning id into new_tenant_id;

  insert into public.vibe_profiles (id, tenant_id, role, full_name)
  values (
    new.id,
    new_tenant_id,
    'owner',
    new.raw_user_meta_data->>'full_name'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.vibe_handle_new_user();

-- ── Yardımcı fonksiyon: mevcut kullanıcının tenant_id'sini döner ─────────
-- RLS policy'lerinde tekrar tekrar subquery yazmak yerine bunu kullanabilirsin:
--   using (tenant_id = public.vibe_current_tenant_id())
create or replace function public.vibe_current_tenant_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select tenant_id from public.vibe_profiles where id = auth.uid();
$$;
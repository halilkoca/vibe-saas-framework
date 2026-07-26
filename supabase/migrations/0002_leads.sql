-- ═══════════════════════════════════════════════════════════════
-- 0002_leads.sql — [MODÜL: leads]
-- Silmek istersen: bu dosyayı uygulama, app/(app)/leads klasörünü sil,
-- modules.config.ts'de leads: false yap. Başka hiçbir tabloya bağımlılığı yok.
-- ═══════════════════════════════════════════════════════════════

create table public.vibe_leads (
  id uuid primary key default gen_random_uuid(),
  -- default vibe_current_tenant_id(): insert sırasında tenant_id GÖNDERMESEN de
  -- doğru tenant'a yazılır. "with check" politikası yine de doğrular,
  -- bu ikinci bir katman.
  tenant_id uuid not null default public.vibe_current_tenant_id()
    references public.vibe_tenants(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  source text,
  status text not null default 'new' check (status in ('new', 'contacted', 'lost', 'won')),
  notes text,
  created_by uuid references public.vibe_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vibe_leads enable row level security;

create index vibe_leads_tenant_id_idx on public.vibe_leads(tenant_id);

-- Standart tenant izolasyon pattern'i — her tenant-scoped tabloda aynı şekli kullan.
create policy "vibe_leads_tenant_isolation" on public.vibe_leads
  for all
  using (tenant_id = public.vibe_current_tenant_id())
  with check (tenant_id = public.vibe_current_tenant_id());

create trigger vibe_leads_set_updated_at
  before update on public.vibe_leads
  for each row execute function extensions.moddatetime(updated_at);
-- ═══════════════════════════════════════════════════════════════
-- 0003_sales.sql — [MODÜL: sales]
-- Bağımlılık: vibe_leads tablosuna opsiyonel foreign key var (lead_id nullable).
-- leads modülünü silersen bu tablo çalışmaya devam eder, sadece lead_id
-- kolonunu kullanmazsın ya da migration'ı elle düzenlersin.
-- ═══════════════════════════════════════════════════════════════

create table public.vibe_deals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.vibe_current_tenant_id()
    references public.vibe_tenants(id) on delete cascade,
  lead_id uuid references public.vibe_leads(id) on delete set null,
  title text not null,
  amount numeric(12,2) not null default 0,
  stage text not null default 'prospecting'
    check (stage in ('prospecting', 'proposal', 'negotiation', 'won', 'lost')),
  close_date date,
  created_by uuid references public.vibe_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vibe_deals enable row level security;

create index vibe_deals_tenant_id_idx on public.vibe_deals(tenant_id);

create policy "vibe_deals_tenant_isolation" on public.vibe_deals
  for all
  using (tenant_id = public.vibe_current_tenant_id())
  with check (tenant_id = public.vibe_current_tenant_id());

create trigger vibe_deals_set_updated_at
  before update on public.vibe_deals
  for each row execute function extensions.moddatetime(updated_at);
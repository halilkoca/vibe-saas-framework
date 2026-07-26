# VibeSaaS Framework — plan.md

> Amaç: Kod güvenliği bilgisi olmayan "vibe coder"ların (AI ile kod yazan, backend/auth/RLS
> kavramlarına hakim olmayan) production'a güvenli çıkabilmesi için hazır, modüler bir
> Next.js + Supabase SaaS starter kit.
>
> Felsefe: **Güvenli defaults.** Kullanıcı hiçbir şey bilmese bile, framework'ü indirip
> `npm install && npm run setup` dediğinde RLS açık, auth doğru kurulmuş, rate-limit ve
> captcha aktif bir sistemle başlasın. Yanlış yapması ZOR olsun, doğru yapması KOLAY olsun.

---

## 0. Tasarım İlkeleri

1. **Secure by default, opt-out değil opt-in risk.** RLS her tablo için baştan açık gelir.
   Kapatmak isteyen bilinçli bir adım atmak zorunda kalır (ör. `-- ALLOW_INSECURE` yorumu).
2. **Modüler = silinebilir, ama kırılmaz.** Her modül (`leads`, `sales`, `reports`, `billing`)
   kendi migration dosyasında, kendi route grubunda, kendi RLS policy'sinde izole. Bir modülü
   silmek diğerini bozmamalı.
3. **Tek DB, satır bazlı multi-tenancy.** Her tenant-scoped tabloda `tenant_id uuid` kolonu
   ve bu kolona bağlı RLS policy. Schema-per-tenant YOK (Supabase'de yönetimi ağır ve
   vibe coder'ın anlayamayacağı bir karmaşıklık ekler).
4. **SSR + SSG birlikte, sayfa bazlı karar.** Pazarlama sayfaları (landing, pricing, blog) SSG.
   Dashboard, leads, reports gibi tenant-datası içeren her şey SSR (`export const dynamic =
   'force-dynamic'` + Supabase server client).
5. **Saldırı yüzeyini baştan kapat.** Auth formlarında Cloudflare Turnstile zorunlu, tüm
   mutation endpoint'lerinde rate-limit, tüm public formlarda honeypot + origin check.
6. **Dokümantasyon kod kadar önemli.** Her modülün başında "bu ne işe yarar, nasıl silinir,
   nelere dikkat et" açıklaması olacak — çünkü hedef kitle bunu okumadan silmeye çalışacak.

---

## 1. Mimari Özet

```
Next.js 16 (App Router, latest) ─┬─ SSG: (marketing)/ (landing, about, contact, pricing, blog)
                                   └─ SSR: (app)/ (dashboard, leads, sales, reports)
                                         │
                                         ▼
                            API Route (app/api/...)
                                         │
                                         ▼
                            Data Layer (lib/data/...)
                                         │
                                         ▼
                            Supabase (Postgres + Auth + RLS)
                                         │
                     tenant_id kolonu + RLS policy her tabloda
                                         │
                            proxy.ts: session refresh + app route guard
```

**Klasör yapısı:**

```
/app
  /(marketing)          → SSG sayfalar (landing, about, contact, pricing, hakkımızda)
  /(auth)               → login, signup, forgot-password (Turnstile korumalı)
  /(app)
    /dashboard           → SSR, tenant-scoped
    /leads                → [MODÜL] CRM benzeri lead takibi
    /sales                → [MODÜL] satış pipeline / deal takibi
    /reports              → [MODÜL] dashboard grafikleri
    /settings
      /team                → kullanıcı davet, rol yönetimi
      /billing              → [MODÜL] Stripe/Helcim entegrasyonu
  /api                   → Route Handlers (Next.js 16)
    /leads                → GET (list), POST (create)
    /leads/[id]           → PATCH (update status), DELETE
    /deals                → GET (list), POST (create)
    /deals/[id]           → PATCH (update stage)
    /reports              → GET (lead + deal istatistikleri)
    /dashboard            → GET (leadCount, openDealCount, recentLeads)
    /auth
      /login              → POST (email + password + Turnstile + rate-limit)
      /signup             → POST (full_name + company_name + email + password + Turnstile + rate-limit)
    /profile              → GET (current user profile + tenant name)
    /webhooks             → Stripe/Helcim webhook handler'ları
/components
  /marketing-header.tsx  → Pazarlama sayfaları ortak header
  /marketing-footer.tsx  → Pazarlama sayfaları ortak footer
  /feature-card.tsx      → Özellik kartı bileşeni
/lib
  /data                  → Veritabanı katmanı (tüm DB sorguları burada)
    leads.ts              → getAllLeads, createLead, updateLeadStatus, deleteLead, getLeadsCount, getRecentLeads
    deals.ts              → getAllDeals, createDeal, updateDealStage, getOpenDealCount
    reports.ts            → getLeadStatusCounts, getDealStageTotals
    profiles.ts           → getProfile (profile + tenant name)
  /supabase
    client.ts             → browser client
    server.ts              → server component / route handler client
    middleware.ts           → session refresh helper
  /modules.config.ts     → hangi modüller aktif (tek yerden aç/kapa)
  /rate-limit.ts         → Upstash veya in-memory basit rate limiter
  /turnstile.ts          → Cloudflare Turnstile server-side verify
/supabase
  /migrations            → numaralı SQL migration dosyaları (her modül ayrı dosya)
config/
  tenant.config.ts       → tenant resolution stratejisi (bkz. bölüm 3)
docs/
  SECURITY.md            → "neden böyle yaptık" açıklamaları
  MODULES.md             → her modülü nasıl eklersin/silersin
```

---

## 2. Auth & Tenant Modeli

- Supabase Auth (email/password + opsiyonel magic link). Sosyal login opsiyonel modül.
- Her kullanıcı `vibe_profiles` tablosunda bir satıra sahip, `vibe_profiles.tenant_id` ile tenant'a bağlı.
- Bir kullanıcı = bir tenant (basit model). Multi-tenant membership (bir kullanıcı birden
  fazla tenant'a üye) → v2 için not düşüldü, ilk sürümde YOK (karmaşıklığı azaltmak için).
- Signup akışı: kullanıcı kayıt olur → otomatik yeni `vibe_tenants` satırı + `vibe_profiles` satırı
  oluşturulur (Postgres trigger ile, client tarafında DEĞİL — client tarafında yapılırsa
  güvenlik açığı olur, bu framework'ün tam önlemeye çalıştığı hata tipi).
- **RLS kuralı (her tenant-scoped tabloda aynı pattern):**

```sql
create policy "vibe_leads_tenant_isolation" on public.vibe_leads
  for all
  using (tenant_id = public.vibe_current_tenant_id())
  with check (tenant_id = public.vibe_current_tenant_id());
```

- Rol modeli: `owner`, `admin`, `member` — `vibe_profiles.role` kolonu. Owner faturalandırmayı
  ve takım davetlerini yönetir.

---

## 3. Modül Sistemi (silinebilir yapı)

`lib/modules.config.ts`:

```ts
export const MODULES = {
  leads: true,
  sales: true,
  reports: true,
  billing: false, // default kapalı, isteyen açar
} as const;
```

Kural: Bir modülü kapatmak/silmek isteyen kullanıcı üç yeri değiştirir:
1. `modules.config.ts` içinde `false` yapar (route/menüden gizlenir — anında, kod silmeden test).
2. Gerçekten silmek isterse: `/app/(app)/<modul>` klasörünü siler.
3. `/supabase/migrations/xxxx_<modul>.sql` migration'ını uygulamaz / rollback eder.

Her modül klasörü kendi `README.md`'sine sahip: "bu tablo neyi tutar, hangi RLS'e bağlı,
silersen ne kırılır (varsa)."

**v1 modülleri:**
| `vibe_` Modül | İçerik | DB Tablo Adı |
|---|---|---|
| `leads` | Lead listesi, durum (yeni/iletişimde/kayıp/kazanıldı), kaynak, not | `vibe_leads` |
| `sales` | Basit pipeline: deal, tutar, aşama, kapanış tarihi | `vibe_deals` |
| `reports` | Leads/sales üzerinden otomatik grafikler (Recharts), tarih filtresi | (sadece okur) |
| `billing` | Stripe checkout + webhook, `vibe_subscriptions` tablosu (opsiyonel, default kapalı) | `vibe_subscriptions` |
| `team` | Davet linki, rol atama (çekirdek, kapatılamaz) | `vibe_team_members` |

---

## 4. API Katmanı (app/api/)

Tüm mutation işlemleri `app/api/` altındaki Route Handlers üzerinden yapılır.
Server Actions doğrudan `supabase.from()` çağırmaz — bunun yerine `fetch("/api/...")` kullanır.

### API Route Haritası

| Route | Metod | Açıklama | Auth | Rate-Limit | Captcha |
|---|---|---|---|---|---|
| `/api/leads` | GET | Lead listesi | RLS | — | — |
| `/api/leads` | POST | Yeni lead | RLS | — | — |
| `/api/leads/[id]` | PATCH | Status güncelle | RLS | — | — |
| `/api/leads/[id]` | DELETE | Lead sil | RLS | — | — |
| `/api/deals` | GET | Deal listesi | RLS | — | — |
| `/api/deals` | POST | Yeni deal | RLS | — | — |
| `/api/deals/[id]` | PATCH | Stage güncelle | RLS | — | — |
| `/api/reports` | GET | Lead/deal istatistikleri | RLS | — | — |
| `/api/dashboard` | GET | Dashboard özet | RLS | — | — |
| `/api/auth/login` | POST | Giriş | — | ✓ (5/dk) | ✓ |
| `/api/auth/signup` | POST | Kayıt | — | ✓ (3/dk) | ✓ |
| `/api/profile` | GET | Kullanıcı profili | RLS | — | — |

### Veritabanı Soyutlama (lib/data/)

Doğrudan `supabase.from("vibe_*")` çağrıları `lib/data/` altındaki fonksiyonlarda toplanır:

```
lib/data/
  leads.ts    → getAllLeads(), createLead(), updateLeadStatus(), deleteLead(), getLeadsCount(), getRecentLeads()
  deals.ts    → getAllDeals(), createDeal(), updateDealStage(), getOpenDealCount()
  reports.ts  → getLeadStatusCounts(), getDealStageTotals()
  profiles.ts → getProfile()
```

Server Component'ler bu fonksiyonları doğrudan çağırır (fetch yerine direkt fonksiyon).
Server Actions ise API route'larını çağırır (fetch ile) — böylece rate-limit ve
diğer güvenlik kontrolleri API katmanında kalır.

---

## 5. Güvenlik Katmanı (framework'ün asıl satış noktası)

Vibe coder'ın bilmediği ama framework'ün otomatik hallettiği şeyler:

- **Cloudflare Turnstile**: signup/login/contact formlarında zorunlu, server-side `verify`
  edilmeden hiçbir mutation çalışmaz.
- **Rate limiting**: `/api/auth/*` route'larında IP bazlı limit (Upstash Redis veya in-memory).
- **RLS varsayılan açık**: migration template'i `enable row level security` satırı olmadan
  tablo oluşturmaya izin vermiyor (linter script ile kontrol edilecek, bkz. bölüm 7).
- **Server-side tenant doğrulama**: Client hiçbir zaman `tenant_id`'yi kendisi set edemez;
  her zaman `auth.uid()` üzerinden server'da resolve edilir.
- **CSRF/Origin kontrolü**: Route handler'larda origin header kontrolü.
- **Environment secrets ayrımı**: `.env.example` net şekilde hangi key public (`NEXT_PUBLIC_`)
  hangi key server-only diye ayrılmış, service_role key'in ASLA client'a sızmaması için
  lint kuralı.
- **Honeypot alanlar**: Public formlarda bot koruması için ekstra katman.
- **CSP Headers**: Content Security Policy ile XSS saldırılarına karşı koruma.
- **Security Headers**: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`.
- **Audit Log**: `vibe_audit_logs` tablosu ile önemli aksiyonların kaydı.
- **Session Timeout**: Inaktivite durumunda otomatik logout.

`docs/SECURITY.md` bu maddelerin her birini "neden" diye açıklayacak, çünkü hedef kitle
kopyala-yapıştır yapacak ve en azından bir kere okumalı.

---

## 6. SSR/SSG Stratejisi

- `(marketing)` route group → SSG/ISR (statik build + revalidate).
- `(app)` route group → her sayfa `export const dynamic = 'force-dynamic'`, Supabase server
  client ile cookie tabanlı session okunur.
- Next.js 16 App Router + React Server Components varsayılan; client component'ler sadece
  interaktif parçalarda (`'use client'` minimal kullanım — vibe coder'ın her şeyi client
  yapma alışkanlığını kırmak için `docs/` içinde özellikle anlatılacak).

---

## 7. Geliştirici Deneyimi (DX) — asıl fark burada olacak

- `npm run setup` → interaktif CLI: Supabase proje URL/key sorar, `.env.local` oluşturur,
  migration'ları çalıştırır, Turnstile key sorar.
- `npm run check` → basit bir güvenlik linter'ı: RLS'siz tablo var mı, service_role key
  client kodunda geçiyor mu, `.env` git'e commit'lenmiş mi kontrol eder.
- `npm run modules` → hangi modüllerin aktif olduğunu gösteren basit CLI toggle.
- Türkçe + İngilizce README (hedef kitlenin bir kısmı Türk, GitHub'a paylaşılacağı için
  ikisi de olmalı).
- **Testing**: Unit testler için Vitest, e2e testler için Playwright.
- **CI/CD**: GitHub Actions template — lint, test, build.
- **Error Monitoring**: Sentry entegrasyonu (opsiyonel modül).
- **SEO**: Metadata API, sitemap.xml, robots.txt, Open Graph etiketleri.
- **Accessibility (a11y)**: WCAG 2.1 AA hedefi — focus management, aria labels, semantic HTML.
- **Responsive Design**: Mobile-first yaklaşım, tüm sayfalar mobil uyumlu.
- **Loading States**: Skeleton component'ler ile yükleme durumları.
- **Toast Notifications**: Kullanıcı aksiyonları için bildirim sistemi.
- **Dark Mode**: CSS değişkenleri ile opsiyonel dark mode desteği.

---

## 8. Yol Haritası

- [x] **v0.1 — Çekirdek**: Next.js + Supabase auth + tenant trigger + RLS pattern + Turnstile + Tablo prefix (`vibe_`)
- [x] **v0.2 — Marketing Sayfaları**: Homepage, About Us, Contact (+ Turnstile + honeypot)
- [x] **v0.3 — Leads modülü**: CRUD + RLS + basit UI
- [x] **v0.4 — Sales modülü**: pipeline + leads ile ilişki
- [x] **v0.5 — Reports modülü**: Recharts ile dashboard grafikleri
- [x] **v0.6 — Güvenlik linter (`npm run check`)**
- [x] **v0.7 — API Katmanı**: app/api/ route'ları + lib/data/ soyutlama + auth endpoint'leri
- [ ] **v0.8 — Billing modülü (opsiyonel, Stripe)**
- [ ] **v0.9 — Setup CLI (`npm run setup`)**
- [ ] **v1.0 — Güvenlik Katmanları**: CSP, audit log, security headers, session timeout
- [ ] **v1.1 — Dokümantasyon (TR/EN), örnek video, GitHub yayını**

---

## 9. Açık Kararlar / Notlar

- Bir kullanıcının birden fazla tenant'a üye olması v1'de desteklenmiyor — basitlik için
  bilinçli tercih. İhtiyaç çıkarsa `memberships` join tablosu ile v2'de eklenir.
- Helcim/Stripe seçimi kullanıcıya bırakılacak; `billing` modülü provider-agnostic
  interface (`lib/billing/provider.ts`) ile yazılacak ki değiştirmesi kolay olsun.
- Subdomain bazlı tenant routing (acme.saas.com) v1 kapsamı DIŞINDA — istenirse ayrı bir
  modül olarak `config/tenant.config.ts` üzerinden v1.1'de eklenebilir.
- Form handling: react-hook-form + zod validation önerilir ama framework dışı bağımlılık
  eklememek için şimdilik native form + Server Actions kullanılıyor.
- Component library: shadcn/ui veya el yapımı minimal bileşenler ile devam edilecek.

---

## 10. Tablo İsimlendirme ve Prefix Stratejisi

Tüm framework tabloları `vibe_` prefix'i ile adlandırılır. Bu kararın sebepleri:

1. **Çakışma önleme**: Supabase projesinde başka eklentiler (pg_graphql, pg_stat_statements
   vb.) veya kullanıcının kendi ek tablolarıyla isim çakışmasını önler.
2. **Framework kimliği**: Hangi tabloların bu framework'e ait olduğu net şekilde bellidir.
3. **Profesyonel convention**: Büyük SaaS framework'leri (Django, Laravel, Symfony) benzer
   prefix stratejisi kullanır.

### Prefix Kuralları

| Nesne | Prefix | Örnek |
|-------|--------|-------|
| Tablo | `vibe_` | `vibe_tenants`, `vibe_profiles`, `vibe_leads` |
| Fonksiyon | `vibe_` | `vibe_current_tenant_id()`, `vibe_handle_new_user()` |
| Policy | `vibe_` | `vibe_leads_tenant_isolation` |
| Index | `vibe_` | `vibe_leads_tenant_id_idx` |
| Trigger | `vibe_` | `vibe_leads_set_updated_at` |

### Migration Dosyaları

| Dosya | İçerik | Tablolar |
|-------|--------|----------|
| `0001_core.sql` | Çekirdek (silinemez) | `vibe_tenants`, `vibe_profiles` |
| `0002_leads.sql` | Leads modülü | `vibe_leads` |
| `0003_sales.sql` | Sales modülü | `vibe_deals` |
| `0004_reports.sql` | Reports (okuma amaçlı, kendi tablosu yok) | — |
| `0005_billing.sql` | Billing (opsiyonel) | `vibe_subscriptions` |

### Kod İçinde Kullanım

```ts
// ❌ Yanlış (eski)
const { data } = await supabase.from("leads").select("*");

// ✅ Doğru (yeni)
const { data } = await supabase.from("vibe_leads").select("*");
```

---

## 11. Pazarlama Sayfaları (UI Sections)

Framework'ün hazır gelen pazarlama sayfaları — SSG ile build edilir, SEO dostudur.

### Sayfalar

| Sayfa | Route | Açıklama |
|-------|-------|----------|
| Homepage | `/` | Hero, özellikler, pricing preview, CTA |
| About Us | `/about` | Şirket hikayesi, ekip, değerler, timeline |
| Contact | `/contact` | İletişim formu (Turnstile + honeypot + rate-limit), adres, email |

### Ortak Bileşenler

```
/components/
  marketing-header.tsx    → Logo, nav linkleri (Anasayfa, Hakkımızda, İletişim, Giriş/Kayıt)
  marketing-footer.tsx    → Linkler, sosyal medya, copyright, legal
  feature-card.tsx        → Özellik kartı (ikon, başlık, açıklama)
```

### Güvenlik (Contact Form)

- **Turnstile**: Bot koruması — server-side doğrulama zorunlu.
- **Honeypot**: Görünmez alan — bot doldurursa reddedilir.
- **Rate-limit**: IP başına saatte 3 mesaj.
- **Origin check**: Sadece kendi domaininden gelen POST'lar kabul edilir.

### SEO

- Her sayfa için ayrı `metadata` export (title, description, openGraph).
- Semantic HTML (header, main, footer, section, article).
- Mobile-first responsive design.

---

## 12. Eksik Güvenlik Katmanları (v1.0 hedefi)

### CSP (Content Security Policy)
- `next.config.ts` içinde `Content-Security-Policy` header'ı tanımlanır.
- Turnstile script'lerine izin vermek için `frame-src` ve `script-src` güncellenir.

### Security Headers
- `X-Frame-Options: DENY` — clickjacking saldırılarını engeller.
- `X-Content-Type-Options: nosniff` — MIME type sniffing'i engeller.
- `Strict-Transport-Security: max-age=63072000` — HTTPS zorunluluğu.

### Session Timeout
- 30 dakika inaktivite sonrası otomatik logout.
- Supabase session cookie'si `maxAge` ile kontrol edilir.

### Audit Log (`vibe_audit_logs`)
- Önemli aksiyonlar kaydedilir: login, signup, lead oluşturma, deal stage değişikliği.
- Tablo yapısı: `id`, `tenant_id`, `actor_id`, `action`, `target_type`, `target_id`, `metadata (jsonb)`, `created_at`.
- RLS ile sadece kendi tenant'ının loglarını görebilir.

### Hata Yönetimi
- Production'da stack trace'ler client'a sızdırılmaz.
- API route'larında try/catch ile standardized error response.

### CORS
- API route'larında sadece bilinen origin'lerden gelen isteklere izin verilir.

### SQL Injection
- Supabase JS client zaten parameterized query kullanır — ama raw SQL sorguları
  (migration, fonksiyon) için `format()` veya `quote_literal()` kullanımı dokümante edilir.

---

## 13. Eksik DX / DevOps (v1.0 hedefi)

### Testing
- **Vitest**: Unit testler için. `lib/`, `app/(app)/**/actions.ts` testleri.
- **Playwright**: E2E testler için. Auth akışı, lead CRUD, marketing sayfaları.

### CI/CD (GitHub Actions)
```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run check  # güvenlik linter
      - run: npm run build  # build'in geçtiğini doğrula
```

### Error Monitoring (Sentry — opsiyonel)
- `npm install @sentry/nextjs`
- `sentry.client.config.ts` ve `sentry.server.config.ts` ile yapılandırma.
- Performance monitoring opsiyonel.

### SEO
- `metadata` API ile her sayfada unique title/description.
- `sitemap.ts` — otomatik sitemap oluşturma.
- `robots.txt` — arama motoru yönlendirmeleri.
- Open Graph / Twitter Card etiketleri.

### Accessibility (a11y)
- Semantic HTML: `header`, `main`, `nav`, `section`, `article`, `footer`.
- Focus management: tab order, skip-to-content link.
- ARIA labels: ikon butonlar, form alanları, dinamik içerik.
- Color contrast: WCAG AA (4.5:1 normal metin, 3:1 büyük metin).
- Keyboard navigation: tüm interaktif öğeler klavye ile erişilebilir.

### Responsive Design
- Mobile-first CSS (Tailwind breakpoints: `sm`, `md`, `lg`, `xl`).
- Marketing sayfaları: mobilde tek sütun, tablette 2, desktop'ta 3.
- Dashboard: sidebar'ı mobilde hamburger menüye daralt.

### Loading States
- Skeleton component'ler: `SkeletonTable`, `SkeletonCard`, `SkeletonChart`.
- `loading.tsx` dosyaları her route group için.

### Toast Notifications
- `lib/toast.ts` — basit bir event-based toast sistemi.
- Server action'dan redirect yerine toast mesajı döndürme pattern'i.

### Dark Mode
- `globals.css`'de `@media (prefers-color-scheme: dark)`.
- `next-themes` ile toggle (opsiyonel, v1.1).

---

## 14. Eksik Mimari Detaylar

### Form Handling
- Native HTML form + Server Actions (şimdilik).
- Gelecekte `react-hook-form` + `zod` entegrasyonu opsiyonel modül olarak eklenebilir.
- Client-side validation: HTML5 built-in (`required`, `type="email"`, `pattern`).
- Server-side validation: Server Action içinde manuel kontrol.

### Component Library
- El yapımı minimal component'ler (button, input, card, modal).
- Tailwind CSS ile stil — başka CSS framework'ü yok.
- İleride shadcn/ui entegrasyonu opsiyonel.

### State Management
- React Server Components + URL search params (dashboard filtreler için).
- Client'ta `useState` minimal — sadece interaktif UI parçalarında.
- Server Actions ile mutation → cache revalidation (`revalidatePath` / `revalidateTag`).

### Error Boundaries
- `app/error.tsx` — root level error boundary.
- `app/(app)/error.tsx` — app route group için ayrı error boundary.
- `app/(marketing)/error.tsx` — marketing sayfaları için.

### i18n (Opsiyonel, v1.1)
- Türkçe + İngilizce desteği.
- `lib/i18n/` — basit JSON-based translation loader.
- `(marketing)` sayfalarında `lang` parametresi ile dil değiştirme.
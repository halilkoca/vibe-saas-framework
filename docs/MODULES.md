# Modülleri Yönetme

## Tablo İsimlendirme

Tüm framework tabloları `vibe_` prefix'i ile adlandırılır:
- `vibe_tenants`, `vibe_profiles` — çekirdek
- `vibe_leads` — leads modülü
- `vibe_deals` — sales modülü
- `vibe_subscriptions` — billing modülü (opsiyonel)

Kod içinde de aynı prefix kullanılır:
```ts
// ✅ Doğru
const { data } = await supabase.from("vibe_leads").select("*");
```

Detaylar için `plan.md` Bölüm 10'a bak.

## Veritabanı Soyutlama (lib/data/)

Doğrudan `supabase.from("vibe_*")` çağrıları `lib/data/` altındaki fonksiyonlarda toplanır:

| Dosya | İçerik |
|-------|--------|
| `lib/data/leads.ts` | getAllLeads, createLead, updateLeadStatus, deleteLead, getLeadsCount, getRecentLeads |
| `lib/data/deals.ts` | getAllDeals, createDeal, updateDealStage, getOpenDealCount |
| `lib/data/reports.ts` | getLeadStatusCounts, getDealStageTotals |
| `lib/data/profiles.ts` | getProfile (profile + tenant name) |

Server Component'ler bu fonksiyonları doğrudan çağırır.
Server Actions API route'larını (`/api/...`) çağırır.

## API Route'ları

Tüm mutation işlemleri `app/api/` altındaki Route Handlers üzerinden yapılır:

| Route | Metod | Açıklama |
|-------|-------|----------|
| `/api/leads` | GET | Lead listesi |
| `/api/leads` | POST | Yeni lead |
| `/api/leads/[id]` | PATCH | Status güncelle |
| `/api/leads/[id]` | DELETE | Lead sil |
| `/api/deals` | GET | Deal listesi |
| `/api/deals` | POST | Yeni deal |
| `/api/deals/[id]` | PATCH | Stage güncelle |
| `/api/reports` | GET | Lead/deal istatistikleri |
| `/api/dashboard` | GET | Dashboard özet |
| `/api/auth/login` | POST | Giriş (Turnstile + rate-limit) |
| `/api/auth/signup` | POST | Kayıt (Turnstile + rate-limit) |
| `/api/profile` | GET | Kullanıcı profili |

## Hızlı kapatma (kod silmeden)

`lib/modules.config.ts` içinde ilgili modülü `false` yap:

```ts
export const MODULES = {
  leads: false, // artık nav'da görünmez, route'a girilirse 404
  sales: true,
  reports: true,
  billing: false,
};
```

Bu geri alınabilir — test etmek için idealdir.

## Kalıcı silme

Bir modülü tamamen projeden çıkarmak istiyorsan:

1. **Route'u sil:** `app/(app)/<modul_adi>/` klasörünü sil.
2. **API route'larını sil:** `app/api/<modul_adi>/` klasörünü sil (varsa).
3. **Migration'ı uygulama:** `supabase/migrations/000X_<modul_adi>.sql` dosyasını henüz
   apply etmediysen hiç çalıştırma. Zaten apply ettiysen ve tabloyu da silmek istiyorsan
   yeni bir migration ile `drop table` yaz (var olan migration'ı SİLME — geçmiş migration'lar
   asla değiştirilmez, üstüne yeni migration eklenir).
4. **Nav/menu referanslarını temizle:** `app/(app)/layout.tsx` içindeki menü linklerini
   kontrol et (modül kapalıysa zaten `isModuleEnabled()` ile otomatik gizlenir, ama kod
   tabanını temizlemek istersen elle de kaldırabilirsin).
5. **Bağımlılıkları kontrol et:** Örn. `sales` modülü `leads.id`'ye foreign key ile bağlı
   (nullable). `leads`'i silmeden önce `deals.lead_id` kolonunu da migration ile
   kaldırman ya da nullable bıraman gerekir — aksi halde foreign key hatası alırsın.

## Yeni modül ekleme

1. `supabase/migrations/000X_<modul_adi>.sql` oluştur. Şu pattern'i takip et:
   - `tenant_id uuid not null references public.tenants(id)`
   - `alter table ... enable row level security;`
   - `using (tenant_id = public.current_tenant_id()) with check (...)`
2. `lib/data/<modul_adi>.ts` oluştur — DB sorgularını burada topla.
3. `app/api/<modul_adi>/route.ts` oluştur — API route handler (opsiyonel, mutation gerekmiyorsa).
4. `app/(app)/<modul_adi>/` altında route'ları oluştur (server component + SSR).
5. `lib/modules.config.ts`'e ekle.
6. `npm run check` çalıştırıp RLS'in doğru kurulduğunu doğrula.

## Modül bağımlılık haritası (v1)

```
core (tenants, profiles)  ← her modülün temeli, silinemez
  ├── leads                ← bağımsız
  ├── sales                ← leads'e opsiyonel FK (lead_id nullable)
  ├── reports               ← leads + sales verisini okur, kendi tablosu yok
  └── billing (opsiyonel)   ← core'a bağlı, diğerlerinden bağımsız
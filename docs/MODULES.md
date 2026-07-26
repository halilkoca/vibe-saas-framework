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

Detaylar için `plan.md` Bölüm 9'a bak.

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
2. **Migration'ı uygulama:** `supabase/migrations/000X_<modul_adi>.sql` dosyasını henüz
   apply etmediysen hiç çalıştırma. Zaten apply ettiysen ve tabloyu da silmek istiyorsan
   yeni bir migration ile `drop table` yaz (var olan migration'ı SİLME — geçmiş migration'lar
   asla değiştirilmez, üstüne yeni migration eklenir).
3. **Nav/menu referanslarını temizle:** `app/(app)/layout.tsx` içindeki menü linklerini
   kontrol et (modül kapalıysa zaten `isModuleEnabled()` ile otomatik gizlenir, ama kod
   tabanını temizlemek istersen elle de kaldırabilirsin).
4. **Bağımlılıkları kontrol et:** Örn. `sales` modülü `leads.id`'ye foreign key ile bağlı
   (nullable). `leads`'i silmeden önce `deals.lead_id` kolonunu da migration ile
   kaldırman ya da nullable bıraman gerekir — aksi halde foreign key hatası alırsın.

## Yeni modül ekleme

1. `supabase/migrations/000X_<modul_adi>.sql` oluştur. Şu pattern'i takip et:
   - `tenant_id uuid not null references public.tenants(id)`
   - `alter table ... enable row level security;`
   - `using (tenant_id = public.current_tenant_id()) with check (...)`
2. `app/(app)/<modul_adi>/` altında route'ları oluştur (server component + SSR).
3. `lib/modules.config.ts`'e ekle.
4. `npm run check` çalıştırıp RLS'in doğru kurulduğunu doğrula.

## Modül bağımlılık haritası (v1)

```
core (tenants, profiles)  ← her modülün temeli, silinemez
  ├── leads                ← bağımsız
  ├── sales                ← leads'e opsiyonel FK (lead_id nullable)
  ├── reports               ← leads + sales verisini okur, kendi tablosu yok
  └── billing (opsiyonel)   ← core'a bağlı, diğerlerinden bağımsız
```

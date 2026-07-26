# Güvenlik Kararları — Neden Böyle Yaptık?

Bu döküman kod yazmadan önce okunmalı. Amaç sana "güven bana çalışıyor" demek değil,
her kararın **hangi saldırıyı engellediğini** göstermek. Böylece framework'ü değiştirirken
neyi bozabileceğini bilirsin.

## Tablo İsimlendirme

Tüm framework tabloları `vibe_` prefix'i ile adlandırılır:
- `vibe_tenants`, `vibe_profiles` — çekirdek
- `vibe_leads` — leads modülü
- `vibe_deals` — sales modülü
- `vibe_subscriptions` — billing modülü (opsiyonel)
- `vibe_audit_logs` — güvenlik logları (v0.9)

Bu prefix, framework'e ait tabloları diğer Supabase tablolarından ayırmak ve
çakışmaları önlemek için kullanılır. Tüm RLS policy'leri, index'ler, trigger'lar
ve fonksiyonlar da aynı prefix'i taşır: `vibe_current_tenant_id()`,
`vibe_leads_tenant_isolation`, `vibe_leads_set_updated_at`.

## 1. RLS (Row Level Security) her zaman açık

**Sorun:** Supabase'de RLS kapalıyken herkes `anon` key ile TÜM tabloyu okuyabilir/yazabilir.
Bu key zaten client'ta public olarak durur (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) — yani RLS
kapalıysa veritabanın tamamen açık demektir.

**Çözüm:** Her migration'da tablo (`vibe_` prefix'li) oluşturulduğu anda `enable row level security` satırı
zorunlu (bkz. `npm run check` linter'ı). Policy'ler her zaman `tenant_id = current_tenant_id()`
pattern'ini kullanır — kullanıcı sadece kendi tenant'ının satırlarını görür/değiştirir.

## 2. tenant_id ASLA client'tan gelmez

**Sorun:** Eğer bir form'da `tenant_id` alanı client'tan POST edilirse, kötü niyetli biri
DevTools ile bu değeri değiştirip başka bir tenant'ın verisine yazabilir.

**Çözüm:** `tenant_id` her zaman server-side `current_tenant_id()` fonksiyonu veya
`auth.uid()` üzerinden resolve edilir — hiçbir insert/update client'tan tenant_id parametresi
almaz. RLS'in `with check` kısmı da bunu ikinci bir katman olarak zorunlu kılar.

## 3. service_role key sadece server-only kodda

**Sorun:** `service_role` key tüm RLS'i bypass eder. Client'a sızarsa (yanlışlıkla
`NEXT_PUBLIC_` prefix'i ile kullanılırsa ya da bir client component'te import edilirse)
saldırgan bu key ile TÜM tenant'ların verisine erişebilir.

**Çözüm:** `lib/supabase/server.ts` içinde `createServiceRoleClient()` sadece webhook gibi
kullanıcı isteğinden bağımsız server route'larında kullanılır. `npm run check` bu key'in
"use client" dosyalarında geçip geçmediğini otomatik tarar.

## 4. Cloudflare Turnstile — neden reCAPTCHA değil

Turnstile ücretsiz, gizlilik dostu (kullanıcı takibi yapmaz) ve entegrasyonu basit.
Signup/login/contact formlarında token server-side doğrulanmadan hiçbir mutation çalışmaz
(`lib/turnstile.ts` → `verifyTurnstileToken`). Bu, otomatik bot signup'larını ve
credential-stuffing saldırılarını büyük ölçüde engeller.

## 5. Rate limiting

**Sorun:** Rate-limit olmadan login endpoint'i brute-force saldırısına, signup endpoint'i
spam hesap açmaya açık kalır.

**Çözüm:** `lib/rate-limit.ts` — Upstash Redis varsa onunla, yoksa in-memory fallback ile
IP/action bazlı limit uygular. **Not:** in-memory fallback tek instance için çalışır;
Vercel'de birden fazla serverless instance'a trafik dağılabileceği için production'da
Upstash (ücretsiz tier) önerilir.

## 6. Signup trigger neden DB'de, client'ta değil

Yeni kullanıcı kayıt olduğunda tenant + profile satırı oluşturmak client-side yapılsaydı,
iki request arasında (tenant oluştu ama profile oluşmadı gibi) tutarsız durumlar oluşabilir
ve kullanıcı isteği manipüle ederek kendi tenant_id'sini seçebilirdi. `handle_new_user()`
trigger'ı `security definer` ile tek bir atomik DB işleminde, RLS'i güvenli şekilde bypass
ederek çalışır — client'ın hiçbir kontrolü yoktur.

## Yapmaman gerekenler (özet)

- ❌ RLS'i "test için" kapatıp unutma.
- ❌ `service_role` key'i client component'te ya da `NEXT_PUBLIC_` ile kullanma.
- ❌ `tenant_id`'yi formdan/query param'dan alıp direkt insert etme.
- ❌ Turnstile doğrulamasını client-side'da "başarılı" sayıp server'da tekrar kontrol etmeme.
- ❌ `.env.local` dosyasını git'e commit etme (`.gitignore`'da zaten var, silme).

Her deploy öncesi: `npm run check`

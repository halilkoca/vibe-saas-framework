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

## Katman Mimarisi ve Veri Akışı

```
Browser (kullanıcı)
  │
  ├─ Client Component ── Server Action ── lib/data/* ── Supabase (RLS)
  │   (useActionState)      (use server)    (RLS client)
  │
  └─ Client JS ── fetch(/api/...) ── Route Handler ── lib/data/* ── Supabase (RLS)
                   (external API)    (auth+validation)
```

**Önemli:** Server action'lar asla `/api/` üzerinden fetch etmez. Doğrudan
`lib/data/` fonksiyonlarını çağırırlar. Bu sayede:
1. Supabase session cookie'leri (browser'dan gelen) doğrudan server action'a ulaşır
2. Ekstra HTTP hop olmaz → login/mutation akışı çalışır
3. API route'lar sadece harici istemciler (3. parti, mobil) için kullanılır

### API Katmanı Güvenliği

Tüm `app/api/` route handler'larında şu kontroller uygulanır:
- **Auth kontrolü**: Her endpoint (GET dahil) önce `supabase.auth.getUser()` ile
  kullanıcının oturumunu doğrular. RLS ikinci katmandır; API kendi kontrolünü yapar.
- **Rate limiting**: Mutation endpoint'lerinde IP bazlı rate-limit uygulanır.
- **Input validasyonu**: `parseJSON()` ile güvenli body parse + `sanitizeText()` ile
  kontrol karakteri temizleme + uzunluk sınırı.
- **Genel hata mesajları**: DB hatları client'a gönderilmez, server'a loglanır.

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
API route'larında da aynı kural geçerlidir — `tenant_id` hiçbir API request body'sinde
kabul edilmez.

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

API route'larında Turnstile doğrulaması `app/api/auth/login` ve `app/api/auth/signup`
endpoint'lerinde yapılır — client tarafında "geçti" sayılıp server'da tekrar kontrol edilmez.

## 5. Rate limiting

**Sorun:** Rate-limit olmadan login endpoint'i brute-force saldırısına, signup endpoint'i
spam hesap açmaya açık kalır.

**Çözüm:** `lib/rate-limit.ts` — Upstash Redis varsa onunla, yoksa in-memory fallback ile
IP/action bazlı limit uygular. **Not:** in-memory fallback tek instance için çalışır;
Vercel'de birden fazla serverless instance'a trafik dağılabileceği için production'da
Upstash (ücretsiz tier) önerilir.

**IP tespiti (güvenlik fix):** `lib/get-client-ip.ts`, `X-Forwarded-For` header'ındaki
**en sağdaki** IP'yi alır (proxy'nin eklediği gerçek IP). Client'ın kendi gönderdiği
sol taraftaki IP'ler rate-limit'i bypass etmek için kullanılamaz. Vercel'de
`x-vercel-forwarded-for` header'ı birincil kaynaktır.

Rate-limit şu noktalarda uygulanır:
- **Server action:** login (IP, 5/dk), signup (IP, 3/dk), lead/deal create (user, 30/dk), contact (IP, 3/saat)
- **API route:** login (IP, 5/dk), signup (IP, 3/dk), lead/deal create (IP, 30/dk), contact (IP, 3/saat)

## 6. Signup trigger neden DB'de, client'ta değil

Yeni kullanıcı kayıt olduğunda tenant + profile satırı oluşturmak client-side yapılsaydı,
iki request arasında (tenant oluştu ama profile oluşmadı gibi) tutarsız durumlar oluşabilir
ve kullanıcı isteği manipüle ederek kendi tenant_id'sini seçebilirdi. `handle_new_user()`
trigger'ı `security definer` ile tek bir atomik DB işleminde, RLS'i güvenli şekilde bypass
ederek çalışır — client'ın hiçbir kontrolü yoktur.

## 7. Input validation ve DB CHECK constraints

**Sorun:** Uzunluk sınırı olmayan text kolonlarına isteyen herkes megabaytlarca veri
yazabilir (DB şişmesi, sayfa yavaşlaması, bcrypt işleminin CPU'yu boğması).

**Çözüm (çift katman):**
1. **Server-side (`lib/validation.ts`):** `sanitizeText()` ile kontrol karakterleri temizlenir,
   uzunluk sınırı uygulanır, email format kontrolü yapılır.
2. **DB seviyesi (migration 0004):** `CHECK` constraint'leri ile tüm text kolonlarında
   `char_length` sınırı zorunludur (ör. `full_name` max 100 karakter).

## 8. Security headers (next.config.ts)

Aşağıdaki header'lar tüm isteklere eklenir:

| Header | Değer | Ne işe yarar |
|--------|-------|-------------|
| Content-Security-Policy | default-src 'self'; ... | XSS'yi bloklar (inline script/style kısıtlı) |
| X-Frame-Options | DENY | Clickjacking koruması |
| X-Content-Type-Options | nosniff | MIME type sniffing'i engeller |
| Referrer-Policy | strict-origin-when-cross-origin | Referrer bilgisini sınırlar |
| Permissions-Policy | camera=(), ... | Gereksiz API'leri kapatır |
| Strict-Transport-Security | max-age=63072000; ... | Sadece production'da, HTTP'yi reddeder |

CSP özellikle şunlara izin verir:
- Turnstile: `challenges.cloudflare.com` (script + frame)
- Supabase: `*.supabase.co` (connect + websocket realtime)

## 9. Security definer fonksiyon erişimi kısıtlama

**Sorun:** `vibe_current_tenant_id()` gibi `security definer` fonksiyonlar varsayılan olarak
public/anon tarafından da çağrılabilir. Bunlar RLS policy'leri içinde kullanılsa da
doğrudan çağrılmaları gereksiz yere bilgi sızdırabilir.

**Çözüm (migration 0004):** `REVOKE EXECUTE ON FUNCTION ... FROM public, anon` ile
sadece `authenticated` rolünün çağırmasına izin verilir. Trigger fonksiyonları
(`vibe_handle_new_user`) trigger context'inde çalıştığı için bu kısıtlamadan etkilenmez.

## Yapmaman gerekenler (özet)

- ❌ RLS'i "test için" kapatıp unutma.
- ❌ `service_role` key'i client component'te ya da `NEXT_PUBLIC_` ile kullanma.
- ❌ `tenant_id`'yi formdan/query param'dan alıp direkt insert etme.
- ❌ Turnstile doğrulamasını client-side'da "başarılı" sayıp server'da tekrar kontrol etmeme.
- ❌ Server action'larda `/api/`'ye fetch yapma (cookie propagation çalışmaz).
- ❌ API route GET handler'larında auth kontrolünü atlama (RLS yeter sanma).
- ❌ `.env.local` dosyasını git'e commit etme (`.gitignore`'da zaten var, silme).
- ❌ `dangerouslySetInnerHTML` kullanma (XSS kapısı açar) — React JSX yeterli.

Her deploy öncesi: `npm run check`
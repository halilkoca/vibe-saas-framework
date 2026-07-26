# VibeSaaS Framework

Kod güvenliği bilgisi olmayan geliştiriciler ("vibe coder"lar) için hazır, güvenli-varsayılanlı
Next.js + Supabase multi-tenant SaaS iskeleti.

**Neden bu framework?**
AI ile hızlı kod yazan ama backend/auth/RLS mimarisine hakim olmayan geliştiriciler genelde
şu hatalardan birini yapıyor: RLS'siz tablo, client-side'da tenant_id set etme, service_role
key'i frontend'e sızdırma, rate-limit'siz form, captcha'sız signup. Bu framework bu hataları
**mimari olarak imkansız** hale getirmeyi hedefliyor.

Detaylı mimari ve yol haritası için → [`plan.md`](./plan.md)
Güvenlik kararlarının "neden"i için → [`docs/SECURITY.md`](./docs/SECURITY.md)
Modül ekleme/silme rehberi → [`docs/MODULES.md`](./docs/MODULES.md)

## Hızlı Başlangıç

```bash
npm install
cp .env.example .env.local   # Supabase + Turnstile key'lerini gir
npm run supabase:migrate     # RLS'li tabloları oluştur
npm run dev
```

## Doğrulanmış durum

Bu iskelet gerçekten `npm install` + `npx next build` ile derlendi ve `npx next dev` ile
ayağa kaldırılıp test edildi:

- `/` → 200 (SSG landing sayfası)
- `/login`, `/signup` → 200 (auth formları, Turnstile + server action bağlı)
- `/dashboard` → oturumsuz istek **307 redirect** ile `/login`'e yönleniyor (proxy.ts koruması çalışıyor)
- `npm run check` → RLS/secret linter'ı temiz sonuç veriyor

Next.js 16'da `middleware.ts` deprecated olduğu için bu framework `proxy.ts` +
`export async function proxy()` convention'ını kullanıyor.

## Stack

- **Next.js 15** (App Router, SSR + SSG karışık)
- **Supabase** (Postgres + Auth + Row Level Security)
- **Cloudflare Turnstile** (captcha)
- **Tailwind CSS**
- Modüler yapı: `lib/modules.config.ts` üzerinden istediğin modülü kapat/aç

## Modüller

| Modül | Açıklama | Varsayılan |
|---|---|---|
| `leads` | Lead/müşteri adayı takibi | açık |
| `sales` | Satış pipeline'ı | açık |
| `reports` | Otomatik grafik/rapor | açık |
| `billing` | Stripe abonelik entegrasyonu | kapalı |

Detaylar için `docs/MODULES.md`.

## Lisans

MIT — özgürce kullan, fork'la, değiştir.

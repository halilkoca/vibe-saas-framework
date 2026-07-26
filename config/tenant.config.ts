// Bu framework v1'de tek strateji kullanıyor: path-based, tek domain üzerinden
// (ör. app.senin-saas.com/dashboard), tenant kullanıcının profiles.tenant_id'sinden
// resolve ediliyor — URL'de tenant bilgisi YOK.
//
// Subdomain bazlı tenant (acme.senin-saas.com) istersen: middleware.ts içinde
// `request.headers.get('host')` üzerinden subdomain'i parse edip bir cookie/header'a
// yazman, sonra server client'ların bunu current_tenant_id() yerine kullanması gerekir.
// Bu v1 kapsamı dışında bırakıldı (bkz. plan.md bölüm 8) — ekleyeceksen bu dosyaya
// yeni bir `resolveTenantFromHost()` fonksiyonu ekleyip middleware'e bağla.

export const TENANT_STRATEGY = "profile" as const; // "profile" | "subdomain" (henüz yok)

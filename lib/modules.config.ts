// Hangi modüllerin aktif olduğunu buradan yönet.
// `false` yapmak: ilgili nav linkini ve route'u gizler (route içindeki
// layout `notFound()` döner) — kodu silmeden hızlıca kapatmanı sağlar.
//
// Gerçekten silmek istersen (repo'yu temizlemek için):
//   1. Bu dosyadan ilgili satırı sil
//   2. app/(app)/<modul> klasörünü sil
//   3. supabase/migrations/ içindeki o modüle ait migration'ı uygulama
// Detaylar: docs/MODULES.md

export const MODULES = {
  leads: true,
  sales: true,
  reports: true,
  billing: false,
} as const;

export type ModuleName = keyof typeof MODULES;

export function isModuleEnabled(name: ModuleName): boolean {
  return MODULES[name];
}

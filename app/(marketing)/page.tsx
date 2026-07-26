import Link from "next/link";
import type { Metadata } from "next";
import { FeatureCard } from "@/components/feature-card";

// Bu sayfa varsayılan olarak statik üretilir (SSG) — dinamik veri çekmediği
// için Next.js otomatik olarak build zamanında pre-render eder.

export const metadata: Metadata = {
  title: "VibeSaaS — Lead ve Satış Takibi",
  description:
    "Küçük işletmeniz için lead ve satış takibi. Kod bilmeyen vibe coder'lar için güvenli-varsayılanlarla hazırlanmış SaaS iskeleti.",
  openGraph: {
    title: "VibeSaaS — Lead ve Satış Takibi",
    description:
      "Küçük işletmeniz için lead ve satış takibi. Kod bilmeyen vibe coder'lar için güvenli-varsayılanlarla hazırlanmış SaaS iskeleti.",
  },
};

const FEATURES = [
  {
    icon: "📋",
    title: "Lead Yönetimi",
    description:
      "Müşteri adaylarını topla, durumlarını takip et (yeni, iletişimde, kazanıldı, kayıp). Her lead için iletişim bilgilerini ve notları sakla.",
  },
  {
    icon: "💰",
    title: "Satış Pipeline",
    description:
      "Fırsatları aşamalara ayır: ön görüşme, teklif, pazarlık, kazanıldı/kayıp. Her aşamadaki toplam fırsat tutarını gör.",
  },
  {
    icon: "📊",
    title: "Raporlar",
    description:
      "Lead ve satış verilerinden otomatik grafikler oluştur. Durum bazında lead dağılımı, aşama bazında satış tutarı.",
  },
  {
    icon: "🔒",
    title: "Güvenli Varsayılanlar",
    description:
      "RLS her tabloda açık gelir. Turnstile captcha, rate-limit, honeypot korumaları baştan aktiftir. Tenant izolasyonu otomatik.",
  },
  {
    icon: "👥",
    title: "Takım Yönetimi",
    description:
      "Takım arkadaşlarını davet et, rollerini belirle (owner, admin, member). Herkes kendi tenant'ının verisini görür.",
  },
  {
    icon: "🚀",
    title: "Hazır Altyapı",
    description:
      "Next.js 15 + Supabase ile çalışır. Auth, migration, RLS, captcha, rate-limit hepsi hazır. Tek komutla başlat.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6">
          Küçük işletmen için
          <br />
          <span className="text-accent">lead ve satış takibi</span>
        </h1>
        <p className="text-lg text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
          Müşteri adaylarını topla, satış sürecini takip et, raporları tek panelden gör.
          Kod bilmene gerek yok — güvenlik en baştan ayarlı.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-block px-8 py-3 rounded-lg bg-ink text-white font-medium hover:opacity-90 transition text-base"
          >
            Ücretsiz hesap oluştur
          </Link>
          <Link
            href="/about"
            className="inline-block px-8 py-3 rounded-lg border border-border text-ink font-medium hover:bg-black/5 transition text-base"
          >
            Daha fazla bilgi
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold tracking-tight mb-3">
            İhtiyacın olan her şey
          </h2>
          <p className="text-muted text-sm">
            Lead yönetiminden satış raporlarına, takım işbirliğinden güvenliğe kadar.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="bg-ink text-white py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">
            Basit ve herkese uygun fiyatlandırma
          </h2>
          <p className="text-white/70 mb-10 max-w-xl mx-auto">
            Küçük işletmeler için başlangıç paketiyle başla, büyüdükçe genişlet.
            İlk 30 gün ücretsiz deneme.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <h3 className="text-sm font-semibold mb-2">Başlangıç</h3>
              <p className="text-3xl font-semibold mb-1">
                ₺0<span className="text-sm font-normal text-white/60">/ay</span>
              </p>
              <p className="text-xs text-white/60 mb-4">1 kullanıcı, temel özellikler</p>
              <ul className="text-xs text-white/70 space-y-1.5">
                <li>✓ 50 lead limiti</li>
                <li>✓ 10 fırsat limiti</li>
                <li>✓ Temel raporlar</li>
              </ul>
            </div>
            <div className="bg-white/10 rounded-xl p-6 border border-accent/50 relative">
              <span className="absolute -top-2.5 right-4 bg-accent text-white text-xs px-2 py-0.5 rounded-full">
                Popüler
              </span>
              <h3 className="text-sm font-semibold mb-2">Profesyonel</h3>
              <p className="text-3xl font-semibold mb-1">
                ₺299<span className="text-sm font-normal text-white/60">/ay</span>
              </p>
              <p className="text-xs text-white/60 mb-4">5 kullanıcı, tüm özellikler</p>
              <ul className="text-xs text-white/70 space-y-1.5">
                <li>✓ Sınırsız lead</li>
                <li>✓ Sınırsız fırsat</li>
                <li>✓ Gelişmiş raporlar</li>
                <li>✓ Takım yönetimi</li>
              </ul>
            </div>
            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <h3 className="text-sm font-semibold mb-2">Kurumsal</h3>
              <p className="text-3xl font-semibold mb-1">
                ₺999<span className="text-sm font-normal text-white/60">/ay</span>
              </p>
              <p className="text-xs text-white/60 mb-4">Sınırsız kullanıcı</p>
              <ul className="text-xs text-white/70 space-y-1.5">
                <li>✓ Sınırsız her şey</li>
                <li>✓ Özel entegrasyonlar</li>
                <li>✓ Öncelikli destek</li>
                <li>✓ API erişimi</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-2xl font-semibold tracking-tight mb-4">
          Hemen başlamaya ne dersin?
        </h2>
        <p className="text-muted mb-8">
          Ücretsiz hesap oluştur, 30 gün boyunca tüm özellikleri dene.
          Kredi kartı gerekmez.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-3 rounded-lg bg-ink text-white font-medium hover:opacity-90 transition text-base"
        >
          Ücretsiz başla
        </Link>
      </section>
    </>
  );
}
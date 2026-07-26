import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımızda — VibeSaaS",
  description:
    "VibeSaaS, kod bilmeyen girişimciler için güvenli-varsayılanlarla hazırlanmış bir SaaS framework'üdür. Misyonumuz, herkesin güvenli bir şekilde SaaS ürünü çıkarabilmesini sağlamak.",
  openGraph: {
    title: "Hakkımızda — VibeSaaS",
    description:
      "VibeSaaS, kod bilmeyen girişimciler için güvenli-varsayılanlarla hazırlanmış bir SaaS framework'üdür.",
  },
};

const TIMELINE = [
  {
    year: "2025",
    title: "Fikir",
    description:
      "Vibe coder'ların (AI ile kod yazan, backend/auth/RLS kavramlarına hakim olmayan) güvenli bir şekilde production'a çıkabilmesi için bir framework ihtiyacı doğdu.",
  },
  {
    year: "2026 Q1",
    title: "İlk Tohum",
    description:
      "Next.js + Supabase ile çekirdek yapı oluşturuldu. Auth, tenant izolasyonu ve RLS pattern'i belirlendi. GitHub'da açık kaynak olarak yayınlandı.",
  },
  {
    year: "2026 Q2",
    title: "Modüler Genişleme",
    description:
      "Leads, sales, reports modülleri eklendi. Turnstile captcha, rate-limit, güvenlik linter'ı geliştirildi. Modüler mimari sayesinde her modül bağımsızca açılıp kapatılabiliyor.",
  },
  {
    year: "2026 Q3",
    title: "v1.0 Çıkışı",
    description:
      "Pazarlama sayfaları, billing modülü, setup CLI, dokümantasyon (TR/EN) ile birlikte v1.0 sürümü yayında. Hedef: vibe coder'ların güvenle kullanabileceği tek framework.",
  },
];

const VALUES = [
  {
    icon: "🔒",
    title: "Güvenlik Önce Gelir",
    description:
      "RLS her tabloda varsayılan açık gelir. Turnstile, rate-limit, honeypot — hiçbiri opsiyonel değil, baştan aktiftir.",
  },
  {
    icon: "🧩",
    title: "Modüler ve Silinebilir",
    description:
      "Her modül bağımsızdır. İhtiyacın olmayanı tek satırla kapat, gerçekten silmek istersen üç adımda temizle. Diğer modüller etkilenmez.",
  },
  {
    icon: "🎯",
    title: "Vibe Coder Odaklı",
    description:
      "Hedef kitle: AI ile kod yazan ama güvenlik konusunda derin bilgisi olmayan geliştiriciler. Her karar bu kullanıcı profiline göre alınır.",
  },
  {
    icon: "📖",
    title: "Şeffaf Dokümantasyon",
    description:
      "Sadece 'nasıl' değil, 'neden böyle' de anlatılır. Her güvenlik kararının hangi saldırıyı engellediği açıklanır. Kopyala-yapıştır yapan bile okumalıdır.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight mb-6">
          VibeSaaS Hakkında
        </h1>
        <p className="text-lg text-muted leading-relaxed">
          VibeSaaS, kod güvenliği bilgisi olmayan vibe coder'ların production'a güvenli
          çıkabilmesi için hazırlanmış, modüler bir Next.js + Supabase SaaS starter
          kitidir. Felsefemiz: <strong>Güvenli defaults.</strong> Yanlış yapması ZOR,
          doğru yapması KOLAY olsun.
        </p>
      </section>

      {/* Mission Section */}
      <section className="bg-white border-y border-border py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-semibold tracking-tight mb-6 text-center">
            Misyonumuz
          </h2>
          <p className="text-muted leading-relaxed text-center max-w-2xl mx-auto">
            SaaS ürünü çıkarmak isteyen herkes, backend güvenliği konusunda uzman olmasa
            bile, ürününü güvenle yayınlayabilmelidir. Biz, bu güveni sağlayan altyapıyı
            hazırlıyoruz — vibe coder'lar yaratmaya odaklansın diye.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-semibold tracking-tight mb-10 text-center">
          Değerlerimiz
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="bg-white border border-border rounded-xl p-6"
            >
              <div className="text-2xl mb-3" aria-hidden="true">
                {value.icon}
              </div>
              <h3 className="text-sm font-semibold mb-2">{value.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline Section */}
      <section className="bg-white border-y border-border py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-semibold tracking-tight mb-10 text-center">
            Zaman Çizelgesi
          </h2>
          <div className="space-y-8">
            {TIMELINE.map((item, index) => (
              <div key={item.year} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-accent mt-1.5" />
                  {index < TIMELINE.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <span className="text-xs font-semibold text-accent">{item.year}</span>
                  <h3 className="text-base font-semibold mt-1">{item.title}</h3>
                  <p className="text-sm text-muted mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
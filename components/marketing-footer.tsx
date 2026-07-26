import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="font-semibold text-sm">VibeSaaS</span>
            <p className="text-sm text-muted mt-2 max-w-xs">
              Küçük işletmeler için lead ve satış takibi. Kod bilmeyen vibe coder'lar
              için güvenli-varsayılanlarla hazırlanmış SaaS iskeleti.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3">Sayfalar</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/" className="hover:text-ink transition">
                  Anasayfa
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-ink transition">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-ink transition">
                  İletişim
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-ink transition">
                  Giriş yap
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-ink transition">
                  Kayıt ol
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3">Yasal</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <span className="hover:text-ink transition cursor-not-allowed">
                  Gizlilik Politikası
                </span>
              </li>
              <li>
                <span className="hover:text-ink transition cursor-not-allowed">
                  Kullanım Koşulları
                </span>
              </li>
              <li>
                <span className="hover:text-ink transition cursor-not-allowed">
                  Çerez Politikası
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} VibeSaaS. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}
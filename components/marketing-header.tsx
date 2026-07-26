import Link from "next/link";

export function MarketingHeader() {
  return (
    <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          VibeSaaS
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-muted hover:text-ink transition">
            Anasayfa
          </Link>
          <Link href="/about" className="text-muted hover:text-ink transition">
            Hakkımızda
          </Link>
          <Link href="/contact" className="text-muted hover:text-ink transition">
            İletişim
          </Link>
          <div className="flex gap-3 ml-4">
            <Link
              href="/login"
              className="px-4 py-2 font-medium text-muted hover:text-ink transition"
            >
              Giriş yap
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-lg bg-ink text-white font-medium hover:opacity-90 transition"
            >
              Ücretsiz başla
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
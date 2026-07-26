"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type SignupState } from "./actions";
import { TurnstileWidget } from "../turnstile-widget";

const initialState: SignupState = { error: null, success: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);
  const turnstileResetKey = state?.error ? Date.now() : undefined;

  if (state?.success) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">E-postanı kontrol et</h1>
        <p className="text-sm text-muted">{state.success}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Hesap oluştur</h1>
      <p className="text-sm text-muted mb-6">Ücretsiz başla, kredi kartı gerekmez.</p>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium mb-1.5">
            Ad Soyad
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="Ahmet Yılmaz"
          />
        </div>

        <div>
          <label htmlFor="company_name" className="block text-sm font-medium mb-1.5">
            Şirket adı
          </label>
          <input
            id="company_name"
            name="company_name"
            type="text"
            required
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="Örnek A.Ş."
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            E-posta
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="ornek@sirket.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">
            Şifre
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="En az 8 karakter"
          />
        </div>

        <TurnstileWidget resetKey={turnstileResetKey} />

        {state?.error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-ink text-white text-sm font-medium py-2.5 hover:opacity-90 disabled:opacity-50 transition"
        >
          {pending ? "Hesap oluşturuluyor..." : "Hesap oluştur"}
        </button>
      </form>

      <p className="text-sm text-muted mt-6 text-center">
        Zaten hesabın var mı?{" "}
        <Link href="/login" className="text-accent font-medium">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}

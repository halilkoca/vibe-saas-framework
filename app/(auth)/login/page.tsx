"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type LoginState } from "./actions";
import { TurnstileWidget } from "../turnstile-widget";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Giriş yap</h1>
      <p className="text-sm text-muted mb-6">Hesabınla devam et.</p>

      <form action={formAction} className="space-y-4">
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
            autoComplete="current-password"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent"
            placeholder="••••••••"
          />
        </div>

        <TurnstileWidget />

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
          {pending ? "Giriş yapılıyor..." : "Giriş yap"}
        </button>
      </form>

      <p className="text-sm text-muted mt-6 text-center">
        Hesabın yok mu?{" "}
        <Link href="/signup" className="text-accent font-medium">
          Kayıt ol
        </Link>
      </p>
    </div>
  );
}

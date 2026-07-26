"use client";

import type { Metadata } from "next";
import { useActionState, useRef, useEffect } from "react";
import { sendContactMessage, type ContactState } from "./actions";

// Client component — Turnstile widget'ı ve form interaksiyonu için.

const metadata: Metadata = {
  title: "İletişim — VibeSaaS",
  description:
    "VibeSaaS ekibine ulaşın. Sorularınız, önerileriniz veya işbirliği fikirleriniz için bize yazın.",
};

const initialState: ContactState = { error: null, success: null };

export default function ContactPage() {
  const [state, formAction, pending] = useActionState(
    sendContactMessage,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <>
      {/* Hero Section */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight mb-6">İletişim</h1>
        <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
          Soruların mı var? Önerin mi var? Yoksa sadece merhaba mı demek istiyorsun?
          Aşağıdaki formu doldur, en kısa sürede dönüş yapalım.
        </p>
      </section>

      {/* Contact Form */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <form
          ref={formRef}
          action={formAction}
          className="bg-white border border-border rounded-xl p-8 space-y-5"
        >
          {/* Honeypot — görünmez, sadece botlar görür */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-ink mb-1.5"
            >
              İsim *
            </label>
            <input
              id="name"
              name="name"
              required
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-accent"
              placeholder="Adın ve soyadın"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-ink mb-1.5"
            >
              E-posta *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-accent"
              placeholder="ornek@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-ink mb-1.5"
            >
              Mesaj *
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              maxLength={2000}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-accent resize-y"
              placeholder="En az 10 karakter... (max 2000)"
            />
          </div>

          {/* Turnstile Widget — public key ile client'ta render edilir */}
          <div
            className="cf-turnstile"
            data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
            data-theme="light"
          />

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-ink text-white text-sm font-medium px-6 py-2.5 hover:opacity-90 disabled:opacity-50 transition"
          >
            {pending ? "Gönderiliyor..." : "Mesajı Gönder"}
          </button>

          {state?.error && (
            <p role="alert" className="text-sm text-red-600 text-center">
              {state.error}
            </p>
          )}

          {state?.success && (
            <p role="status" className="text-sm text-green-600 text-center">
              {state.success}
            </p>
          )}
        </form>
      </section>

      {/* Turnstile script'i — Cloudflare'den yüklenir */}
      <script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
    </>
  );
}
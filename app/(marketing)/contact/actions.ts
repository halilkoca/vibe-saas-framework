"use server";

import { verifyTurnstileToken } from "@/lib/turnstile";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export type ContactState = { error: string | null; success?: string | null };

export async function sendContactMessage(
  _prevState: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
  const honeypot = String(formData.get("website") ?? "");

  // Honeypot: görünmez alan — bot doldurursa reddet.
  if (honeypot) {
    // Bot'a "başarılı" mesajı verip sessizce reddet (böylece bot formun
    // çalıştığını sanıp spam'a devam etmez).
    return { error: null, success: "Mesajınız alındı. En kısa sürede dönüş yapacağız." };
  }

  if (!name || !email || !message) {
    return { error: "İsim, e-posta ve mesaj alanları zorunlu." };
  }

  if (!email.includes("@") || !email.includes(".")) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }

  if (message.length < 10) {
    return { error: "Mesaj en az 10 karakter olmalı." };
  }

  if (message.length > 2000) {
    return { error: "Mesaj çok uzun (max 2000 karakter)." };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? "unknown";

  // Rate limit: IP başına saatte 3 mesaj — spam'i engeller.
  const { success: rateOk } = await rateLimit(ip, "contact", 3, 3600_000);
  if (!rateOk) {
    return {
      error: "Çok fazla mesaj gönderdiniz. Lütfen bir saat sonra tekrar deneyin.",
    };
  }

  // Turnstile doğrulaması — bot koruması.
  const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
  if (!captchaOk) {
    return { error: "Doğrulama başarısız. Lütfen sayfayı yenileyip tekrar deneyin." };
  }

  // Bu noktada mesajı DB'ye kaydedebilir veya e-posta ile yöneticiye iletebilirsin.
  // Şimdilik sadece başarılı mesajı döndürüyoruz.
  // İleride: `await supabase.from("vibe_contact_messages").insert({...})`
  // veya `await sendEmail({ to: "admin@vibesaas.com", subject: name, body: message })`

  console.log("[Contact]", { name, email, message, ip });

  return {
    error: null,
    success: "Mesajınız alındı. En kısa sürede dönüş yapacağız.",
  };
}
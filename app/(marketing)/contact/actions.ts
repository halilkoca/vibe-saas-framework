"use server";

import { verifyTurnstileToken } from "@/lib/turnstile";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/get-client-ip";
import { sanitizeText, isValidEmail, LIMITS } from "@/lib/validation";

export type ContactState = { error: string | null; success?: string | null };

export async function sendContactMessage(
  _prevState: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name = sanitizeText(String(formData.get("name") ?? ""), LIMITS.fullName.max);
  const email = sanitizeText(String(formData.get("email") ?? ""), LIMITS.email.max);
  const message = sanitizeText(String(formData.get("message") ?? ""), LIMITS.message.max);
  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
  const honeypot = String(formData.get("website") ?? "");

  // Honeypot: görünmez alan — bot doldurursa reddet.
  if (honeypot) {
    return { error: null, success: "Mesajınız alındı. En kısa sürede dönüş yapacağız." };
  }

  if (!name || !email || !message) {
    return { error: "İsim, e-posta ve mesaj alanları zorunlu." };
  }

  if (!isValidEmail(email)) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }

  if (message.length < LIMITS.message.min) {
    return { error: "Mesaj en az 10 karakter olmalı." };
  }

  const headerList = await headers();
  const ip = getClientIp(headerList);

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

  // Mesaj alındı — ileride DB'ye kaydet veya e-posta ile ilet.
  // console.log("[Contact]", { name, email, message, ip });

  return {
    error: null,
    success: "Mesajınız alındı. En kısa sürede dönüş yapacağız.",
  };
}
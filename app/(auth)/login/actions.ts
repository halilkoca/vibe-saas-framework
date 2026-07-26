"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/get-client-ip";
import { sanitizeText, isValidEmail, LIMITS } from "@/lib/validation";

export type LoginState = { error: string | null };

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const headerList = await headers();
  const ip = getClientIp(headerList);

  const email = sanitizeText(String(formData.get("email") ?? ""), LIMITS.email.max);
  const password = String(formData.get("password") ?? "");
  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");

  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli." };
  }

  if (!isValidEmail(email)) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }

  // Rate limit: aynı IP'den dakikada 5 login denemesi
  const { success: rateOk } = await rateLimit(ip, "login", 5, 60_000);
  if (!rateOk) {
    return { error: "Çok fazla deneme yaptınız. Bir dakika sonra tekrar deneyin." };
  }

  // Captcha doğrulaması
  const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
  if (!captchaOk) {
    return { error: "Doğrulama başarısız. Sayfayı yenileyip tekrar deneyin." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-posta veya şifre hatalı." };
  }

  redirect("/dashboard");
}
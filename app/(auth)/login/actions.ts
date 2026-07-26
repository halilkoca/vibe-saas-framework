"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type LoginState = { error: string | null };

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");

  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli." };
  }

  // Rate limit: aynı IP'den dakikada 5 login denemesi — brute-force'u engeller.
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? "unknown";
  const { success } = await rateLimit(ip, "login", 5, 60_000);
  if (!success) {
    return { error: "Çok fazla deneme yaptınız. Bir dakika sonra tekrar deneyin." };
  }

  // Captcha doğrulaması olmadan hiçbir auth işlemi yapılmaz.
  const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
  if (!captchaOk) {
    return { error: "Doğrulama başarısız. Sayfayı yenileyip tekrar deneyin." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Kullanıcıya "yanlış şifre" mi "hesap yok" mu olduğunu ayrı ayrı söylemiyoruz —
    // bu bilgi hesap keşfi (account enumeration) saldırısına zemin hazırlar.
    return { error: "E-posta veya şifre hatalı." };
  }

  redirect("/dashboard");
  return { error: null };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/get-client-ip";
import { sanitizeText, isValidEmail, isValidPassword, LIMITS } from "@/lib/validation";

export type SignupState = { error: string | null; success?: string | null };

export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const headerList = await headers();
  const ip = getClientIp(headerList);

  const fullName = sanitizeText(String(formData.get("full_name") ?? ""), LIMITS.fullName.max);
  const companyName = sanitizeText(String(formData.get("company_name") ?? ""), LIMITS.companyName.max);
  const email = sanitizeText(String(formData.get("email") ?? ""), LIMITS.email.max);
  const password = String(formData.get("password") ?? "");
  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");

  if (!fullName || !companyName || !email || !password) {
    return { error: "Tüm alanları doldurman gerekiyor." };
  }

  if (!isValidEmail(email)) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }

  if (!isValidPassword(password)) {
    return { error: "Şifre en az 8, en fazla 72 karakter olmalı." };
  }

  // Signup spam'ini engelle
  const { success: rateOk } = await rateLimit(ip, "signup", 3, 60_000);
  if (!rateOk) {
    return { error: "Çok fazla kayıt denemesi yapıldı. Bir dakika sonra tekrar deneyin." };
  }

  const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
  if (!captchaOk) {
    return { error: "Doğrulama başarısız. Sayfayı yenileyip tekrar deneyin." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company_name: companyName,
      },
    },
  });

  if (error) {
    return { error: "Kayıt oluşturulamadı. E-posta zaten kullanılıyor olabilir." };
  }

  return {
    error: null,
    success: "Hesabın oluşturuldu! E-postana gelen doğrulama linkine tıkla.",
  };
}
"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export type SignupState = { error: string | null; success?: string | null };

export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");

  if (!fullName || !companyName || !email || !password) {
    return { error: "Tüm alanları doldurman gerekiyor." };
  }

  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalı." };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? "unknown";

  // Signup spam'ini engellemek için IP başına daha sıkı limit.
  const { success } = await rateLimit(ip, "signup", 3, 60_000);
  if (!success) {
    return { error: "Çok fazla kayıt denemesi yapıldı. Bir dakika sonra tekrar deneyin." };
  }

  const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
  if (!captchaOk) {
    return { error: "Doğrulama başarısız. Sayfayı yenileyip tekrar deneyin." };
  }

  const supabase = await createClient();

  // ÖNEMLİ: tenant_id burada YOK. Kullanıcı meta verisi sadece isim/şirket adı taşır.
  // Gerçek tenant + profile satırı 0001_core.sql'deki handle_new_user() trigger'ında
  // DB tarafında, security definer ile oluşturulur — client asla tenant_id belirlemez.
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

// API route for signup — POST (full_name + company_name + email + password + Turnstile + rate-limit).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/get-client-ip";
import { sanitizeText, isValidEmail, isValidPassword, parseJSON, LIMITS } from "@/lib/validation";

export async function POST(request: Request) {
  const headerList = await headers();
  const ip = getClientIp(headerList);

  let body: Record<string, unknown>;
  {
    const parsed = parseJSON(await request.text());
    if (!parsed.ok) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    body = parsed.data as Record<string, unknown>;
  }

  const fullName = sanitizeText(String(body.full_name ?? ""), LIMITS.fullName.max);
  const companyName = sanitizeText(String(body.company_name ?? ""), LIMITS.companyName.max);
  const email = sanitizeText(String(body.email ?? ""), LIMITS.email.max);
  const password = String(body.password ?? "");
  const turnstileToken = String(body.turnstileToken ?? "");

  if (!fullName || !companyName || !email || !password) {
    return NextResponse.json(
      { error: "Tüm alanları doldurman gerekiyor." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }

  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: "Şifre en az 8, en fazla 72 karakter olmalı." },
      { status: 400 }
    );
  }

  // Signup spam'ini engelle
  const { success: rateOk } = await rateLimit(ip, "signup", 3, 60_000);
  if (!rateOk) {
    return NextResponse.json(
      { error: "Çok fazla kayıt denemesi yapıldı. Bir dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
  if (!captchaOk) {
    return NextResponse.json(
      { error: "Doğrulama başarısız. Sayfayı yenileyip tekrar deneyin." },
      { status: 400 }
    );
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
    return NextResponse.json(
      { error: "Kayıt oluşturulamadı. E-posta zaten kullanılıyor olabilir." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Hesabın oluşturuldu! E-postana gelen doğrulama linkine tıkla.",
  });
}
// API route for login — POST (email + password + Turnstile + rate-limit).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/get-client-ip";
import { sanitizeText, isValidEmail, parseJSON, LIMITS } from "@/lib/validation";

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

  const email = sanitizeText(String(body.email ?? ""), LIMITS.email.max);
  const password = String(body.password ?? "");
  const turnstileToken = String(body.turnstileToken ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "E-posta ve şifre gerekli." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }

  // Rate limit: aynı IP'den dakikada 5 login denemesi
  const { success: rateOk } = await rateLimit(ip, "login", 5, 60_000);
  if (!rateOk) {
    return NextResponse.json(
      { error: "Çok fazla deneme yaptınız. Bir dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  // Captcha doğrulaması
  const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
  if (!captchaOk) {
    return NextResponse.json(
      { error: "Doğrulama başarısız. Sayfayı yenileyip tekrar deneyin." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json(
      { error: "E-posta veya şifre hatalı." },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true });
}
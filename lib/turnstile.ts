// Cloudflare Turnstile server-side doğrulama.
// Client'tan gelen token'a GÜVENME — her zaman server'da bu fonksiyonla doğrula.
// Signup, login, contact form gibi tüm public mutation'larda çağrılmalı.

export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  if (!token) return false;

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Secret tanımlı değilse dev ortamında bile sessizce geçme — hata fırlat
    // ki kullanıcı .env'i unuttuğunu hemen fark etsin.
    throw new Error(
      "TURNSTILE_SECRET_KEY tanımlı değil. .env.local dosyanı kontrol et."
    );
  }

  const formData = new URLSearchParams();
  formData.append("secret", secret);
  formData.append("response", token);
  if (remoteIp) formData.append("remoteip", remoteIp);

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: formData }
  );

  const data = await res.json();
  return data.success === true;
}

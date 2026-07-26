// Basit rate limiter. Upstash Redis env değişkenleri tanımlıysa onu kullanır
// (production için önerilir — serverless'te instance'lar arası paylaşılır).
// Tanımlı değilse in-memory Map'e düşer — tek instance/dev ortamı için yeterli,
// ama Vercel'de birden fazla instance'a yayılan trafikte güvenilir DEĞİLDİR.
// Production'a çıkmadan önce Upstash key'lerini eklemen önerilir (ücretsiz tier var).

type RateLimitResult = { success: boolean; remaining: number };

const memoryStore = new Map<string, { count: number; resetAt: number }>();

async function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count };
}

async function upstashRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

  const windowSec = Math.ceil(windowMs / 1000);
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, windowSec.toString(), "NX"],
    ]),
  });

  const [incrResult] = await res.json();
  const count = incrResult.result as number;

  return { success: count <= limit, remaining: Math.max(0, limit - count) };
}

/**
 * @param identifier IP adresi ya da user id gibi benzersiz bir anahtar
 * @param action rate limit uygulanan aksiyonun adı (ör. "login", "signup")
 * @param limit pencere içinde izin verilen maksimum istek sayısı
 * @param windowMs pencere süresi (ms)
 */
export async function rateLimit(
  identifier: string,
  action: string,
  limit = 5,
  windowMs = 60_000
): Promise<RateLimitResult> {
  const key = `ratelimit:${action}:${identifier}`;

  const hasUpstash =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  return hasUpstash
    ? upstashRateLimit(key, limit, windowMs)
    : memoryRateLimit(key, limit, windowMs);
}

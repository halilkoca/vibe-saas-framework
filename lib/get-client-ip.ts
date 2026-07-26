// Extract the client IP from request headers.
// Trusts the LAST IP in X-Forwarded-For (the edge proxy appends the real IP;
// client-supplied values appear first). Falls back to x-real-ip,
// then x-vercel-forwarded-for, then "unknown".
//
// Usage:
//   const ip = getClientIp(await headers());
//
// Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For

export function getClientIp(headersList: Headers): string {
  // Vercel-specific: most reliable
  const vercel = headersList.get("x-vercel-forwarded-for");
  if (vercel) return vercel;

  // Standard x-forwarded-for: take RIGHT-MOST public IP
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    const rightMost = ips[ips.length - 1];
    if (rightMost && rightMost !== "unknown") return rightMost;
  }

  // Fallback
  return headersList.get("x-real-ip") ?? "unknown";
}
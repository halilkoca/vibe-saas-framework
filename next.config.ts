import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [],
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Content Security Policy
          // Turnstile needs: script + frame from challenges.cloudflare.com
          // Supabase needs: connect to *.supabase.co, wss for realtime
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' https://challenges.cloudflare.com; " +
              "frame-src https://challenges.cloudflare.com; " +
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co; " +
              "img-src 'self' data:; " +
              "style-src 'self' 'unsafe-inline'; " +
              "font-src 'self'; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self'; " +
              "frame-ancestors 'none';",
          },
          // Clickjacking protection (older browsers that don't support CSP frame-ancestors)
          { key: "X-Frame-Options", value: "DENY" },
          // MIME-type sniffing prevention
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions Policy — disable unused features
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Strict Transport Security (production only — localhost dev uses HTTP)
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                } as const,
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
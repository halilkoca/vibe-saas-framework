import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server actions varsayılan olarak aynı origin'den kabul edilir; Vercel
  // preview URL'lerinden test edeceksen buraya domain eklemen gerekebilir.
  experimental: {
    serverActions: {
      allowedOrigins: [],
    },
  },
};

export default nextConfig;

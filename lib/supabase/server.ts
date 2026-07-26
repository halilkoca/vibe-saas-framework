// Server Component / Route Handler / Server Action tarafında kullanılacak
// Supabase client. Cookie üzerinden kullanıcı session'ını okur.
//
// ÖNEMLİ: Bu client de anon key kullanır — RLS devrede kalır. tenant_id
// hiçbir zaman burada elle set edilmez, auth.uid() üzerinden RLS policy'si
// otomatik filtreler. "WHERE tenant_id = ..." diye elle client'tan tenant_id
// göndermeye ÇALIŞMA; bu güvenlik açığıdır (kullanıcı başka tenant_id verebilir).

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component içinden cookie set edilemez (middleware'de yapılır).
            // Middleware session'ı zaten yeniliyorsa bu hata görmezden gelinebilir.
          }
        },
      },
    }
  );
}

// service_role client — SADECE webhook/admin route handler'larında,
// kullanıcı isteğinden BAĞIMSIZ server işlemlerinde kullanılır
// (ör. Stripe webhook'unda subscription güncelleme). Asla kullanıcı
// isteğine bağlı normal CRUD'da kullanılmaz — kullanılırsa RLS bypass olur.
export function createServiceRoleClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

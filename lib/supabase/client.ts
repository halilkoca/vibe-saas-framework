// Browser (client component) tarafında kullanılacak Supabase client.
// Sadece anon key kullanır — RLS her zaman devrede, bu client asla
// service_role key ile başlatılmamalı.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

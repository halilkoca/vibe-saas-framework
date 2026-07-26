// Her istekte Supabase session'ını tazeler. Bu olmadan uzun süreli
// oturumlarda kullanıcı beklenmedik şekilde login sayfasına düşer.
// Vibe coder'ın en sık atladığı adımlardan biri budur — framework'te
// baştan var, dokunmasına gerek yok.
//
// Next.js 16'da "middleware.ts" dosya adı deprecated, yerine "proxy.ts" +
// "proxy" export'u kullanılıyor. Fonksiyon içeriği aynı, sadece isim değişti.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Session'ı tazele — bu satır olmadan token süresi dolunca kullanıcı
  // habersizce logout olur.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // (app) route group'una girilmeye çalışılıyorsa ve kullanıcı yoksa login'e yönlendir.
  const isAppRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/leads") ||
    request.nextUrl.pathname.startsWith("/sales") ||
    request.nextUrl.pathname.startsWith("/reports") ||
    request.nextUrl.pathname.startsWith("/settings");

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

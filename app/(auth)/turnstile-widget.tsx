"use client";

// Cloudflare Turnstile widget'ını yükleyip render eden client component.
// Formun içine <TurnstileWidget /> koy, hidden input olarak "cf-turnstile-response"
// name'i ile token gönderir — server action bunu FormData'dan okuyup doğrular.

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback?: (token: string) => void }
      ) => string;
    };
  }
}

export function TurnstileWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    const scriptId = "cf-turnstile-script";

    function render() {
      if (rendered.current || !containerRef.current || !window.turnstile) return;
      window.turnstile.render(containerRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
      });
      rendered.current = true;
    }

    if (window.turnstile) {
      render();
      return;
    }

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.onload = render;
      document.body.appendChild(script);
    }
  }, []);

  return <div ref={containerRef} className="my-3" />;
}

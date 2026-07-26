"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    __turnstileLoadCallback?: () => void;
  }
}

export function TurnstileWidget({
  resetKey,
}: {
  resetKey?: string | number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const [scriptReady, setScriptReady] = useState(false);

  // Register a one-time global callback for Turnstile's onload parameter.
  // Next.js Script component will load api.js?onload=__turnstileLoadCallback.
  useEffect(() => {
    let called = false;
    window.__turnstileLoadCallback = () => {
      if (!called) {
        called = true;
        setScriptReady(true);
      }
    };
    return () => {
      delete window.__turnstileLoadCallback;
    };
  }, []);

  // Render the widget once the script signals it's ready.
  useEffect(() => {
    if (!scriptReady) return;
    if (!containerRef.current) return;
    if (!window.turnstile) return;
    if (widgetIdRef.current) return;

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.error("[Turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set");
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => {
        if (inputRef.current) {
          inputRef.current.value = token;
        }
      },
      "expired-callback": () => {
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
      "error-callback": () => {
        console.error("[Turnstile] Widget render error");
      },
    });
  }, [scriptReady]);

  // Reset Turnstile when resetKey changes (e.g. after a form submission error)
  useEffect(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [resetKey]);

  return (
    <>
      <Script
        id="cf-turnstile-script"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__turnstileLoadCallback"
        strategy="afterInteractive"
      />
      <input
        ref={inputRef}
        name="cf-turnstile-response"
        type="hidden"
      />
      <div ref={containerRef} className="my-3" />
    </>
  );
}
import { useCallback, useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "../config";

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  execute: (id: string) => void;
  reset: (id: string) => void;
  remove: (id: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi | null> | null = null;

function loadScript(): Promise<TurnstileApi | null> {
  if (!TURNSTILE_SITE_KEY) return Promise.resolve(null);
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(window.turnstile ?? null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Invisible Turnstile. `getToken()` returns a fresh single-use token, or ""
 * when no site key is configured (local dev; the server decides whether
 * that's acceptable).
 */
export function useTurnstile() {
  const holder = useRef<HTMLDivElement | null>(null);
  const widget = useRef<string | null>(null);
  const pending = useRef<((t: string) => void) | null>(null);
  // Tokens are single-use and the widget serves one request at a time.
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;
    const el = document.createElement("div");
    el.style.position = "fixed";
    el.style.bottom = "0";
    el.style.right = "0";
    el.style.zIndex = "60";
    document.body.appendChild(el);
    holder.current = el;
    void loadScript().then((ts) => {
      if (!ts || cancelled) return;
      widget.current = ts.render(el, {
        sitekey: TURNSTILE_SITE_KEY,
        size: "invisible",
        execution: "execute",
        appearance: "interaction-only",
        callback: (token: string) => {
          pending.current?.(token);
          pending.current = null;
        },
        "error-callback": () => {
          pending.current?.("");
          pending.current = null;
        },
      });
    });
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      el.remove();
    };
  }, []);

  const fetchToken = useCallback(async (): Promise<string> => {
    if (!TURNSTILE_SITE_KEY) return "";
    const ts = await loadScript();
    // Wait briefly for the widget to render after the script loads.
    for (let i = 0; i < 20 && !widget.current; i++) await new Promise((r) => setTimeout(r, 100));
    if (!ts || !widget.current) return "";
    const id = widget.current;
    return new Promise<string>((resolve) => {
      const timer = setTimeout(() => {
        pending.current = null;
        resolve("");
      }, 15_000);
      pending.current = (t) => {
        clearTimeout(timer);
        resolve(t);
        ts.reset(id);
      };
      ts.execute(id);
    });
  }, []);

  return useCallback((): Promise<string> => {
    const next = queue.current.then(fetchToken, fetchToken);
    queue.current = next;
    return next;
  }, [fetchToken]);
}

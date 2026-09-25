/** Client-side configuration. Only VITE_-prefixed, non-secret values belong here. */
export const BOOKING_URL: string = import.meta.env.VITE_BOOKING_URL || "https://primeflowai.com/freedemo";
export const TURNSTILE_SITE_KEY: string | undefined = import.meta.env.VITE_TURNSTILE_SITE_KEY || undefined;

/**
 * Website conversion-gap detection. Pure code, no AI: every signal here is
 * something we actually found in the HTML, so it can be shown as fact.
 * Shared by /api/analyze-site and the unit tests.
 */
import { HIGH_CONV_HOURS } from "./constants";
import type { SiteHours, SiteSignal } from "./types";

export type { SiteScan, SiteSignal, SignalKey, SiteHours } from "./types";

interface Signature {
  name: string;
  re: RegExp;
}

const CHAT: Signature[] = [
  { name: "Intercom", re: /widget\.intercom\.io|intercomSettings|js\.intercomcdn\.com/i },
  { name: "Drift", re: /js\.driftt\.com|drift\.com\/include|driftt?\.load/i },
  { name: "Tidio", re: /code\.tidio\.co/i },
  { name: "LiveChat", re: /cdn\.livechatinc\.com|__lc\.license/i },
  { name: "Crisp", re: /client\.crisp\.chat|\$crisp/i },
  { name: "tawk.to", re: /embed\.tawk\.to/i },
  { name: "HubSpot chat", re: /js\.usemessages\.com|HubSpotConversations/i },
  { name: "GoHighLevel chat", re: /widgets\.leadconnectorhq\.com\/loader|chat-widget[^>]*leadconnector|msgsndr\.com\/.*chat/i },
  { name: "Zendesk", re: /static\.zdassets\.com|zE\(['"]webWidget/i },
  { name: "Freshchat", re: /wchat\.freshchat\.com|fcWidget/i },
  { name: "Olark", re: /static\.olark\.com/i },
  { name: "Podium", re: /connect\.podium\.com|podium-webchat/i },
  { name: "Birdeye", re: /birdeye\.com\/embed\/.*webchat|bewebchat/i },
];

const BOOKING: Signature[] = [
  { name: "Calendly", re: /calendly\.com\//i },
  { name: "Acuity", re: /acuityscheduling\.com|as\.me\//i },
  { name: "SimplePractice", re: /simplepractice\.com/i },
  { name: "Cliniko", re: /cliniko\.com/i },
  { name: "Square Appointments", re: /squareup\.com\/appointments|square\.site\/book/i },
  { name: "Fresha", re: /fresha\.com/i },
  { name: "Jane", re: /janeapp\.com/i },
  { name: "Mindbody", re: /mindbodyonline\.com|healcode\.com/i },
  { name: "Vagaro", re: /vagaro\.com/i },
  { name: "Setmore", re: /setmore\.com/i },
  { name: "Housecall Pro", re: /book\.housecallpro\.com|housecallpro\.com\/book/i },
  { name: "Jobber", re: /clienthub\.getjobber\.com|getjobber\.com\/.*request/i },
  { name: "ServiceTitan", re: /scheduler\.servicetitan\.com|st-scheduler/i },
  { name: "GoHighLevel calendar", re: /leadconnectorhq\.com\/widget\/booking|\/widget\/booking\//i },
  { name: "Booksy", re: /booksy\.com/i },
  { name: "Zocdoc", re: /zocdoc\.com/i },
  { name: "HubSpot meetings", re: /meetings\.hubspot\.com/i },
  { name: "Cal.com", re: /\bcal\.com\//i },
  { name: "HotDoc", re: /hotdoc\.com\.au/i },
  { name: "HealthEngine", re: /healthengine\.com\.au/i },
];

const PIXELS: Signature[] = [
  { name: "Meta Pixel", re: /connect\.facebook\.net\/[^"']*fbevents\.js|fbq\(\s*['"]init/i },
  { name: "Google Ads", re: /googleadservices\.com|['"]AW-\d{6,}/i },
  { name: "GA4", re: /gtag\/js\?id=G-[A-Z0-9]+|['"]G-[A-Z0-9]{6,}['"]/i },
  { name: "Google Tag Manager", re: /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]{4,}/i },
  { name: "TikTok Pixel", re: /analytics\.tiktok\.com/i },
  { name: "LinkedIn Insight", re: /snap\.licdn\.com/i },
];

const EMBEDDED_FORMS: Signature[] = [
  { name: "HubSpot form", re: /js\.hsforms\.net|hbspt\.forms/i },
  { name: "Typeform", re: /embed\.typeform\.com|form\.typeform\.com/i },
  { name: "Jotform", re: /jotform\.com/i },
  { name: "Gravity Forms", re: /gform_wrapper|gravityforms/i },
  { name: "GoHighLevel form", re: /leadconnectorhq\.com\/widget\/form|\/widget\/form\//i },
  { name: "Wix form", re: /wixforms|wix-forms/i },
  { name: "Contact Form 7", re: /wpcf7/i },
];

const match = (html: string, sigs: Signature[]) => sigs.filter((s) => s.re.test(html)).map((s) => s.name);

function hasLeadForm(html: string): string[] {
  const found: string[] = [];
  const forms = html.match(/<form[\s\S]*?<\/form>/gi) ?? [];
  for (const f of forms) {
    if (/type=["']?(email|tel)["'\s>]|name=["'][^"']*(email|phone|mobile)[^"']*["']/i.test(f)) {
      found.push("On-page form");
      break;
    }
  }
  return [...found, ...match(html, EMBEDDED_FORMS)];
}

function bookingLinks(html: string): string[] {
  const anchors = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) ?? [];
  for (const a of anchors) {
    const text = a.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (/\b(book (now|online|an? (appointment|consult\w*|call|session|visit))|schedule (now|online|an? \w+))\b/i.test(text))
      return ["Booking link"];
  }
  return [];
}

export function detectSignals(html: string): SiteSignal[] {
  const chat = match(html, CHAT);
  const booking = [...match(html, BOOKING)];
  if (!booking.length) booking.push(...bookingLinks(html));
  const tel = /href=["']tel:/i.test(html);
  const sms = /href=["']sms:/i.test(html);
  const wa = /wa\.me\/|api\.whatsapp\.com\/send|web\.whatsapp\.com\/send/i.test(html);
  const forms = hasLeadForm(html);
  const pixels = match(html, PIXELS);

  return [
    { key: "liveChat", label: "Live chat", present: chat.length > 0, detail: chat },
    { key: "onlineBooking", label: "Online booking", present: booking.length > 0, detail: booking },
    { key: "clickToCall", label: "Click-to-call", present: tel, detail: tel ? ["tel: link"] : [] },
    {
      key: "smsWhatsapp",
      label: "SMS / WhatsApp",
      present: sms || wa,
      detail: [...(sms ? ["SMS"] : []), ...(wa ? ["WhatsApp"] : [])],
    },
    { key: "leadForm", label: "Lead form", present: forms.length > 0, detail: forms },
    { key: "trackingPixels", label: "Tracking pixels", present: pixels.length > 0, detail: pixels },
  ];
}

/** First tel: number on the page. */
export function extractPhone(html: string): string | null {
  const m = html.match(/href=["']tel:([+\d\s().-]{6,})["']/i);
  return m?.[1]?.trim() ?? null;
}

/** Parses every JSON-LD block, flattening @graph. Invalid blocks are skipped. */
export function extractJsonLd(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const blocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const b of blocks) {
    const body = b.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      const parsed = JSON.parse(body.trim()) as unknown;
      const push = (v: unknown) => {
        if (Array.isArray(v)) v.forEach(push);
        else if (v && typeof v === "object") {
          const o = v as Record<string, unknown>;
          if (Array.isArray(o["@graph"])) (o["@graph"] as unknown[]).forEach(push);
          out.push(o);
        }
      };
      push(parsed);
    } catch {
      /* malformed JSON-LD is common; ignore */
    }
  }
  return out;
}

const DAY_CODES: Record<string, number> = { mo: 0, tu: 1, we: 2, th: 3, fr: 4, sa: 5, su: 6 };

function dayIndex(v: string): number | undefined {
  const k = v
    .replace(/^https?:\/\/schema\.org\//i, "")
    .slice(0, 2)
    .toLowerCase();
  return DAY_CODES[k];
}

const hourOf = (t: string) => {
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  return h >= 0 && h <= 24 ? h : null;
};

/**
 * Opening hours from JSON-LD `openingHoursSpecification` or `openingHours`
 * ("Mo-Fr 09:00-17:00"). Returns the widest daily window across open days.
 */
export function extractHours(ld: Record<string, unknown>[]): SiteHours | null {
  const days = Array(7).fill(false) as boolean[];
  let start = 24;
  let end = 0;
  let found = false;

  const addRange = (fromDay: number, toDay: number, open: number, close: number) => {
    if (close <= open) return;
    for (let d = fromDay; ; d = (d + 1) % 7) {
      days[d] = true;
      if (d === toDay) break;
    }
    start = Math.min(start, open);
    end = Math.max(end, close);
    found = true;
  };

  for (const node of ld) {
    const specs = node.openingHoursSpecification;
    for (const s of (Array.isArray(specs) ? specs : specs ? [specs] : []) as Record<string, unknown>[]) {
      const open = hourOf(String(s.opens ?? ""));
      const close = hourOf(String(s.closes ?? ""));
      if (open === null || close === null) continue;
      const dow = s.dayOfWeek;
      for (const d of (Array.isArray(dow) ? dow : [dow]) as unknown[]) {
        const idx = typeof d === "string" ? dayIndex(d) : undefined;
        if (idx !== undefined) addRange(idx, idx, open, close === 0 ? 24 : close);
      }
    }
    const oh = node.openingHours;
    for (const line of (Array.isArray(oh) ? oh : oh ? [oh] : []) as unknown[]) {
      if (typeof line !== "string") continue;
      const m = line.match(/^([A-Za-z]{2})(?:\s*-\s*([A-Za-z]{2}))?(?:,[A-Za-z,]+)?\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if (!m) continue;
      const a = dayIndex(m[1]!);
      const b = m[2] ? dayIndex(m[2]) : a;
      const open = hourOf(m[3]!);
      const close = hourOf(m[4]!);
      if (a === undefined || b === undefined || open === null || close === null) continue;
      addRange(a, b, open, close === 0 ? 24 : close);
    }
  }
  if (!found) return null;
  return { days, start, end: Math.min(end, 23) };
}

/** True when listed hours leave any 6–9am / 4–7pm hour uncovered. */
export function afterHoursGap(h: SiteHours | null): boolean | null {
  if (!h) return null;
  return HIGH_CONV_HOURS.some((hr) => !(hr >= h.start && hr < h.end)) || h.days.filter(Boolean).length < 7;
}

/** Visible text: strips scripts, styles, tags and collapses whitespace. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h\d|\/tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

export function metaContent(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:name|property)=["']${name}["']`, "i");
  return html.match(re)?.[1] ?? html.match(re2)?.[1] ?? null;
}

/** Internal links most likely to hold contact, services, pricing or booking info. */
export function usefulInternalLinks(html: string, base: URL, limit = 2): string[] {
  const hrefs = [...html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const scored: { url: string; score: number }[] = [];
  const seen = new Set<string>([base.href.replace(/\/$/, "")]);
  for (const [, href, inner] of hrefs) {
    let u: URL;
    try {
      u = new URL(href!, base);
    } catch {
      continue;
    }
    if (u.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) continue;
    if (!/^https?:$/.test(u.protocol) || /\.(pdf|jpe?g|png|gif|svg|webp|zip|mp4)$/i.test(u.pathname)) continue;
    u.hash = "";
    const key = u.href.replace(/\/$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    const text = `${u.pathname} ${(inner ?? "").replace(/<[^>]+>/g, " ")}`.toLowerCase();
    let score = 0;
    if (/contact|get-in-touch|location/.test(text)) score += 3;
    if (/pric|rates|fees|cost/.test(text)) score += 3;
    if (/book|schedule|appointment/.test(text)) score += 2;
    if (/service|what-we-do|treatment/.test(text)) score += 2;
    if (/hours/.test(text)) score += 1;
    if (score) scored.push({ url: u.href, score });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.url);
}

const PRIVATE_V4 = [/^10\./, /^127\./, /^0\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./];

/**
 * Normalises a user-entered URL and applies SSRF rules: http(s) only, no IP
 * literals, no localhost or internal names, no credentials, default ports only.
 */
export function normalizeSiteUrl(input: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let raw = input.trim();
  if (!raw) return { ok: false, reason: "Enter your website address." };
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^[^:]+:\d/.test(raw))
      return { ok: false, reason: "Only http and https addresses are supported." };
    raw = `https://${raw}`;
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "That doesn't look like a website address." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    return { ok: false, reason: "Only http and https addresses are supported." };
  if (url.username || url.password) return { ok: false, reason: "Remove the username or password from the address." };
  if (url.port && url.port !== "80" && url.port !== "443")
    return { ok: false, reason: "Custom ports aren't supported." };
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":") || host.startsWith("["))
    return { ok: false, reason: "Enter a domain name, not an IP address." };
  if (PRIVATE_V4.some((re) => re.test(host))) return { ok: false, reason: "Enter a public website." };
  if (
    host === "localhost" ||
    !host.includes(".") ||
    /\.(localhost|local|internal|intranet|lan|home|corp|test|invalid|example)$/.test(host)
  )
    return { ok: false, reason: "Enter a public website." };
  url.hash = "";
  return { ok: true, url };
}

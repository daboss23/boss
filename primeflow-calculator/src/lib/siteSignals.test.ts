import { describe, expect, it } from "vitest";
import {
  afterHoursGap,
  detectSignals,
  extractHours,
  extractJsonLd,
  extractPhone,
  htmlToText,
  normalizeSiteUrl,
  usefulInternalLinks,
} from "./siteSignals";

const signal = (html: string, key: string) => detectSignals(html).find((s) => s.key === key)!;

describe("detectSignals", () => {
  it("finds chat vendors by script signature", () => {
    expect(signal('<script src="https://widget.intercom.io/widget/abc"></script>', "liveChat").detail).toEqual(["Intercom"]);
    expect(signal('<script src="//code.tidio.co/xyz.js"></script>', "liveChat").present).toBe(true);
    expect(signal('<script src="https://embed.tawk.to/1/2"></script>', "liveChat").detail).toEqual(["tawk.to"]);
    expect(signal("<p>No widgets here</p>", "liveChat").present).toBe(false);
  });

  it("finds booking tools and plain booking links", () => {
    expect(signal('<iframe src="https://calendly.com/acme/intro"></iframe>', "onlineBooking").detail).toEqual(["Calendly"]);
    expect(signal('<a href="/appointments">Book an appointment</a>', "onlineBooking").detail).toEqual(["Booking link"]);
    expect(signal('<a href="/about">About the book club</a>', "onlineBooking").present).toBe(false);
  });

  it("finds click-to-call, SMS and WhatsApp", () => {
    const html = '<a href="tel:+61 2 9999 0000">Call</a><a href="https://wa.me/61400000000">WhatsApp</a>';
    expect(signal(html, "clickToCall").present).toBe(true);
    expect(signal(html, "smsWhatsapp").detail).toEqual(["WhatsApp"]);
    expect(extractPhone(html)).toBe("+61 2 9999 0000");
  });

  it("only counts forms that capture contact details", () => {
    expect(signal('<form><input type="search" name="q"></form>', "leadForm").present).toBe(false);
    expect(signal('<form><input type="email" name="e"></form>', "leadForm").present).toBe(true);
    expect(signal('<script src="//js.hsforms.net/forms/v2.js"></script>', "leadForm").detail).toEqual(["HubSpot form"]);
  });

  it("finds tracking pixels", () => {
    const html = `<script>fbq('init', '123');</script><script src="https://www.googletagmanager.com/gtag/js?id=G-ABC1234"></script><script>gtag('config','AW-1234567')</script>`;
    expect(signal(html, "trackingPixels").detail).toEqual(["Meta Pixel", "Google Ads", "GA4"]);
  });
});

describe("JSON-LD and hours", () => {
  const html = `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Dentist","name":"Harbour Dental","openingHoursSpecification":[{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"08:00","closes":"17:30"}]}]}</script>`;

  it("flattens @graph", () => {
    const ld = extractJsonLd(html);
    expect(ld.some((n) => n.name === "Harbour Dental")).toBe(true);
  });

  it("parses openingHoursSpecification", () => {
    const h = extractHours(extractJsonLd(html))!;
    expect(h.days).toEqual([true, true, true, true, true, false, false]);
    expect(h.start).toBe(8);
    expect(h.end).toBe(17);
    expect(afterHoursGap(h)).toBe(true);
  });

  it("parses openingHours strings", () => {
    const h = extractHours([{ openingHours: ["Mo-Su 06:00-20:00"] }])!;
    expect(h.days.every(Boolean)).toBe(true);
    expect(afterHoursGap(h)).toBe(false);
  });

  it("returns null without hours", () => {
    expect(extractHours([{ name: "x" }])).toBeNull();
    expect(afterHoursGap(null)).toBeNull();
  });

  it("skips malformed JSON-LD", () => {
    expect(extractJsonLd('<script type="application/ld+json">{nope</script>')).toEqual([]);
  });
});

describe("normalizeSiteUrl (SSRF rules)", () => {
  it.each(["example.com", "www.example.com/about", "https://example.co.uk", "http://example.com"])("accepts %s", (u) => {
    expect(normalizeSiteUrl(u).ok).toBe(true);
  });

  it("adds https://", () => {
    const r = normalizeSiteUrl("harbourdental.com.au");
    expect(r.ok && r.url.href).toBe("https://harbourdental.com.au/");
  });

  it.each([
    "http://127.0.0.1",
    "10.0.0.5",
    "http://192.168.1.1/admin",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/",
    "localhost:3000",
    "http://localhost",
    "http://intranet",
    "http://printer.local",
    "ftp://example.com",
    "javascript:alert(1)",
    "file:///etc/passwd",
    "http://user:pass@example.com",
    "http://example.com:8080",
    "",
  ])("rejects %s", (u) => {
    expect(normalizeSiteUrl(u).ok).toBe(false);
  });
});

describe("text + links", () => {
  it("strips scripts and tags", () => {
    expect(htmlToText("<script>var a=1</script><h1>Hi</h1><p>there&nbsp;you</p>")).toBe("Hi\n there you");
  });

  it("ranks contact / pricing pages and stays on-domain", () => {
    const html = `<a href="/about">About</a><a href="/pricing">Pricing</a><a href="https://other.com/contact">x</a><a href="/contact-us">Contact</a>`;
    expect(usefulInternalLinks(html, new URL("https://example.com/"))).toEqual([
      "https://example.com/pricing",
      "https://example.com/contact-us",
    ]);
  });
});

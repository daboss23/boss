import type { Currency } from "./types";

const TZ_COUNTRY: [RegExp, string][] = [
  [/^Australia\//, "AU"],
  [/^Pacific\/Auckland|^Pacific\/Chatham/, "NZ"],
  [/^Europe\/London|^Europe\/Belfast/, "GB"],
  [/^Europe\/Dublin/, "IE"],
  [/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns)/, "CA"],
  [/^America\//, "US"],
  [/^Asia\/Singapore/, "SG"],
  [/^Africa\/Johannesburg/, "ZA"],
];

const EURO = new Set(["DE", "FR", "ES", "IT", "NL", "BE", "AT", "PT", "FI", "IE", "GR", "LU", "SK", "SI", "EE", "LV", "LT", "MT", "CY", "HR"]);

/** Best guess at the visitor's country when the site scan didn't find one. */
export function guessCountry(): string {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const fromTz = TZ_COUNTRY.find(([re]) => re.test(tz))?.[1];
    // Time zone is a stronger signal than browser language (en-US is common everywhere).
    return fromTz ?? region ?? "US";
  } catch {
    return "US";
  }
}

export function currencyForCountry(country: string | null | undefined): Currency | null {
  if (!country) return null;
  const c = country.toUpperCase();
  if (c === "GB" || c === "UK") return "£";
  if (EURO.has(c)) return "€";
  if (["US", "AU", "CA", "NZ", "SG"].includes(c)) return "$";
  return null;
}

export function currencyForCode(code: string | null | undefined): Currency | null {
  if (!code) return null;
  const c = code.toUpperCase();
  if (c === "GBP") return "£";
  if (c === "EUR") return "€";
  if (["USD", "AUD", "CAD", "NZD", "SGD"].includes(c)) return "$";
  return null;
}

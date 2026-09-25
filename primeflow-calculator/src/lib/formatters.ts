/** Compact money, identical to the legacy `fmt()`: $1.3M, $42K, $870. */
export function fmt(sym: string, n: number): string {
  if (!Number.isFinite(n)) n = 0;
  const neg = n < 0;
  const a = Math.abs(n);
  let out: string;
  if (a >= 1_000_000) out = `${sym}${(a / 1_000_000).toFixed(1)}M`;
  else if (a >= 1000) out = `${sym}${(a / 1000).toFixed(0)}K`;
  else out = `${sym}${Math.round(a).toLocaleString("en-US")}`;
  return neg ? `−${out}` : out;
}

/** Full money with thousands separators: $1,270,642. */
export function fmtFull(sym: string, n: number): string {
  return `${sym}${Math.round(Number.isFinite(n) ? n : 0).toLocaleString("en-US")}`;
}

/** Money rounded to the nearest thousand: used while the teaser is blurred. */
export function fmtThousands(sym: string, n: number): string {
  return fmtFull(sym, Math.round(n / 1000) * 1000);
}

export function fmtInt(n: number): string {
  return Math.round(Number.isFinite(n) ? n : 0).toLocaleString("en-US");
}

export function fmtPct(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function hourLabel(h: number): string {
  if (h === 0 || h === 24) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

/** Filename-safe slug of a person's name. */
export function safeFileName(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
  return cleaned || "Report";
}

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import type { Calculator } from "../hooks/useCalculator";
import type { SiteScan } from "../lib/types";
import { CtaButton, TextButton } from "./ui/Button";
import { Bezel } from "./ui/Card";
import { Icon } from "./ui/Icon";
import { EASE } from "./ui/Reveal";

const STATUS_LINES = [
  "Reading your homepage...",
  "Checking for live chat...",
  "Looking for online booking...",
  "Checking click-to-call and messaging...",
  "Matching industry benchmarks...",
];

export default function Step0WebsiteScan({ calc }: { calc: Calculator }) {
  const [url, setUrl] = useState("");
  const { scanStatus, scanError, scan } = calc;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void calc.scanWebsite(url);
  };

  return (
    <Bezel className="mx-auto w-full max-w-[640px]" coreClassName="relative overflow-hidden p-5 sm:p-7">
      <AnimatePresence mode="wait" initial={false}>
        {scanStatus === "idle" && (
          <motion.form
            key="form"
            onSubmit={submit}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
            noValidate
          >
            <label htmlFor="site-url" className="mb-3 block text-left text-[13px] font-medium text-soft">
              Start with your website. We'll pre-fill what we can and flag the gaps.
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-14 items-center gap-3 sm:flex-1 rounded-full bg-white/[0.04] px-5 ring-1 ring-white/10 transition focus-within:ring-2 focus-within:ring-cyan/70 hover:ring-white/20 sm:h-[60px]">
                <Icon name="globe" size={18} className="shrink-0 text-muted" />
                <input
                  id="site-url"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="yourbusiness.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  aria-invalid={Boolean(scanError) || undefined}
                  aria-describedby={scanError ? "site-url-err" : undefined}
                  className="h-full w-full min-w-0 bg-transparent text-base text-white placeholder:text-muted/70 focus:outline-none"
                />
              </div>
              <CtaButton type="submit" className="sm:w-auto">
                Scan my website
              </CtaButton>
            </div>
            {scanError && (
              <p id="site-url-err" role="alert" className="mt-3 text-left text-[13px] text-leak">
                {scanError}
              </p>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
              <TextButton onClick={calc.skipScan}>Skip, I'll enter details manually</TextButton>
              <span className="flex items-center gap-1.5 text-[12px] text-muted">
                <Icon name="shield" size={14} /> Reads public pages only
              </span>
            </div>
          </motion.form>
        )}

        {scanStatus === "scanning" && <Scanning key="scanning" />}

        {scanStatus === "done" && scan && <ScanSummary key="done" scan={scan} onContinue={() => calc.go("business")} />}

        {scanStatus === "failed" && (
          <motion.div
            key="failed"
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="text-left"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-leak-yellow/10 text-leak-yellow ring-1 ring-leak-yellow/25">
                <Icon name="globe" size={18} />
              </span>
              <div>
                <p className="font-medium text-white">{scanError ?? "We couldn't read that site."}</p>
                <p className="mt-1 text-sm text-muted">It only takes a minute to enter your numbers by hand.</p>
              </div>
            </div>
            <CtaButton className="mt-6" block onClick={() => calc.go("business")}>
              Enter my details
            </CtaButton>
          </motion.div>
        )}
      </AnimatePresence>
    </Bezel>
  );
}

function Scanning() {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setLine((l) => Math.min(l + 1, STATUS_LINES.length - 1)), 1300);
    return () => window.clearInterval(id);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative text-left"
      role="status"
      aria-live="polite"
    >
      {/* Scan beam */}
      <div aria-hidden className="pointer-events-none absolute -inset-x-7 -top-7 h-[calc(100%+56px)] overflow-hidden">
        <div className="h-full w-full [animation:scan-line_2.2s_cubic-bezier(0.45,0,0.55,1)_infinite] bg-linear-to-b from-transparent via-cyan/[0.07] to-transparent" />
      </div>
      <div className="mb-5 flex items-center gap-3">
        <span className="relative grid size-9 place-items-center">
          <span className="absolute inset-0 rounded-full border border-cyan/30 [animation:orbit-pulse_1.8s_ease-in-out_infinite]" />
          <span className="size-2.5 rounded-full bg-cyan shadow-[0_0_14px_rgba(0,200,255,0.9)]" />
        </span>
        <div>
          <p className="font-semibold text-white">Scanning your website</p>
          <p className="text-[13px] text-muted">Usually 3 to 10 seconds</p>
        </div>
      </div>
      <ul className="space-y-2.5">
        {STATUS_LINES.map((text, i) => (
          <motion.li
            key={text}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: i <= line ? 1 : 0.28, x: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: i === 0 ? 0 : 0.05 }}
            className="flex items-center gap-3 text-sm"
          >
            {i < line ? (
              <Icon name="check" size={16} strokeWidth={2.2} className="text-win" />
            ) : i === line ? (
              <span className="size-4 rounded-full border-2 border-cyan/25 border-t-cyan [animation:spin-cw_0.8s_linear_infinite]" />
            ) : (
              <span className="size-4 rounded-full border border-white/15" />
            )}
            <span className={i <= line ? "text-soft" : "text-muted"}>{text}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

function ScanSummary({ scan, onContinue }: { scan: SiteScan; onContinue: () => void }) {
  const facts = [
    scan.businessName && { k: "Business", v: scan.businessName },
    scan.industry && { k: "Industry", v: scan.industry },
    scan.location?.city && { k: "Location", v: [scan.location.city, scan.location.country].filter(Boolean).join(", ") },
    scan.hours && { k: "Hours", v: "Opening hours found" },
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-left" role="status" aria-live="polite">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-white">Scan complete</p>
          <p className="text-[13px] text-muted">{scan.domain}</p>
        </div>
        <span className="rounded-full bg-win/10 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-win uppercase ring-1 ring-win/25">
          Ready
        </span>
      </div>

      {facts.length > 0 && (
        <dl className="mb-5 grid grid-cols-1 gap-x-6 gap-y-2 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.06] sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.k} className="flex min-w-0 items-baseline justify-between gap-3 text-sm sm:block">
              <dt className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">{f.k}</dt>
              <dd className="truncate text-soft">{f.v}</dd>
            </div>
          ))}
        </dl>
      )}

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {scan.signals.map((s, i) => (
          <motion.li
            key={s.key}
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.12 + i * 0.16 }}
            className="flex items-center gap-2.5 rounded-xl bg-white/[0.025] px-3 py-2.5 text-sm ring-1 ring-white/[0.06]"
          >
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full ${s.present ? "bg-win/15 text-win" : "bg-leak/15 text-leak"}`}
            >
              <Icon name={s.present ? "check" : "x"} size={12} strokeWidth={2.6} />
            </span>
            <span className="text-soft">{s.label}</span>
            {s.detail[0] && <span className="ml-auto truncate text-[11px] text-muted">{s.detail[0]}</span>}
          </motion.li>
        ))}
      </ul>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + scan.signals.length * 0.16 }}>
        <CtaButton className="mt-6" block onClick={onContinue}>
          Continue to your numbers
        </CtaButton>
        <p className="mt-3 text-center text-[12px] text-muted">Everything we pre-fill is labelled and editable.</p>
      </motion.div>
    </motion.div>
  );
}

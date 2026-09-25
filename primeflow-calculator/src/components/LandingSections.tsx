import type { ReactNode } from "react";
import { BOOKING_URL } from "../config";
import { CtaButton } from "./ui/Button";
import { Icon, type IconName } from "./ui/Icon";
import Logo from "./Logo";
import { Reveal } from "./ui/Reveal";

const LEAKS: { icon: IconName; title: string; body: string; color: string; visual: ReactNode }[] = [
  {
    icon: "bolt",
    title: "Slow replies",
    body: "Every hour a lead waits, fewer of them buy. We price the gap between how fast you reply today and replying inside a minute.",
    color: "#ef4444",
    visual: (
      <div className="flex h-10 items-end gap-1">
        {[100, 92, 82, 68, 52, 38, 26, 17, 10].map((h, i) => (
          <span key={i} className="w-1.5 rounded-sm" style={{ height: `${h}%`, background: i === 4 ? "#00c8ff" : "rgba(148,190,255,0.2)" }} />
        ))}
      </div>
    ),
  },
  {
    icon: "clock",
    title: "After-hours gaps",
    body: "Buyers enquire most from 6 to 9am and 4 to 7pm. We lay your open hours over those windows, hour by hour, all week.",
    color: "#fb923c",
    visual: (
      <div className="grid grid-cols-12 gap-[3px]">
        {Array.from({ length: 36 }, (_, i) => {
          const h = i % 12;
          const covered = h >= 3 && h < 9 && i < 30;
          const hot = h < 2 || h >= 10;
          return <span key={i} className="size-2 rounded-[2px]" style={{ background: covered ? "rgba(0,200,255,0.5)" : hot ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.06)" }} />;
        })}
      </div>
    ),
  },
  {
    icon: "phoneMissed",
    title: "Missed calls",
    body: "A call that rings out usually rings a competitor next. We turn your weekly missed calls into what they cost you in a year.",
    color: "#facc15",
    visual: (
      <div className="w-24">
        <div className="flex h-2 gap-[2px] overflow-hidden rounded-full">
          <span className="bg-leak-deep/80" style={{ flex: 70 }} />
          <span className="bg-win-deep" style={{ flex: 30 }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] text-muted">
          <span>lost</span>
          <span>recoverable</span>
        </div>
      </div>
    ),
  },
  {
    icon: "refresh",
    title: "Dormant leads",
    body: "Leads you paid for and never closed are still sitting in your database. We model what a reactivation campaign brings back.",
    color: "#a855f7",
    visual: (
      <div className="flex items-end gap-1">
        {[100, 60, 36, 20].map((w, i) => (
          <span key={i} className="h-1.5 rounded-full" style={{ width: w * 0.28 + 4, background: i === 3 ? "#4ade80" : `rgba(168,85,247,${0.35 + i * 0.15})` }} />
        ))}
      </div>
    ),
  },
];

const INSIDE = [
  "Your total annual leakage, calculated from your numbers",
  "A pipeline health grade from A to F",
  "An AI diagnosis written for your business",
  "A step-by-step recovery plan for each leak",
  "A shareable link and a branded PDF for your team",
];

const STEPS = [
  { icon: "globe" as IconName, title: "Scan your site", body: "Optional. We check for chat, booking, click-to-call and tracking, and pre-fill what we find.", time: "About 10 seconds" },
  { icon: "chart" as IconName, title: "Answer a few questions", body: "Sale value, lead volume, response time, hours, missed calls. Every field is editable.", time: "About 60 seconds" },
  { icon: "target" as IconName, title: "Get your recovery report", body: "Your number, your grade, your diagnosis and a plan, ranked by what each fix is worth.", time: "Instant" },
];

export default function LandingSections({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative">
      {/* Solid ground under the landing content so the grid stays in the hero. */}
      <div aria-hidden className="absolute inset-x-0 -top-40 bottom-0 bg-linear-to-b from-transparent via-ink-950/95 to-ink-950" />

      <div className="relative mx-auto max-w-[1120px] px-4 sm:px-6">
        {/* Four leaks */}
        <section className="grid gap-12 py-24 md:grid-cols-[0.9fr_1.1fr] md:gap-16 md:py-32" aria-labelledby="leaks-h">
          <Reveal className="md:sticky md:top-24 md:self-start">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-cyan-soft uppercase">What the engine measures</p>
            <h2 id="leaks-h" className="mt-4 text-[clamp(30px,4.2vw,46px)] leading-[1.06] font-semibold tracking-[-0.03em] text-white">
              Four leaks.
              <br />
              <span className="text-muted">One number.</span>
            </h2>
            <p className="mt-5 max-w-[44ch] text-[15.5px] leading-relaxed text-soft">
              Most pipelines don't lose money in one place. They lose it quietly in four, and nobody adds them up. The engine does, using your
              numbers instead of industry averages.
            </p>
          </Reveal>
          <ol className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
            {LEAKS.map((l, i) => (
              <Reveal key={l.title} delay={i * 0.06}>
                <li className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 py-7 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <span className="grid size-11 place-items-center rounded-2xl" style={{ color: l.color, background: `${l.color}14`, boxShadow: `inset 0 0 0 1px ${l.color}33` }}>
                    <Icon name={l.icon} size={20} />
                  </span>
                  <div>
                    <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-white">{l.title}</h3>
                    <p className="mt-1.5 max-w-[52ch] text-sm leading-relaxed text-muted">{l.body}</p>
                  </div>
                  <div className="col-start-2 sm:col-start-auto sm:pl-4" aria-hidden>
                    {l.visual}
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Report preview */}
        <section className="grid items-center gap-14 py-20 md:grid-cols-2 md:py-28" aria-labelledby="inside-h">
          <Reveal className="order-2 md:order-1">
            <ReportPreview />
          </Reveal>
          <Reveal className="order-1 md:order-2" delay={0.1}>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-cyan-soft uppercase">Your report</p>
            <h2 id="inside-h" className="mt-4 text-[clamp(28px,3.8vw,42px)] leading-[1.08] font-semibold tracking-[-0.03em] text-white">
              Specific to your business, down to the dollar.
            </h2>
            <ul className="mt-7 space-y-3.5">
              {INSIDE.map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] text-soft">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-cyan/10 text-cyan ring-1 ring-cyan/30">
                    <Icon name="check" size={12} strokeWidth={2.6} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* How it works */}
        <section className="py-20 md:py-28" aria-labelledby="how-h">
          <Reveal>
            <h2 id="how-h" className="text-center text-[clamp(26px,3.4vw,38px)] font-semibold tracking-[-0.03em] text-white">
              Ninety seconds, start to finish.
            </h2>
          </Reveal>
          <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            <div aria-hidden className="absolute top-[22px] right-[16%] left-[16%] hidden h-px bg-linear-to-r from-transparent via-cyan/40 to-transparent md:block" />
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1}>
                <li className="relative text-center">
                  <span className="relative mx-auto grid size-11 place-items-center rounded-full bg-ink-900 text-cyan-soft ring-1 ring-cyan/30 shadow-[0_0_24px_-4px_rgba(0,200,255,0.45)]">
                    <Icon name={s.icon} size={19} />
                  </span>
                  <h3 className="mt-5 text-[17px] font-semibold text-white">{s.title}</h3>
                  <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-relaxed text-muted">{s.body}</p>
                  <p className="mt-3 text-[11px] font-semibold tracking-[0.12em] text-cyan-soft/80 uppercase">{s.time}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Final CTA */}
        <section className="py-20 md:py-28">
          <Reveal>
            <div className="bezel">
              <div className="bezel-core relative overflow-hidden px-6 py-14 text-center sm:py-20">
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_100%,rgba(255,0,200,0.16),transparent_70%),radial-gradient(60%_60%_at_50%_0%,rgba(0,200,255,0.12),transparent_70%)]" />
                <div className="relative">
                  <h2 className="mx-auto max-w-[20ch] text-[clamp(28px,4.4vw,48px)] leading-[1.06] font-semibold tracking-[-0.03em] text-white">
                    Find out what your pipeline is leaking.
                  </h2>
                  <p className="mx-auto mt-5 max-w-[46ch] text-[15.5px] leading-relaxed text-soft">
                    Built on your numbers, not averages. Free, private, and yours to keep.
                  </p>
                  <CtaButton className="mt-9" onClick={onStart}>
                    Start my free audit
                  </CtaButton>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </div>

      <Footer />
    </div>
  );
}

function ReportPreview() {
  return (
    <div className="relative [perspective:1400px]">
      <div aria-hidden className="absolute -inset-10 rounded-full bg-[radial-gradient(closest-side,rgba(0,200,255,0.18),transparent)] blur-2xl" />
      <div className="bezel relative origin-bottom [transform:rotateX(10deg)_rotateY(-8deg)] transition-transform duration-700 ease-[var(--ease-out-expo)] hover:[transform:rotateX(4deg)_rotateY(-3deg)]">
        <div className="bezel-core p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.16em] text-leak uppercase">Annual revenue left on the table</span>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">Example</span>
          </div>
          <div className="mt-3 font-display text-[clamp(30px,4.6vw,44px)] font-black text-white tabular [text-shadow:0_0_32px_rgba(239,68,68,0.35)]">
            $1,270,642
          </div>
          <div className="mt-4 flex h-2 gap-[3px] overflow-hidden rounded-full">
            <span className="bg-leak-deep" style={{ flex: 16 }} />
            <span className="bg-leak-orange" style={{ flex: 82 }} />
            <span className="bg-leak-yellow" style={{ flex: 2 }} />
          </div>
          <div className="mt-6 grid grid-cols-[auto_1fr] items-center gap-5 border-t border-white/[0.06] pt-5">
            <div className="relative size-16">
              <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden>
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
                <circle cx="32" cy="32" r="26" fill="none" stroke="#f97316" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 26 * 0.46} 999`} />
              </svg>
              <span className="absolute inset-0 grid place-items-center font-display text-xl font-black text-[#f97316]">D</span>
            </div>
            <div className="space-y-2">
              <div className="skeleton h-2.5 w-[92%] [animation:none]" />
              <div className="skeleton h-2.5 w-[80%] [animation:none]" />
              <div className="skeleton h-2.5 w-[58%] [animation:none]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] safe-bottom">
      <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-5 px-4 pt-10 sm:flex-row sm:px-6">
        <Logo size="sm" className="!mx-0" />
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted">
          <a href={BOOKING_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
            Book a demo
          </a>
          <a href="https://primeflowai.com" target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
            primeflowai.com
          </a>
          <span>© {new Date().getFullYear()} PrimeFlowAI</span>
        </div>
      </div>
    </footer>
  );
}

import { motion } from "motion/react";
import { fmt, fmtFull } from "../../lib/formatters";
import type { CalculatorResults } from "../../lib/types";
import { Bezel } from "../ui/Card";
import { Icon } from "../ui/Icon";
import { CountUp, LEAK_COLORS } from "./shared";

export default function LeakageBanner({ r }: { r: CalculatorResults }) {
  return (
    <Bezel coreClassName="relative overflow-hidden p-6 sm:p-10">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(239,68,68,0.18),transparent)]" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-leak uppercase">
          <Icon name="alert" size={14} strokeWidth={2} />
          Annual revenue left on the table
        </div>
        <div className="mt-4 font-display text-[clamp(44px,9vw,88px)] leading-[0.95] font-black tracking-tight text-white tabular [text-shadow:0_0_48px_rgba(239,68,68,0.35)]">
          <CountUp value={r.totalLeakage} format={(n) => fmtFull(r.sym, n)} duration={2} />
        </div>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-soft">
          That's <span className="font-semibold text-leak">{r.leakPct}%</span> of your potential annual revenue disappearing before it
          reaches you.
        </p>

        <div className="mt-8 flex h-2.5 gap-[3px] overflow-hidden rounded-full" role="img" aria-label="Leakage breakdown">
          {r.leakageBreakdown.map((b, i) => (
            <motion.div
              key={b.key}
              className="h-full origin-left rounded-[2px] first:rounded-l-full last:rounded-r-full"
              style={{ flex: Math.max(b.pct, 1), background: LEAK_COLORS[i] }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 + i * 0.12 }}
            />
          ))}
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-7 gap-y-2.5">
          {r.leakageBreakdown.map((b, i) => (
            <li key={b.key} className="flex items-center gap-2 text-[13px]">
              <span className="size-2.5 rounded-[3px]" style={{ background: LEAK_COLORS[i] }} />
              <span className="text-muted">{b.label}</span>
              <span className="font-semibold text-white tabular">{fmt(r.sym, b.value)}</span>
              <span className="text-muted tabular">({b.pct}%)</span>
            </li>
          ))}
        </ul>
      </div>
    </Bezel>
  );
}

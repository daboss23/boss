import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PlanStep } from "../../lib/actionPlans";
import { Kicker } from "../ui/Card";

/** Slow Response, Missed Calls, Dead Leads. */
export const LEAK_COLORS = ["#ef4444", "#fb923c", "#facc15"] as const;

/** Counts up to `value` once when scrolled into view. */
export function CountUp({ value, format, duration = 1.6, className = "" }: { value: number; format: (n: number) => string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setN(value);
      return;
    }
    const c = animate(0, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setN });
    return () => c.stop();
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {format(n)}
    </span>
  );
}

type Tone = "default" | "leak" | "win" | "warn";
const toneText: Record<Tone, string> = {
  default: "text-white",
  leak: "text-leak",
  win: "text-win",
  warn: "text-leak-yellow",
};

/** A data tile: label, value, optional note. */
export function Stat({ label, value, note, tone = "default", className = "" }: { label: ReactNode; value: ReactNode; note?: ReactNode; tone?: Tone; className?: string }) {
  const ring =
    tone === "leak"
      ? "ring-leak/25 bg-leak/[0.06]"
      : tone === "win"
        ? "ring-win/25 bg-win/[0.06]"
        : "ring-white/[0.07] bg-white/[0.025]";
  return (
    <div className={`rounded-2xl p-5 ring-1 ${ring} ${className}`}>
      <Kicker>{label}</Kicker>
      <div className={`mt-2.5 text-[28px] leading-none font-semibold tracking-[-0.02em] tabular ${toneText[tone]}`}>{value}</div>
      {note && <div className="mt-2 text-[12.5px] text-muted">{note}</div>}
    </div>
  );
}

/** Personalised 3-step plan. */
export function PlanSteps({ steps, title = "Your recovery plan" }: { steps: PlanStep[]; title?: string }) {
  return (
    <div className="mt-8 border-t border-white/[0.06] pt-7">
      <Kicker className="mb-5 text-cyan-soft/90">{title}</Kicker>
      <ol className="grid gap-6 md:grid-cols-3 md:gap-5">
        {steps.map((s, i) => (
          <li key={s.title} className="relative">
            <div className="flex items-center gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cyan/10 text-[12px] font-semibold text-cyan-soft ring-1 ring-cyan/25 tabular">
                {i + 1}
              </span>
              {s.tag && (
                <span className="rounded-full bg-purple/10 px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.08em] text-[#c9a2fa] uppercase ring-1 ring-purple/25">
                  {s.tag}
                </span>
              )}
            </div>
            <h4 className="mt-3.5 text-[15px] font-semibold text-white">{s.title}</h4>
            <p className="mt-1.5 text-sm leading-relaxed text-soft">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export const chartTooltip = {
  contentStyle: {
    background: "#0a1430",
    border: "1px solid rgba(148,190,255,0.2)",
    borderRadius: 12,
    color: "#e2e8f0",
    fontSize: 12,
    boxShadow: "0 12px 30px -10px rgba(0,0,0,0.8)",
  },
  itemStyle: { color: "#e2e8f0" },
  labelStyle: { color: "#a3b1c6", marginBottom: 4 },
  cursor: { fill: "rgba(148,190,255,0.06)" },
};

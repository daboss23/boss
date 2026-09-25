import { motion } from "motion/react";
import { scoreGrade } from "../../lib/calcResults";
import { Card } from "../ui/Card";
import { CountUp } from "./shared";

export default function GradeRing({ score }: { score: number }) {
  const g = scoreGrade(score);
  const R = 52;
  const C = 2 * Math.PI * R;
  return (
    <Card>
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10">
        <div className="relative size-[132px] shrink-0">
          <svg viewBox="0 0 132 132" className="size-full -rotate-90" role="img" aria-label={`Pipeline health ${score} out of 100, grade ${g.grade}`}>
            <circle cx="66" cy="66" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
            <motion.circle
              cx="66"
              cy="66"
              r={R}
              fill="none"
              stroke={g.color}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              whileInView={{ strokeDashoffset: C * (1 - score / 100) }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{ filter: `drop-shadow(0 0 8px ${g.color}88)` }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-display text-[40px] font-black" style={{ color: g.color, textShadow: `0 0 24px ${g.color}66` }}>
              {g.grade}
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">Pipeline health</div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-[40px] leading-none font-semibold tracking-[-0.02em] text-white tabular">
              <CountUp value={score} format={(n) => String(Math.round(n))} />
              <span className="text-xl text-muted">/100</span>
            </span>
            <span className="rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: `${g.color}1f`, color: g.color }}>
              {g.label}
            </span>
          </div>
          <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-muted">
            Your pipeline health score is based on response time, coverage, missed calls, and follow-up behavior.
          </p>
        </div>
      </div>
    </Card>
  );
}

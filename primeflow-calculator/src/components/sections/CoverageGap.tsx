import { coveragePlan } from "../../lib/actionPlans";
import { isCovered } from "../../lib/calcResults";
import { DAYS, HIGH_CONV_HOURS } from "../../lib/constants";
import type { CalculatorInputs, CalculatorResults } from "../../lib/types";
import { Card, CardHeader } from "../ui/Card";
import { PlanSteps, Stat } from "./shared";

const CELL = {
  coveredHigh: "bg-cyan shadow-[0_0_10px_rgba(0,200,255,0.55)]",
  covered: "bg-cyan/35",
  missedHigh: "bg-leak/45 ring-1 ring-inset ring-leak/50",
  off: "bg-white/[0.045]",
};

const HOUR_TICKS = [0, 6, 9, 12, 16, 19, 23];
const tick = (h: number) => (h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`);

export default function CoverageGap({ r, inputs }: { r: CalculatorResults; inputs: CalculatorInputs }) {
  const high = new Set<number>(HIGH_CONV_HOURS);
  return (
    <Card id="coverage">
      <CardHeader icon="clock" title="Coverage gap" sub="When you're available vs. when leads are converting" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Your coverage" value={`${r.coveragePct}%`} tone={r.coveragePct < 40 ? "leak" : "warn"} note="of 168 hrs/week" />
        <Stat
          label="High-conv. window coverage"
          value={`${r.highConvCoverage}%`}
          tone={r.highConvCoverage < 50 ? "leak" : "win"}
          note="6–9am & 4–7pm slots"
        />
      </div>

      <div className="mt-7 overflow-x-auto pb-1">
        <div className="min-w-[520px]" role="img" aria-label={`Weekly coverage heatmap: open ${r.weeklyHours} of 168 hours`}>
          <div className="grid grid-cols-[34px_repeat(24,minmax(0,1fr))] gap-[3px]">
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="h-4 text-center text-[10px] text-muted tabular">
                {HOUR_TICKS.includes(h) ? tick(h) : ""}
              </div>
            ))}
            {DAYS.map((day, d) => (
              <div key={day} className="contents">
                <div className="flex items-center text-[11px] text-muted">{day}</div>
                {Array.from({ length: 24 }, (_, h) => {
                  const c = isCovered(inputs.activeDays, inputs.workStart, inputs.workEnd, d, h);
                  const hc = high.has(h);
                  const cls = c ? (hc ? CELL.coveredHigh : CELL.covered) : hc ? CELL.missedHigh : CELL.off;
                  return <div key={h} className={`h-[18px] rounded-[3px] ${cls}`} />;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-muted">
        {[
          [CELL.coveredHigh, "Covered, high-conversion"],
          [CELL.covered, "Covered"],
          [CELL.missedHigh, "High-conversion, uncovered"],
          [CELL.off, "Uncovered"],
        ].map(([cls, label]) => (
          <li key={label} className="flex items-center gap-2">
            <span className={`size-3 rounded-[3px] ${cls}`} />
            {label}
          </li>
        ))}
      </ul>
      <PlanSteps steps={coveragePlan(r, inputs)} />
    </Card>
  );
}

import { motion } from "motion/react";
import { missedCallsPlan } from "../../lib/actionPlans";
import { fmt, fmtInt } from "../../lib/formatters";
import type { CalculatorInputs, CalculatorResults } from "../../lib/types";
import { Card, CardHeader } from "../ui/Card";
import { PlanSteps, Stat } from "./shared";

export default function MissedCalls({ r, inputs }: { r: CalculatorResults; inputs: CalculatorInputs }) {
  const lost = r.revLostMissed - r.recoverableRev;
  return (
    <Card id="missed-calls">
      <CardHeader icon="phoneMissed" title="Missed calls" sub="Every missed call is a competitor's win" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Annual missed calls" value={fmtInt(r.annualMissed)} />
        <Stat label="Revenue lost" value={fmt(r.sym, r.revLostMissed)} tone="leak" />
        <Stat label="Recoverable (30%)" value={fmt(r.sym, r.recoverableRev)} tone="win" />
      </div>

      {r.revLostMissed > 0 && (
        <div className="mt-7">
          <div className="flex h-3 gap-[3px] overflow-hidden rounded-full">
            <motion.div
              className="h-full origin-left rounded-l-full bg-leak-deep/85"
              style={{ flex: 70 }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.div
              className="h-full origin-left rounded-r-full bg-win-deep shadow-[0_0_12px_rgba(34,197,94,0.6)]"
              style={{ flex: 30 }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
            />
          </div>
          <div className="mt-3 flex flex-col gap-1 text-[12.5px] sm:flex-row sm:justify-between sm:gap-4">
            <span className="text-muted">
              <span className="font-semibold text-leak">70%</span> Walking to Competitors · <span className="tabular">{fmt(r.sym, lost)}</span>
            </span>
            <span className="text-muted sm:text-right">
              <span className="font-semibold text-win">30%</span> Recoverable · <span className="tabular">{fmt(r.sym, r.recoverableRev)}</span>
            </span>
          </div>
        </div>
      )}
      <PlanSteps steps={missedCallsPlan(r, inputs)} title="Your rescue plan" />
    </Card>
  );
}

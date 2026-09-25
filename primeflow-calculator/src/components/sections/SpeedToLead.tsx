import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { speedPlan } from "../../lib/actionPlans";
import { speedCurve } from "../../lib/calcResults";
import { fmt } from "../../lib/formatters";
import type { CalculatorResults } from "../../lib/types";
import { Card, CardHeader } from "../ui/Card";
import { chartTooltip, PlanSteps, Stat } from "./shared";

export default function SpeedToLead({ r }: { r: CalculatorResults }) {
  const data = speedCurve(r);
  return (
    <Card id="speed">
      <CardHeader icon="bolt" title="Speed to lead" sub="Your response time vs. industry benchmarks" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Your response time" value={r.rt.label} tone={r.rt.multiplier < 0.5 ? "leak" : "warn"} note={`${Math.round(r.rt.multiplier * 100)}% of optimal performance`} />
        <Stat label="Revenue lost to slow response" value={fmt(r.sym, r.speedLeakage)} tone="leak" note="vs. replying inside a minute" />
      </div>
      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between text-[12px] text-muted">
          <span>Annual revenue at each response time</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-cyan" /> You today
          </span>
        </div>
        <div className="h-[190px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#7d8ba1", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fill: "#7d8ba1", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmt(r.sym, v)} width={52} />
              <Tooltip {...chartTooltip} formatter={(v) => [fmt(r.sym, Number(v)), "Annual revenue"]} />
              <Bar dataKey="revenue" radius={[6, 6, 2, 2]} maxBarSize={44}>
                {data.map((d) => (
                  <Cell key={d.name} fill={d.current ? "#00c8ff" : "rgba(148,190,255,0.16)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <PlanSteps steps={speedPlan(r)} />
    </Card>
  );
}

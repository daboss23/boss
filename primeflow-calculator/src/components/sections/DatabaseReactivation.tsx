import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { reactivationPlan } from "../../lib/actionPlans";
import { fmt, fmtInt } from "../../lib/formatters";
import type { CalculatorResults } from "../../lib/types";
import { Card, CardHeader, Kicker } from "../ui/Card";
import { chartTooltip, PlanSteps, Stat } from "./shared";

export default function DatabaseReactivation({ r }: { r: CalculatorResults }) {
  const chain = [
    { v: fmtInt(r.prospects), l: "Dormant leads", tone: "text-white" },
    { v: `${Math.round(r.reactivationResponseRate * 100)}%`, l: "Response rate", tone: "text-[#c9a2fa]" },
    { v: `${Math.round(r.reactivationQualRate * 100)}%`, l: "Qualified", tone: "text-[#c9a2fa]" },
    { v: `${Math.round(r.reactivationCloseRate * 100)}%`, l: "Close rate", tone: "text-[#c9a2fa]" },
    { v: fmt(r.sym, r.saleVal), l: "Deal value", tone: "text-[#c9a2fa]" },
  ];
  const funnel = [
    { l: "Responding", v: fmtInt(r.reactStep1), w: 1 },
    { l: "Qualified", v: fmtInt(r.reactStep2), w: r.reactStep1 ? r.reactStep2 / r.reactStep1 : 0 },
    { l: "Closed deals", v: fmtInt(r.reactStep3), w: r.reactStep1 ? r.reactStep3 / r.reactStep1 : 0 },
    { l: "Revenue", v: fmt(r.sym, r.reactRevenue), w: 1, money: true },
  ];

  return (
    <Card id="reactivation">
      <CardHeader icon="refresh" title="Database reactivation" sub="Your forgotten goldmine of pre-qualified prospects" />

      <div className="rounded-2xl bg-black/25 p-5 ring-1 ring-white/[0.06] sm:p-6">
        <Kicker className="mb-5 text-cyan-soft/90">Hidden revenue formula</Kicker>
        <div className="flex flex-wrap items-end gap-x-3 gap-y-4">
          {chain.map((c, i) => (
            <div key={c.l} className="flex items-end gap-3">
              <div>
                <div className={`text-2xl leading-none font-semibold tabular ${c.tone}`}>{c.v}</div>
                <div className="mt-1.5 text-[11.5px] text-muted">{c.l}</div>
              </div>
              <span className="pb-5 text-lg font-light text-muted/60">{i < chain.length - 1 ? "×" : "="}</span>
            </div>
          ))}
          <div>
            <div className="text-[30px] leading-none font-semibold text-win tabular [text-shadow:0_0_24px_rgba(74,222,128,0.35)]">
              {fmt(r.sym, r.reactRevenue)}
            </div>
            <div className="mt-1.5 text-[11.5px] text-muted">Hidden revenue</div>
          </div>
        </div>

        <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {funnel.map((f, i) => (
            <li key={f.l} className="relative overflow-hidden rounded-xl bg-white/[0.03] p-3.5 ring-1 ring-white/[0.06]">
              <div
                aria-hidden
                className={`absolute inset-x-0 bottom-0 h-1 ${f.money ? "bg-win" : "bg-purple/70"}`}
                style={{ width: `${Math.max(6, f.w * 100)}%` }}
              />
              <div className="text-[11px] text-muted">Step {i + 1}</div>
              <div className={`mt-1 text-xl font-semibold tabular ${f.money ? "text-win" : "text-white"}`}>{f.v}</div>
              <div className="mt-0.5 text-[12px] text-muted">{f.l}</div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Stat label="Reactivatable prospects" value={fmtInt(r.prospects)} />
        <Stat label="Acquisition cost already spent" value={fmt(r.sym, r.acquisitionCostSpent)} tone="leak" />
      </div>

      <div className="mt-7">
        <div className="mb-3 text-[12px] text-muted">Revenue potential by reactivation response rate</div>
        <div className="h-[170px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r.reactivationData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="rate" tick={{ fill: "#7d8ba1", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#7d8ba1", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmt(r.sym, v)} width={52} />
              <Tooltip {...chartTooltip} formatter={(v) => [fmt(r.sym, Number(v)), "Revenue"]} />
              <Bar dataKey="revenue" radius={[6, 6, 2, 2]} maxBarSize={56}>
                {r.reactivationData.map((d, i) => (
                  <Cell key={d.rate} fill={`rgba(168,85,247,${0.28 + i * 0.16})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <PlanSteps steps={reactivationPlan(r)} />
    </Card>
  );
}

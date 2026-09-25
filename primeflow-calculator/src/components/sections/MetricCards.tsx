import { fmt } from "../../lib/formatters";
import type { CalculatorResults } from "../../lib/types";
import { Kicker } from "../ui/Card";
import { CountUp } from "./shared";

/** One surface, three columns separated by hairlines. */
export default function MetricCards({ r }: { r: CalculatorResults }) {
  const items = [
    { label: "Annual revenue", value: r.annualRevenue, note: "from new leads", tone: "text-white", sub: "text-muted" },
    { label: "Marketing waste", value: r.annualWaste, note: "annually not converting", tone: "text-leak", sub: "text-muted" },
    { label: "Cost per acquisition", value: r.cpa, note: `→ ${fmt(r.sym, r.potentialCPA)} potential`, tone: "text-white", sub: "text-win" },
  ];
  return (
    <section className="surface grid overflow-hidden rounded-[22px] sm:grid-cols-3" aria-label="Headline metrics">
      {items.map((m, i) => (
        <div key={m.label} className={`p-6 sm:p-7 ${i > 0 ? "border-t border-white/[0.06] sm:border-t-0 sm:border-l" : ""}`}>
          <Kicker>{m.label}</Kicker>
          <div className={`mt-3 text-[32px] leading-none font-semibold tracking-[-0.02em] tabular ${m.tone}`}>
            <CountUp value={m.value} format={(n) => fmt(r.sym, n)} />
          </div>
          <div className={`mt-2 text-[12.5px] ${m.sub}`}>{m.note}</div>
        </div>
      ))}
    </section>
  );
}

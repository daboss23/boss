import { topOpportunities } from "../../lib/actionPlans";
import { fmt } from "../../lib/formatters";
import type { CalculatorInputs, CalculatorResults } from "../../lib/types";
import { Card, CardHeader } from "../ui/Card";
import { Icon } from "../ui/Icon";

const PILLS = [
  "bg-gold/[0.12] text-gold-bright ring-gold/30",
  "bg-cyan/10 text-cyan-soft ring-cyan/25",
  "bg-white/[0.05] text-soft ring-white/10",
];
const PILL_TEXT = ["Biggest lever", "Next up", "Also worth it"];

export default function TopImpactOpportunities({ r, inputs }: { r: CalculatorResults; inputs: CalculatorInputs }) {
  const items = topOpportunities(r, inputs);
  const max = items[0]?.value || 1;
  return (
    <Card>
      <CardHeader icon="target" title="Top impact opportunities" sub="Ranked by what each one is worth to your business" tone="gold" />
      <ol className="space-y-2">
        {items.map((o, i) => (
          <li key={o.key}>
            <a
              href={`#${o.section}`}
              className="group relative block overflow-hidden rounded-2xl bg-white/[0.025] p-4 ring-1 ring-white/[0.07] transition-[background-color,box-shadow] duration-200 hover:bg-white/[0.045] hover:ring-white/[0.12] sm:p-5"
            >
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 bg-linear-to-r from-gold/[0.07] to-transparent"
                style={{ width: `${Math.max(8, (o.value / max) * 100)}%` }}
              />
              <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="w-6 text-lg font-semibold text-muted tabular">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">{o.title}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold tracking-[0.08em] uppercase ring-1 ${PILLS[i]}`}>
                      {PILL_TEXT[i]}
                    </span>
                  </div>
                  <div className="mt-1 text-[13px] text-muted">{o.line}</div>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-xl font-semibold text-white tabular">{fmt(r.sym, o.value)}</span>
                  <Icon name="arrowRight" size={16} className="text-muted transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </Card>
  );
}

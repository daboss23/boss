import { compareToIndustry, countryName } from "../../lib/research";
import { fmt } from "../../lib/formatters";
import type { CalculatorInputs, CalculatorResults, PublicResearch, ResearchComparison } from "../../lib/types";
import { Card, CardHeader } from "../ui/Card";
import { Icon } from "../ui/Icon";

function show(c: ResearchComparison, sym: string, v: number) {
  if (c.unit === "percent") return `${+v.toFixed(1)}%`;
  if (c.unit === "minutes") return v >= 1440 ? `${+(v / 1440).toFixed(1)} days` : v >= 60 ? `${+(v / 60).toFixed(1)} ${v === 60 ? "hr" : "hrs"}` : `${Math.round(v)} min`;
  return fmt(sym, v);
}

export default function HowYouCompare({ inputs, r, research }: { inputs: CalculatorInputs; r: CalculatorResults; research: PublicResearch | null }) {
  const rows = compareToIndustry(inputs, r, research);
  if (!rows.length || !research) return null;
  const seg = research.segment ?? research.industry ?? "your industry";

  return (
    <Card>
      <CardHeader icon="chart" title="How you compare" sub={`Your numbers next to ${seg} in ${countryName(research.country)}`} />
      <ul className="divide-y divide-white/[0.06]">
        {rows.map((c) => {
          const better = c.higherIsBetter ? c.yours >= c.industry : c.yours <= c.industry;
          const max = Math.max(c.yours, c.industry) || 1;
          return (
            <li key={c.metric} className="grid gap-4 py-5 first:pt-0 last:pb-0 md:grid-cols-[1.2fr_2fr_1.2fr] md:items-center">
              <div>
                <div className="text-sm font-medium text-white">{c.label}</div>
                <div className={`mt-1 inline-flex items-center gap-1.5 text-[12px] font-semibold ${better ? "text-win" : "text-leak"}`}>
                  <Icon name={better ? "check" : "alert"} size={13} strokeWidth={2.2} />
                  {better ? "Ahead of industry" : "Behind industry"}
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { k: "You", v: c.yours, color: better ? "#4ade80" : "#f87171" },
                  { k: "Industry", v: c.industry, color: "rgba(163,177,198,0.55)" },
                ].map((b) => (
                  <div key={b.k} className="flex items-center gap-3 text-[12.5px]">
                    <span className="w-14 shrink-0 text-muted">{b.k}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                      <div className="h-full rounded-full" style={{ width: `${(b.v / max) * 100}%`, background: b.color }} />
                    </div>
                    <span className="w-20 shrink-0 text-right font-semibold text-white tabular">{show(c, r.sym, b.v)}</span>
                  </div>
                ))}
              </div>
              <div className="text-sm text-soft md:text-right">
                {c.gapValue ? (
                  <>
                    Closing half that gap is worth <span className="font-semibold text-win">{fmt(r.sym, c.gapValue)}</span> a year.
                  </>
                ) : (
                  <span className="text-muted">Keep it there.</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-[12px] text-muted">
        Based on live industry research for {seg} in {countryName(research.country)}.
      </p>
    </Card>
  );
}

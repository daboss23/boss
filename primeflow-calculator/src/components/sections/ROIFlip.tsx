import { ROI_SCENARIO_SHARE } from "../../lib/constants";
import { fmt } from "../../lib/formatters";
import type { CalculatorResults } from "../../lib/types";
import { Icon } from "../ui/Icon";
import { CountUp } from "./shared";

export default function ROIFlip({ r }: { r: CalculatorResults }) {
  return (
    <section className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.02))] p-6 ring-1 ring-win/20 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 size-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(74,222,128,0.14),transparent)]" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-win uppercase">
          <Icon name="trend" size={14} strokeWidth={2} /> What if you recovered just 20%?
        </div>
        <div className="mt-5 grid items-center gap-6 md:grid-cols-[auto_1fr] md:gap-12">
          <div>
            <div className="font-display text-[clamp(40px,7vw,60px)] leading-none font-black text-win tabular [text-shadow:0_0_36px_rgba(74,222,128,0.4)]">
              <CountUp value={r.totalLeakage * ROI_SCENARIO_SHARE} format={(n) => fmt(r.sym, n)} />
            </div>
            <div className="mt-2 text-sm text-muted">added to your annual revenue</div>
          </div>
          <p className="max-w-[46ch] text-[15px] leading-relaxed text-soft">
            Businesses using PrimeFlowAI typically recover <strong className="font-semibold text-win">30–60%</strong> of their hidden revenue
            within the first 90 days, without increasing their ad spend.
          </p>
        </div>
      </div>
    </section>
  );
}

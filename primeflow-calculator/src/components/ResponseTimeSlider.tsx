import { RESPONSE_TIMES } from "../lib/constants";

/** Nine response bands on one track, with a live readout of what the band costs. */
export default function ResponseTimeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const rt = RESPONSE_TIMES[value] ?? RESPONSE_TIMES[4]!;
  const pct = Math.round(rt.multiplier * 100);
  const fill = `${(value / (RESPONSE_TIMES.length - 1)) * 100}%`;
  const tone = pct >= 80 ? "text-win" : pct >= 50 ? "text-leak-yellow" : "text-leak";

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-[13px] font-medium text-soft" id="rt-label">
            Average time to respond to a new lead
          </div>
          <div className="mt-1 font-display text-2xl font-bold tracking-wide text-white tabular">{rt.label}</div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-semibold tabular ${tone}`}>{pct}%</div>
          <div className="text-[11px] text-muted">of optimal conversion</div>
        </div>
      </div>
      <input
        type="range"
        className="range"
        min={0}
        max={RESPONSE_TIMES.length - 1}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-labelledby="rt-label"
        aria-valuetext={`${rt.label}, ${pct}% of optimal conversion`}
        style={{ ["--fill" as string]: fill }}
      />
      <div className="mt-1 grid grid-cols-9 text-center">
        {RESPONSE_TIMES.map((b, i) => (
          <button
            key={b.label}
            type="button"
            tabIndex={-1}
            onClick={() => onChange(i)}
            className={`py-1.5 text-[10.5px] whitespace-nowrap transition-colors sm:text-[11px] ${
              i === value ? "font-semibold text-cyan-soft" : "text-muted hover:text-soft"
            } ${i % 2 === 1 ? "max-sm:invisible" : ""}`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

import type { Calculator } from "../hooks/useCalculator";
import { CURRENCIES, DAYS, HOURS, INDUSTRIES } from "../lib/constants";
import type { Industry } from "../lib/types";
import ResponseTimeSlider from "./ResponseTimeSlider";
import StepFooter, { missingList } from "./StepFooter";
import { Card } from "./ui/Card";
import { Label, NumberField, SelectField, SourceBadge, TextField, ToggleChip } from "./ui/Field";

export function Group({ title, children, first = false }: { title: string; children: React.ReactNode; first?: boolean }) {
  return (
    <fieldset className={first ? "" : "mt-9 border-t border-white/[0.06] pt-8"}>
      <legend className="float-left mb-5 w-full text-[11px] font-semibold tracking-[0.16em] text-cyan-soft/90 uppercase">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

export default function Step1BusinessOverview({ calc }: { calc: Calculator }) {
  const { form, setField, sources, step1Errors: e } = calc;
  const sym = form.currency;

  return (
    <div>
      <Card>
        <Group title="About the business" first>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Business name"
              placeholder="Optional"
              value={form.businessName ?? ""}
              onChange={(ev) => setField("businessName", ev.target.value)}
              source={sources.businessName}
              error={e.businessName}
              autoComplete="organization"
              maxLength={120}
            />
            <SelectField
              label="Industry"
              value={form.industry}
              onChange={(ev) => calc.chooseIndustry(ev.target.value as Industry | "")}
              source={sources.industry}
              error={e.industry}
            >
              <option value="">Optional</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </SelectField>
          </div>
        </Group>

        <Group title="Revenue and spend">
          <div className="mb-5">
            <Label aside={<SourceBadge source={sources.currency} />}>Currency</Label>
            <div role="radiogroup" aria-label="Currency" className="inline-flex rounded-xl bg-white/[0.035] p-1 ring-1 ring-white/[0.08]">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={form.currency === c}
                  onClick={() => setField("currency", c)}
                  className={`h-10 w-14 rounded-lg text-[15px] font-semibold transition-[background-color,color,box-shadow] duration-200 ${
                    form.currency === c
                      ? "bg-cyan/[0.16] text-white shadow-[inset_0_0_0_1px_rgba(0,200,255,0.5)]"
                      : "text-muted hover:text-soft"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField
              label="Average sale value"
              prefix={sym}
              placeholder="2,500"
              value={form.avgSaleValue}
              onValue={(v) => setField("avgSaleValue", v)}
              source={sources.avgSaleValue}
              error={e.avgSaleValue}
            />
            <NumberField
              label="New leads per month"
              placeholder="50"
              value={form.monthlyLeadVolume}
              onValue={(v) => setField("monthlyLeadVolume", v)}
              source={sources.monthlyLeadVolume}
              error={e.monthlyLeadVolume}
            />
            <NumberField
              className="sm:col-span-2"
              label="Monthly marketing spend"
              prefix={sym}
              placeholder="3,000"
              value={form.monthlyMarketingSpend}
              onValue={(v) => setField("monthlyMarketingSpend", v)}
              source={sources.monthlyMarketingSpend}
              error={e.monthlyMarketingSpend}
              hint="Ads, agencies and lead sources. Enter 0 if none."
            />
          </div>
        </Group>

        <Group title="Speed to lead">
          <ResponseTimeSlider value={form.responseTimeIdx} onChange={(v) => setField("responseTimeIdx", v)} />
        </Group>

        <Group title="Working hours">
          <div className="grid grid-cols-2 gap-5">
            <SelectField
              label="Opens"
              value={form.workStart}
              onChange={(ev) => calc.setHours({ workStart: Number(ev.target.value) })}
              source={sources.hours}
            >
              {HOURS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </SelectField>
            <SelectField label="Closes" value={form.workEnd} onChange={(ev) => calc.setHours({ workEnd: Number(ev.target.value) })}>
              {HOURS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </SelectField>
          </div>
          {e.hours && (
            <p role="alert" className="mt-2 text-[12.5px] text-leak">
              {e.hours}
            </p>
          )}
          <div className="mt-5">
            <Label>Days you're open</Label>
            <div className="grid grid-cols-7 gap-1.5 sm:flex sm:gap-2">
              {DAYS.map((d, i) => (
                <ToggleChip
                  key={d}
                  active={Boolean(form.activeDays[i])}
                  className="px-0! text-[12px] sm:w-14 sm:text-[13px]"
                  aria-label={d}
                  onClick={() => {
                    const next = [...form.activeDays];
                    next[i] = !next[i];
                    calc.setHours({ activeDays: next });
                  }}
                >
                  {d}
                </ToggleChip>
              ))}
            </div>
            {e.activeDays && (
              <p role="alert" className="mt-2 text-[12.5px] text-leak">
                {e.activeDays}
              </p>
            )}
          </div>
        </Group>
      </Card>

      <StepFooter
        onNext={() => calc.go("pipeline")}
        nextLabel="Next: pipeline behavior"
        disabled={!calc.canContinue1}
        missing={missingList(calc.rawStep1Errors)}
      />
    </div>
  );
}

import type { Calculator } from "../hooks/useCalculator";
import { CHANNELS, FOLLOW_UP_OPTIONS, REACTIVATION_DEFAULTS } from "../lib/constants";
import { Group } from "./Step1BusinessOverview";
import StepFooter, { missingList } from "./StepFooter";
import { Card } from "./ui/Card";
import { Label, NumberField, ToggleChip } from "./ui/Field";

export default function Step2PipelineBehavior({ calc }: { calc: Calculator }) {
  const { form, setField, sources, step2Errors: e } = calc;

  return (
    <div>
      <Card>
        <Group title="Pipeline behavior" first>
          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField
              label="Unanswered inbound calls per week"
              placeholder="8"
              value={form.missedCallsWeekly}
              onValue={(v) => setField("missedCallsWeekly", v)}
              source={sources.missedCallsWeekly}
              error={e.missedCallsWeekly}
            />
            <NumberField
              label="Lead-to-customer conversion rate"
              suffix="%"
              placeholder="15"
              value={form.conversionRate}
              onValue={(v) => setField("conversionRate", v)}
              source={sources.conversionRate}
              error={e.conversionRate}
            />
          </div>
        </Group>

        <Group title="Follow-up behavior">
          <Label>Follow-up attempts per lead</Label>
          <div role="radiogroup" aria-label="Follow-up attempts per lead" className="grid grid-cols-6 gap-1.5 sm:flex sm:gap-2">
            {FOLLOW_UP_OPTIONS.map((n) => (
              <ToggleChip
                key={n}
                role="radio"
                aria-checked={form.followUpAttempts === n}
                active={form.followUpAttempts === n}
                onClick={() => setField("followUpAttempts", n)}
                className="px-0! tabular sm:w-14"
              >
                {n}
              </ToggleChip>
            ))}
          </div>
          <div className="mt-6">
            <Label>Follow-up channels</Label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => {
                const active = form.followUpChannels.includes(ch);
                return (
                  <ToggleChip
                    key={ch}
                    active={active}
                    onClick={() =>
                      setField("followUpChannels", active ? form.followUpChannels.filter((c) => c !== ch) : [...form.followUpChannels, ch])
                    }
                  >
                    {ch}
                  </ToggleChip>
                );
              })}
            </div>
          </div>
        </Group>

        <Group title="Reactivation assumptions">
          <p className="mb-5 max-w-[60ch] text-sm leading-relaxed text-muted">
            We'll use these to calculate your dormant lead revenue potential. Defaults are realistic industry averages. Adjust them if you
            know your numbers.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <NumberField
              label="Response rate"
              suffix="%"
              value={form.reactResponseRate}
              onValue={(v) => setField("reactResponseRate", v)}
              source={sources.reactResponseRate}
              error={e.reactResponseRate}
              hint={`Default: ${REACTIVATION_DEFAULTS.response}%`}
            />
            <NumberField
              label="Qualification rate"
              suffix="%"
              value={form.reactQualRate}
              onValue={(v) => setField("reactQualRate", v)}
              source={sources.reactQualRate}
              error={e.reactQualRate}
              hint={`Default: ${REACTIVATION_DEFAULTS.qualified}%`}
            />
            <NumberField
              label="Close rate"
              suffix="%"
              value={form.reactCloseRate}
              onValue={(v) => setField("reactCloseRate", v)}
              source={sources.reactCloseRate}
              error={e.reactCloseRate}
              hint={`Default: ${REACTIVATION_DEFAULTS.close}%`}
            />
          </div>
        </Group>
      </Card>

      <StepFooter
        onBack={() => calc.go("business")}
        onNext={() => calc.go("gate")}
        nextLabel="Calculate my profit recovery"
        disabled={!calc.canContinue2}
        missing={missingList(calc.rawStep2Errors)}
      />
    </div>
  );
}

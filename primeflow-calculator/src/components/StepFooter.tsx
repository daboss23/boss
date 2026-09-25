import type { FieldErrors } from "../lib/validation";
import { CtaButton, GhostButton } from "./ui/Button";

const NAMES: Partial<Record<keyof FieldErrors, string>> = {
  avgSaleValue: "average sale value",
  monthlyLeadVolume: "monthly leads",
  monthlyMarketingSpend: "marketing spend",
  hours: "working hours",
  activeDays: "open days",
  missedCallsWeekly: "missed calls",
  conversionRate: "conversion rate",
  reactResponseRate: "response rate",
  reactQualRate: "qualification rate",
  reactCloseRate: "close rate",
  businessName: "business name",
  industry: "industry",
};

export function missingList(errors: FieldErrors): string[] {
  return (Object.keys(errors) as (keyof FieldErrors)[]).map((k) => NAMES[k] ?? String(k));
}

/** Sticky-feeling step footer. The disabled state always says what's missing. */
export default function StepFooter({
  onNext,
  onBack,
  nextLabel,
  disabled,
  missing,
}: {
  onNext: () => void;
  onBack?: () => void;
  nextLabel: string;
  disabled: boolean;
  missing: string[];
}) {
  return (
    <div className="mt-6">
      <div className="flex gap-3">
        {onBack && (
          <GhostButton icon="arrowLeft" onClick={onBack} className="h-14 shrink-0 sm:h-[60px]" aria-label="Back">
            <span className="max-sm:hidden">Back</span>
          </GhostButton>
        )}
        <CtaButton block onClick={onNext} disabled={disabled}>
          {nextLabel}
        </CtaButton>
      </div>
      <p className="mt-3 min-h-5 text-center text-[12.5px] text-muted" aria-live="polite">
        {disabled && missing.length > 0 ? `Still needed: ${missing.join(", ")}.` : ""}
      </p>
    </div>
  );
}

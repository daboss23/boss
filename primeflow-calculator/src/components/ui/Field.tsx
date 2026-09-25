import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import type { FieldSource } from "../../lib/types";

const SOURCE_COPY: Record<FieldSource, { label: string; dot: string; text: string }> = {
  site: { label: "Found on your site", dot: "bg-cyan", text: "text-cyan-soft" },
  industry: { label: "Industry average", dot: "bg-gold", text: "text-[#e6c766]" },
  research: { label: "Industry data", dot: "bg-purple", text: "text-[#c9a2fa]" },
};

export function SourceBadge({ source }: { source?: FieldSource }) {
  if (!source) return null;
  const s = SOURCE_COPY[source];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium whitespace-nowrap ${s.text}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function Label({ htmlFor, children, aside }: { htmlFor?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2 flex min-h-5 items-center justify-between gap-3">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-soft">
        {children}
      </label>
      {aside}
    </div>
  );
}

const shell =
  "flex h-12 items-center rounded-xl bg-white/[0.035] ring-1 ring-inset transition-[box-shadow,background-color] duration-200 focus-within:bg-white/[0.05] focus-within:ring-2 focus-within:ring-cyan/70 focus-within:shadow-[0_0_0_4px_rgba(0,200,255,0.08)]";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label: string;
  error?: string;
  hint?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  source?: FieldSource;
}

export function TextField({ label, error, hint, prefix, suffix, source, className = "", ...rest }: InputProps) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className={`${shell} ${error ? "ring-leak/60" : "ring-white/10 hover:ring-white/20"}`}>
        {prefix && <span className="pl-4 text-[15px] text-muted select-none">{prefix}</span>}
        <input
          id={id}
          {...rest}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errId : undefined}
          className={`tabular h-full w-full min-w-0 bg-transparent text-[15px] text-text placeholder:text-muted/70 focus:outline-none ${prefix ? "pl-1.5" : "pl-4"} ${suffix ? "pr-1.5" : "pr-4"}`}
        />
        {suffix && <span className="pr-4 text-[15px] text-muted select-none">{suffix}</span>}
      </div>
      <FieldFoot id={errId} error={error} hint={hint} source={source} />
    </div>
  );
}

/** Under-field row: an error replaces everything; otherwise source badge, then hint. */
function FieldFoot({ id, error, hint, source }: { id?: string; error?: string; hint?: ReactNode; source?: FieldSource }) {
  if (error)
    return (
      <p id={id} role="alert" className="mt-1.5 text-[12.5px] text-leak">
        {error}
      </p>
    );
  if (!hint && !source) return null;
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
      <SourceBadge source={source} />
      {hint && <span>{hint}</span>}
    </p>
  );
}

/** Numeric input that keeps the raw string (so it can be empty) and uses a decimal keypad on mobile. */
export function NumberField(props: InputProps & { value: string; onValue: (v: string) => void }) {
  const { onValue, ...rest } = props;
  return (
    <TextField
      inputMode="decimal"
      autoComplete="off"
      {...rest}
      onChange={(e) => onValue(e.target.value.replace(/[^\d.,]/g, ""))}
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  source?: FieldSource;
  children: ReactNode;
}

export function SelectField({ label, error, source, children, className = "", ...rest }: SelectProps) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className={`${shell} relative ${error ? "ring-leak/60" : "ring-white/10 hover:ring-white/20"}`}>
        <select
          id={id}
          {...rest}
          className="h-full w-full cursor-pointer appearance-none bg-transparent pr-10 pl-4 text-[15px] text-text focus:outline-none [&>option]:bg-ink-850"
        >
          {children}
        </select>
        <svg className="pointer-events-none absolute right-4 size-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <FieldFoot error={error} source={source} />
    </div>
  );
}

export function ToggleChip({
  active,
  onClick,
  children,
  className = "",
  ...rest
}: { active: boolean; onClick: () => void; children: ReactNode; className?: string } & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      {...rest}
      className={`h-11 rounded-xl px-4 text-[13px] font-semibold transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out-strong)] active:scale-[0.97] ${
        active
          ? "bg-cyan/[0.14] text-white shadow-[inset_0_0_0_1px_rgba(0,200,255,0.55),0_0_20px_-6px_rgba(0,200,255,0.6)]"
          : "bg-white/[0.035] text-muted shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/[0.06] hover:text-soft"
      } ${className}`}
    >
      {children}
    </button>
  );
}

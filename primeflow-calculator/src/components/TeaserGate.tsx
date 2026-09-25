import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import type { Calculator } from "../hooks/useCalculator";
import { fmtThousands } from "../lib/formatters";
import type { FieldErrors } from "../lib/validation";
import { CtaButton, TextButton } from "./ui/Button";
import { Bezel, Card } from "./ui/Card";
import { TextField } from "./ui/Field";
import { Icon } from "./ui/Icon";
import { EASE } from "./ui/Reveal";
import { LEAK_COLORS } from "./sections/shared";

export default function TeaserGate({ calc }: { calc: Calculator }) {
  const r = calc.preview;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  if (!r) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const errs = await calc.submitLead(name, email);
    setBusy(false);
    setErrors(errs ?? {});
  };

  return (
    <div className="space-y-5">
      <Bezel coreClassName="relative overflow-hidden px-6 py-10 text-center sm:px-10 sm:py-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(239,68,68,0.16),transparent_70%)]" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-leak uppercase">
            <Icon name="alert" size={14} strokeWidth={2} />
            Your pipeline is leaking an estimated
          </div>

          <div className="relative mx-auto mt-5 w-fit">
            {/* The real figure, rounded to the nearest thousand, blurred and hidden from assistive tech and selection. */}
            <div
              aria-hidden
              className="font-display text-[clamp(44px,10vw,84px)] leading-none font-black tracking-tight text-white select-none tabular"
              style={{ filter: "blur(11px)", textShadow: "0 0 40px rgba(239,68,68,0.55)" }}
            >
              {fmtThousands(r.sym, r.totalLeakage)}
            </div>
            <div className="absolute inset-0 grid place-items-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-ink-950/70 px-4 py-2 text-[13px] font-semibold text-soft ring-1 ring-white/10">
                <Icon name="lock" size={15} /> Enter details to reveal
              </span>
            </div>
          </div>

          <p className="mt-5 text-[15px] text-soft">
            per year, <span className="font-semibold text-leak">{r.leakPct}%</span> of your potential revenue
          </p>

          <div aria-hidden className="mx-auto mt-6 flex h-2 max-w-[380px] gap-[3px] overflow-hidden rounded-full blur-[4px]">
            {r.leakageBreakdown.map((b, i) => (
              <div key={b.key} style={{ flex: Math.max(b.pct, 2), background: LEAK_COLORS[i] }} />
            ))}
          </div>
        </div>
      </Bezel>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}>
        <Card>
          <form onSubmit={submit} noValidate>
            <div className="mb-6 flex items-start gap-3.5">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-cyan/10 text-cyan-soft ring-1 ring-cyan/20">
                <Icon name="unlock" size={18} />
              </span>
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.015em] text-white">Unlock your full profit recovery report</h2>
                <p className="mt-1.5 max-w-[56ch] text-sm leading-relaxed text-muted">
                  Enter your details to reveal the full breakdown: your AI diagnosis, recovery plan, and downloadable report.
                </p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="First name"
                placeholder="Priya"
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                maxLength={80}
              />
              <TextField
                label="Business email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="priya@harbourdental.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
            </div>
            <CtaButton type="submit" block className="mt-6" disabled={busy} aria-busy={busy}>
              {busy ? "Unlocking..." : "Reveal my profit recovery"}
            </CtaButton>
            <p className="mt-3 text-center text-[12.5px] text-muted">No spam. No commitment. Just your numbers.</p>
          </form>
        </Card>
      </motion.div>

      <div className="text-center">
        <TextButton onClick={() => calc.go("pipeline")}>Change my numbers</TextButton>
      </div>
    </div>
  );
}

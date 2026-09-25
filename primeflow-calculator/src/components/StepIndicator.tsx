import { motion } from "motion/react";
import { Icon } from "./ui/Icon";

const STEPS = ["Business", "Pipeline", "Report"] as const;

/** Three labelled segments with a travelling fill. `current` is 1-based. */
export default function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Progress" className="mx-auto mb-8 w-full max-w-[560px]">
      <ol className="grid grid-cols-3 gap-2 sm:gap-3">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <li key={label} aria-current={active ? "step" : undefined} className="min-w-0">
              <div className="relative h-[3px] overflow-hidden rounded-full bg-white/[0.08]">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-cyan to-cyan-soft shadow-[0_0_12px_rgba(0,200,255,0.7)]"
                  initial={false}
                  animate={{ width: done || active ? "100%" : "0%", opacity: active ? 1 : done ? 0.55 : 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div
                className={`mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase sm:text-xs ${
                  active ? "text-white" : done ? "text-cyan-soft" : "text-muted"
                }`}
              >
                {done ? (
                  <Icon name="check" size={13} strokeWidth={2.2} />
                ) : (
                  <span className="tabular text-[10px] opacity-70">{n}</span>
                )}
                <span className="truncate">
                  <span className="max-sm:hidden">Your </span>
                  {label.toLowerCase()}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

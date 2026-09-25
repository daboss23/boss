import { motion } from "motion/react";
import { EASE } from "./ui/Reveal";

/**
 * PROFIT (pink neon) · RECOVERY (cyan neon, offset flicker) / ENGINE (static gold).
 * `compact` is the in-flow size once the prospect has started.
 */
export default function AnimatedHeadline({ compact = false }: { compact?: boolean }) {
  const row1 = compact ? "text-[clamp(22px,4.4vw,34px)]" : "text-[clamp(30px,7.4vw,74px)]";
  const row2 = compact ? "text-[clamp(14px,2.4vw,18px)] tracking-[0.62em]" : "text-[clamp(18px,3.6vw,36px)] tracking-[0.58em]";
  const word = (delay: number) => ({
    initial: { opacity: 0, y: 14, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.9, ease: EASE, delay },
  });

  return (
    <h1 className="font-display leading-none select-none" aria-label="Profit Recovery Engine">
      <span aria-hidden className={`flex flex-wrap items-baseline justify-center gap-x-[0.32em] font-black tracking-[0.04em] ${row1}`}>
        <motion.span {...word(0.15)} className="neon-pink inline-block">
          PROFIT
        </motion.span>
        <motion.span {...word(0.28)} className="neon-cyan inline-block">
          RECOVERY
        </motion.span>
      </span>
      <motion.span
        aria-hidden
        {...word(0.45)}
        className={`gold-static mt-[0.5em] block pl-[0.58em] text-center font-bold ${row2}`}
      >
        ENGINE
      </motion.span>
    </h1>
  );
}

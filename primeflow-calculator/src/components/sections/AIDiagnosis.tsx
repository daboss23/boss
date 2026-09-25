import { AnimatePresence, motion } from "motion/react";
import type { Diagnosis } from "../../hooks/useCalculator";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";

export default function AIDiagnosis({ diagnosis }: { diagnosis: Diagnosis }) {
  const loading = diagnosis.status !== "ready";
  return (
    <Card className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_100%_at_0%_0%,rgba(168,85,247,0.12),transparent_60%)]" />
      <div className="relative">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-purple/10 text-[#c9a2fa] ring-1 ring-purple/25">
            <Icon name="spark" size={18} />
          </span>
          <h2 className="text-[19px] font-semibold tracking-[-0.015em] text-white">AI diagnosis</h2>
          <span className="ml-auto inline-flex items-center gap-2 text-[12px] text-muted" title={loading ? "Analyzing" : "Ready"}>
            <span
              className={`size-2 rounded-full ${loading ? "bg-leak-yellow shadow-[0_0_10px_#eab308] [animation:blink_1.2s_ease-in-out_infinite]" : "bg-win-deep shadow-[0_0_10px_#22c55e]"}`}
            />
            <span className="max-sm:sr-only">{loading ? "Analyzing your pipeline data..." : "Written for your numbers"}</span>
          </span>
        </div>
        <div aria-live="polite" aria-busy={loading}>
          <AnimatePresence mode="wait" initial={false}>
            {loading ? (
              <motion.div key="skeleton" exit={{ opacity: 0 }} className="space-y-3 py-1" aria-hidden>
                {["100%", "96%", "98%", "88%", "62%"].map((w, i) => (
                  <div key={i} className="skeleton h-3.5" style={{ width: w }} />
                ))}
              </motion.div>
            ) : (
              <motion.p
                key="text"
                initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-[70ch] text-[16.5px] leading-[1.75] text-[#dde4f0]"
              >
                {diagnosis.text}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { Icon } from "./ui/Icon";

export default function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(onDismiss, 6000);
    return () => window.clearTimeout(id);
  }, [message, onDismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(20px,env(safe-area-inset-bottom))] z-40 flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
            className="pointer-events-auto flex max-w-[520px] items-center gap-3 rounded-full bg-ink-800/95 py-2.5 pr-2.5 pl-4 text-sm text-soft shadow-[0_18px_50px_-12px_rgba(0,0,0,0.9)] ring-1 ring-purple/30 backdrop-blur-md"
          >
            <span className="size-2 shrink-0 rounded-full bg-purple shadow-[0_0_10px_#a855f7]" />
            <span className="min-w-0">{message}</span>
            <button type="button" onClick={onDismiss} className="grid size-7 shrink-0 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-white" aria-label="Dismiss">
              <Icon name="x" size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

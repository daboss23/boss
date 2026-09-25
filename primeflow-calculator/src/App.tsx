import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { lazy, Suspense, useEffect, useState } from "react";
import AnimatedHeadline from "./components/AnimatedHeadline";
import LandingSections, { Footer } from "./components/LandingSections";
import Logo from "./components/Logo";
import ReportView from "./components/ReportView";
import Step0WebsiteScan from "./components/Step0WebsiteScan";
import Step1BusinessOverview from "./components/Step1BusinessOverview";
import Step2PipelineBehavior from "./components/Step2PipelineBehavior";
import StepIndicator from "./components/StepIndicator";
import SynthwaveBackground from "./components/SynthwaveBackground";
import TeaserGate from "./components/TeaserGate";
import ThinkingAnimation from "./components/ThinkingAnimation";
import Toast from "./components/Toast";
import { Icon } from "./components/ui/Icon";
import { EASE } from "./components/ui/Reveal";
import { useCalculator, type Stage } from "./hooks/useCalculator";

const ResultsPage = lazy(() => import("./components/ResultsPage"));

function reportIdFromPath(path: string) {
  return path.match(/^\/r\/([0-9a-f-]{36})\/?$/i)?.[1] ?? null;
}

export default function App() {
  // Evaluated once: after submit the URL becomes /r/:id without remounting.
  const [initialReport] = useState(() => reportIdFromPath(window.location.pathname));

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-950 focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      {initialReport ? <ReportView id={initialReport} /> : <Calculator />}
    </MotionConfig>
  );
}

const STEP_OF: Partial<Record<Stage, 1 | 2 | 3>> = { business: 1, pipeline: 2, gate: 3 };

function Calculator() {
  const calc = useCalculator();
  const { stage } = calc;
  const landing = stage === "scan";
  const intensity = landing ? 1 : stage === "results" ? 0.35 : 0.55;

  // Preload the results chunk (and Recharts) while the prospect is on the gate.
  useEffect(() => {
    if (stage === "gate" || stage === "thinking") void import("./components/ResultsPage");
  }, [stage]);

  const startFromLanding = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => document.getElementById("site-url")?.focus({ preventScroll: true }), 500);
  };

  return (
    <div className="grain relative min-h-dvh">
      <SynthwaveBackground intensity={intensity} />

      <main id="main" className="relative z-10 w-full max-w-full overflow-x-clip">
        <header
          className={`mx-auto flex max-w-[1120px] flex-col items-center px-4 text-center sm:px-6 ${
            landing ? "min-h-[100dvh] justify-center pt-10 pb-16 sm:pt-12" : "pt-8 pb-10 sm:pt-10"
          }`}
        >
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className={landing ? "mb-8 sm:mb-10" : "mb-5"}
          >
            <Logo size={landing ? "lg" : "sm"} />
          </motion.div>

          <AnimatedHeadline compact={!landing} />

          {landing && (
            <>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.6 }}
                className="mx-auto mt-7 max-w-[46ch] text-[15px] leading-relaxed text-white/90 sm:text-base"
              >
                Uncover exactly how much revenue is hiding in your pipeline, and how to claim it back.
              </motion.p>
              <motion.div
                className="mt-10 w-full"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1, ease: EASE, delay: 0.75 }}
              >
                <Step0WebsiteScan calc={calc} />
              </motion.div>
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.1 }}
                className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-soft"
              >
                {["About 90 seconds", "Built on your real numbers", "Private, shareable report"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Icon name="check" size={14} strokeWidth={2.2} className="text-cyan" />
                    {t}
                  </li>
                ))}
              </motion.ul>
            </>
          )}
        </header>

        {landing ? (
          <LandingSections onStart={startFromLanding} />
        ) : (
          <>
            <div className={`mx-auto px-4 pb-24 sm:px-6 ${stage === "results" ? "max-w-[1040px]" : "max-w-[760px]"}`}>
              {STEP_OF[stage] && <StepIndicator current={STEP_OF[stage]!} />}
              <AnimatePresence mode="wait">
                <motion.div
                  key={stage}
                  initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  {stage === "business" && <Step1BusinessOverview calc={calc} />}
                  {stage === "pipeline" && <Step2PipelineBehavior calc={calc} />}
                  {stage === "gate" && <TeaserGate calc={calc} />}
                  {stage === "thinking" && (
                    <div className="surface rounded-[22px]">
                      <ThinkingAnimation onComplete={() => calc.go("results")} researchPending={calc.research?.status === "pending"} />
                    </div>
                  )}
                  {stage === "results" && calc.results && calc.inputs && (
                    <Suspense fallback={<div className="h-[60vh]" />}>
                      <ResultsPage
                        name={calc.lead?.name ?? ""}
                        inputs={calc.inputs}
                        results={calc.results}
                        diagnosis={calc.diagnosis}
                        scan={calc.scan}
                        research={calc.research?.status === "ready" ? calc.research : null}
                        reportId={calc.reportId}
                        offline={calc.offline}
                      />
                    </Suspense>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <Footer />
          </>
        )}
      </main>

      <Toast message={calc.toast} onDismiss={calc.dismissToast} />
    </div>
  );
}

import { lazy, Suspense, useEffect, useState } from "react";
import { api, ApiError } from "../api";
import type { Diagnosis } from "../hooks/useCalculator";
import { fallbackDiagnosis } from "../lib/diagnosis";
import type { SavedReport } from "../lib/types";
import AnimatedHeadline from "./AnimatedHeadline";
import { Footer } from "./LandingSections";
import Logo from "./Logo";
import SynthwaveBackground from "./SynthwaveBackground";
import { CtaButton } from "./ui/Button";
import { Card } from "./ui/Card";

const ResultsPage = lazy(() => import("./ResultsPage"));

/** /r/:id: a saved report, re-rendered from stored inputs. Refresh-safe and shareable. */
export default function ReportView({ id }: { id: string }) {
  const [report, setReport] = useState<SavedReport | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [diagnosis, setDiagnosis] = useState<Diagnosis>({ status: "loading", text: "" });

  useEffect(() => {
    let alive = true;
    api
      .report(id)
      .then(async (r) => {
        if (!alive) return;
        setReport(r);
        setState("ready");
        if (r.diagnosis) setDiagnosis({ status: "ready", text: r.diagnosis });
        else {
          try {
            const d = await api.aiDiagnosis(id);
            if (alive) setDiagnosis({ status: "ready", text: d.diagnosis });
          } catch {
            if (alive) setDiagnosis({ status: "ready", text: fallbackDiagnosis(r.inputs, r.results, r.siteScan) });
          }
        }
      })
      .catch((err) => {
        if (alive) setState(err instanceof ApiError && err.status === 404 ? "missing" : "error");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="grain relative min-h-dvh">
      <SynthwaveBackground intensity={0.35} />
      <main id="main" className="relative z-10 w-full overflow-x-clip">
        <header className="mx-auto flex max-w-[1040px] flex-col items-center px-4 pt-8 pb-10 text-center sm:px-6 sm:pt-10">
          <a href="/" className="mb-5" aria-label="PrimeFlowAI home">
            <Logo size="sm" />
          </a>
          <AnimatedHeadline compact />
        </header>
        <div className="mx-auto max-w-[1040px] px-4 pb-24 sm:px-6">
          {state === "loading" && (
            <div className="space-y-5" aria-busy="true" aria-label="Loading report">
              <div className="skeleton h-[260px] rounded-[28px]" />
              <div className="skeleton h-[160px] rounded-[22px]" />
              <div className="skeleton h-[140px] rounded-[22px]" />
            </div>
          )}
          {(state === "missing" || state === "error") && (
            <Card className="mx-auto max-w-[560px] text-center">
              <h2 className="text-xl font-semibold text-white">{state === "missing" ? "We couldn't find that report" : "We couldn't load that report"}</h2>
              <p className="mt-2 text-sm text-muted">
                {state === "missing" ? "The link may be incomplete. You can run a fresh audit in about 90 seconds." : "Check your connection and try again."}
              </p>
              <CtaButton className="mt-7" onClick={() => (window.location.href = "/")}>
                Run a new audit
              </CtaButton>
            </Card>
          )}
          {state === "ready" && report && (
            <Suspense fallback={<div className="h-[60vh]" />}>
              <ResultsPage
                name={report.name}
                inputs={report.inputs}
                results={report.results}
                diagnosis={diagnosis}
                scan={report.siteScan}
                research={report.research}
                reportId={report.id}
              />
            </Suspense>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}

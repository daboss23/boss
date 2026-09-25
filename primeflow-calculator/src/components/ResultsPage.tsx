import { useState } from "react";
import type { Diagnosis } from "../hooks/useCalculator";
import type { CalculatorInputs, CalculatorResults, PublicResearch, SiteScan } from "../lib/types";
import AIDiagnosis from "./sections/AIDiagnosis";
import CoverageGap from "./sections/CoverageGap";
import CTA from "./sections/CTA";
import DatabaseReactivation from "./sections/DatabaseReactivation";
import GradeRing from "./sections/GradeRing";
import HowYouCompare from "./sections/HowYouCompare";
import LeakageBanner from "./sections/LeakageBanner";
import MetricCards from "./sections/MetricCards";
import MissedCalls from "./sections/MissedCalls";
import ROIFlip from "./sections/ROIFlip";
import SiteFindings from "./sections/SiteFindings";
import SpeedToLead from "./sections/SpeedToLead";
import TopImpactOpportunities from "./sections/TopImpactOpportunities";
import { Reveal } from "./ui/Reveal";
import { Icon } from "./ui/Icon";

export interface ResultsProps {
  name: string;
  inputs: CalculatorInputs;
  results: CalculatorResults;
  diagnosis: Diagnosis;
  scan: SiteScan | null;
  research: PublicResearch | null;
  reportId: string | null;
  offline?: boolean;
}

/** Results in the brief's fixed order. Lazy-loaded (with Recharts) after the gate. */
export default function ResultsPage(p: ResultsProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const r = p.results;

  const download = async () => {
    setDownloading(true);
    try {
      const { downloadReportPdf } = await import("./pdf/download");
      await downloadReportPdf({ ...p, diagnosisText: p.diagnosis.status === "ready" ? p.diagnosis.text : null });
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setDownloading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the URL bar still has it */
    }
  };

  return (
    <div className="space-y-5">
      <header className="mb-10 text-center">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
          Profit recovery report{p.name ? ` · ${p.name}` : ""}
          {p.inputs.businessName ? ` · ${p.inputs.businessName}` : ""}
        </div>
        <h2 className="mt-3 text-[clamp(26px,4vw,36px)] font-semibold tracking-[-0.025em] text-white">Your profit recovery audit</h2>
        {p.reportId && !p.offline && (
          <button
            type="button"
            onClick={copyLink}
            className="mt-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] text-soft ring-1 ring-white/10 transition hover:bg-white/[0.04] hover:text-white"
          >
            <Icon name={copied ? "check" : "link"} size={14} />
            {copied ? "Link copied" : "Copy shareable link"}
          </button>
        )}
      </header>

      <Reveal>
        <LeakageBanner r={r} />
      </Reveal>
      <Reveal>
        <AIDiagnosis diagnosis={p.diagnosis} />
      </Reveal>
      {p.scan && (
        <Reveal>
          <SiteFindings scan={p.scan} />
        </Reveal>
      )}
      <Reveal>
        <GradeRing score={r.score} />
      </Reveal>
      <Reveal>
        <HowYouCompare inputs={p.inputs} r={r} research={p.research} />
      </Reveal>
      <Reveal>
        <MetricCards r={r} />
      </Reveal>
      <Reveal>
        <SpeedToLead r={r} />
      </Reveal>
      <Reveal>
        <CoverageGap r={r} inputs={p.inputs} />
      </Reveal>
      <Reveal>
        <MissedCalls r={r} inputs={p.inputs} />
      </Reveal>
      <Reveal>
        <DatabaseReactivation r={r} />
      </Reveal>
      <Reveal>
        <TopImpactOpportunities r={r} inputs={p.inputs} />
      </Reveal>
      <Reveal>
        <ROIFlip r={r} />
      </Reveal>
      <Reveal>
        <div className="pt-6">
          <CTA onDownload={download} downloading={downloading} />
        </div>
      </Reveal>
    </div>
  );
}

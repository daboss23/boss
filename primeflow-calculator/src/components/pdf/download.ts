import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import { BOOKING_URL } from "../../config";
import { safeFileName } from "../../lib/formatters";
import type { CalculatorInputs, CalculatorResults, PublicResearch, SiteScan } from "../../lib/types";
import ReportDocument from "./ReportDocument";

/** Loaded with dynamic import() only when the download button is clicked. */
export async function downloadReportPdf(p: {
  name: string;
  inputs: CalculatorInputs;
  results: CalculatorResults;
  diagnosisText: string | null;
  scan: SiteScan | null;
  research: PublicResearch | null;
}) {
  const doc = createElement(ReportDocument, { ...p, bookingUrl: BOOKING_URL });
  const blob = await pdf(doc as Parameters<typeof pdf>[0]).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PrimeFlowAI-Profit-Recovery-Report-${safeFileName(p.name)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

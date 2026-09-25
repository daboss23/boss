import { Document, Font, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { coveragePlan, missedCallsPlan, reactivationPlan, siteGapLines, speedPlan, type PlanStep } from "../../lib/actionPlans";
import { scoreGrade } from "../../lib/calcResults";
import { ROI_SCENARIO_SHARE } from "../../lib/constants";
import { fmt, fmtFull, fmtInt } from "../../lib/formatters";
import { compareToIndustry, countryName } from "../../lib/research";
import type { CalculatorInputs, CalculatorResults, PublicResearch, SiteScan } from "../../lib/types";

const origin = typeof window !== "undefined" ? window.location.origin : "";

Font.register({
  family: "Inter",
  fonts: [
    { src: `${origin}/fonts/Inter-Regular.ttf`, fontWeight: 400 },
    { src: `${origin}/fonts/Inter-Medium.ttf`, fontWeight: 500 },
    { src: `${origin}/fonts/Inter-SemiBold.ttf`, fontWeight: 600 },
    { src: `${origin}/fonts/Inter-Bold.ttf`, fontWeight: 700 },
  ],
});
Font.register({
  family: "Orbitron",
  fonts: [
    { src: `${origin}/fonts/Orbitron-Bold.ttf`, fontWeight: 700 },
    { src: `${origin}/fonts/Orbitron-Black.ttf`, fontWeight: 900 },
  ],
});
// No automatic hyphenation: numbers and names must never split.
Font.registerHyphenationCallback((word) => [word]);

const C = {
  bg: "#03060f",
  card: "#0a1430",
  line: "#1a2a4f",
  text: "#e2e8f0",
  soft: "#a3b1c6",
  muted: "#7d8ba1",
  cyan: "#38bdf8",
  win: "#4ade80",
  leak: "#f87171",
  gold: "#ffd700",
  purple: "#c9a2fa",
};
const LEAK = ["#ef4444", "#fb923c", "#facc15"];

const s = StyleSheet.create({
  page: { backgroundColor: C.bg, color: C.text, fontFamily: "Inter", fontSize: 10, paddingTop: 0, paddingBottom: 54, paddingHorizontal: 0 },
  header: { backgroundColor: "#000000", paddingVertical: 22, paddingHorizontal: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: { width: 150 },
  meta: { alignItems: "flex-end" },
  metaSmall: { fontSize: 8.5, color: C.muted, marginBottom: 3 },
  metaName: { fontSize: 11, fontWeight: 600, color: C.text },
  body: { paddingHorizontal: 40, paddingTop: 24 },
  hero: { backgroundColor: "#1a0a10", borderWidth: 1, borderColor: "#5b1d24", borderRadius: 14, padding: 22, marginBottom: 14 },
  kicker: { fontSize: 7.5, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: C.muted },
  heroNum: { fontFamily: "Orbitron", fontWeight: 900, fontSize: 38, color: "#ffffff", marginTop: 8 },
  bar: { flexDirection: "row", height: 7, borderRadius: 4, overflow: "hidden", marginTop: 14 },
  legendRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 9 },
  legendItem: { flexDirection: "row", alignItems: "center", marginRight: 16, marginTop: 3 },
  dot: { width: 7, height: 7, borderRadius: 2, marginRight: 5 },
  row: { flexDirection: "row" },
  tile: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 12 },
  tileVal: { fontSize: 17, fontWeight: 700, marginTop: 6 },
  tileNote: { fontSize: 7.5, color: C.muted, marginTop: 4 },
  section: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 18, marginBottom: 12 },
  h2: { fontSize: 13, fontWeight: 700, color: "#ffffff" },
  sub: { fontSize: 8.5, color: C.muted, marginTop: 2, marginBottom: 12 },
  p: { fontSize: 10, lineHeight: 1.6, color: C.soft },
  stepNum: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#0c2a44", color: C.cyan, fontSize: 8, fontWeight: 700, textAlign: "center", paddingTop: 3.5 },
  stepTitle: { fontSize: 9.5, fontWeight: 600, color: "#ffffff", marginTop: 6 },
  stepBody: { fontSize: 8.5, lineHeight: 1.5, color: C.soft, marginTop: 3 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#101a33", paddingTop: 8 },
  footerText: { fontSize: 7.5, color: C.muted },
});

function Tile({ label, value, note, color = "#ffffff", noteColor = C.muted, last = false }: { label: string; value: string; note?: string; color?: string; noteColor?: string; last?: boolean }) {
  return (
    <View style={[s.tile, { marginRight: last ? 0 : 8 }]}>
      <Text style={s.kicker}>{label}</Text>
      <Text style={[s.tileVal, { color }]}>{value}</Text>
      {note ? <Text style={[s.tileNote, { color: noteColor }]}>{note}</Text> : null}
    </View>
  );
}

function Plan({ steps }: { steps: PlanStep[] }) {
  return (
    <View style={[s.row, { marginTop: 14, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 12 }]}>
      {steps.map((st, i) => (
        <View key={st.title} style={{ flex: 1, marginRight: i < steps.length - 1 ? 12 : 0 }} wrap={false}>
          <Text style={s.stepNum}>{i + 1}</Text>
          <Text style={s.stepTitle}>{st.title}</Text>
          <Text style={s.stepBody}>{st.body}</Text>
        </View>
      ))}
    </View>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <View style={s.section} wrap={false}>
      <Text style={s.h2}>{title}</Text>
      <Text style={s.sub}>{sub}</Text>
      {children}
    </View>
  );
}

export interface ReportDocProps {
  name: string;
  inputs: CalculatorInputs;
  results: CalculatorResults;
  diagnosisText: string | null;
  scan: SiteScan | null;
  research: PublicResearch | null;
  bookingUrl: string;
}

export default function ReportDocument({ name, inputs, results: r, diagnosisText, scan, research, bookingUrl }: ReportDocProps) {
  const g = scoreGrade(r.score);
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const compare = compareToIndustry(inputs, r, research);

  return (
    <Document title={`Profit Recovery Report: ${name}`} author="PrimeFlowAI" creator="PrimeFlowAI Profit Recovery Engine">
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed={false}>
          <Image src={`${origin}/brand/primeflowai-logo.png`} style={s.logo} />
          <View style={s.meta}>
            <Text style={s.metaSmall}>{date}</Text>
            <Text style={s.metaName}>Report for {name}</Text>
            {inputs.businessName ? <Text style={[s.metaSmall, { marginTop: 3, marginBottom: 0 }]}>{inputs.businessName}</Text> : null}
          </View>
        </View>

        <View style={s.body}>
          <View style={s.hero} wrap={false}>
            <Text style={[s.kicker, { color: C.leak }]}>Annual revenue left on the table</Text>
            <Text style={s.heroNum}>{fmtFull(r.sym, r.totalLeakage)}</Text>
            <Text style={[s.p, { marginTop: 6 }]}>
              That's <Text style={{ color: C.leak, fontWeight: 700 }}>{r.leakPct}%</Text> of your potential annual revenue disappearing before it reaches you.
            </Text>
            <View style={s.bar}>
              {r.leakageBreakdown.map((b, i) => (
                <View key={b.key} style={{ flex: Math.max(b.pct, 1), backgroundColor: LEAK[i], marginRight: i < 2 ? 2 : 0 }} />
              ))}
            </View>
            <View style={s.legendRow}>
              {r.leakageBreakdown.map((b, i) => (
                <View key={b.key} style={s.legendItem}>
                  <View style={[s.dot, { backgroundColor: LEAK[i] }]} />
                  <Text style={{ fontSize: 8.5, color: C.muted }}>
                    {b.label}: <Text style={{ color: C.text, fontWeight: 600 }}>{fmt(r.sym, b.value)}</Text> ({b.pct}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[s.row, { marginBottom: 12 }]} wrap={false}>
            <Tile label="Pipeline health" value={`${g.grade} · ${r.score}/100`} note={g.label} color={g.color} />
            <Tile label="Annual revenue" value={fmt(r.sym, r.annualRevenue)} note="from new leads" />
            <Tile label="Marketing waste" value={fmt(r.sym, r.annualWaste)} note="annually not converting" color={C.leak} />
            <Tile label="Cost per acquisition" value={fmt(r.sym, r.cpa)} note={`→ ${fmt(r.sym, r.potentialCPA)} potential`} noteColor={C.win} last />
          </View>

          {diagnosisText ? (
            <View style={[s.section, { borderColor: "#3b2466" }]} wrap={false}>
              <Text style={[s.kicker, { color: C.purple }]}>AI diagnosis</Text>
              <Text style={[s.p, { marginTop: 8, color: C.text, fontSize: 10.5 }]}>{diagnosisText}</Text>
            </View>
          ) : null}

          {scan ? (
            <Section title="What we found on your site" sub={scan.domain}>
              {siteGapLines(scan).map((l) => (
                <View key={l.key} style={[s.row, { marginBottom: 5, alignItems: "center" }]}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: l.ok ? C.win : C.leak, marginRight: 8 }} />
                  <Text style={{ fontSize: 9.5, color: l.ok ? C.soft : C.text }}>{l.text}</Text>
                </View>
              ))}
            </Section>
          ) : null}

          {compare.length && research ? (
            <Section title="How you compare" sub={`Based on live industry research for ${research.segment ?? research.industry} in ${countryName(research.country)}`}>
              {compare.map((c) => {
                const f = (v: number) => (c.unit === "percent" ? `${+v.toFixed(1)}%` : c.unit === "minutes" ? `${Math.round(v)} min` : fmt(r.sym, v));
                return (
                  <View key={c.metric} style={[s.row, { marginBottom: 6, justifyContent: "space-between" }]}>
                    <Text style={{ fontSize: 9.5, color: C.text, width: 150 }}>{c.label}</Text>
                    <Text style={{ fontSize: 9.5, color: C.soft }}>
                      You {f(c.yours)} · Industry {f(c.industry)}
                    </Text>
                    <Text style={{ fontSize: 9.5, color: c.gapValue ? C.win : C.muted, width: 120, textAlign: "right" }}>
                      {c.gapValue ? `+${fmt(r.sym, c.gapValue)}/yr` : "On par or ahead"}
                    </Text>
                  </View>
                );
              })}
            </Section>
          ) : null}

          <Section title="Speed to lead" sub="Your response time vs. industry benchmarks">
            <View style={s.row}>
              <Tile label="Your response time" value={r.rt.label} color={r.rt.multiplier < 0.5 ? C.leak : "#facc15"} />
              <Tile label="Revenue lost / yr" value={fmt(r.sym, r.speedLeakage)} color={C.leak} />
              <Tile label="Of optimal performance" value={`${Math.round(r.rt.multiplier * 100)}%`} last />
            </View>
            <Plan steps={speedPlan(r)} />
          </Section>

          <Section title="Coverage gap" sub="When you're available vs. when leads are converting">
            <View style={s.row}>
              <Tile label="Weekly coverage" value={`${r.coveragePct}%`} color={r.coveragePct < 40 ? C.leak : "#facc15"} note="of 168 hrs/week" />
              <Tile label="High-conv. window" value={`${r.highConvCoverage}%`} color={r.highConvCoverage < 50 ? C.leak : C.win} note="6–9am & 4–7pm" />
              <Tile label="Hours unprotected" value={`${100 - r.coveragePct}%`} color={C.leak} last />
            </View>
            <Plan steps={coveragePlan(r, inputs)} />
          </Section>

          <Section title="Missed calls" sub="Every missed call is a competitor's win">
            <View style={s.row}>
              <Tile label="Annual missed calls" value={fmtInt(r.annualMissed)} />
              <Tile label="Revenue lost / yr" value={fmt(r.sym, r.revLostMissed)} color={C.leak} />
              <Tile label="Recoverable (30%)" value={fmt(r.sym, r.recoverableRev)} color={C.win} last />
            </View>
            {r.revLostMissed > 0 ? (
              <View style={{ marginTop: 12 }}>
                <View style={[s.bar, { marginTop: 0 }]}>
                  <View style={{ flex: 70, backgroundColor: "#ef4444", marginRight: 2 }} />
                  <View style={{ flex: 30, backgroundColor: "#22c55e" }} />
                </View>
                <View style={[s.row, { justifyContent: "space-between", marginTop: 5 }]}>
                  <Text style={{ fontSize: 8, color: C.muted }}>70% Walking to Competitors</Text>
                  <Text style={{ fontSize: 8, color: C.muted }}>30% Recoverable</Text>
                </View>
              </View>
            ) : null}
            <Plan steps={missedCallsPlan(r, inputs)} />
          </Section>

          <Section title="Database reactivation" sub="Your forgotten goldmine of pre-qualified prospects">
            <Text style={[s.p, { color: C.text }]}>
              {fmtInt(r.prospects)} dormant leads × {Math.round(r.reactivationResponseRate * 100)}% response × {Math.round(r.reactivationQualRate * 100)}% qualified ×{" "}
              {Math.round(r.reactivationCloseRate * 100)}% close × {fmt(r.sym, r.saleVal)} ={" "}
              <Text style={{ color: C.win, fontWeight: 700 }}>{fmt(r.sym, r.reactRevenue)}</Text>
            </Text>
            <View style={[s.row, { marginTop: 10 }]}>
              <Tile label="Responding" value={fmtInt(r.reactStep1)} color={C.purple} />
              <Tile label="Qualified" value={fmtInt(r.reactStep2)} color={C.purple} />
              <Tile label="Closed deals" value={fmtInt(r.reactStep3)} color={C.purple} />
              <Tile label="Revenue" value={fmt(r.sym, r.reactRevenue)} color={C.win} last />
            </View>
            <Plan steps={reactivationPlan(r)} />
          </Section>

          <View style={[s.section, { backgroundColor: "#06180f", borderColor: "#14532d", flexDirection: "row", alignItems: "center" }]} wrap={false}>
            <View style={{ marginRight: 22 }}>
              <Text style={[s.kicker, { color: C.win }]}>What if you recovered just 20%?</Text>
              <Text style={{ fontFamily: "Orbitron", fontWeight: 900, fontSize: 28, color: C.win, marginTop: 6 }}>{fmt(r.sym, r.totalLeakage * ROI_SCENARIO_SHARE)}</Text>
              <Text style={{ fontSize: 8.5, color: C.muted, marginTop: 3 }}>added to your annual revenue</Text>
            </View>
            <Text style={[s.p, { flex: 1 }]}>
              Businesses using PrimeFlowAI typically recover <Text style={{ color: C.win, fontWeight: 700 }}>30–60%</Text> of their hidden revenue within the first 90 days, without increasing their ad spend.
            </Text>
          </View>

          <View style={[s.section, { borderColor: "#3730a3", alignItems: "center", paddingVertical: 24 }]} wrap={false}>
            <Text style={[s.h2, { fontSize: 14, textAlign: "center", maxWidth: 400 }]}>
              Want to see how businesses are adding an extra 5–6 figures of profit from leads they already paid for?
            </Text>
            <Text style={[s.p, { textAlign: "center", marginTop: 8, maxWidth: 420 }]}>
              We'll show you the exact Stealth Reactivation Engine that wakes up 'dead' leads and turns them into paying customers. Live demo, your business, no fluff.
            </Text>
            <Link src={bookingUrl} style={{ marginTop: 14, backgroundColor: "#6366f1", color: "#ffffff", paddingVertical: 10, paddingHorizontal: 22, borderRadius: 20, fontSize: 10, fontWeight: 700, textDecoration: "none", letterSpacing: 0.6 }}>
              BOOK A FREE LIVE DEMO →
            </Link>
            <Text style={{ fontSize: 8, color: C.muted, marginTop: 10 }}>{bookingUrl.replace(/^https?:\/\//, "")}</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <View style={[s.row, { alignItems: "center" }]}>
            <Image src={`${origin}/brand/emblem.png`} style={{ width: 14, height: 14, marginRight: 6 }} />
            <Text style={s.footerText}>PrimeFlowAI · Profit Recovery Report</Text>
          </View>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

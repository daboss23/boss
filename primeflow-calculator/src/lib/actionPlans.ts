/**
 * Personalised action plans. The base copy is the legacy "Solutions" line for
 * each section; the prospect's own numbers are injected where they read
 * naturally. Every sentence must change when the inputs change.
 */
import { DAYS, HIGH_CONV_HOURS } from "./constants.js";
import { fmt, fmtInt, hourLabel } from "./formatters.js";
import type { CalculatorInputs, CalculatorResults, SiteScan } from "./types.js";

export interface PlanStep {
  title: string;
  body: string;
  tag?: string;
}

export interface Opportunity {
  key: "speed" | "missed" | "reactivation";
  title: string;
  value: number;
  line: string;
  section: string;
}

const plural = (n: number, one: string, many = `${one}s`) => (Math.round(n) === 1 ? one : many);

export function speedPlan(r: CalculatorResults): PlanStep[] {
  const lift = r.rt.multiplier > 0 ? 1 / r.rt.multiplier : 1;
  const fast = r.rtIdx === 0;
  return [
    {
      tag: "Speed to Lead",
      title: "Instant AI SMS response",
      body: fast
        ? `You already answer inside a minute. Lock it in with an automated first touch so it holds at 9pm on a Sunday too.`
        : `You're answering leads in ${r.rt.label}. On this model, replying inside a minute converts ${lift.toFixed(1)}x more of the same leads, worth ${fmt(r.sym, r.speedLeakage)} a year.`,
    },
    {
      tag: "Never Miss a Lead",
      title: "Voice AI backup",
      body: `Every one of your ${fmtInt(r.monthlyLeads)} monthly leads gets a live answer, even when the team is on a job or in a meeting.`,
    },
    {
      tag: "Tireless Persistence",
      title: "Multi-channel follow-up automation",
      body: `Follow-up runs across SMS, email and voice until each lead replies or opts out, with no one on your team chasing by hand.`,
    },
  ];
}

export function coveragePlan(r: CalculatorResults, i: CalculatorInputs): PlanStep[] {
  const open = DAYS.filter((_, d) => i.activeDays[d]);
  const closed = DAYS.filter((_, d) => !i.activeDays[d]);
  const missedWindows = HIGH_CONV_HOURS.filter((h) => !(h >= i.workStart && h < i.workEnd));
  const uncoveredHours = 168 - r.weeklyHours;
  return [
    {
      title: "24/7 AI engagement",
      body: `You're open ${hourLabel(i.workStart)} to ${hourLabel(i.workEnd)}, ${open.length} ${plural(open.length, "day")} a week. That leaves ${fmtInt(uncoveredHours)} of 168 hours with no one answering.`,
    },
    {
      title: "Weekend reception",
      body: closed.length
        ? `${closed.join(", ")} ${closed.length === 1 ? "is" : "are"} dark. Leads who reach out then get an instant reply and a booked slot instead of silence.`
        : `You're open seven days. Keep evenings covered so the week never has a gap.`,
    },
    {
      title: "Enterprise-level availability without extra staff",
      body: missedWindows.length
        ? `You cover ${r.highConvCoverage}% of the 6 to 9am and 4 to 7pm windows when buyers are most active. Close the gap without hiring a night shift.`
        : `Your hours already span the peak buying windows. Extend the same response quality to the days you're closed.`,
    },
  ];
}

export function missedCallsPlan(r: CalculatorResults, i: CalculatorInputs): PlanStep[] {
  if (i.missedCallsWeekly === 0) {
    return [
      {
        title: "AI Voice Receptionist",
        body: `You report zero missed calls. Keep it that way through holidays, sick days and busy seasons with an always-on first answer.`,
      },
      {
        title: "Missed call text-back automation",
        body: `A safety net that texts any caller you can't reach within seconds, so a slip never becomes a lost job.`,
      },
      {
        title: "Call transcription & routing",
        body: `Every call is logged, summarised and routed to the right person, so nothing falls through between the phone and the CRM.`,
      },
    ];
  }
  return [
    {
      title: "AI Voice Receptionist",
      body: `Your team misses ${fmtInt(i.missedCallsWeekly)} ${plural(i.missedCallsWeekly, "call")} a week. That's ${fmtInt(r.annualMissed)} a year walking to competitors.`,
    },
    {
      title: "Missed call text-back automation",
      body: `Text every missed caller back within seconds. Rescuing 30% of them is worth ${fmt(r.sym, r.recoverableRev)} a year at your ${fmt(r.sym, r.saleVal)} average sale.`,
    },
    {
      title: "Call transcription & routing",
      body: `Each call is transcribed and routed to whoever can close it, so ${fmt(r.sym, r.revLostMissed)} of annual demand stops leaking out of voicemail.`,
    },
  ];
}

export function reactivationPlan(r: CalculatorResults): PlanStep[] {
  return [
    {
      title: "Stealth reactivation sequences",
      body: `You have ${fmtInt(r.prospects)} dormant ${plural(r.prospects, "lead")} sitting in your database, already paid for at ${fmt(r.sym, r.acquisitionCostSpent)}.`,
    },
    {
      title: "AI qualification",
      body: `At a ${Math.round(r.reactivationResponseRate * 100)}% response rate that's ${fmtInt(r.reactStep1)} conversations. AI sorts the ${fmtInt(r.reactStep2)} worth a call from the rest.`,
    },
    {
      title: "Ready-to-convert lead handoff",
      body: `Your team only talks to buyers ready to go: about ${fmtInt(r.reactStep3)} closed ${plural(r.reactStep3, "deal")}, worth ${fmt(r.sym, r.reactRevenue)}.`,
    },
  ];
}

/** Biggest lever first, always by the prospect's own dollar values. */
export function topOpportunities(r: CalculatorResults, i: CalculatorInputs): Opportunity[] {
  const items: Opportunity[] = [
    {
      key: "speed",
      title: "Respond in under a minute",
      value: r.speedLeakage,
      section: "speed",
      line:
        r.rtIdx === 0
          ? "Already fast. Protect it after hours."
          : `From ${r.rt.label} to under a minute on your ${fmtInt(r.monthlyLeads)} leads a month.`,
    },
    {
      key: "missed",
      title: "Answer every call",
      value: r.revLostMissed,
      section: "missed-calls",
      line:
        i.missedCallsWeekly === 0
          ? "No missed calls reported."
          : `${fmtInt(r.annualMissed)} missed calls a year at ${fmt(r.sym, r.saleVal)} each.`,
    },
    {
      key: "reactivation",
      title: "Wake up dormant leads",
      value: r.reactRevenue,
      section: "reactivation",
      line: `${fmtInt(r.prospects)} leads you already paid for.`,
    },
  ];
  return items.sort((a, b) => b.value - a.value);
}

/** Gap statements for the "What we found on your site" card. */
export function siteGapLines(scan: SiteScan): { key: string; text: string; ok: boolean; section?: string }[] {
  const out: { key: string; text: string; ok: boolean; section?: string }[] = [];
  const s = Object.fromEntries(scan.signals.map((x) => [x.key, x]));
  const describe = (present: boolean, yes: string, no: string, section?: string, key = "") =>
    out.push({ key, ok: present, text: present ? yes : no, section });
  if (s.liveChat)
    describe(
      s.liveChat.present,
      `Live chat detected${s.liveChat.detail.length ? ` (${s.liveChat.detail.join(", ")})` : ""}`,
      "No live chat detected",
      "speed",
      "liveChat",
    );
  if (s.onlineBooking)
    describe(
      s.onlineBooking.present,
      `Online booking detected${s.onlineBooking.detail.length ? ` (${s.onlineBooking.detail.join(", ")})` : ""}`,
      "No online booking detected",
      "speed",
      "onlineBooking",
    );
  if (s.clickToCall)
    describe(s.clickToCall.present, "Click-to-call link found", "No click-to-call link", "missed-calls", "clickToCall");
  if (s.smsWhatsapp)
    describe(s.smsWhatsapp.present, "SMS or WhatsApp link found", "No SMS or WhatsApp channel", "coverage", "smsWhatsapp");
  if (s.leadForm) describe(s.leadForm.present, "Lead capture form found", "No lead capture form found", "speed", "leadForm");
  if (s.trackingPixels?.present) {
    const paid = s.trackingPixels.detail.filter((d) => /Meta|Google Ads/i.test(d));
    const noInstant = !s.liveChat?.present && !s.onlineBooking?.present;
    out.push({
      key: "trackingPixels",
      ok: !(paid.length && noInstant),
      section: "speed",
      text:
        paid.length && noInstant
          ? `Running ${paid.join(" and ")} with no chat or booking, so paid leads wait for a callback`
          : `Tracking in place (${s.trackingPixels.detail.join(", ")})`,
    });
  }
  if (scan.afterHoursGap !== null)
    out.push({
      key: "afterHours",
      ok: !scan.afterHoursGap,
      section: "coverage",
      text: scan.afterHoursGap
        ? "Listed hours miss the 6 to 9am or 4 to 7pm buying windows"
        : "Listed hours cover the peak buying windows",
    });
  return out;
}

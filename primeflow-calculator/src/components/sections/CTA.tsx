import { BOOKING_URL } from "../../config";
import { CtaLink, GhostButton } from "../ui/Button";
import { Bezel } from "../ui/Card";
import { Icon } from "../ui/Icon";

export default function CTA({ onDownload, downloading }: { onDownload: () => void; downloading: boolean }) {
  return (
    <Bezel coreClassName="relative overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(99,102,241,0.2),transparent_70%)]" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-leak uppercase">
          <Icon name="alert" size={14} strokeWidth={2} />
          Every day you wait, competitors are calling your leads
        </div>
        <h2 className="mx-auto mt-5 max-w-[26ch] text-[clamp(24px,3.6vw,34px)] leading-[1.18] font-semibold tracking-[-0.02em] text-white">
          Want to see how businesses are adding an extra 5–6 figures of profit from leads they already paid for?
        </h2>
        <p className="mx-auto mt-5 max-w-[58ch] text-[15.5px] leading-relaxed text-soft">
          We'll show you the exact <strong className="font-semibold text-white">Stealth Reactivation Engine</strong> that wakes up 'dead' leads
          and turns them into paying customers. Live demo, your business, no fluff.
        </p>
        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <CtaLink href={BOOKING_URL} target="_blank" rel="noreferrer" icon="calendar">
            Book a free live demo
          </CtaLink>
          <GhostButton icon="download" onClick={onDownload} disabled={downloading} className="h-14 sm:h-[60px] sm:px-7" aria-busy={downloading}>
            {downloading ? "Preparing PDF..." : "Download my report"}
          </GhostButton>
        </div>
        <p className="mt-6 text-[13px] text-muted italic">No commitment. No hard sell. Only value &amp; transparency.</p>
      </div>
    </Bezel>
  );
}

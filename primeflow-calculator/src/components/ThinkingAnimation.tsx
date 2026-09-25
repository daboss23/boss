import { useEffect, useRef, useState } from "react";

const PHASES = [
  "Scanning pipeline data...",
  "Calculating revenue leakage...",
  "Mapping coverage gaps...",
  "Running reactivation model...",
  "Generating your report...",
];
const RESEARCH_PHASE = "Pulling live industry data...";
const BASE_MS = 5000;
const MAX_RESEARCH_WAIT_MS = 15000;

function gearPath(cx: number, cy: number, r: number, teeth: number) {
  const inner = r * 0.74;
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a = (k: number) => ((i + k) / teeth) * Math.PI * 2 - Math.PI / 2;
    const p = (rad: number, ang: number) => `${(cx + Math.cos(ang) * rad).toFixed(2)} ${(cy + Math.sin(ang) * rad).toFixed(2)}`;
    d += `${i === 0 ? "M" : "L"} ${p(inner, a(0))} L ${p(r, a(0.12))} L ${p(r, a(0.38))} L ${p(inner, a(0.5))} `;
  }
  return `${d}Z`;
}

const GEARS = [
  { cx: 104, cy: 96, r: 46, teeth: 12, dur: 9, dir: "cw", color: "#00c8ff" },
  { cx: 178, cy: 70, r: 30, teeth: 8, dur: 6, dir: "ccw", color: "#ff00dd" },
  { cx: 170, cy: 138, r: 24, teeth: 7, dur: 5, dir: "ccw", color: "#ffd700" },
] as const;

/**
 * ~5 second build-up while the report is prepared. If live research is still
 * running, waits up to 15 more seconds on an extra phase.
 */
export default function ThinkingAnimation({ onComplete, researchPending }: { onComplete: () => void; researchPending: boolean }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(PHASES[0]!);
  const pendingRef = useRef(researchPending);
  pendingRef.current = researchPending;
  const done = useRef(onComplete);
  done.current = onComplete;

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    let finished = false;
    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed < BASE_MS) {
        const p = (elapsed / BASE_MS) * (pendingRef.current ? 88 : 100);
        setProgress(p);
        setPhase(PHASES[Math.min(PHASES.length - 1, Math.floor((elapsed / BASE_MS) * PHASES.length))]!);
      } else if (pendingRef.current && elapsed < BASE_MS + MAX_RESEARCH_WAIT_MS) {
        setPhase(RESEARCH_PHASE);
        setProgress(88 + ((elapsed - BASE_MS) / MAX_RESEARCH_WAIT_MS) * 11);
      } else if (!finished) {
        finished = true;
        setProgress(100);
        setTimeout(() => done.current(), 350);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-10 text-center" role="status" aria-live="polite">
      <div className="relative mb-10 h-[190px] w-[280px]" aria-hidden>
        {[92, 118, 144].map((r, i) => (
          <div
            key={r}
            className="absolute top-1/2 left-1/2 rounded-full"
            style={{
              width: r * 2,
              height: r * 2,
              marginLeft: -r,
              marginTop: -r,
              border: `1px solid ${i === 1 ? "rgba(255,0,220,0.22)" : "rgba(0,200,255,0.18)"}`,
              animation: `orbit-pulse ${2.6 + i * 0.7}s ease-in-out ${i * 0.4}s infinite`,
            }}
          />
        ))}
        <svg viewBox="0 0 280 190" className="absolute inset-0 h-full w-full">
          <defs>
            <filter id="g-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {GEARS.map((g, i) => (
            <g
              key={i}
              filter="url(#g-glow)"
              style={{
                transformOrigin: `${g.cx}px ${g.cy}px`,
                animation: `${g.dir === "cw" ? "spin-cw" : "spin-ccw"} ${g.dur}s linear infinite`,
              }}
            >
              <path d={gearPath(g.cx, g.cy, g.r, g.teeth)} fill={`${g.color}1f`} stroke={g.color} strokeWidth="1.4" strokeLinejoin="round" />
              <circle cx={g.cx} cy={g.cy} r={g.r * 0.34} fill="#03060f" stroke={g.color} strokeWidth="1.1" />
            </g>
          ))}
          <image href="/brand/emblem.png" x={104 - 22} y={96 - 22} width="44" height="44" style={{ mixBlendMode: "screen" }} />
        </svg>
      </div>

      <div className="w-full max-w-[360px]">
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-linear-to-r from-purple via-indigo to-cyan shadow-[0_0_12px_rgba(6,182,212,0.6)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2.5 flex justify-between text-[12px] text-muted">
          <span>{phase}</span>
          <span className="tabular">{Math.round(progress)}%</span>
        </div>
      </div>
      <p className="mt-8 text-[13px] tracking-[0.06em] text-muted">Building your personalized report...</p>
    </div>
  );
}

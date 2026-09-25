import { useEffect, useRef } from "react";

interface Props {
  /** 0–1. Lowered on data-heavy screens so numbers read cleanly. */
  intensity?: number;
}

interface Comet {
  x: number;
  y: number;
  speed: number;
  len: number;
  hue: number;
  alpha: number;
}

const HORIZON = 0.64;

/**
 * Synthwave canvas: deep-space gradient, twinkling stars, comet streaks across
 * the upper half, mountain silhouettes and a moving perspective grid.
 *
 * Performance: DPR capped at 2, paused when the tab is hidden, one static frame
 * under prefers-reduced-motion, half the comets under 640px.
 */
export default function SynthwaveBackground({ intensity = 1 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0;
    let H = 0;
    let raf = 0;
    let t = 0;
    let last = performance.now();
    let comets: Comet[] = [];
    let stars: { x: number; y: number; r: number; p: number }[] = [];

    const spawn = (initial: boolean): Comet => ({
      x: initial ? Math.random() * W : -Math.random() * W * 0.4,
      y: Math.random() * H * HORIZON * 0.78,
      speed: 90 + Math.random() * 220,
      len: 60 + Math.random() * 160,
      hue: Math.random() < 0.55 ? 190 : Math.random() < 0.5 ? 305 : 265,
      alpha: 0.35 + Math.random() * 0.5,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = W < 640 ? 9 : 18;
      comets = Array.from({ length: count }, () => spawn(true));
      const starCount = Math.round((W * H) / 9000);
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * HORIZON * 0.95,
        r: Math.random() < 0.85 ? 0.6 : 1.2,
        p: Math.random() * Math.PI * 2,
      }));
      if (reduce) draw(0);
    };

    const mountains = (pts: number[][], height: number, fill: string, stroke: string, horizonY: number) => {
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      for (const [x, y] of pts) ctx.lineTo(x! * W, horizonY - y! * height);
      ctx.lineTo(W, horizonY);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const draw = (dt: number) => {
      t += dt;
      const horizonY = H * HORIZON;

      // Deep space
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#010208");
      bg.addColorStop(0.45, "#02051a");
      bg.addColorStop(0.64, "#0a0628");
      bg.addColorStop(1, "#05030f");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Stars
      for (const s of stars) {
        const a = 0.25 + 0.6 * Math.abs(Math.sin(t * 0.9 + s.p));
        ctx.fillStyle = `rgba(210,225,255,${a * 0.75})`;
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }

      // Comets, left to right across the upper half
      for (let i = 0; i < comets.length; i++) {
        const c = comets[i]!;
        c.x += c.speed * dt;
        if (c.x - c.len > W) comets[i] = spawn(false);
        const g = ctx.createLinearGradient(c.x - c.len, c.y, c.x, c.y);
        g.addColorStop(0, `hsla(${c.hue},100%,70%,0)`);
        g.addColorStop(1, `hsla(${c.hue},100%,78%,${c.alpha})`);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(c.x - c.len, c.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
        ctx.fillStyle = `hsla(${c.hue},100%,92%,${c.alpha})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Horizon glow
      const glow = ctx.createLinearGradient(0, horizonY - 90, 0, horizonY + 50);
      glow.addColorStop(0, "rgba(255,0,180,0)");
      glow.addColorStop(0.55, "rgba(255,0,200,0.22)");
      glow.addColorStop(0.72, "rgba(255,40,210,0.34)");
      glow.addColorStop(1, "rgba(160,0,160,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, horizonY - 90, W, 140);

      // Mountains
      mountains(
        [[0, 0], [0.05, 0.3], [0.12, 0.72], [0.2, 0.4], [0.28, 0.92], [0.38, 0.5], [0.45, 0.76], [0.5, 0.34], [0.57, 0.82], [0.65, 0.5], [0.72, 0.86], [0.8, 0.42], [0.88, 0.66], [0.95, 0.3], [1, 0]],
        Math.min(90, H * 0.1),
        "rgba(9,5,32,0.96)",
        "rgba(150,40,230,0.4)",
        horizonY,
      );
      mountains(
        [[0, 0.05], [0.07, 0.22], [0.15, 0.5], [0.22, 0.3], [0.3, 0.6], [0.4, 0.35], [0.5, 0.55], [0.6, 0.3], [0.7, 0.62], [0.8, 0.3], [0.9, 0.46], [1, 0.12]],
        Math.min(90, H * 0.1),
        "rgba(4,3,18,0.99)",
        "rgba(0,190,255,0.22)",
        horizonY,
      );

      // Horizon line
      const line = ctx.createLinearGradient(0, 0, W, 0);
      line.addColorStop(0, "rgba(220,0,220,0)");
      line.addColorStop(0.2, "rgba(230,40,230,0.7)");
      line.addColorStop(0.5, "rgba(255,120,255,1)");
      line.addColorStop(0.8, "rgba(230,40,230,0.7)");
      line.addColorStop(1, "rgba(220,0,220,0)");
      ctx.fillStyle = line;
      ctx.fillRect(0, horizonY - 0.75, W, 1.5);

      // Perspective grid floor
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, horizonY, W, H - horizonY);
      ctx.clip();
      const floor = ctx.createLinearGradient(0, horizonY, 0, H);
      floor.addColorStop(0, "rgba(30,6,60,0.9)");
      floor.addColorStop(1, "rgba(2,3,12,1)");
      ctx.fillStyle = floor;
      ctx.fillRect(0, horizonY, W, H - horizonY);

      const vx = W / 2;
      const numV = 28;
      ctx.lineWidth = 1;
      for (let i = 0; i <= numV; i++) {
        const xf = i / numV;
        const xb = (xf - 0.5) * W * 3.2 + vx;
        const d = Math.abs(xf - 0.5) * 2;
        ctx.strokeStyle = `rgba(0,200,255,${0.1 + (1 - d) * 0.16})`;
        ctx.beginPath();
        ctx.moveTo(vx, horizonY);
        ctx.lineTo(xb, H);
        ctx.stroke();
      }
      const speed = (t * 0.22) % 1;
      const numH = 16;
      for (let i = 0; i < numH; i++) {
        const f = (i / numH + speed) % 1;
        const p = Math.pow(f, 2.4);
        const y = horizonY + p * (H - horizonY);
        const a = 0.05 + p * 0.38;
        ctx.strokeStyle = i % 4 === 0 ? `rgba(200,60,255,${a})` : `rgba(0,190,255,${a * 0.8})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.restore();
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(dt);
      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduce) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    if (reduce) draw(0);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <canvas
        ref={ref}
        className="block h-full w-full transition-opacity duration-1000"
        style={{ opacity: intensity, transitionTimingFunction: "var(--ease-out-expo)" }}
      />
      {/* Veil: keeps content legible where it overlaps the grid. */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, rgba(30,80,180,0.12), transparent 60%), linear-gradient(180deg, rgba(3,6,15,0) 40%, rgba(3,6,15,0.55) 78%, rgba(3,6,15,0.85) 100%)",
        }}
      />
    </div>
  );
}

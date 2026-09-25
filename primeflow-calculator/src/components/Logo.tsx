/**
 * Brand lockup. Rendered with `mix-blend-mode: screen` so the supplied black
 * background disappears into the page and the glow stays intact.
 * Never place on a light background.
 */
export default function Logo({ size = "lg", className = "" }: { size?: "sm" | "lg"; className?: string }) {
  const w = size === "lg" ? "w-[240px] sm:w-[320px]" : "w-[132px] sm:w-[150px]";
  return (
    <picture>
      <source srcSet="/brand/primeflowai-logo.webp" type="image/webp" />
      <img
        src="/brand/primeflowai-logo.png"
        alt="PrimeFlowAI"
        width={720}
        height={324}
        decoding="async"
        fetchPriority={size === "lg" ? "high" : "auto"}
        className={`mx-auto block h-auto ${w} mix-blend-screen ${className}`}
      />
    </picture>
  );
}

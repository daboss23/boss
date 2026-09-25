import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export function Card({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`surface scroll-mt-6 rounded-[22px] p-6 sm:p-8 ${className}`}>
      {children}
    </section>
  );
}

/** Outer tray + inner plate. Reserved for the hero moments. */
export function Bezel({ children, className = "", coreClassName = "" }: { children: ReactNode; className?: string; coreClassName?: string }) {
  return (
    <div className={`bezel ${className}`}>
      <div className={`bezel-core ${coreClassName}`}>{children}</div>
    </div>
  );
}

export function CardHeader({
  icon,
  title,
  sub,
  aside,
  tone = "cyan",
}: {
  icon?: IconName;
  title: ReactNode;
  sub?: ReactNode;
  aside?: ReactNode;
  tone?: "cyan" | "leak" | "win" | "gold";
}) {
  const tones = {
    cyan: "text-cyan-soft bg-cyan/10 ring-cyan/20",
    leak: "text-leak bg-leak/10 ring-leak/20",
    win: "text-win bg-win/10 ring-win/20",
    gold: "text-gold-bright bg-gold/10 ring-gold/25",
  };
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        {icon && (
          <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ring-1 ${tones[tone]}`}>
            <Icon name={icon} size={18} />
          </span>
        )}
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.015em] text-white sm:text-xl">{title}</h2>
          {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
        </div>
      </div>
      {aside}
    </header>
  );
}

/** Small uppercase label used on data tiles. */
export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`text-[11px] font-semibold tracking-[0.14em] text-muted uppercase ${className}`}>{children}</div>;
}

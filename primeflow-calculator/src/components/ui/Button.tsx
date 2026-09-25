import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type Size = "md" | "lg";

const sizes: Record<Size, string> = {
  md: "h-12 pl-6 pr-1.5 text-[13px]",
  lg: "h-14 pl-7 pr-2 text-sm sm:h-[60px] sm:text-[15px]",
};

/** The nested trailing icon: a circle inside the pill that nudges on hover. */
function Trailing({ icon, size }: { icon: IconName; size: Size }) {
  return (
    <span
      className={`ml-4 grid shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-white/20 transition-transform duration-300 ease-[var(--ease-out-strong)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 ${
        size === "lg" ? "size-10 sm:size-11" : "size-9"
      }`}
    >
      <Icon name={icon} size={size === "lg" ? 18 : 16} strokeWidth={2} />
    </span>
  );
}

interface CtaProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size;
  icon?: IconName;
  children: ReactNode;
  block?: boolean;
}

export function CtaButton({ size = "lg", icon = "arrowRight", children, block, className = "", ...rest }: CtaProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`cta group inline-flex items-center justify-between rounded-full ${sizes[size]} ${block ? "w-full" : ""} ${className}`}
    >
      <span className="flex-1 text-center">{children}</span>
      <Trailing icon={icon} size={size} />
    </button>
  );
}

interface CtaLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  size?: Size;
  icon?: IconName;
  children: ReactNode;
  block?: boolean;
}

export function CtaLink({ size = "lg", icon = "arrowUpRight", children, block, className = "", ...rest }: CtaLinkProps) {
  return (
    <a {...rest} className={`cta group inline-flex items-center justify-between rounded-full ${sizes[size]} ${block ? "w-full" : ""} ${className}`}>
      <span className="flex-1 text-center">{children}</span>
      <Trailing icon={icon} size={size} />
    </a>
  );
}

interface GhostProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconName;
  iconPosition?: "left" | "right";
  children: ReactNode;
}

export function GhostButton({ icon, iconPosition = "left", children, className = "", ...rest }: GhostProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`group inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-semibold tracking-[0.04em] text-soft uppercase ring-1 ring-line-strong transition duration-200 ease-[var(--ease-out-strong)] hover:bg-white/[0.04] hover:text-text active:scale-[0.98] disabled:opacity-40 ${className}`}
    >
      {icon && iconPosition === "left" && (
        <Icon name={icon} size={16} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
      )}
      {children}
      {icon && iconPosition === "right" && (
        <Icon name={icon} size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
      )}
    </button>
  );
}

export function TextButton({ children, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`text-sm text-soft underline decoration-white/20 underline-offset-4 transition-colors hover:text-text hover:decoration-cyan ${className}`}
    >
      {children}
    </button>
  );
}

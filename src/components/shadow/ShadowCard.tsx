import { forwardRef, HTMLAttributes } from "react";

type Variant = "default" | "muted" | "elevated";

interface ShadowCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  hover?: boolean;
  glow?: boolean;
  /** Tinted glow halo from one corner */
  haloColor?: string;
  haloPosition?: "tl" | "tr" | "bl" | "br";
  /** Show subtle inner gradient highlight on top */
  highlight?: boolean;
  /** Bleed padding to edges (no inner padding) */
  bleed?: boolean;
  padded?: "sm" | "md" | "lg" | "none";
}

const padMap: Record<NonNullable<ShadowCardProps["padded"]>, string> = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
  none: "",
};

const variantMap: Record<Variant, string> = {
  default:
    "bg-[#0D1322] border border-white/[0.07]",
  muted:
    "bg-[#080D18] border border-white/[0.05]",
  elevated:
    "bg-[#111827] border border-white/[0.08]",
};

const haloPosMap: Record<NonNullable<ShadowCardProps["haloPosition"]>, string> = {
  tl: "-left-10 -top-12",
  tr: "-right-10 -top-12",
  bl: "-left-10 -bottom-12",
  br: "-right-10 -bottom-12",
};

export const ShadowCard = forwardRef<HTMLDivElement, ShadowCardProps>(
  (
    {
      variant = "default",
      hover = false,
      glow = false,
      haloColor,
      haloPosition = "tr",
      highlight = true,
      bleed = false,
      padded = "md",
      className = "",
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`relative overflow-hidden rounded-[18px] backdrop-blur-xl transition-colors duration-300 ${
          variantMap[variant]
        } ${bleed ? "" : padMap[padded]} ${
          hover ? "hover:border-white/[0.13]" : ""
        } ${glow ? "glow-primary" : ""} ${className}`}
        {...rest}
      >
        {/* Inner highlight */}
        {highlight && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
            }}
          />
        )}
        {/* Halo */}
        {haloColor && (
          <div
            className={`pointer-events-none absolute ${haloPosMap[haloPosition]} h-40 w-40 rounded-full opacity-50 blur-3xl`}
            style={{ background: haloColor }}
          />
        )}
        <div className="relative">{children}</div>
      </div>
    );
  }
);

ShadowCard.displayName = "ShadowCard";

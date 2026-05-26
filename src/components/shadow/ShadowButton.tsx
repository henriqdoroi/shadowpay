import { forwardRef, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

interface ShadowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const sizeMap: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-9 w-9",
};

const variantMap: Record<Variant, string> = {
  primary:
    "text-white shadow-[0_14px_36px_-14px_rgba(124,58,237,0.6)] hover:shadow-[0_18px_46px_-14px_rgba(124,58,237,0.75)]",
  secondary:
    "bg-white/[0.06] text-white hover:bg-white/[0.10] border border-white/[0.08]",
  ghost: "text-white/70 hover:bg-white/[0.05] hover:text-white",
  outline:
    "border border-white/[0.10] bg-white/[0.02] text-white/85 hover:bg-white/[0.06] hover:text-white",
  danger:
    "border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
};

export const ShadowButton = forwardRef<HTMLButtonElement, ShadowButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      className = "",
      children,
      disabled,
      style,
      ...rest
    },
    ref
  ) => {
    const primaryStyle: React.CSSProperties =
      variant === "primary"
        ? {
            background: "linear-gradient(120deg, #7C3AED 0%, #6366F1 100%)",
            ...style,
          }
        : (style as React.CSSProperties);

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`group relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${sizeMap[size]} ${variantMap[variant]} ${className}`}
        style={primaryStyle}
        {...rest}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {!loading && children}
      </button>
    );
  }
);

ShadowButton.displayName = "ShadowButton";

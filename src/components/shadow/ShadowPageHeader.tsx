import { ReactNode } from "react";

interface ShadowPageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** brand gradient on title accent word */
  gradientTitle?: boolean;
}

export function ShadowPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  gradientTitle = false,
}: ShadowPageHeaderProps) {
  return (
    <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-white/40">
            {eyebrow}
          </p>
        )}
        <h1
          className="text-[28px] font-bold leading-[1.1] tracking-tight text-white md:text-[34px]"
          style={{
            fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
          }}
        >
          {gradientTitle ? (
            <span
              style={{
                background:
                  "linear-gradient(90deg, #F8FAFC 0%, #A855F7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {title}
            </span>
          ) : (
            title
          )}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-white/55">{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

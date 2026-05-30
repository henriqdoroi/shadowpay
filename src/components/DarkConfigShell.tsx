"use client";

/**
 * Wrapper dark glassy violeta para as páginas de configuração:
 *   /v1/configs/profile, /security, /notifications, /v1/kyc, etc.
 *
 * Pinta o background do main do LightShell em dark, e tem um halo
 * violeta radial sutil no topo.
 */
import { ReactNode } from "react";

export const DARK_T = {
  bg: "#0A0A14",
  bgSoft: "#0F0B1C",
  cardBg: "rgba(20, 17, 32, 0.85)",
  cardBorder: "rgba(255, 255, 255, 0.06)",
  cardBorderHover: "rgba(139, 92, 246, 0.25)",
  inputBg: "rgba(15, 11, 28, 0.7)",
  inputBorder: "rgba(255, 255, 255, 0.08)",
  inputBorderFocus: "#7C3AED",
  text: "#F8FAFC",
  text2: "#CBD5E1",
  textMuted: "#64748B",
  primary: "#8B5CF6",
  primaryStrong: "#7C3AED",
  primaryGlow: "rgba(139, 92, 246, 0.30)",
  green: "#22C55E",
  greenSoft: "rgba(34, 197, 94, 0.12)",
  amber: "#F59E0B",
  amberSoft: "rgba(245, 158, 11, 0.12)",
  blue: "#06B6D4",
  blueSoft: "rgba(6, 182, 212, 0.12)",
  red: "#EF4444",
  redSoft: "rgba(239, 68, 68, 0.12)",
};

export function DarkConfigShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative -mx-3 -my-5 min-h-[calc(100vh-80px)] px-3 py-5 sm:-mx-4 sm:-my-6 sm:px-4 sm:py-6 md:-mx-8 md:-my-8 md:px-8 md:py-8"
      style={{
        background: DARK_T.bg,
        color: DARK_T.text,
      }}
    >
      {/* Halo violeta radial topo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[800px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.05) 35%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      {/* Halo violeta inferior direita */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ============================================================
 * DarkCard — card glassy padrão das páginas de config
 * ============================================================ */
export function DarkCard({
  children,
  className = "",
  style = {},
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: DARK_T.cardBg,
        border: `1px solid ${DARK_T.cardBorder}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================
 * SectionHeader — ícone circular + título + subtítulo
 * ============================================================ */
export function SectionHeader({
  icon,
  iconBg = "rgba(139,92,246,0.15)",
  iconColor = DARK_T.primary,
  title,
  subtitle,
  right,
}: {
  icon: ReactNode;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{
            background: iconBg,
            color: iconColor,
            boxShadow: `0 0 0 1px ${iconBg}, 0 8px 24px -8px ${iconColor}`,
          }}
        >
          {icon}
        </div>
        <div>
          <p
            className="text-[16px] font-bold leading-tight"
            style={{ color: DARK_T.text }}
          >
            {title}
          </p>
          {subtitle && (
            <p
              className="mt-0.5 text-[12px]"
              style={{ color: DARK_T.textMuted }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

/* ============================================================
 * DarkInput, DarkSelect — usados nos forms
 * ============================================================ */
export const darkInputCls =
  "h-12 w-full rounded-xl border bg-transparent px-4 text-[13.5px] font-medium outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20";

export const darkInputStyle: React.CSSProperties = {
  background: DARK_T.inputBg,
  borderColor: DARK_T.inputBorder,
  color: DARK_T.text,
};

/* ============================================================
 * DarkLabel — float label estilo Material no canto sup. esquerdo
 * ============================================================ */
export function DarkLabel({ children }: { children: ReactNode }) {
  return (
    <label
      className="mb-1.5 block text-[11.5px] font-semibold"
      style={{ color: DARK_T.textMuted }}
    >
      {children}
    </label>
  );
}

/* ============================================================
 * StatusPill — pill colorida (Aprovado, Pendente, Inativo, etc.)
 * ============================================================ */
export function StatusPill({
  label,
  variant,
}: {
  label: string;
  variant: "green" | "amber" | "blue" | "red" | "violet";
}) {
  const map = {
    green: { bg: DARK_T.greenSoft, color: DARK_T.green },
    amber: { bg: DARK_T.amberSoft, color: DARK_T.amber },
    blue: { bg: DARK_T.blueSoft, color: DARK_T.blue },
    red: { bg: DARK_T.redSoft, color: DARK_T.red },
    violet: {
      bg: "rgba(139,92,246,0.15)",
      color: DARK_T.primary,
    },
  };
  const cfg = map[variant];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {label}
    </span>
  );
}

"use client";

/**
 * Peças visuais da área "Minha conta" — mesmo visual do dashboard: cartões
 * brancos com borda #E6E8EB e sombra leve, roxo #7C3AED, fonte Inter.
 */
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

export const C = {
  primary: "#7C3AED",
  primaryDark: "#6D28D9",
  primarySoft: "rgba(124,58,237,0.08)",
  border: "#E6E8EB",
  green: "#059669",
  greenSoft: "rgba(16,185,129,0.12)",
  amber: "#B45309",
  amberSoft: "rgba(245,158,11,0.14)",
  rose: "#E11D48",
  roseSoft: "rgba(244,63,94,0.10)",
  blue: "#2563EB",
  blueSoft: "rgba(37,99,235,0.10)",
};

export const cardCls = "rounded-xl border border-[#E6E8EB] bg-white shadow-[0_1px_1px_rgba(15,23,42,0.04)]";

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`${cardCls} ${className}`}>{children}</div>;
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-slate-500">
      {children}
    </label>
  );
}

export const inputCls =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-slate-900 outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

export function TextInput({ className = "", ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={`${inputCls} ${className}`} />;
}

export function Hint({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "ok" | "error" }) {
  const color = tone === "ok" ? "text-emerald-600" : tone === "error" ? "text-rose-600" : "text-slate-400";
  return <p className={`mt-1.5 text-[11.5px] ${color}`}>{children}</p>;
}

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: checked ? C.primary : "#CBD5E1" }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left]"
        style={{ left: checked ? 22 : 2 }}
      />
    </button>
  );
}

type Tone = "green" | "amber" | "rose" | "slate" | "violet" | "blue";
const TONES: Record<Tone, { bg: string; fg: string }> = {
  green: { bg: C.greenSoft, fg: C.green },
  amber: { bg: C.amberSoft, fg: C.amber },
  rose: { bg: C.roseSoft, fg: C.rose },
  slate: { bg: "#F1F5F9", fg: "#475569" },
  violet: { bg: C.primarySoft, fg: C.primary },
  blue: { bg: C.blueSoft, fg: C.blue },
};

export function Pill({ tone = "slate", icon, children }: { tone?: Tone; icon?: ReactNode; children: ReactNode }) {
  const t = TONES[tone];
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ background: t.bg, color: t.fg }}
    >
      {icon}
      {children}
    </span>
  );
}

export function Button({
  variant = "primary",
  loading,
  icon,
  children,
  className = "",
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  loading?: boolean;
  icon?: ReactNode;
}) {
  const base =
    "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 text-[13.5px] font-semibold transition-[background,box-shadow,transform,color] disabled:cursor-not-allowed disabled:opacity-50";
  const v =
    variant === "primary"
      ? "bg-[#7C3AED] text-white shadow-[0_8px_20px_-10px_rgba(124,58,237,0.7)] hover:bg-[#6D28D9]"
      : variant === "outline"
        ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        : variant === "danger"
          ? "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
          : "text-slate-600 hover:bg-slate-100";
  return (
    <button {...p} disabled={p.disabled || loading} className={`${base} ${v} ${className}`}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

/** Quadradinho de ícone dos cabeçalhos dos cartões. */
export function IconBox({ children, tone = "violet" }: { children: ReactNode; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: t.bg, color: t.fg }}>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------- formatos

export const onlyDigits = (v: string) => (v || "").replace(/\D/g, "");

export function fmtPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function fmtDoc(v?: string | null): string {
  const d = onlyDigits(v || "");
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return v || "";
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / 86400);
  if (d < 30) return d === 1 ? "ontem" : `há ${d} dias`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

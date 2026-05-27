"use client";

import { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/router";

interface ComingSoonProps {
  title: string;
  subtitle: string;
  description: string;
  icon: ReactNode;
  accent?: string;
  /** ETA short label, e.g. "Q3 2026" */
  eta?: string;
}

export function ComingSoon({
  title,
  subtitle,
  description,
  icon,
  accent = "#7C3AED",
  eta,
}: ComingSoonProps) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <header className="mb-7">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
          {subtitle}
        </p>
        <h1
          className="text-[28px] font-bold tracking-tight text-slate-900"
          style={{
            fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
            letterSpacing: "-0.005em",
          }}
        >
          {title}
        </h1>
      </header>

      {/* Coming soon card */}
      <div
        className="relative overflow-hidden rounded-2xl p-10 text-center"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
        }}
      >
        {/* Halo */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: `radial-gradient(circle, ${accent}22 0%, transparent 65%)`,
          }}
        />

        {/* Icon */}
        <div
          className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: `${accent}14`,
            border: `1px solid ${accent}33`,
            color: accent,
          }}
        >
          {icon}
        </div>

        {/* ETA pill */}
        {eta && (
          <div
            className="relative mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: `${accent}14`,
              color: accent,
              border: `1px solid ${accent}33`,
            }}
          >
            <Sparkles className="h-3 w-3" />
            {eta}
          </div>
        )}

        <h2
          className="relative text-[22px] font-bold tracking-tight text-slate-900"
          style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
        >
          Em breve
        </h2>
        <p className="relative mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-slate-500">
          {description}
        </p>

        <button
          onClick={() => router.push("/v1/dashboard")}
          className="relative mt-6 inline-flex h-10 items-center justify-center rounded-xl px-5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5"
          style={{
            background: accent,
            boxShadow: `0 8px 20px -8px ${accent}99`,
          }}
        >
          Voltar ao dashboard
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

interface ShadowLogoProps {
  /** width in px. height = width * 1.4 (panther+S aspect) */
  size?: number;
  /** glow halo behind the logo (for hero / Shadow AI card) */
  glow?: boolean;
  glowColor?: string;
  className?: string;
  /** alt path override (defaults to /shadow-panther.png) */
  src?: string;
}

/**
 * Brand mark da ShadowPay (pantera + S, prata cromado).
 *
 * Carrega `/shadow-panther.png` quando disponível.
 * Se o arquivo não existir, faz fallback para um SVG estilizado.
 *
 * → Para usar o logo final: salve o PNG da pantera em
 *   `public/shadow-panther.png` (recomendado 600×840px PNG transparente).
 */
export function ShadowLogo({
  size = 100,
  glow = false,
  glowColor = "rgba(124, 58, 237, 0.25)",
  className,
  src = "/shadow-panther.png",
}: ShadowLogoProps) {
  const [errored, setErrored] = useState(false);
  const h = Math.round(size * 1.4);

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${className || ""}`}
      style={{ width: size, height: h }}
    >
      {glow && (
        <div
          className="pointer-events-none absolute inset-0 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            transform: "scale(1.4)",
          }}
        />
      )}
      {!errored ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="ShadowPay"
          width={size}
          height={h}
          onError={() => setErrored(true)}
          className="relative h-full w-full object-contain"
          style={{
            filter: glow
              ? "drop-shadow(0 6px 20px rgba(124, 58, 237, 0.25))"
              : undefined,
          }}
        />
      ) : (
        <PantherFallbackSVG size={size} />
      )}
    </div>
  );
}

/* ============================================================
 * Fallback SVG — usado SOMENTE quando /shadow-panther.png falha.
 * É uma aproximação estilizada (não 1:1 com o brand real).
 * ============================================================ */
function PantherFallbackSVG({ size = 100 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.4)}
      viewBox="0 0 100 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ShadowPay"
    >
      <defs>
        <linearGradient id="sl-chrome" x1="20" y1="0" x2="80" y2="140">
          <stop offset="0" stopColor="#F8FAFC" />
          <stop offset="0.18" stopColor="#CBD5E1" />
          <stop offset="0.4" stopColor="#64748B" />
          <stop offset="0.7" stopColor="#334155" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="sl-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.8" />
          <stop offset="0.5" stopColor="white" stopOpacity="0.15" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="sl-glow" cx="50%" cy="40%" r="40%">
          <stop offset="0" stopColor="#A855F7" stopOpacity="0.25" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ambient violet glow */}
      <ellipse cx="50" cy="60" rx="44" ry="60" fill="url(#sl-glow)" />

      {/* Panther head (top) */}
      <g>
        {/* ears */}
        <path
          d="M30 18 L26 36 L40 30 Z"
          fill="url(#sl-chrome)"
          stroke="rgba(15,23,42,0.3)"
          strokeWidth="0.6"
        />
        <path
          d="M70 18 L74 36 L60 30 Z"
          fill="url(#sl-chrome)"
          stroke="rgba(15,23,42,0.3)"
          strokeWidth="0.6"
        />
        {/* main head: rounded triangle */}
        <path
          d="M50 16
             C 38 16 28 24 26 38
             C 25 46 28 54 34 60
             C 38 64 44 66 50 66
             C 56 66 62 64 66 60
             C 72 54 75 46 74 38
             C 72 24 62 16 50 16 Z"
          fill="url(#sl-chrome)"
          stroke="rgba(15,23,42,0.3)"
          strokeWidth="0.6"
        />
        {/* highlight on head */}
        <path
          d="M50 18
             C 40 18 32 24 30 36
             C 30 42 33 48 38 52"
          fill="url(#sl-shine)"
          opacity="0.5"
        />
        {/* eyes */}
        <path
          d="M40 38 Q 42 36 45 38 L 44 41 Q 42 42 40 41 Z"
          fill="#0F172A"
        />
        <path
          d="M60 38 Q 58 36 55 38 L 56 41 Q 58 42 60 41 Z"
          fill="#0F172A"
        />
        {/* nose & muzzle */}
        <path d="M50 52 L 47 56 L 50 58 L 53 56 Z" fill="#0F172A" />
        <path
          d="M50 58 L 50 62"
          stroke="#0F172A"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </g>

      {/* S body (bottom, flowing curl) */}
      <g>
        <path
          d="M64 66
             C 80 70 84 88 70 96
             C 58 102 38 100 30 112
             C 25 122 35 132 50 132"
          stroke="url(#sl-chrome)"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        {/* shine over S */}
        <path
          d="M65 70 C 76 74 78 86 70 92"
          stroke="url(#sl-shine)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </g>
    </svg>
  );
}

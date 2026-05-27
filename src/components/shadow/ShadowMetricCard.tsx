import { ReactNode } from "react";
import { ShadowCard } from "./ShadowCard";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface ShadowMetricCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: string;
  delta?: {
    /** e.g. "+12.4%" */
    text: string;
    /** "up" | "down" | "flat" */
    direction?: "up" | "down" | "flat";
  };
  comparison?: string;
  sparkline?: number[];
  /** animation delay (seconds) for stagger entrance */
  delay?: number;
  hidden?: boolean;
}

function MiniSparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  if (!data.length) return null;
  const w = 110;
  const h = 28;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const pts = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");

  // area path with bottom close
  const areaPts = `0,${h} ${pts} ${w},${h}`;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#spark-${color.replace("#", "")})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ShadowMetricCard({
  label,
  value,
  icon,
  accent = "#7C3AED",
  delta,
  comparison,
  sparkline,
  delay = 0,
  hidden = false,
}: ShadowMetricCardProps) {
  const deltaColor =
    delta?.direction === "down"
      ? "text-rose-300 bg-rose-500/10 border-rose-500/20"
      : delta?.direction === "flat"
      ? "text-white/55 bg-white/[0.05] border-white/[0.08]"
      : "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";

  const DeltaIcon =
    delta?.direction === "down"
      ? ArrowDownRight
      : delta?.direction === "flat"
      ? Minus
      : ArrowUpRight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <ShadowCard
        haloColor={`${accent}26`}
        haloPosition="tl"
        hover
        padded="md"
        className="h-full"
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${accent}26 0%, ${accent}0d 100%)`,
              color: accent,
              border: `1px solid ${accent}33`,
            }}
          >
            {icon}
          </span>
          {delta && (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${deltaColor}`}
            >
              <DeltaIcon className="h-2.5 w-2.5" />
              {delta.text}
            </span>
          )}
        </div>

        <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
          {label}
        </p>
        <div
          className="mt-1.5 text-[26px] font-bold leading-none tracking-tight text-white"
          style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
        >
          {hidden ? "••••••" : value}
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          {comparison && (
            <span className="text-[11px] text-white/40">{comparison}</span>
          )}
          {sparkline && sparkline.length > 1 && (
            <div className="ml-auto opacity-80">
              <MiniSparkline data={sparkline} color={accent} />
            </div>
          )}
        </div>
      </ShadowCard>
    </motion.div>
  );
}

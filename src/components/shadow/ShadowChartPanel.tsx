"use client";

import { useState, useMemo, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ShadowCard } from "./ShadowCard";
import { Radio } from "lucide-react";

export type Period = "today" | "yesterday" | "7d" | "30d" | "lastMonth" | "max";

const periodLabels: Record<Period, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  "7d": "7 dias",
  "30d": "Este mês",
  lastMonth: "Mês passado",
  max: "Máximo",
};

export interface ChartPoint {
  label: string;
  ts: number;
  primary: number; // valor principal (ex: faturamento)
  secondary?: number; // valor secundário (ex: pago/líquido)
}

interface ShadowChartPanelProps {
  title?: string;
  subtitle?: string;
  data: ChartPoint[];
  /** when period changes, callback */
  onPeriodChange?: (period: Period) => void;
  initialPeriod?: Period;
  primaryColor?: string;
  secondaryColor?: string;
  formatValue?: (v: number) => string;
  primaryLabel?: string;
  secondaryLabel?: string;
  emptyText?: string;
  loading?: boolean;
}

export function ShadowChartPanel({
  title = "Receita",
  subtitle,
  data,
  onPeriodChange,
  initialPeriod = "30d",
  primaryColor = "#7C3AED",
  secondaryColor = "#22D3EE",
  formatValue = (v) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v),
  primaryLabel = "Geradas",
  secondaryLabel = "Pagas",
  emptyText = "Nenhuma atividade detectada",
  loading = false,
}: ShadowChartPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<Period>(initialPeriod);

  useEffect(() => setMounted(true), []);

  const handlePeriod = (p: Period) => {
    setPeriod(p);
    onPeriodChange?.(p);
  };

  const periods: Period[] = useMemo(
    () => ["today", "yesterday", "7d", "30d", "lastMonth", "max"],
    []
  );

  const total = useMemo(
    () => data.reduce((acc, d) => acc + (d.primary || 0), 0),
    [data]
  );

  return (
    <ShadowCard padded="lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2
              className="text-lg font-semibold tracking-tight text-white"
              style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
            >
              {title}
            </h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              ao vivo
            </span>
          </div>
          <p className="mt-1 text-xs text-white/40">
            {subtitle ||
              `${formatValue(total)} · ${periodLabels[period].toLowerCase()}`}
          </p>
        </div>

        {/* Period pills */}
        <div className="flex flex-wrap gap-1.5">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => handlePeriod(p)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                period === p
                  ? "bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/30"
                  : "text-white/55 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 h-[300px] w-full">
        {!mounted || loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-400/50 border-t-transparent" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Radio className="mb-3 h-7 w-7 text-violet-400/50" />
            <p className="text-sm font-medium text-white/65">{emptyText}</p>
            <p className="mt-1 text-xs text-white/35">
              Sua infraestrutura está pronta. Os dados aparecem aqui em tempo
              real.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="sc-primary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sc-secondary" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={secondaryColor}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor={secondaryColor}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                }
              />
              <Tooltip
                cursor={{
                  stroke: "rgba(124,58,237,0.25)",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
                contentStyle={{
                  background: "#0D1322",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 12,
                  color: "#F8FAFC",
                  fontSize: 12,
                  padding: "10px 12px",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                }}
                labelStyle={{ color: "#A4ACBE", fontWeight: 500 }}
                formatter={(v: any, name: any) => [
                  formatValue(Number(v)),
                  name === "primary" ? primaryLabel : secondaryLabel,
                ]}
              />
              <Area
                type="monotone"
                dataKey="primary"
                stroke={primaryColor}
                strokeWidth={2}
                fill="url(#sc-primary)"
              />
              {data.some((d) => d.secondary !== undefined) && (
                <Area
                  type="monotone"
                  dataKey="secondary"
                  stroke={secondaryColor}
                  strokeWidth={2}
                  fill="url(#sc-secondary)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 border-t border-white/[0.05] pt-3">
        <span className="flex items-center gap-1.5 text-[11px] text-white/55">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: primaryColor }}
          />
          {primaryLabel}
        </span>
        {data.some((d) => d.secondary !== undefined) && (
          <span className="flex items-center gap-1.5 text-[11px] text-white/55">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: secondaryColor }}
            />
            {secondaryLabel}
          </span>
        )}
      </div>
    </ShadowCard>
  );
}

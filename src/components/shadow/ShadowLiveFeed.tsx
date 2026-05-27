"use client";

import { ShadowCard } from "./ShadowCard";
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export interface LiveFeedItem {
  id: string;
  kind: "sale" | "withdraw" | "alert" | "success" | "ai";
  title: string;
  subtitle?: string;
  value?: string;
  /** ISO timestamp */
  at?: string;
}

interface ShadowLiveFeedProps {
  items: LiveFeedItem[];
  title?: string;
  emptyText?: string;
}

const kindMap = {
  sale: {
    icon: ArrowDownLeft,
    color: "#22C55E",
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.25)",
  },
  withdraw: {
    icon: ArrowUpRight,
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.25)",
  },
  alert: {
    icon: AlertTriangle,
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.25)",
  },
  success: {
    icon: CheckCircle2,
    color: "#22C55E",
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.25)",
  },
  ai: {
    icon: Sparkles,
    color: "#22D3EE",
    bg: "rgba(34, 211, 238, 0.12)",
    border: "rgba(34, 211, 238, 0.25)",
  },
} as const;

function timeAgo(iso?: string) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (diff < 60000) return "agora";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `há ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `há ${days}d`;
}

export function ShadowLiveFeed({
  items,
  title = "Atividade ao vivo",
  emptyText = "Sem atividades por enquanto",
}: ShadowLiveFeedProps) {
  return (
    <ShadowCard padded="md" haloColor="rgba(124,58,237,0.18)" haloPosition="tr">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3
            className="text-sm font-semibold text-white"
            style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
          >
            {title}
          </h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            live
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Sparkles className="mb-2 h-5 w-5 text-violet-400/40" />
          <p className="text-xs text-white/50">{emptyText}</p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {items.map((item) => {
            const cfg = kindMap[item.kind];
            const Icon = cfg.icon;
            return (
              <li
                key={item.id}
                className="group relative flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] p-3 transition-colors hover:border-white/[0.1] hover:bg-white/[0.03]"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: cfg.bg,
                    color: cfg.color,
                    border: `1px solid ${cfg.border}`,
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white/90">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="truncate text-[11px] text-white/45">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {item.value && (
                    <p
                      className="text-xs font-bold"
                      style={{
                        color: cfg.color,
                        fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                      }}
                    >
                      {item.value}
                    </p>
                  )}
                  <p className="text-[10px] text-white/35">
                    {timeAgo(item.at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ShadowCard>
  );
}

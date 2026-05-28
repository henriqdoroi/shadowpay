"use client";

import Head from "next/head";
import { useEffect, useState } from "react";
import { Megaphone, ArrowUpRight, Activity, TrendingUp, MousePointerClick } from "lucide-react";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primaryStrong: "#6D28D9",
  primaryBg: "rgba(124, 58, 237, 0.08)",
  border: "rgba(15, 23, 42, 0.08)",
  borderSoft: "rgba(15, 23, 42, 0.06)",
};

type TrackingChannel = {
  source: string;
  clicks: number;
  conversions: number;
  revenue: number;
};

function TrackingContent() {
  const { token } = useAuth();
  const [channels, setChannels] = useState<TrackingChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        // Endpoint real (será implementado no backend). Por enquanto, deriva
        // dos pedidos pra mostrar dados reais agregando por utm_source.
        const r = await axios.get(
          `${API}/api/user/transactions-report?page=1&limit=500`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (r.data?.success) {
          const txs = r.data.data.transactions || [];
          const map = new Map<string, TrackingChannel>();
          for (const t of txs) {
            const src = (t.utmSource || t.utm_source || "direto").toLowerCase();
            const isPaid = String(t.status).toUpperCase() === "PAID";
            const cur = map.get(src) || {
              source: src,
              clicks: 0,
              conversions: 0,
              revenue: 0,
            };
            cur.clicks += 1;
            if (isPaid) {
              cur.conversions += 1;
              cur.revenue += Number(t.grossAmount || 0);
            }
            map.set(src, cur);
          }
          setChannels(Array.from(map.values()).sort((a, b) => b.revenue - a.revenue));
        }
      } catch (e) {
        console.error("tracking fetch", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const totalClicks = channels.reduce((s, c) => s + c.clicks, 0);
  const totalConv = channels.reduce((s, c) => s + c.conversions, 0);
  const totalRev = channels.reduce((s, c) => s + c.revenue, 0);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-6">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
          AVANÇADO
        </p>
        <h1
          className="text-[28px] font-bold tracking-tight text-slate-900"
          style={{ letterSpacing: "-0.005em" }}
        >
          Tracking
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Acompanhe a origem de cada venda e otimize seu funil de tráfego em
          tempo real.
        </p>
      </header>

      {/* Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Cliques totais",
            value: totalClicks.toLocaleString("pt-BR"),
            icon: MousePointerClick,
            color: "#7C3AED",
          },
          {
            label: "Conversões",
            value: totalConv.toLocaleString("pt-BR"),
            icon: TrendingUp,
            color: "#16A34A",
          },
          {
            label: "Receita atribuída",
            value: totalRev.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
            icon: Activity,
            color: "#F59E0B",
          },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-2xl p-5"
              style={{
                background: "#FFFFFF",
                border: `1px solid ${T.borderSoft}`,
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: `${m.color}14`, color: m.color }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: T.textMuted }}
                >
                  {m.label}
                </p>
              </div>
              <p className="mt-3 text-[24px] font-bold text-slate-900">
                {m.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Channels table */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: "#FFFFFF",
          border: `1px solid ${T.borderSoft}`,
          boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${T.borderSoft}` }}
        >
          <div>
            <h2 className="text-[14px] font-bold text-slate-900">
              Canais de tráfego
            </h2>
            <p className="text-[11px] text-slate-500">
              Agrupado por utm_source nas transações reais
            </p>
          </div>
          <a
            href="/v1/integrations"
            className="inline-flex items-center gap-1 text-[12px] font-semibold"
            style={{ color: T.primary }}
          >
            Conectar tracker
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
        {loading ? (
          <div className="px-5 py-12 text-center text-[13px] text-slate-500">
            Carregando…
          </div>
        ) : channels.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Megaphone
              className="mx-auto mb-3 h-10 w-10"
              style={{ color: T.textMuted }}
            />
            <p className="text-[14px] font-semibold text-slate-700">
              Nenhuma origem rastreada ainda
            </p>
            <p className="mt-1 text-[12px] text-slate-500">
              Adicione UTMs nos seus checkouts ou conecte UTMify / Xtracky em
              Integrações.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr
                  className="text-left text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: T.textMuted, background: "#F8FAFC" }}
                >
                  <th className="px-5 py-2.5">Fonte</th>
                  <th className="px-5 py-2.5 text-right">Cliques</th>
                  <th className="px-5 py-2.5 text-right">Conversões</th>
                  <th className="px-5 py-2.5 text-right">Conv. rate</th>
                  <th className="px-5 py-2.5 text-right">Receita</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((c) => {
                  const conv =
                    c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0;
                  return (
                    <tr
                      key={c.source}
                      style={{ borderTop: `1px solid ${T.borderSoft}` }}
                    >
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {c.source}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-700">
                        {c.clicks.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-700">
                        {c.conversions.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-700">
                          {conv.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-semibold text-slate-900">
                        {c.revenue.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Tracking</title>
      </Head>
      <LightShell>
        <TrackingContent />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}

"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import Head from "next/head";
import { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, TrendingUp, MousePointerClick, Tag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primaryBg: "rgba(124, 58, 237, 0.08)",
  border: "rgba(15, 23, 42, 0.08)",
  borderSoft: "rgba(15, 23, 42, 0.06)",
};

type UtmRow = {
  source: string;
  medium: string;
  campaign: string;
  clicks: number;
  conversions: number;
  revenue: number;
};

type UtmsResponse = {
  rangeDays: number;
  rows: UtmRow[];
  totals: {
    clicks: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
  };
};

function UtmsContent() {
  const { token } = useAuth();
  const [data, setData] = useState<UtmsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    axios
      .get(`${API}/api/tracking/utms?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        if (r.data?.success) setData(r.data.data);
      })
      .catch((e) => console.error("utms fetch", e))
      .finally(() => setLoading(false));
  }, [token, days]);

  const totals = data?.totals || {
    clicks: 0,
    conversions: 0,
    revenue: 0,
    conversionRate: 0,
  };
  const rows = data?.rows || [];

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            ANÁLISES
          </p>
          <h1
            className="text-[28px] font-bold tracking-tight text-slate-900"
            style={{ letterSpacing: "-0.005em" }}
          >
            UTMs
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Veja de onde vem cada venda — origem, mídia e campanha das suas
            transações reais.
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="h-10 rounded-xl bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none"
          style={{ border: `1px solid ${T.borderSoft}` }}
        >
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
          <option value={365}>Último ano</option>
        </select>
      </header>

      {/* Metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Cliques rastreados",
            value: totals.clicks.toLocaleString("pt-BR"),
            icon: MousePointerClick,
            color: "#7C3AED",
          },
          {
            label: "Vendas atribuídas",
            value: totals.conversions.toLocaleString("pt-BR"),
            icon: Tag,
            color: "#06B6D4",
          },
          {
            label: "Conversão",
            value: `${totals.conversionRate.toFixed(2)}%`,
            icon: TrendingUp,
            color: "#16A34A",
          },
          {
            label: "Receita rastreada",
            value: totals.revenue.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
            icon: LineChart,
            color: "#F59E0B",
          },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-2xl p-4"
              style={{
                background: "#FFFFFF",
                border: `1px solid ${T.borderSoft}`,
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
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
              <p className="mt-2 text-[22px] font-bold text-slate-900">
                {m.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: "#FFFFFF",
          border: `1px solid ${T.borderSoft}`,
          boxShadow:
            "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${T.borderSoft}` }}
        >
          <div>
            <h2 className="text-[14px] font-bold text-slate-900">
              Fontes de tráfego
            </h2>
            <p className="text-[11px] text-slate-500">
              Agrupado por utm_source / utm_medium / utm_campaign
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-5 py-12 text-center text-[13px] text-slate-500">
              Carregando…
            </div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <LineChart
                className="mx-auto mb-3 h-10 w-10"
                style={{ color: T.textMuted }}
              />
              <p className="text-[14px] font-semibold text-slate-700">
                Sem UTMs registradas ainda
              </p>
              <p className="mt-1 text-[12px] text-slate-500">
                Adicione utm_source/utm_medium/utm_campaign aos seus links de
                checkout pra trackear origem.
              </p>
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr
                  className="text-left text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: T.textMuted, background: "#F8FAFC" }}
                >
                  <th className="px-5 py-2.5">utm_source</th>
                  <th className="px-5 py-2.5">utm_medium</th>
                  <th className="px-5 py-2.5">utm_campaign</th>
                  <th className="px-5 py-2.5 text-right">Cliques</th>
                  <th className="px-5 py-2.5 text-right">Vendas</th>
                  <th className="px-5 py-2.5 text-right">Receita</th>
                  <th className="px-5 py-2.5 text-right">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const conv =
                    row.clicks > 0 ? (row.conversions / row.clicks) * 100 : 0;
                  return (
                    <tr
                      key={`${row.source}-${row.medium}-${row.campaign}`}
                      style={{ borderTop: `1px solid ${T.borderSoft}` }}
                    >
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {row.source}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{row.medium}</td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            background: T.primaryBg,
                            color: T.primary,
                          }}
                        >
                          {row.campaign}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-700">
                        {row.clicks.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-700">
                        {row.conversions.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-semibold text-slate-900">
                        {row.revenue.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-700">
                          {conv.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UtmsPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — UTMs</title>
      </Head>
      <LightShell>
        <UtmsContent />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}

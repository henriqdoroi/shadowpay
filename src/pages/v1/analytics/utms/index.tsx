"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import Head from "next/head";
import { LineChart, TrendingUp, MousePointerClick, Tag } from "lucide-react";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primaryBg: "rgba(124, 58, 237, 0.08)",
  border: "rgba(15, 23, 42, 0.08)",
  borderSoft: "rgba(15, 23, 42, 0.06)",
};

const TOP_SOURCES = [
  { source: "instagram", medium: "stories", campaign: "blackfriday", clicks: 12450, sales: 387, revenue: 18920.0 },
  { source: "facebook", medium: "cpc", campaign: "retargeting", clicks: 8723, sales: 245, revenue: 12150.0 },
  { source: "tiktok", medium: "video", campaign: "lancamento", clicks: 6521, sales: 198, revenue: 9870.0 },
  { source: "google", medium: "cpc", campaign: "branded", clicks: 4287, sales: 156, revenue: 7820.0 },
  { source: "kwai", medium: "video", campaign: "viral", clicks: 3120, sales: 89, revenue: 4450.0 },
  { source: "youtube", medium: "video", campaign: "review", clicks: 2890, sales: 76, revenue: 3820.0 },
];

function UtmsContent() {
  const totalClicks = TOP_SOURCES.reduce((s, r) => s + r.clicks, 0);
  const totalSales = TOP_SOURCES.reduce((s, r) => s + r.sales, 0);
  const totalRevenue = TOP_SOURCES.reduce((s, r) => s + r.revenue, 0);
  const conversionRate = (totalSales / totalClicks) * 100;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-6">
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
          Veja de onde vem cada venda — origem, mídia e campanha de cada PIX
          gerado.
        </p>
      </header>

      {/* Metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Cliques rastreados",
            value: totalClicks.toLocaleString("pt-BR"),
            icon: MousePointerClick,
            color: "#7C3AED",
          },
          {
            label: "Vendas atribuídas",
            value: totalSales.toLocaleString("pt-BR"),
            icon: Tag,
            color: "#06B6D4",
          },
          {
            label: "Conversão",
            value: `${conversionRate.toFixed(2)}%`,
            icon: TrendingUp,
            color: "#16A34A",
          },
          {
            label: "Receita rastreada",
            value: totalRevenue.toLocaleString("pt-BR", {
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

      {/* Top Sources Table */}
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
              Top fontes de tráfego (últimos 30 dias)
            </h2>
            <p className="text-[11px] text-slate-500">
              Agrupado por utm_source / utm_medium / utm_campaign
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
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
              {TOP_SOURCES.map((row) => {
                const conv = (row.sales / row.clicks) * 100;
                return (
                  <tr
                    key={`${row.source}-${row.campaign}`}
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
                      {row.sales.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-slate-900">
                      {row.revenue.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-700"
                      >
                        {conv.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-slate-400">
        Dados de exemplo. Conecte UTMify ou Xtracky em{" "}
        <a
          href="/v1/integrations"
          className="font-semibold"
          style={{ color: T.primary }}
        >
          Integrações
        </a>{" "}
        pra trackear server-side em tempo real.
      </p>
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
    </ProtectedRoute>
  );
}

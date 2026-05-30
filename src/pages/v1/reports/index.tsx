"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import Head from "next/head";
import Image from "next/image";
import {
  RefreshCw,
  PiggyBank,
  HandCoins,
  ShoppingBag,
  Users,
  Filter,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

interface Transaction {
  id: string;
  method?: string;
  status: string;
  grossAmount?: string | number;
  netAmount?: string | number;
  customer?: { name?: string; email?: string };
  createdAt: string;
  updatedAt: string;
}

function ReportsContent() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    blockedBalance: 0,
    grossRevenue: 0,
    netRevenue: 0,
    totalPixGenerated: 0,
    totalSales: 0,
    uniqueCustomers: 0,
  });
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchDashboardStats = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(
        "https://shadowpay-api-production.up.railway.app/api/user/dashboard-stats",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        const s = res.data.data;
        setStats({
          blockedBalance: Number(s.blockedBalance) || 0,
          grossRevenue: Number(s.grossRevenue) || 0,
          netRevenue: Number(s.netRevenue) || 0,
          totalPixGenerated: Number(s.totalPixGenerated) || 0,
          totalSales: Number(s.totalSales) || 0,
          uniqueCustomers: Number(s.uniqueCustomers) || 0,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiltered = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "200" });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const r = await axios.get(
        `https://shadowpay-api-production.up.railway.app/api/user/transactions-report?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        const approved: Transaction[] = (r.data.data.transactions || []).filter(
          (t: Transaction) => String(t.status).toUpperCase() === "PAID"
        );
        setStats((prev) => ({
          ...prev,
          grossRevenue: approved.reduce(
            (a, t) => a + Number(t.grossAmount || 0),
            0
          ),
          netRevenue: approved.reduce(
            (a, t) => a + Number(t.netAmount || 0),
            0
          ),
          totalPixGenerated: approved.filter(
            (t) => String(t.method).toUpperCase() === "PIX"
          ).length,
          totalSales: approved.length,
          uniqueCustomers: new Set(
            approved.map((t) => t.customer?.email || t.customer?.name || t.id)
          ).size,
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) fetchDashboardStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);

  const cards = [
    {
      title: "Faturamento bruto",
      icon: <PiggyBank className="h-4 w-4" />,
      color: "#22C55E",
      value: fmt(stats.grossRevenue),
      sub: "no período",
    },
    {
      title: "Faturamento líquido",
      icon: <HandCoins className="h-4 w-4" />,
      color: "#22D3EE",
      value: fmt(stats.netRevenue),
      sub: "no período",
    },
    {
      title: "Qtd. de vendas",
      icon: <ShoppingBag className="h-4 w-4" />,
      color: "#7C3AED",
      value: String(stats.totalSales),
      sub: "vendas aprovadas",
    },
    {
      title: "Pix gerados",
      icon: (
        <Image
          src="/pix-icon.svg"
          width={16}
          height={16}
          alt="Pix"
          className="object-contain"
        />
      ),
      color: "#3B82F6",
      value: String(stats.totalPixGenerated),
      sub: "transações",
    },
    {
      title: "Qtd. de clientes",
      icon: <Users className="h-4 w-4" />,
      color: "#F59E0B",
      value: String(stats.uniqueCustomers),
      sub: "clientes únicos",
    },
  ];

  const inputCls =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-violet-300 focus:ring-2 focus:ring-violet-100";

  return (
    <>
      <Head>
        <title>ShadowPay — Relatórios</title>
      </Head>
      <LightShell>
        <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:gap-4 sm:items-end sm:justify-between">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
              Inteligência
            </p>
            <h1
              className="text-[22px] font-bold tracking-tight sm:text-[28px] text-slate-900"
              style={{
                fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                letterSpacing: "-0.005em",
              }}
            >
              Relatórios
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              Analise o desempenho do seu negócio por período.
            </p>
          </div>
          <button
            onClick={fetchDashboardStats}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
        </header>

        {/* Filtro de período */}
        <div
          className="mb-6 rounded-2xl p-5"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            <Filter className="h-3.5 w-3.5" /> Filtrar período
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs text-slate-500">
                Data inicial
              </label>
              <input
                type="date"
                className={inputCls}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs text-slate-500">
                Data final
              </label>
              <input
                type="date"
                className={inputCls}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button
              onClick={fetchFiltered}
              className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{
                background: "#7C3AED",
                boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
              }}
            >
              Aplicar filtro
            </button>
          </div>
        </div>

        {/* KPIs */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl p-3 sm:p-4 md:p-5"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(15,23,42,0.06)",
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500">
                  {c.title}
                </p>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: `${c.color}14`, color: c.color }}
                >
                  {c.icon}
                </span>
              </div>
              <div
                className="mt-2 text-[24px] font-bold leading-none tracking-tight text-slate-900"
                style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
              >
                {c.value}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">{c.sub}</p>
            </div>
          ))}
        </section>
      </LightShell>
      <ShadowPanel />
    </>
  );
}

export default function Reports() {
  return (
    <ProtectedRoute>
      <ReportsContent />
    </ProtectedRoute>
  );
}

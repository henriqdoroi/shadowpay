"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import ProtectedRoute from "@/components/ProtectedRoute";
import ShadowPanel from "@/components/ShadowPanel";
import TwoFAModal from "./2faAuthentication";
import { ShadowLogo } from "@/components/shadow/ShadowLogo";

import {
  Search,
  Bell,
  MessageCircle,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  LayoutDashboard,
  Package,
  Receipt,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Megaphone,
  Workflow,
  Sparkles,
  Webhook as WebhookIcon,
  Code,
  Target,
  Globe,
  UserCircle2,
  Shield,
  BellRing,
  LifeBuoy,
  MoreHorizontal,
  Plus,
  Calendar,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  CircleDollarSign,
  Wallet,
  CheckCircle2,
  Percent,
  Inbox,
  ShoppingCart,
  ReceiptText,
  RotateCcw,
  DollarSign,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const API = "https://shadowpay-api-production.up.railway.app";

/* ============================================================
 * TOKENS LIGHT — locais a essa página, ignora o ThemeProvider dark
 * ============================================================ */
const T = {
  bg: "#F4F5F9",
  card: "#FFFFFF",
  border: "rgba(15, 23, 42, 0.06)",
  borderStrong: "rgba(15, 23, 42, 0.10)",
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primaryBg: "rgba(124, 58, 237, 0.08)",
  blue: "#3B82F6",
  green: "#22C55E",
  orange: "#F59E0B",
  red: "#EF4444",
  cardShadow:
    "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)",
  cardShadowHover:
    "0 4px 6px rgba(15, 23, 42, 0.05), 0 10px 15px rgba(15, 23, 42, 0.08)",
};

/* ============================================================
 * MAIN DASHBOARD
 * ============================================================ */
function DashboardContent() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [localUser, setLocalUser] = useState<any>(user);
  const [valuesVisible, setValuesVisible] = useState(true);

  const [walletStats, setWalletStats] = useState({
    currentBalance: 0,
    blockedBalance: 0,
  });
  const [txData, setTxData] = useState<{
    totals: any;
    transactions: any[];
  }>({
    totals: { totalTransacionado: 0, totalEntradas: 0, totalSaidas: 0 },
    transactions: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [verification, setVerification] = useState<
    "NOT_STARTED" | "PENDING" | "APPROVED" | "BANNED"
  >("NOT_STARTED");
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [period, setPeriod] = useState<
    "today" | "yesterday" | "7d" | "30d" | "lastMonth" | "max"
  >("today");
  const [refreshAt, setRefreshAt] = useState<Date>(new Date());
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = sidebarCollapsed ? 76 : 260;

  /* ---------- fetch user profile (2FA flags) ---------- */
  useEffect(() => {
    if (
      user &&
      (user as any).kycStatus &&
      verification !== (user as any).kycStatus
    ) {
      setVerification((user as any).kycStatus);
    }
  }, [user, verification]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await axios.get(`${API}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.data?.success && r.data.data) {
          setLocalUser({
            ...r.data.data,
            twofaEnabled: Boolean(r.data.data.twofaEnabled),
            twofaConfirmed: Boolean(r.data.data.twofaConfirmed),
          });
        }
      } catch (e) {
        console.error("profile error", e);
      }
    })();
  }, [token]);

  /* ---------- wallet ---------- */
  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        const r = await axios.get(`${API}/api/user/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.data?.success) {
          setWalletStats({
            currentBalance: Number(r.data.data.currentBalance) || 0,
            blockedBalance: Number(r.data.data.blockedBalance) || 0,
          });
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user, token]);

  /* ---------- transactions ---------- */
  const fetchTransactions = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const r = await axios.get(
        `${API}/api/user/transactions-report?page=1&limit=200`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        setTxData({
          totals: {
            totalTransacionado:
              Number(r.data.data.summary?.totalTransactionado) || 0,
            totalEntradas: Number(r.data.data.summary?.totalEntradas) || 0,
            totalSaidas: Number(r.data.data.summary?.totalSaidas) || 0,
          },
          transactions: r.data.data.transactions || [],
        });
        setRefreshAt(new Date());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);
  const num = (v: number) => new Intl.NumberFormat("pt-BR").format(v || 0);
  const hideable = (v: string) => (valuesVisible ? v : "••••••");

  /* ---------- derived computations ---------- */
  const txs = txData.transactions;
  const paid = txs.filter((t) => String(t.status).toUpperCase() === "PAID");
  const refunded = txs.filter((t) =>
    ["REFUNDED", "CHARGEBACK"].includes(String(t.status).toUpperCase())
  );
  const pixGenerated = txs.filter(
    (t) => String(t.method).toUpperCase() === "PIX"
  );
  const totalTx = txs.length;
  const conv = totalTx > 0 ? (paid.length / totalTx) * 100 : 0;
  const grossSum = paid.reduce(
    (acc, t) => acc + Number(t.grossAmount || 0),
    0
  );
  const netSum = paid.reduce((acc, t) => acc + Number(t.netAmount || 0), 0);
  const avgTicket = paid.length > 0 ? grossSum / paid.length : 0;
  const approvalRate = totalTx > 0 ? (paid.length / totalTx) * 100 : 0;

  /* ---------- group by hour for "today" chart ---------- */
  const chartData = useMemo(() => {
    const now = new Date();
    const buckets = new Array(13).fill(null).map((_, i) => ({
      label: `${String(i * 2).padStart(2, "0")}:00`,
      hour: i * 2,
      gross: 0,
      paid: 0,
      pix: 0,
    }));
    for (const t of txs) {
      if (!t.createdAt) continue;
      const d = new Date(t.createdAt);
      if (period === "today") {
        if (
          d.getFullYear() !== now.getFullYear() ||
          d.getMonth() !== now.getMonth() ||
          d.getDate() !== now.getDate()
        )
          continue;
      }
      const h = d.getHours();
      const idx = Math.min(12, Math.floor(h / 2));
      const bucket = buckets[idx];
      if (!bucket) continue;
      bucket.gross += Number(t.grossAmount || 0);
      if (String(t.status).toUpperCase() === "PAID") {
        bucket.paid += 1;
      }
      if (String(t.method).toUpperCase() === "PIX") {
        bucket.pix += 1;
      }
    }
    return buckets;
  }, [txs, period]);

  /* ---------- sparkline data (last N points per metric) ---------- */
  const sparkGross = chartData.map((b) => b.gross);
  const sparkPaid = chartData.map((b) => b.paid);
  const sparkConv = chartData.map((b) =>
    b.paid > 0 && b.gross > 0 ? (b.paid / Math.max(1, b.gross / 100)) * 100 : 0
  );
  const sparkPaidCount = chartData.map((b) => b.paid);

  /* ---------- live feed ---------- */
  const liveFeed = useMemo(() => {
    return [...txs]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 8)
      .map((t) => {
        const status = String(t.status).toUpperCase();
        const method = String(t.method || "").toUpperCase();
        const isPaid = status === "PAID";
        return {
          id: t.id,
          title: isPaid
            ? "Venda aprovada"
            : method === "PIX"
            ? "PIX gerado"
            : `Transação ${status}`,
          name: t.customer?.name || "Cliente",
          value: `+${fmt(Number(t.grossAmount || 0))}`,
          at: t.createdAt,
          kind: isPaid ? "paid" : "pix",
          color: isPaid ? T.primary : T.green,
        };
      });
  }, [txs]);

  /* ---------- greeting ---------- */
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  /* ---------- sidebar nav definition ---------- */
  const nav = [
    {
      label: "Command Center",
      items: [
        { label: "Dashboard", href: "/v1/dashboard", icon: LayoutDashboard },
        { label: "Produtos", href: "/v1/products", icon: Package },
        { label: "Pedidos", href: "/v1/products/sales", icon: Receipt },
        {
          label: "Recebimentos",
          href: "/v1/finance/recivements",
          icon: ArrowDownToLine,
        },
        {
          label: "Saques",
          href: "/v1/finance/withdraw",
          icon: ArrowUpFromLine,
        },
      ],
    },
    {
      label: "Inteligência",
      items: [
        { label: "Relatórios", href: "/v1/reports", icon: BarChart3 },
        { label: "Campanhas", href: "/v1/reports", icon: Megaphone },
        { label: "Automação", href: "/v1/configs/webhook", icon: Workflow },
        { label: "Shadow AI", href: "/shadow", icon: Sparkles },
      ],
    },
    {
      label: "Integrações",
      items: [
        { label: "Webhooks", href: "/v1/configs/webhook", icon: WebhookIcon },
        { label: "API & Docs", href: "/v1/configs/apikey", icon: Code },
        { label: "Pixels", href: "/v1/configs/apikey", icon: Target },
        { label: "Domínios", href: "/v1/configs/profile", icon: Globe },
      ],
    },
    {
      label: "Configurações",
      items: [
        { label: "Conta", href: "/v1/configs/profile", icon: UserCircle2 },
        { label: "Segurança", href: "/v1/configs/profile", icon: Shield },
        {
          label: "Notificações",
          href: "/v1/configs/profile",
          icon: BellRing,
        },
      ],
    },
  ];

  if (!user) return null;

  const initial = (user?.companyName?.[0] || "S").toUpperCase();

  /* ---------- KPI data ---------- */
  const kpis = [
    {
      label: "Faturamento bruto",
      value: hideable(fmt(grossSum)),
      delta: "+14,6%",
      deltaText: "vs ontem",
      deltaPositive: true,
      icon: <CircleDollarSign className="h-3.5 w-3.5" />,
      color: T.primary,
      sparkColor: T.primary,
      sparkline: sparkGross,
    },
    {
      label: "Faturamento líquido",
      value: hideable(fmt(netSum)),
      delta: "+12,7%",
      deltaText: "vs ontem",
      deltaPositive: true,
      icon: <Wallet className="h-3.5 w-3.5" />,
      color: T.blue,
      sparkColor: T.blue,
      sparkline: sparkGross.map((g) => g * 0.87),
    },
    {
      label: "Taxa de conversão",
      value: `${conv.toFixed(1)}%`,
      delta: "+2,4pp",
      deltaText: "vs ontem",
      deltaPositive: true,
      icon: <Percent className="h-3.5 w-3.5" />,
      color: T.green,
      sparkColor: T.green,
      sparkline: sparkConv,
    },
    {
      label: "Pedidos pagos",
      value: num(paid.length),
      delta: "+9,1%",
      deltaText: "vs ontem",
      deltaPositive: true,
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      color: T.orange,
      sparkColor: T.orange,
      sparkline: sparkPaidCount,
    },
  ];

  const secondary = [
    {
      label: "Pedidos totais",
      value: num(totalTx),
      delta: "+14,1%",
      icon: <ShoppingCart className="h-4 w-4" />,
      color: T.primary,
    },
    {
      label: "PIX gerados",
      value: num(pixGenerated.length),
      delta: "+11,3%",
      icon: <Zap className="h-4 w-4" />,
      color: T.green,
    },
    {
      label: "Pedidos pagos",
      value: num(paid.length),
      delta: "+9,1%",
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: T.blue,
    },
    {
      label: "Reembolsos",
      value: num(refunded.length),
      delta: "-2,1%",
      icon: <RotateCcw className="h-4 w-4" />,
      color: T.red,
      negative: true,
    },
    {
      label: "Ticket médio",
      value: hideable(fmt(avgTicket)),
      delta: "+4,6%",
      icon: <ReceiptText className="h-4 w-4" />,
      color: T.orange,
    },
    {
      label: "Aprovação",
      value: `${approvalRate.toFixed(1)}%`,
      delta: "+3,2pp",
      icon: <ShieldCheck className="h-4 w-4" />,
      color: T.green,
    },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Command Center</title>
      </Head>

      <div
        className="relative flex min-h-screen w-full"
        style={{
          background: "#F1F3F8",
          color: T.text,
          fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {/* ============================================================
            SIDEBAR (LIGHT GRAY, STICKY, COLLAPSIBLE)
            ============================================================ */}
        <aside
          className="sticky top-0 z-30 hidden h-screen shrink-0 flex-col md:flex"
          style={{
            width: sidebarWidth,
            background: "#F1F3F8",
            transition: "width 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* Brand */}
          <Link
            href="/v1/dashboard"
            className="relative flex flex-col items-center gap-2 px-4 py-5"
            style={{ minHeight: 120 }}
          >
            <ShadowLogo size={sidebarCollapsed ? 56 : 110} />
            {!sidebarCollapsed && (
              <div className="text-center leading-tight">
                <div
                  className="text-[13px] font-bold tracking-[0.18em] text-slate-700"
                  style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
                >
                  SHADOWPAY
                </div>
                <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.30em] text-slate-400">
                  Financial OS
                </div>
              </div>
            )}
          </Link>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-2">
            {nav.map((group) => (
              <div key={group.label} className="mb-5 last:mb-0">
                {!sidebarCollapsed && (
                  <p
                    className="px-3 pb-2 text-[9.5px] font-bold uppercase tracking-[0.20em]"
                    style={{ color: T.textMuted }}
                  >
                    {group.label}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = router.pathname === item.href;
                    return (
                      <li key={`${group.label}-${item.label}`}>
                        <Link
                          href={item.href}
                          title={sidebarCollapsed ? item.label : undefined}
                          className="group flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-colors"
                          style={{
                            padding: sidebarCollapsed
                              ? "10px"
                              : "8px 12px",
                            justifyContent: sidebarCollapsed
                              ? "center"
                              : "flex-start",
                            background: active
                              ? T.primaryBg
                              : "transparent",
                            color: active ? T.primary : T.text2,
                          }}
                        >
                          <Icon
                            className="h-4 w-4 shrink-0"
                            style={{
                              color: active ? T.primary : T.textMuted,
                            }}
                          />
                          {!sidebarCollapsed && (
                            <span className="flex-1 truncate">
                              {item.label}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* User card */}
          <div className="px-3 pb-3">
            {!sidebarCollapsed ? (
              <>
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(15,23,42,0.06)",
                    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)",
                      }}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-900">
                        {user?.companyName || "Operador"}
                      </p>
                      <p className="truncate text-[10px] text-slate-500">
                        Seller Bronze
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    KYC verificado
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">
                    Próximo repasse{" "}
                    <span className="font-semibold text-slate-700">
                      25 Mai 2026
                    </span>
                  </p>
                </div>

                <a
                  href="https://wa.me/559991519044?text=Ol%C3%A1%20preciso%20de%20ajuda%20com%20a%20ShadowPay."
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
                >
                  <LifeBuoy className="h-3.5 w-3.5" />
                  Suporte 24/7
                </a>
              </>
            ) : (
              <div
                className="flex h-10 w-10 mx-auto items-center justify-center rounded-full text-xs font-bold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)",
                }}
                title={user?.companyName || "Operador"}
              >
                {initial}
              </div>
            )}
          </div>
        </aside>

        {/* ============================================================
            MAIN COLUMN (white, sticks next to sidebar with shadow)
            ============================================================ */}
        <div
          className="relative flex min-h-screen min-w-0 flex-1 flex-col"
          style={{
            background: "#FFFFFF",
            boxShadow:
              "-12px 0 28px -16px rgba(15, 23, 42, 0.10), -2px 0 8px rgba(15, 23, 42, 0.05)",
          }}
        >
          {/* Toggle button — sits on the divider between sidebar and main */}
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="absolute top-7 z-40 hidden h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-110 md:flex"
            style={{
              left: -14,
              background: "#FFFFFF",
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "0 2px 6px rgba(15,23,42,0.10)",
              color: "#475569",
            }}
            aria-label={
              sidebarCollapsed ? "Expandir menu" : "Recolher menu"
            }
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </button>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* ============================================================
                TOPBAR (LIGHT)
                ============================================================ */}
            <header
              className="sticky top-0 z-40 flex h-16 items-center gap-3 px-4 md:px-8"
              style={{
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(12px)",
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              {/* Search */}
              <div className="flex-1 max-w-2xl">
                <div
                  className="relative group flex h-10 items-center rounded-xl px-3"
                  style={{
                    background: "#F1F2F6",
                    border: `1px solid ${T.border}`,
                  }}
                >
                  <Search className="mr-2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar, criar produto, abrir checkout..."
                    className="flex-1 bg-transparent text-[13px] text-slate-700 placeholder-slate-400 outline-none"
                  />
                  <kbd
                    className="ml-2 hidden items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[10px] sm:flex"
                    style={{
                      background: "white",
                      border: `1px solid ${T.border}`,
                      color: T.text2,
                    }}
                  >
                    Ctrl K
                  </kbd>
                </div>
              </div>

              {/* Right cluster */}
              <div className="ml-auto flex items-center gap-2">
                {/* Shadow online */}
                <Link
                  href="/shadow"
                  className="hidden h-9 items-center gap-2 rounded-xl px-3 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:flex"
                  style={{ border: `1px solid ${T.border}` }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Shadow online
                  <svg
                    width="44"
                    height="14"
                    viewBox="0 0 44 14"
                    className="ml-1"
                    fill="none"
                  >
                    <path
                      d="M0 7 L8 7 L10 3 L14 11 L18 5 L22 9 L26 4 L30 8 L34 7 L44 7"
                      stroke={T.primary}
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>

                {/* Eye toggle */}
                <button
                  onClick={() => setValuesVisible((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                  style={{ border: `1px solid ${T.border}` }}
                  aria-label="Alternar valores"
                >
                  {valuesVisible ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                  )}
                </button>

                <a
                  href="https://wa.me/559991519044?text=Ol%C3%A1%20preciso%20de%20ajuda%20com%20a%20ShadowPay."
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                  style={{ border: `1px solid ${T.border}` }}
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
                <button
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                  style={{ border: `1px solid ${T.border}` }}
                >
                  <Bell className="h-4 w-4" />
                  <span
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: T.primary }}
                  >
                    3
                  </span>
                </button>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                  style={{ border: `1px solid ${T.border}` }}
                >
                  <HelpCircle className="h-4 w-4" />
                </button>

                {/* Avatar */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex h-10 items-center gap-2 rounded-xl pl-1 pr-3 transition-colors hover:bg-slate-50"
                    style={{ border: `1px solid ${T.border}` }}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)",
                      }}
                    >
                      {initial}
                    </div>
                    <div className="hidden text-left leading-tight md:block">
                      <p className="text-[12px] font-semibold text-slate-800">
                        {(user?.companyName || "Operador").slice(0, 16)}
                      </p>
                      <p className="text-[10px] text-slate-500">Seller Bronze</p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div
                        className="absolute right-0 top-12 z-40 w-48 overflow-hidden rounded-xl bg-white p-1.5 shadow-xl"
                        style={{ border: `1px solid ${T.border}` }}
                      >
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            router.push("/v1/configs/profile");
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <UserCircle2 className="h-3.5 w-3.5" />
                          Perfil
                        </button>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-500 hover:bg-rose-50"
                        >
                          Sair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* ============================================================
                MAIN CONTENT
                ============================================================ */}
            <main className="px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8">
              {/* HERO — banner art como background-image (sem <img>) */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="relative mb-6 overflow-hidden"
                style={{
                  // Banner art "embutido" no card — aparece no DevTools como
                  // background-image num div, não como <img>.
                  backgroundColor: "#FFFFFF",
                  backgroundImage: "url('/shadow-hero-bg.png')",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "left center",
                  backgroundSize: "auto 100%",
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  borderRadius: 24,
                  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
                  padding: "32px 36px",
                }}
              >
                {/* Content area — offset right da arte */}
                <div className="relative md:pl-[210px]">
                  {/* top row: greeting + buttons */}
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <h1
                        className="flex flex-wrap items-center gap-x-3 gap-y-1"
                        style={{
                          fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                          fontSize: 28,
                          fontWeight: 700,
                          lineHeight: 1.15,
                          color: "#0F172A",
                          letterSpacing: "-0.005em",
                          fontFeatureSettings: '"calt" 1, "kern" 1',
                          wordSpacing: "0.05em",
                          margin: 0,
                        }}
                      >
                        <span className="break-words">
                          {greeting}, {user?.companyName || "Operador"}.
                        </span>
                        <span
                          className="inline-block"
                          style={{
                            fontFamily: "system-ui, sans-serif",
                            fontSize: 24,
                          }}
                        >
                          👋
                        </span>
                      </h1>
                      <p
                        style={{
                          marginTop: 8,
                          fontSize: 14,
                          color: "#64748B",
                        }}
                      >
                        Operação sincronizada. Última atualização há{" "}
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#334155",
                          }}
                        >
                          {Math.max(
                            1,
                            Math.floor(
                              (Date.now() - refreshAt.getTime()) / 1000
                            )
                          )}{" "}
                          segundos
                        </span>
                        .
                      </p>
                    </div>

                    {/* Buttons — top right */}
                    <div
                      className="flex flex-wrap items-center"
                      style={{ gap: 12 }}
                    >
                      <button
                        onClick={() => router.push("/v1/products/create")}
                        className="inline-flex items-center gap-2 transition-all hover:bg-slate-50"
                        style={{
                          height: 40,
                          padding: "0 16px",
                          borderRadius: 12,
                          background: "#FFFFFF",
                          border: "1px solid #E5E7EB",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        <Plus className="h-4 w-4" style={{ color: "#64748B" }} />
                        Novo produto
                      </button>
                      <button
                        onClick={() => router.push("/v1/products/create")}
                        className="inline-flex items-center gap-2 transition-all hover:bg-slate-50"
                        style={{
                          height: 40,
                          padding: "0 16px",
                          borderRadius: 12,
                          background: "#FFFFFF",
                          border: "1px solid #E5E7EB",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        <MessageSquare
                          className="h-4 w-4"
                          style={{ color: "#64748B" }}
                        />
                        Criar checkout
                      </button>
                      <button
                        onClick={() => router.push("/v1/finance/withdraw")}
                        className="inline-flex items-center gap-2 transition-transform hover:-translate-y-0.5"
                        style={{
                          height: 40,
                          padding: "0 18px",
                          borderRadius: 12,
                          background: "#7C3AED",
                          boxShadow: "0 8px 20px -8px rgba(124, 58, 237, 0.55)",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#FFFFFF",
                        }}
                      >
                        <DollarSign className="h-4 w-4" />
                        Sacar
                      </button>
                    </div>
                  </div>

                  {/* 2FA alert — horizontal bar */}
                  {localUser &&
                    !(localUser.twofaEnabled && localUser.twofaConfirmed) && (
                      <div
                        className="flex items-center justify-between"
                        style={{
                          marginTop: 28,
                          height: 64,
                          borderRadius: 16,
                          background: "transparent",
                          border: "1px solid rgba(15, 23, 42, 0.06)",
                          padding: "0 18px",
                        }}
                      >
                        <div className="flex items-center" style={{ gap: 14 }}>
                          <div
                            className="flex items-center justify-center"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: "rgba(255, 255, 255, 0.55)",
                              border: "1px solid rgba(15, 23, 42, 0.05)",
                              color: "#475569",
                              backdropFilter: "blur(4px)",
                              flexShrink: 0,
                            }}
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#1E293B",
                                margin: 0,
                              }}
                            >
                              Autenticação em duas etapas pendente
                            </p>
                            <p
                              style={{
                                fontSize: 12,
                                color: "#64748B",
                                margin: 0,
                              }}
                            >
                              Proteja saques, API keys e alterações sensíveis.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIs2FAModalOpen(true)}
                          className="inline-flex items-center transition-colors hover:bg-slate-50"
                          style={{
                            height: 36,
                            padding: "0 16px",
                            borderRadius: 10,
                            background: "#FFFFFF",
                            border: "1px solid #E5E7EB",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#334155",
                          }}
                        >
                          Ativar agora
                        </button>
                      </div>
                    )}

                  <TwoFAModal
                    isOpen={is2FAModalOpen}
                    onClose={() => setIs2FAModalOpen(false)}
                    token={token!}
                    user={localUser}
                    setUser={setLocalUser}
                  />
                </div>
              </motion.section>

              {/* KPIs ROW */}
              <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {kpis.map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: i * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="rounded-2xl p-5"
                    style={{
                      background: T.card,
                      border: `1px solid ${T.border}`,
                      boxShadow: T.cardShadow,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-slate-500">
                        {k.label}
                      </p>
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{
                          background: `${k.color}1a`,
                          color: k.color,
                        }}
                      >
                        {k.icon}
                      </span>
                    </div>
                    <div
                      className="mt-2 text-[24px] font-bold leading-none tracking-tight text-slate-900"
                      style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
                    >
                      {k.value}
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span
                        className="text-[12px] font-bold"
                        style={{ color: k.deltaPositive ? T.green : T.red }}
                      >
                        {k.delta}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {k.deltaText}
                      </span>
                    </div>
                    {/* sparkline */}
                    <div className="mt-3 h-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={k.sparkline.map((v, idx) => ({
                            i: idx,
                            v,
                          }))}
                        >
                          <Line
                            type="monotone"
                            dataKey="v"
                            stroke={k.sparkColor}
                            strokeWidth={1.8}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                ))}

                {/* Saldo disponível — larger card */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.25,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="rounded-2xl p-5"
                  style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    boxShadow: T.cardShadow,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Saldo disponível
                    </p>
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{
                        background: T.primaryBg,
                        color: T.primary,
                      }}
                    >
                      <Wallet className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div
                    className="mt-2 text-[24px] font-bold leading-none tracking-tight text-slate-900"
                    style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
                  >
                    {hideable(fmt(walletStats.currentBalance))}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Bloqueado</span>
                      <span className="font-semibold text-slate-700">
                        {hideable(fmt(walletStats.blockedBalance))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Próximo repasse</span>
                      <span className="font-semibold text-slate-700">
                        25 Mai 2026
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/v1/finance/withdraw")}
                    className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    style={{ border: `1px solid ${T.border}` }}
                  >
                    Ver extrato
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                </motion.div>
              </section>

              {/* CHART + ACTIVITY */}
              <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
                {/* Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="rounded-2xl p-5"
                  style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    boxShadow: T.cardShadow,
                  }}
                >
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2
                        className="text-[15px] font-bold tracking-tight text-slate-900"
                        style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
                      >
                        Volume processado
                      </h2>
                      <p className="text-[12px] text-slate-500">
                        Receita, pedidos pagos e PIX gerados
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        style={{ border: `1px solid ${T.border}` }}
                      >
                        Todos os checkouts
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50"
                        style={{ border: `1px solid ${T.border}` }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Period pills */}
                  <div className="mb-4 flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        ["today", "Hoje"],
                        ["yesterday", "Ontem"],
                        ["7d", "7 dias"],
                        ["30d", "Este mês"],
                        ["lastMonth", "Mês passado"],
                        ["max", "Máximo"],
                      ] as const
                    ).map(([key, label]) => {
                      const active = period === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setPeriod(key as any)}
                          className="rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors"
                          style={{
                            background: active ? T.primaryBg : "transparent",
                            color: active ? T.primary : T.text2,
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                      style={{ border: `1px solid ${T.border}` }}
                    >
                      Personalizado
                      <Calendar className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Legend */}
                  <div className="mb-3 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: T.primary }}
                      />
                      Faturamento bruto
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: T.blue }}
                      />
                      Pedidos pagos
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: T.green }}
                      />
                      PIX gerados
                    </span>
                  </div>

                  {/* Chart */}
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 8, right: 16, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(15, 23, 42, 0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          stroke="#94A3B8"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#94A3B8"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          width={50}
                          tickFormatter={(v: number) =>
                            v >= 1000
                              ? `R$ ${(v / 1000).toFixed(0)}K`
                              : `R$ ${v}`
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            background: "white",
                            border: `1px solid ${T.border}`,
                            borderRadius: 12,
                            boxShadow:
                              "0 12px 32px rgba(15, 23, 42, 0.08)",
                            fontSize: 12,
                            color: T.text,
                          }}
                          labelStyle={{
                            color: T.text2,
                            fontWeight: 600,
                          }}
                          formatter={(v: any, name: any) => {
                            if (name === "gross")
                              return [fmt(Number(v)), "Faturamento"];
                            if (name === "paid")
                              return [num(Number(v)), "Pedidos pagos"];
                            return [num(Number(v)), "PIX gerados"];
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="gross"
                          stroke={T.primary}
                          strokeWidth={2.2}
                          dot={{
                            fill: T.primary,
                            stroke: "white",
                            strokeWidth: 2,
                            r: 3,
                          }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="paid"
                          stroke={T.blue}
                          strokeWidth={2.2}
                          dot={{
                            fill: T.blue,
                            stroke: "white",
                            strokeWidth: 2,
                            r: 3,
                          }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="pix"
                          stroke={T.green}
                          strokeWidth={2.2}
                          dot={{
                            fill: T.green,
                            stroke: "white",
                            strokeWidth: 2,
                            r: 3,
                          }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="rounded-2xl p-5"
                  style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    boxShadow: T.cardShadow,
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3
                        className="text-[14px] font-bold tracking-tight text-slate-900"
                        style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
                      >
                        Atividade ao vivo
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                        Live
                      </span>
                    </div>
                    <button
                      onClick={() => router.push("/v1/products/sales")}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Ver todas
                    </button>
                  </div>

                  {liveFeed.length === 0 ? (
                    <div className="py-10 text-center">
                      <Inbox className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                      <p className="text-xs text-slate-500">
                        Nenhuma atividade ainda
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {liveFeed.map((item, idx) => {
                        const initial =
                          item.name?.charAt(0).toUpperCase() || "?";
                        const gradients = [
                          "linear-gradient(135deg,#7C3AED,#22D3EE)",
                          "linear-gradient(135deg,#F59E0B,#EF4444)",
                          "linear-gradient(135deg,#22C55E,#3B82F6)",
                          "linear-gradient(135deg,#3B82F6,#7C3AED)",
                          "linear-gradient(135deg,#EC4899,#F59E0B)",
                          "linear-gradient(135deg,#06B6D4,#22C55E)",
                        ];
                        return (
                          <li
                            key={item.id}
                            className="flex items-center gap-3"
                          >
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                              style={{
                                background: gradients[idx % gradients.length],
                              }}
                            >
                              {initial}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-semibold text-slate-800">
                                {item.title}
                              </p>
                              <p className="truncate text-[11px] text-slate-500">
                                {item.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className="text-[12px] font-bold"
                                style={{
                                  color:
                                    item.kind === "paid"
                                      ? T.primary
                                      : T.green,
                                  fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                                }}
                              >
                                {valuesVisible ? item.value : "•••••"}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {timeAgo(item.at)}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </motion.div>
              </section>

              {/* SECONDARY METRICS + SHADOW AI */}
              <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="rounded-2xl p-5"
                  style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    boxShadow: T.cardShadow,
                  }}
                >
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
                    {secondary.map((m) => (
                      <div key={m.label}>
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-md"
                            style={{
                              background: `${m.color}14`,
                              color: m.color,
                            }}
                          >
                            {m.icon}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] font-semibold text-slate-500">
                          {m.label}
                        </p>
                        <div className="mt-1.5 flex items-baseline gap-1.5">
                          <span
                            className="text-[18px] font-bold tracking-tight text-slate-900"
                            style={{
                              fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                            }}
                          >
                            {m.value}
                          </span>
                          <span
                            className="text-[11px] font-bold"
                            style={{
                              color: m.negative ? T.red : T.green,
                            }}
                          >
                            {m.delta}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Shadow AI promo card */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                  className="relative overflow-hidden rounded-2xl p-5"
                  style={{
                    background:
                      "linear-gradient(135deg, #1A1430 0%, #2D1B69 50%, #1A1430 100%)",
                    border: `1px solid rgba(124, 58, 237, 0.3)`,
                    boxShadow:
                      "0 8px 24px -8px rgba(124, 58, 237, 0.4)",
                  }}
                >
                  {/* Big halo behind orb */}
                  <div
                    className="pointer-events-none absolute -right-10 -bottom-10 h-52 w-52 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(168,85,247,0.55) 0%, rgba(124,58,237,0.18) 45%, transparent 70%)",
                      filter: "blur(8px)",
                    }}
                  />

                  {/* Orbital ring with logo */}
                  <div className="pointer-events-none absolute right-2 bottom-2 flex h-32 w-32 items-center justify-center">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(124,58,237,0.04) 55%, transparent 100%)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow:
                          "inset 0 0 20px rgba(168,85,247,0.15), 0 0 40px rgba(168,85,247,0.18)",
                      }}
                    />
                    <ShadowLogo
                      size={64}
                      glow
                      glowColor="rgba(168, 85, 247, 0.55)"
                    />
                  </div>

                  <div className="relative">
                    <div className="mb-1 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-300" />
                      <h3
                        className="text-[16px] font-bold tracking-tight text-white"
                        style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
                      >
                        Shadow AI
                      </h3>
                    </div>
                    <p className="text-[12px] text-violet-200/80">
                      Monitorando sua operação
                    </p>
                    <button
                      onClick={() => router.push("/shadow")}
                      className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5"
                      style={{
                        background:
                          "linear-gradient(120deg, #7C3AED 0%, #6D28D9 100%)",
                      }}
                    >
                      Abrir Shadow
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              </section>

              {/* Footer */}
              <p
                className="mt-8 text-center text-[11px]"
                style={{ color: T.textMuted }}
              >
                ShadowPay Financial OS © 2026 · Todos os direitos reservados.
              </p>
            </main>
          </div>
        </div>
      </div>

      <ShadowPanel />
    </>
  );
}

/* helpers */
function timeAgo(iso?: string) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (diff < 60_000) return "agora";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m} min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

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
import { LightShell } from "@/components/LightShell";

import {
  ChevronDown,
  Sparkles,
  MessageSquare,
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
} from "lucide-react";

const API = "https://shadowpay-backend.onrender.com";

/* ============================================================
 * TOKENS LIGHT — locais a essa página, ignora o ThemeProvider dark
 * ============================================================ */
const T = {
  bg: "#F6F8FB",
  card: "#FFFFFF",
  border: "#E6E8EB",
  borderStrong: "rgba(15, 23, 42, 0.10)",
  text: "#1A1F36",
  text2: "#475569",
  textMuted: "#8A94A6",
  primary: "#7C3AED",
  primaryBg: "rgba(124, 58, 237, 0.08)",
  blue: "#3B82F6",
  green: "#1F8F4E",
  orange: "#F59E0B",
  red: "#D4351C",
  cardShadow: "0 1px 1px rgba(15, 23, 42, 0.04)",
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
  type PeriodKey =
    | "today"
    | "yesterday"
    | "7d"
    | "30d"
    | "lastMonth"
    | "max"
    | "custom";
  const [period, setPeriod] = useState<PeriodKey>("today");
  const [refreshAt, setRefreshAt] = useState<Date>(new Date());

  // Data selecionada no gráfico "Desempenho Diário" (estilo FlevoPay). A
  // dashboard (métricas + gráfico) reflete esse dia. Default = hoje.
  const ymdLocal = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    ymdLocal(new Date())
  );

  /* ---------- Drawer de Filtros (botão "Filtros" no topo) ----------
   * Mantém estados PROVISÓRIOS (draftStatus / draftFrom / draftTo) que
   * só viram efetivos quando o seller clica "Aplicar Filtros".
   */
  type StatusFilter = "all" | "PAID" | "PENDING" | "REFUNDED";
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [customRange, setCustomRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });

  // estados de rascunho (só salva ao clicar Aplicar)
  const [draftStatus, setDraftStatus] = useState<StatusFilter>("all");
  const [draftRange, setDraftRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });
  const [showCal, setShowCal] = useState(false);

  // ao abrir o drawer, hidrata o rascunho com o estado atual
  const openFilters = () => {
    setDraftStatus(statusFilter);
    setDraftRange(customRange);
    setFiltersOpen(true);
  };
  const applyFilters = () => {
    setStatusFilter(draftStatus);
    setCustomRange(draftRange);
    if (draftRange.from && draftRange.to) setPeriod("custom");
    setFiltersOpen(false);
  };
  const clearFilters = () => {
    setDraftStatus("all");
    setDraftRange({ from: "", to: "" });
    setStatusFilter("all");
    setCustomRange({ from: "", to: "" });
    if (period === "custom") setPeriod("today");
    setFiltersOpen(false);
  };

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

  /* ---------- transactions ----------
   * limit alto pra manter histórico no front. O summary do backend
   * agrega no banco inteiro, então mesmo passando do limit, "Máximo"
   * exibe valor real (totalEntradas/totalSaidas).
   */
  const fetchTransactions = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const r = await axios.get(
        `${API}/api/user/transactions-report?page=1&limit=1000`,
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

  /* refresh suave a cada 30s pra venda nova entrar no painel sem reload */
  useEffect(() => {
    if (!user || !token) return;
    const id = setInterval(() => {
      fetchTransactions();
    }, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);
  const num = (v: number) => new Intl.NumberFormat("pt-BR").format(v || 0);
  const hideable = (v: string) => (valuesVisible ? v : "••••••");

  /* ---------- helpers de período ----------
   * Cada período tem uma janela `[start, end)` real, e o "período
   * anterior" tem o MESMO tamanho imediatamente antes — assim a delta
   * é uma comparação justa.
   */
  type Range = { start: Date; end: Date };

  const periodRanges = useMemo((): { curr: Range; prev: Range } => {
    // Janela = o DIA selecionado (estilo FlevoPay). "prev" = dia anterior,
    // só pra manter os cálculos de delta válidos (não são mais exibidos).
    const p = selectedDate.split("-");
    const y = Number(p[0]);
    const m = Number(p[1]);
    const d = Number(p[2]);
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    const end = new Date(y, m - 1, d, 23, 59, 59, 999);
    const prevStart = new Date(y, m - 1, d - 1, 0, 0, 0, 0);
    const prevEnd = new Date(y, m - 1, d - 1, 23, 59, 59, 999);
    return { curr: { start, end }, prev: { start: prevStart, end: prevEnd } };
  }, [selectedDate]);

  const periodLabel: Record<PeriodKey, string> = {
    today: "vs ontem",
    yesterday: "vs anteontem",
    "7d": "vs 7 dias antes",
    "30d": "vs mês passado",
    lastMonth: "vs mês anterior",
    max: "histórico",
    custom: "vs período anterior",
  };

  const inRange = (t: any, r: Range) => {
    if (!t?.createdAt) return false;
    const d = new Date(t.createdAt).getTime();
    return d >= r.start.getTime() && d <= r.end.getTime();
  };

  /* ---------- derived computations (período-aware + filtro status) ---------- */
  const allTxs = txData.transactions;
  const matchStatus = (t: any) => {
    if (statusFilter === "all") return true;
    const s = String(t.status).toUpperCase();
    if (statusFilter === "PAID") return s === "PAID";
    if (statusFilter === "PENDING") return s === "PENDING" || s === "PROCESSING";
    if (statusFilter === "REFUNDED")
      return s === "REFUNDED" || s === "CHARGEBACK";
    return true;
  };
  const txs = useMemo(
    () =>
      allTxs.filter((t) => inRange(t, periodRanges.curr) && matchStatus(t)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTxs, periodRanges, statusFilter]
  );
  const prevTxs = useMemo(
    () =>
      allTxs.filter((t) => inRange(t, periodRanges.prev) && matchStatus(t)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTxs, periodRanges, statusFilter]
  );

  const isPaid = (t: any) => String(t.status).toUpperCase() === "PAID";
  const isRefund = (t: any) =>
    ["REFUNDED", "CHARGEBACK"].includes(String(t.status).toUpperCase());
  const isPix = (t: any) => String(t.method).toUpperCase() === "PIX";

  const computeBlock = (rows: any[]) => {
    const paid = rows.filter(isPaid);
    const refunded = rows.filter(isRefund);
    const pix = rows.filter(isPix);
    const grossSum = paid.reduce((a, t) => a + Number(t.grossAmount || 0), 0);
    const netSum = paid.reduce((a, t) => a + Number(t.netAmount || 0), 0);
    const conv = rows.length > 0 ? (paid.length / rows.length) * 100 : 0;
    const avgTicket = paid.length > 0 ? grossSum / paid.length : 0;
    return {
      total: rows.length,
      paid,
      refunded,
      pix,
      grossSum,
      netSum,
      conv,
      avgTicket,
      paidCount: paid.length,
      pixCount: pix.length,
      refundCount: refunded.length,
      approvalRate: conv,
    };
  };

  const curr = useMemo(() => computeBlock(txs), [txs]);
  const prev = useMemo(() => computeBlock(prevTxs), [prevTxs]);

  /* No "Máximo" usamos os agregados do banco (independente do limit
   * de transactions retornadas). */
  const isMax = period === "max";
  const grossSum = isMax ? Number(txData.totals.totalEntradas) || 0 : curr.grossSum;
  const netSum = isMax
    ? grossSum * 0.97 // sem agregado de netAmount no summary, mostra estimado
    : curr.netSum;
  const paid = curr.paid;
  const refunded = curr.refunded;
  const pixGenerated = curr.pix;
  const totalTx = curr.total;
  const conv = curr.conv;
  const avgTicket = curr.avgTicket;
  const approvalRate = curr.approvalRate;

  /* ---------- delta real (atual vs anterior) ----------
   *  Sempre devolve uma porcentagem. Quando o baseline é 0:
   *    - currentVal > 0 → +100% (representação de "tudo veio agora")
   *    - currentVal == 0 → 0%
   *  Sem mais "novo" / "—".
   */
  function fmtDelta(
    currentVal: number,
    previousVal: number,
    opts: { kind?: "pct" | "abs"; suffix?: "pp" } = {}
  ): { text: string; direction: "up" | "down" | "flat" } | null {
    if (isMax) return null; // "máximo" não tem baseline

    // Delta absoluta (pp) — usada pra conversão / aprovação
    if (opts.kind === "abs") {
      const diff = currentVal - previousVal;
      return {
        text: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}${opts.suffix ?? ""}`,
        direction: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
      };
    }

    // Sem nada nos dois períodos
    if (previousVal === 0 && currentVal === 0) {
      return { text: "0%", direction: "flat" };
    }

    // Baseline zero, hoje tem algo → considera 100% de crescimento
    if (previousVal === 0) {
      return currentVal > 0
        ? { text: "+100%", direction: "up" }
        : { text: "0%", direction: "flat" };
    }

    const pct = ((currentVal - previousVal) / previousVal) * 100;
    return {
      text: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
      direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat",
    };
  }

  const dGross = fmtDelta(grossSum, prev.grossSum);
  const dNet = fmtDelta(netSum, prev.netSum);
  const dConv = fmtDelta(conv, prev.conv, { kind: "abs", suffix: "pp" });
  const dPaid = fmtDelta(curr.paidCount, prev.paidCount);
  const dTotal = fmtDelta(curr.total, prev.total);
  const dPix = fmtDelta(curr.pixCount, prev.pixCount);
  const dRefund = fmtDelta(curr.refundCount, prev.refundCount);
  const dTicket = fmtDelta(avgTicket, prev.avgTicket);
  const dApproval = fmtDelta(approvalRate, prev.approvalRate, {
    kind: "abs",
    suffix: "pp",
  });

  /* "Próximo repasse" = D+1 útil (sex pula pra seg) */
  const nextPayout = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  /* ---------- buckets do gráfico — janela depende do período ----------
   *  - today/yesterday  → 13 buckets de 2h
   *  - 7d / 30d / mês   → buckets por dia
   *  - máximo           → buckets por mês
   */
  type Bucket = { label: string; key: string; gross: number; paid: number; pix: number };

  const chartData = useMemo<Bucket[]>(() => {
    // Sempre por hora do dia selecionado (00:00 → 22:00, passos de 2h),
    // igual ao "Desempenho Diário" da FlevoPay.
    const buckets: Bucket[] = [];
    for (let i = 0; i < 12; i++) {
      buckets.push({
        label: `${String(i * 2).padStart(2, "0")}:00`,
        key: String(i),
        gross: 0,
        paid: 0,
        pix: 0,
      });
    }
    for (const t of txs) {
      if (!t.createdAt) continue;
      const d = new Date(t.createdAt);
      const idx = Math.min(11, Math.floor(d.getHours() / 2));
      const b = buckets[idx];
      if (!b) continue;
      b.gross += Number(t.grossAmount || 0);
      if (isPaid(t)) b.paid += 1;
      if (isPix(t)) b.pix += 1;
    }
    return buckets;
  }, [txs]);

  /* ---------- sparkline data (last N points per metric) ---------- */
  const sparkGross = chartData.map((b) => b.gross);
  const sparkPaid = chartData.map((b) => b.paid);
  const sparkConv = chartData.map((b) =>
    b.paid > 0 && b.gross > 0 ? (b.paid / Math.max(1, b.gross / 100)) * 100 : 0
  );
  const sparkPaidCount = chartData.map((b) => b.paid);

  /* ---------- live feed (independente do período — atividade em si) ---------- */
  const liveFeed = useMemo(() => {
    return [...allTxs]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 8)
      .map((t) => {
        const status = String(t.status).toUpperCase();
        const method = String(t.method || "").toUpperCase();
        const paidNow = status === "PAID";
        return {
          id: t.id,
          title: paidNow
            ? "Venda aprovada"
            : method === "PIX"
            ? "PIX gerado"
            : `Transação ${status}`,
          name: t.customer?.name || t.customerName || "Cliente",
          value: `+${fmt(Number(t.grossAmount || 0))}`,
          at: t.createdAt,
          kind: paidNow ? "paid" : "pix",
          color: paidNow ? T.primary : T.green,
        };
      });
  }, [allTxs]);

  /* ---------- greeting ---------- */
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  if (!user) return null;

  /* ---------- KPI data ---------- */
  const deltaText = periodLabel[period];

  type Secondary = {
    label: string;
    value: string;
    delta: { text: string; direction: "up" | "down" | "flat" } | null;
    icon: any;
    color: string;
    /** quando true, "down" é bom (ex.: reembolsos caindo) */
    negativeIsGood?: boolean;
  };

  const secondary: Secondary[] = [
    {
      label: "Pedidos totais",
      value: num(totalTx),
      delta: dTotal,
      icon: <ShoppingCart className="h-4 w-4" />,
      color: T.primary,
    },
    {
      label: "PIX gerados",
      value: num(pixGenerated.length),
      delta: dPix,
      icon: <Zap className="h-4 w-4" />,
      color: T.green,
    },
    {
      label: "Pedidos pagos",
      value: num(paid.length),
      delta: dPaid,
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: T.blue,
    },
    {
      label: "Reembolsos",
      value: num(refunded.length),
      delta: dRefund,
      icon: <RotateCcw className="h-4 w-4" />,
      color: T.red,
      negativeIsGood: true,
    },
    {
      label: "Ticket médio",
      value: hideable(fmt(avgTicket)),
      delta: dTicket,
      icon: <ReceiptText className="h-4 w-4" />,
      color: T.orange,
    },
    {
      label: "Aprovação",
      value: `${approvalRate.toFixed(1)}%`,
      delta: dApproval,
      icon: <ShieldCheck className="h-4 w-4" />,
      color: T.green,
    },
  ];

  /* Faixa de métricas do topo (design do Figma) — valores reais do período
     selecionado. "Vendas" = pedidos pagos. */
  const statStrip = [
    { label: "Faturamento Bruto", value: hideable(fmt(grossSum)) },
    { label: "Faturamento Líquido", value: hideable(fmt(netSum)) },
    {
      label: "Taxa de conversão",
      value: `${conv.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`,
    },
    { label: "Ticket médio", value: hideable(fmt(avgTicket)) },
    { label: "Vendas", value: num(paid.length) },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Command Center</title>
      </Head>

      <LightShell valuesVisible={valuesVisible} onToggleValues={() => setValuesVisible((v) => !v)}>
            <div style={{ fontFeatureSettings: '"tnum" 1' }}>
              {/* BANNER promocional — largura total do conteúdo (igual à faixa
                  de métricas). Arquivo em public/dashboard-banner.webp. */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="mb-6"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/dashboard-banner.webp"
                  alt="ShadowPay — seu lucro vale mais"
                  className="block h-auto w-full rounded-[12px]"
                  draggable={false}
                />
              </motion.section>

              {/* 2FA modal (controlado pelo banner do hero) */}
              <TwoFAModal
                isOpen={is2FAModalOpen}
                onClose={() => setIs2FAModalOpen(false)}
                token={token!}
                user={localUser}
                setUser={setLocalUser}
              />

              {/* KPIs — faixa única. Espaçamentos iguais aos da FlevoPay:
                  padding 32px (p-8), gap 24px entre colunas (gap-6), radius
                  12px; rótulo 14px/500, valor 28px/800, gap rótulo→valor 8px. */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-6 rounded-[12px] p-5 sm:p-8"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  boxShadow: T.cardShadow,
                }}
              >
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
                  {statStrip.map((s) => (
                    <div key={s.label} className="flex flex-col">
                      <p className="text-[14px] font-medium leading-tight text-slate-500">
                        {s.label}
                      </p>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span
                          className="text-[28px] font-semibold leading-none text-slate-900"
                          style={{
                            fontFamily:
                              "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                          }}
                        >
                          {s.value}
                        </span>
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 12 12"
                          fill="none"
                          className="shrink-0"
                          aria-hidden="true"
                        >
                          <path
                            d="M6 1.8 L10.8 10.2 L1.2 10.2 Z"
                            fill="#7C3AED"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>

              {/* CHART + ACTIVITY */}
              <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
                {/* Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="rounded-xl p-4 sm:p-5"
                  style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    boxShadow: T.cardShadow,
                  }}
                >
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2
                        className="text-[15px] font-bold tracking-tight text-slate-900"
                        style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
                      >
                        Desempenho Diário
                      </h2>
                      <p className="text-[12px] text-slate-500">
                        Evolução financeira no período selecionado.
                      </p>
                    </div>
                    {/* Seletor de data (estilo FlevoPay) — controla o dia exibido */}
                    <div
                      className="inline-flex h-9 items-center gap-2 rounded-lg px-3"
                      style={{ border: `1px solid ${T.border}`, background: "#F8FAFC" }}
                    >
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent text-[12.5px] font-semibold text-slate-700 outline-none"
                      />
                    </div>
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
                          strokeWidth={2.4}
                          dot={false}
                          activeDot={{ r: 4 }}
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
                  className="rounded-xl p-4 sm:p-5"
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
                        const tints = [
                          { bg: "#EDE9FE", color: "#7C3AED" },
                          { bg: "#FEF3C7", color: "#D97706" },
                          { bg: "#DCFCE7", color: "#16A34A" },
                          { bg: "#DBEAFE", color: "#2563EB" },
                          { bg: "#FCE7F3", color: "#DB2777" },
                          { bg: "#CFFAFE", color: "#0891B2" },
                        ];
                        const tint = tints[idx % tints.length] as { bg: string; color: string };
                        return (
                          <li
                            key={item.id}
                            className="flex items-center gap-3"
                          >
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                              style={{ background: tint.bg, color: tint.color }}
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

            </div>
      </LightShell>

      {/* ============================================================
          DRAWER DE FILTROS — slide-in da direita
          ============================================================ */}
      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={() => setFiltersOpen(false)}
          style={{ background: "rgba(15,23,42,0.35)", backdropFilter: "blur(2px)" }}
        >
          <motion.aside
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-[380px] flex-col bg-white"
            style={{ boxShadow: "-12px 0 32px rgba(15,23,42,0.10)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${T.border}` }}
            >
              <p className="text-[15px] font-bold text-slate-900">Filtros</p>
              <button
                onClick={() => setFiltersOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Fechar"
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>×</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Action buttons */}
              <div className="mb-5 grid grid-cols-2 gap-2">
                <button
                  onClick={applyFilters}
                  className="inline-flex h-10 items-center justify-center rounded-xl text-[13px] font-bold text-white transition-colors"
                  style={{
                    background: T.primary,
                    boxShadow: "0 1px 2px rgba(13,37,61,0.10)",
                  }}
                >
                  Aplicar Filtros
                </button>
                <button
                  onClick={clearFilters}
                  className="inline-flex h-10 items-center justify-center rounded-xl text-[13px] font-bold transition-colors hover:bg-slate-50"
                  style={{
                    background: "#FFFFFF",
                    border: `1px solid ${T.border}`,
                    color: T.text,
                  }}
                >
                  Limpar
                </button>
              </div>

              <div
                className="my-5 h-px w-full"
                style={{ background: T.border }}
              />

              {/* Status */}
              <div className="mb-5">
                <label className="mb-1.5 block text-[12px] font-semibold text-slate-600">
                  Status
                </label>
                <select
                  value={draftStatus}
                  onChange={(e) =>
                    setDraftStatus(e.target.value as StatusFilter)
                  }
                  className="h-11 w-full rounded-xl border bg-white px-3 text-[13px] font-semibold outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  style={{ borderColor: T.border, color: T.text }}
                >
                  <option value="all">Todos os status</option>
                  <option value="PAID">Concluído</option>
                  <option value="PENDING">Pendente</option>
                  <option value="REFUNDED">Estornada</option>
                </select>
              </div>

              {/* Período personalizado */}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-slate-600">
                  Período
                </label>
                <button
                  onClick={() => setShowCal((v) => !v)}
                  className="flex h-11 w-full items-center justify-between rounded-xl border bg-white px-3 text-[13px] font-semibold outline-none transition-colors hover:bg-slate-50 focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  style={{ borderColor: T.border, color: T.text }}
                >
                  <span>
                    {draftRange.from && draftRange.to
                      ? `${new Date(
                          draftRange.from + "T00:00:00"
                        ).toLocaleDateString("pt-BR")} - ${new Date(
                          draftRange.to + "T00:00:00"
                        ).toLocaleDateString("pt-BR")}`
                      : "Selecione um período"}
                  </span>
                  <Calendar className="h-4 w-4" style={{ color: T.textMuted }} />
                </button>

                {showCal && (
                  <div
                    className="mt-2 rounded-xl border p-3"
                    style={{
                      borderColor: T.border,
                      background: "#FFFFFF",
                    }}
                  >
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Data inicial
                    </p>
                    <input
                      type="date"
                      value={draftRange.from}
                      max={draftRange.to || undefined}
                      onChange={(e) =>
                        setDraftRange({ ...draftRange, from: e.target.value })
                      }
                      className="h-9 w-full rounded-lg border bg-white px-3 text-[13px] outline-none"
                      style={{ borderColor: T.border }}
                    />
                    <p className="mb-2 mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Data final
                    </p>
                    <input
                      type="date"
                      value={draftRange.to}
                      min={draftRange.from || undefined}
                      onChange={(e) =>
                        setDraftRange({ ...draftRange, to: e.target.value })
                      }
                      className="h-9 w-full rounded-lg border bg-white px-3 text-[13px] outline-none"
                      style={{ borderColor: T.border }}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        </div>
      )}

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

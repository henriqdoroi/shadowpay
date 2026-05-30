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
import { ShadowLogo } from "@/components/shadow/ShadowLogo";

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
    const now = new Date();
    const startOfDay = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    switch (period) {
      case "today": {
        const curr = { start: startOfDay(now), end: endOfDay(now) };
        const yest = new Date(now); yest.setDate(yest.getDate() - 1);
        const prev = { start: startOfDay(yest), end: endOfDay(yest) };
        return { curr, prev };
      }
      case "yesterday": {
        const yest = new Date(now); yest.setDate(yest.getDate() - 1);
        const curr = { start: startOfDay(yest), end: endOfDay(yest) };
        const before = new Date(now); before.setDate(before.getDate() - 2);
        const prev = { start: startOfDay(before), end: endOfDay(before) };
        return { curr, prev };
      }
      case "7d": {
        const end = now;
        const start = new Date(now); start.setDate(start.getDate() - 7);
        const prevEnd = new Date(start);
        const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 7);
        return { curr: { start, end }, prev: { start: prevStart, end: prevEnd } };
      }
      case "30d": {
        // "Este mês" — calendário
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = now;
        const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        return { curr: { start, end }, prev: { start: prevStart, end: prevEnd } };
      }
      case "lastMonth": {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
        return { curr: { start, end }, prev: { start: prevStart, end: prevEnd } };
      }
      case "custom": {
        // Personalizado — usa as datas escolhidas no drawer Filtros.
        // Período anterior tem o mesmo tamanho da janela.
        const fromStr = customRange.from || new Date().toISOString().slice(0, 10);
        const toStr = customRange.to || fromStr;
        const start = new Date(fromStr + "T00:00:00");
        const end = new Date(toStr + "T23:59:59.999");
        const ms = end.getTime() - start.getTime();
        const prevEnd = new Date(start);
        const prevStart = new Date(start.getTime() - ms);
        return { curr: { start, end }, prev: { start: prevStart, end: prevEnd } };
      }
      case "max":
      default: {
        // Tudo desde o início — não há "anterior"
        const start = new Date(0);
        return { curr: { start, end: now }, prev: { start, end: start } };
      }
    }
  }, [period, customRange]);

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
    const buckets = new Map<string, Bucket>();

    const isHourly = period === "today" || period === "yesterday";
    const isMonthly = period === "max";

    if (isHourly) {
      for (let i = 0; i < 13; i++) {
        const label = `${String(i * 2).padStart(2, "0")}:00`;
        buckets.set(String(i), {
          label,
          key: String(i),
          gross: 0,
          paid: 0,
          pix: 0,
        });
      }
      for (const t of txs) {
        if (!t.createdAt) continue;
        const d = new Date(t.createdAt);
        const idx = String(Math.min(12, Math.floor(d.getHours() / 2)));
        const b = buckets.get(idx);
        if (!b) continue;
        b.gross += Number(t.grossAmount || 0);
        if (isPaid(t)) b.paid += 1;
        if (isPix(t)) b.pix += 1;
      }
      return Array.from(buckets.values());
    }

    if (isMonthly) {
      // agrupa por mês (até 12 últimos)
      const sourceRows = allTxs;
      for (const t of sourceRows) {
        if (!t.createdAt) continue;
        const d = new Date(t.createdAt);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!buckets.has(k)) {
          buckets.set(k, {
            key: k,
            label: d.toLocaleDateString("pt-BR", { month: "short" }),
            gross: 0,
            paid: 0,
            pix: 0,
          });
        }
        const b = buckets.get(k)!;
        b.gross += Number(t.grossAmount || 0);
        if (isPaid(t)) b.paid += 1;
        if (isPix(t)) b.pix += 1;
      }
      return Array.from(buckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([, v]) => v);
    }

    // dia a dia (7d/este mês/mês passado)
    const r = periodRanges.curr;
    const dayMs = 24 * 60 * 60 * 1000;
    const days = Math.max(
      1,
      Math.ceil((r.end.getTime() - r.start.getTime()) / dayMs)
    );
    for (let i = 0; i < days; i++) {
      const d = new Date(r.start.getTime() + i * dayMs);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      buckets.set(k, {
        key: k,
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        gross: 0,
        paid: 0,
        pix: 0,
      });
    }
    for (const t of txs) {
      if (!t.createdAt) continue;
      const d = new Date(t.createdAt);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      const b = buckets.get(k);
      if (!b) continue;
      b.gross += Number(t.grossAmount || 0);
      if (isPaid(t)) b.paid += 1;
      if (isPix(t)) b.pix += 1;
    }
    return Array.from(buckets.values());
  }, [txs, allTxs, period, periodRanges]);

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

  type Kpi = {
    label: string;
    value: string;
    delta: { text: string; direction: "up" | "down" | "flat" } | null;
    deltaText: string;
    icon: any;
    color: string;
    sparkColor: string;
    sparkline: number[];
  };

  const kpis: Kpi[] = [
    {
      label: "Faturamento bruto",
      value: hideable(fmt(grossSum)),
      delta: dGross,
      deltaText,
      icon: <CircleDollarSign className="h-3.5 w-3.5" />,
      color: T.primary,
      sparkColor: T.primary,
      sparkline: sparkGross,
    },
    {
      label: "Faturamento líquido",
      value: hideable(fmt(netSum)),
      delta: dNet,
      deltaText,
      icon: <Wallet className="h-3.5 w-3.5" />,
      color: T.blue,
      sparkColor: T.blue,
      sparkline: sparkGross.map((g) => g * 0.97),
    },
    {
      label: "Taxa de conversão",
      value: `${conv.toFixed(1)}%`,
      delta: dConv,
      deltaText,
      icon: <Percent className="h-3.5 w-3.5" />,
      color: T.green,
      sparkColor: T.green,
      sparkline: sparkConv,
    },
    {
      label: "Pedidos pagos",
      value: num(paid.length),
      delta: dPaid,
      deltaText,
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      color: T.orange,
      sparkColor: T.orange,
      sparkline: sparkPaidCount,
    },
  ];

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

  return (
    <>
      <Head>
        <title>ShadowPay — Command Center</title>
      </Head>

      <LightShell valuesVisible={valuesVisible} onToggleValues={() => setValuesVisible((v) => !v)}>
              {/* HERO — banner publicitário deitado no estilo do mockup.
                  Mobile: aspect ratio compacto tipo 5:1, SEM botões (só
                  título com nome do seller + pantera de fundo).
                  Desktop: mantém os botões à direita. */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="relative mb-6 flex items-center overflow-hidden px-5 py-6 sm:px-6 sm:py-5 md:px-8 md:py-7"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  borderRadius: 24,
                  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
                  minHeight: 120,
                }}
              >
                {/* Mobile: banner pronto com pantera já embutida (shadow-hero-mobile.png) */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 sm:hidden"
                  style={{
                    backgroundImage: "url('/shadow-hero-mobile.png')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }}
                />

                {/* Desktop (sm+): pantera separada à esquerda */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 hidden w-[150px] sm:block md:w-[210px]"
                  style={{
                    backgroundImage: "url('/shadow-hero-bg.png')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "left center",
                    backgroundSize: "auto 100%",
                  }}
                />

                {/* Content — offset pra não cobrir a pantera */}
                <div className="relative w-full pl-[120px] sm:pl-[140px] md:pl-[210px]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <h1
                        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[18px] leading-[1.2] sm:text-[20px] md:text-[28px]"
                        style={{
                          fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                          fontWeight: 700,
                          color: "#0F172A",
                          letterSpacing: "-0.01em",
                          fontFeatureSettings: '"calt" 1, "kern" 1',
                          wordSpacing: "0.05em",
                          margin: 0,
                        }}
                      >
                        <span className="break-words">
                          {greeting}, {user?.companyName || "Operador"}.
                        </span>
                        <span
                          className="inline-block text-[18px] sm:text-[22px] md:text-[24px]"
                          style={{
                            fontFamily: "system-ui, sans-serif",
                          }}
                        >
                          👋
                        </span>
                      </h1>
                      {/* subtítulo curto em mobile, completo em sm+ */}
                      <p
                        className="mt-1.5 text-[12px] leading-snug sm:mt-2 sm:text-[13px] md:text-[14px]"
                        style={{
                          color: "#64748B",
                        }}
                      >
                        <span className="hidden sm:inline">
                          Operação sincronizada. Última atualização há{" "}
                        </span>
                        <span className="sm:hidden">Atualizado há </span>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#1E293B",
                          }}
                        >
                          {Math.max(
                            1,
                            Math.floor(
                              (Date.now() - refreshAt.getTime()) / 1000
                            )
                          )}{" "}
                          seg
                        </span>
                        <span className="hidden sm:inline">undos</span>.
                      </p>
                    </div>

                    {/* Buttons — só desktop (sm+). Mobile fica só com título. */}
                    <div
                      className="hidden flex-wrap items-center gap-2 sm:flex sm:gap-3"
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
                        className="hidden items-center gap-2 transition-all hover:bg-slate-50 md:inline-flex"
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
                        className="hidden flex-col gap-3 sm:mt-6 sm:flex sm:flex-row sm:items-center sm:justify-between"
                        style={{
                          borderRadius: 16,
                          background: "rgba(255, 255, 255, 0.85)",
                          border: "1px solid rgba(15, 23, 42, 0.06)",
                          padding: "12px 16px",
                        }}
                      >
                        <div className="flex items-center gap-3 sm:gap-3.5">
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
                          className="inline-flex shrink-0 items-center justify-center self-stretch transition-colors hover:bg-slate-50 sm:self-auto"
                          style={{
                            height: 36,
                            padding: "0 18px",
                            borderRadius: 10,
                            background: "#FFFFFF",
                            border: "1px solid #E5E7EB",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#334155",
                            whiteSpace: "nowrap",
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

              {/* TOOLBAR — Refresh + Filtros (entre hero e KPIs, alinhado à direita) */}
              <div className="mb-4 flex justify-end gap-2">
                <button
                  onClick={() => fetchTransactions()}
                  title="Atualizar"
                  className="inline-flex items-center justify-center transition-all hover:bg-slate-50"
                  style={{
                    height: 40,
                    width: 40,
                    borderRadius: 12,
                    background: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    color: "#475569",
                  }}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={openFilters}
                  className="relative inline-flex items-center gap-2 transition-all hover:bg-slate-50"
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
                  <Activity className="h-4 w-4" style={{ color: "#64748B" }} />
                  Filtros
                  {(statusFilter !== "all" ||
                    (customRange.from && customRange.to)) && (
                    <span
                      className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                      style={{ background: T.primary }}
                    >
                      {[
                        statusFilter !== "all" ? 1 : 0,
                        customRange.from && customRange.to ? 1 : 0,
                      ].reduce((a, b) => a + b, 0)}
                    </span>
                  )}
                </button>
              </div>

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
                      {k.delta ? (
                        <>
                          <span
                            className="text-[12px] font-bold"
                            style={{
                              color:
                                k.delta.direction === "up"
                                  ? T.green
                                  : k.delta.direction === "down"
                                  ? T.red
                                  : T.textMuted,
                            }}
                          >
                            {k.delta.text}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {k.deltaText}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {k.deltaText}
                        </span>
                      )}
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
                        {nextPayout}
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
                          {m.delta && (
                            <span
                              className="text-[11px] font-bold"
                              style={{
                                color: (() => {
                                  const d = m.delta!.direction;
                                  if (d === "flat") return T.textMuted;
                                  // pra reembolsos, "down" é bom
                                  const goodDown = m.negativeIsGood;
                                  if (goodDown)
                                    return d === "down" ? T.green : T.red;
                                  return d === "up" ? T.green : T.red;
                                })(),
                              }}
                            >
                              {m.delta.text}
                            </span>
                          )}
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
                  className="inline-flex h-10 items-center justify-center rounded-xl text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5"
                  style={{
                    background: T.primary,
                    boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
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

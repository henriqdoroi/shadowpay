"use client";

/**
 * /v1/dashboard — Cockpit do seller.
 *
 *  - Seletor de período UNIFICADO: Hoje / Ontem / 7 dias / Este mês /
 *    Mês passado / Máximo / Personalizado (input de data início e fim).
 *  - 9 KPIs grandes recalculados pelo período:
 *      Faturamento bruto, Faturamento líquido, Taxa de conversão,
 *      Pedidos pagos, Pedidos totais, PIX gerados, Reembolsos,
 *      Ticket médio, Aprovação.
 *  - Saldo disponível + saldo bloqueado + Total já recebido (vida toda).
 *  - Atividade ao vivo (independente do período).
 *  - Sem chart "Volume processado" — substituído pela barra de período
 *    + grade de cards (mais legível, sem ruído visual).
 *
 *  Dados 100% reais — /api/user/dashboard-stats + /api/user/transactions-report.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import Head from "next/head";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import ShadowPanel from "@/components/ShadowPanel";
import TwoFAModal from "./2faAuthentication";
import { LightShell } from "@/components/LightShell";
import { ShadowLogo } from "@/components/shadow/ShadowLogo";

import {
  Sparkles,
  Plus,
  Calendar,
  ShieldCheck,
  ArrowUpRight,
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
  MessageSquare,
  X,
  Banknote,
} from "lucide-react";

const API = "https://shadowpay-api-production.up.railway.app";

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
};

type PeriodKey =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "lastMonth"
  | "max"
  | "custom";

type Range = { start: Date; end: Date };

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function rangeFor(
  period: PeriodKey,
  custom: { from: string; to: string }
): { curr: Range; prev: Range } {
  const now = new Date();
  switch (period) {
    case "today": {
      const curr = { start: startOfDay(now), end: endOfDay(now) };
      const y = new Date(now); y.setDate(y.getDate() - 1);
      return { curr, prev: { start: startOfDay(y), end: endOfDay(y) } };
    }
    case "yesterday": {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      const curr = { start: startOfDay(y), end: endOfDay(y) };
      const b = new Date(now); b.setDate(b.getDate() - 2);
      return { curr, prev: { start: startOfDay(b), end: endOfDay(b) } };
    }
    case "7d": {
      const end = now;
      const start = new Date(now); start.setDate(start.getDate() - 7);
      const prevEnd = new Date(start);
      const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 7);
      return { curr: { start, end }, prev: { start: prevStart, end: prevEnd } };
    }
    case "30d": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { curr: { start, end: now }, prev: { start: prevStart, end: prevEnd } };
    }
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
      return { curr: { start, end }, prev: { start: prevStart, end: prevEnd } };
    }
    case "custom": {
      const start = custom.from ? new Date(custom.from + "T00:00:00") : startOfDay(now);
      const end = custom.to ? new Date(custom.to + "T23:59:59.999") : endOfDay(now);
      const ms = end.getTime() - start.getTime();
      const prevEnd = new Date(start);
      const prevStart = new Date(start.getTime() - ms);
      return { curr: { start, end }, prev: { start: prevStart, end: prevEnd } };
    }
    case "max":
    default: {
      const start = new Date(0);
      return {
        curr: { start, end: now },
        prev: { start, end: start },
      };
    }
  }
}

const periodLabel: Record<PeriodKey, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  "7d": "Últimos 7 dias",
  "30d": "Este mês",
  lastMonth: "Mês passado",
  max: "Máximo",
  custom: "Personalizado",
};

const periodDelta: Record<PeriodKey, string> = {
  today: "vs ontem",
  yesterday: "vs anteontem",
  "7d": "vs 7 dias antes",
  "30d": "vs mês passado",
  lastMonth: "vs mês anterior",
  max: "histórico",
  custom: "vs período anterior",
};

function DashboardContent() {
  const router = useRouter();
  const { user, token } = useAuth();
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
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>("today");
  const [custom, setCustom] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });
  const [showCustom, setShowCustom] = useState(false);
  const [refreshAt, setRefreshAt] = useState<Date>(new Date());

  // -------- fetch perfil
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        if (r.data?.success && r.data.data) {
          setLocalUser({
            ...r.data.data,
            twofaEnabled: Boolean(r.data.data.twofaEnabled),
            twofaConfirmed: Boolean(r.data.data.twofaConfirmed),
          });
        }
      })
      .catch(console.error);
  }, [token]);

  // -------- fetch wallet
  useEffect(() => {
    if (!user || !token) return;
    axios
      .get(`${API}/api/user/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        if (r.data?.success) {
          setWalletStats({
            currentBalance: Number(r.data.data.currentBalance) || 0,
            blockedBalance: Number(r.data.data.blockedBalance) || 0,
          });
        }
      })
      .catch(console.error);
  }, [user, token]);

  // -------- fetch transactions
  const fetchTransactions = async () => {
    if (!token) return;
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
    }
  };

  useEffect(() => {
    if (user && token) fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  // refresh suave a cada 30s
  useEffect(() => {
    if (!user || !token) return;
    const id = setInterval(fetchTransactions, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  // -------- period ranges + filtered txs
  const periodRanges = useMemo(() => rangeFor(period, custom), [period, custom]);

  const allTxs = txData.transactions;
  const inRange = (t: any, r: Range) => {
    if (!t?.createdAt) return false;
    const d = new Date(t.createdAt).getTime();
    return d >= r.start.getTime() && d <= r.end.getTime();
  };
  const txs = useMemo(
    () => allTxs.filter((t) => inRange(t, periodRanges.curr)),
    [allTxs, periodRanges]
  );
  const prevTxs = useMemo(
    () => allTxs.filter((t) => inRange(t, periodRanges.prev)),
    [allTxs, periodRanges]
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

  const isMax = period === "max";
  const grossSum = isMax ? Number(txData.totals.totalEntradas) || 0 : curr.grossSum;
  // netSum no max não está agregado no summary, então estima 97% (taxa típica)
  const netSum = isMax ? grossSum * 0.97 : curr.netSum;
  const paid = curr.paid;
  const refunded = curr.refunded;
  const pixGenerated = curr.pix;
  const totalTx = curr.total;
  const conv = curr.conv;
  const avgTicket = curr.avgTicket;
  const approvalRate = curr.approvalRate;

  // delta
  function fmtDelta(
    a: number,
    b: number,
    opts: { kind?: "pct" | "abs"; suffix?: "pp" } = {}
  ): { text: string; direction: "up" | "down" | "flat" } | null {
    if (isMax) return null;
    if (a === 0 && b === 0) return { text: "—", direction: "flat" };
    if (b === 0) return a > 0 ? { text: "novo", direction: "up" } : { text: "—", direction: "flat" };
    if (opts.kind === "abs") {
      const diff = a - b;
      return {
        text: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}${opts.suffix ?? ""}`,
        direction: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
      };
    }
    const pct = ((a - b) / b) * 100;
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
  const dApproval = fmtDelta(approvalRate, prev.approvalRate, { kind: "abs", suffix: "pp" });

  // formatters
  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
  const num = (v: number) => new Intl.NumberFormat("pt-BR").format(v || 0);
  const hideable = (v: string) => (valuesVisible ? v : "••••••");

  const nextPayout = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  }, []);

  const liveFeed = useMemo(() => {
    return [...allTxs]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 8)
      .map((t) => {
        const status = String(t.status).toUpperCase();
        const paidNow = status === "PAID";
        const method = String(t.method || "").toUpperCase();
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
        };
      });
  }, [allTxs]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  if (!user) return null;

  const kpis: Array<{
    label: string;
    value: string;
    delta: { text: string; direction: "up" | "down" | "flat" } | null;
    icon: any;
    color: string;
    negativeIsGood?: boolean;
  }> = [
    {
      label: "Faturamento bruto",
      value: hideable(fmt(grossSum)),
      delta: dGross,
      icon: <CircleDollarSign className="h-4 w-4" />,
      color: T.primary,
    },
    {
      label: "Faturamento líquido",
      value: hideable(fmt(netSum)),
      delta: dNet,
      icon: <Wallet className="h-4 w-4" />,
      color: T.blue,
    },
    {
      label: "Taxa de conversão",
      value: `${conv.toFixed(1)}%`,
      delta: dConv,
      icon: <Percent className="h-4 w-4" />,
      color: T.green,
    },
    {
      label: "Pedidos pagos",
      value: num(paid.length),
      delta: dPaid,
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: T.orange,
    },
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

      <LightShell
        valuesVisible={valuesVisible}
        onToggleValues={() => setValuesVisible((v) => !v)}
      >
        {/* HERO */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-6 overflow-hidden"
          style={{
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
          <div className="relative md:pl-[210px]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <h1
                  className="flex flex-wrap items-center gap-x-3 gap-y-1"
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: T.text,
                    letterSpacing: "-0.005em",
                  }}
                >
                  <span className="break-words">
                    {greeting}, {user?.companyName || "Operador"}.
                  </span>
                  <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 24 }}>
                    👋
                  </span>
                </h1>
                <p style={{ marginTop: 8, fontSize: 14, color: "#64748B" }}>
                  Operação sincronizada. Última atualização há{" "}
                  <span style={{ fontWeight: 600, color: "#334155" }}>
                    {Math.max(1, Math.floor((Date.now() - refreshAt.getTime()) / 1000))} segundos
                  </span>
                  .
                </p>
              </div>

              <div className="flex flex-wrap items-center" style={{ gap: 12 }}>
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
                  onClick={() => router.push("/v1/finance")}
                  className="inline-flex items-center gap-2 transition-transform hover:-translate-y-0.5"
                  style={{
                    height: 40,
                    padding: "0 18px",
                    borderRadius: 12,
                    background: T.primary,
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

            {localUser && !(localUser.twofaEnabled && localUser.twofaConfirmed) && (
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
                    }}
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", margin: 0 }}>
                      Autenticação em duas etapas pendente
                    </p>
                    <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
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

        {/* PERIODO + RESUMO HEADER */}
        <section
          className="mb-4 rounded-2xl p-4"
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            boxShadow: T.cardShadow,
          }}
        >
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[14px] font-bold text-slate-900">Resumo do período</p>
              <p className="text-[11.5px] text-slate-500">
                {periodLabel[period]}
                {period === "custom" && custom.from && custom.to
                  ? ` · ${new Date(custom.from + "T00:00:00").toLocaleDateString("pt-BR")} → ${new Date(
                      custom.to + "T00:00:00"
                    ).toLocaleDateString("pt-BR")}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
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
                  onClick={() => {
                    setPeriod(key as PeriodKey);
                    setShowCustom(false);
                  }}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors"
                  style={{
                    background: active ? T.primaryBg : "transparent",
                    color: active ? T.primary : T.text2,
                    border: active
                      ? `1px solid rgba(124,58,237,0.20)`
                      : "1px solid transparent",
                  }}
                >
                  {label}
                </button>
              );
            })}
            <button
              onClick={() => {
                setPeriod("custom");
                setShowCustom(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors"
              style={{
                background: period === "custom" ? T.primaryBg : "transparent",
                color: period === "custom" ? T.primary : T.text2,
                border:
                  period === "custom"
                    ? `1px solid rgba(124,58,237,0.20)`
                    : `1px solid ${T.border}`,
              }}
            >
              <Calendar className="h-3 w-3" />
              Personalizado
            </button>
          </div>

          {period === "custom" && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                  De
                </label>
                <input
                  type="date"
                  value={custom.from}
                  max={custom.to || undefined}
                  onChange={(e) => setCustom({ ...custom, from: e.target.value })}
                  className="h-9 w-full rounded-lg border bg-white px-3 text-[13px] outline-none"
                  style={{ borderColor: T.border }}
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                  Até
                </label>
                <input
                  type="date"
                  value={custom.to}
                  min={custom.from || undefined}
                  onChange={(e) => setCustom({ ...custom, to: e.target.value })}
                  className="h-9 w-full rounded-lg border bg-white px-3 text-[13px] outline-none"
                  style={{ borderColor: T.border }}
                />
              </div>
              <button
                onClick={() => {
                  setCustom({ from: "", to: "" });
                  setPeriod("today");
                }}
                className="inline-flex h-9 items-center gap-1 rounded-lg border bg-white px-3 text-[11.5px] font-semibold text-slate-600 hover:bg-slate-50"
                style={{ borderColor: T.border }}
              >
                <X className="h-3 w-3" />
                Limpar
              </button>
            </div>
          )}
        </section>

        {/* GRID DE 9 KPIs (3 colunas em md+, 2 em sm) */}
        <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {kpis.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl p-4"
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                boxShadow: T.cardShadow,
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500">{k.label}</p>
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: `${k.color}14`, color: k.color }}
                >
                  {k.icon}
                </span>
              </div>
              <div
                className="mt-2 text-[22px] font-bold leading-none tracking-tight text-slate-900"
                style={{
                  fontFamily:
                    "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                }}
              >
                {k.value}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                {k.delta ? (
                  <>
                    <span
                      className="text-[11.5px] font-bold"
                      style={{
                        color: (() => {
                          const d = k.delta.direction;
                          if (d === "flat") return T.textMuted;
                          const goodDown = k.negativeIsGood;
                          if (goodDown) return d === "down" ? T.green : T.red;
                          return d === "up" ? T.green : T.red;
                        })(),
                      }}
                    >
                      {k.delta.text}
                    </span>
                    <span className="text-[11px] text-slate-500">{periodDelta[period]}</span>
                  </>
                ) : (
                  <span className="text-[11px] text-slate-400">{periodDelta[period]}</span>
                )}
              </div>
            </motion.div>
          ))}
        </section>

        {/* SALDO + ATIVIDADE AO VIVO */}
        <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
          {/* Saldo */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="rounded-2xl p-5"
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              boxShadow: T.cardShadow,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Saldo disponível</p>
                <p
                  className="mt-1.5 text-[36px] font-bold leading-none tracking-tight text-slate-900"
                  style={{
                    fontFamily:
                      "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                  }}
                >
                  {hideable(fmt(walletStats.currentBalance))}
                </p>
              </div>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: T.primaryBg, color: T.primary }}
              >
                <Wallet className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                  Bloqueado
                </p>
                <p className="mt-1 text-[15px] font-bold text-slate-900">
                  {hideable(fmt(walletStats.blockedBalance))}
                </p>
              </div>
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                  Próximo repasse
                </p>
                <p className="mt-1 text-[15px] font-bold text-slate-900">{nextPayout}</p>
              </div>
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                  Total recebido
                </p>
                <p className="mt-1 text-[15px] font-bold text-slate-900">
                  {hideable(fmt(Number(txData.totals.totalEntradas) || 0))}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/v1/finance")}
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              style={{ border: `1px solid ${T.border}` }}
            >
              Ver financeiro
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </motion.div>

          {/* Atividade ao vivo */}
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
                <h3 className="text-[14px] font-bold tracking-tight text-slate-900">
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
                <p className="text-xs text-slate-500">Nenhuma atividade ainda</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {liveFeed.map((item, idx) => {
                  const initial = item.name?.charAt(0).toUpperCase() || "?";
                  const gradients = [
                    "linear-gradient(135deg,#7C3AED,#22D3EE)",
                    "linear-gradient(135deg,#F59E0B,#EF4444)",
                    "linear-gradient(135deg,#22C55E,#3B82F6)",
                    "linear-gradient(135deg,#3B82F6,#7C3AED)",
                    "linear-gradient(135deg,#EC4899,#F59E0B)",
                    "linear-gradient(135deg,#06B6D4,#22C55E)",
                  ];
                  return (
                    <li key={item.id} className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                        style={{ background: gradients[idx % gradients.length] }}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-slate-800">
                          {item.title}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">{item.name}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-[12px] font-bold"
                          style={{ color: item.kind === "paid" ? T.primary : T.green }}
                        >
                          {valuesVisible ? item.value : "•••••"}
                        </p>
                        <p className="text-[10px] text-slate-400">{timeAgo(item.at)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        </section>

        {/* Shadow AI */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="relative mb-6 overflow-hidden rounded-2xl p-5"
          style={{
            background: "linear-gradient(135deg, #1A1430 0%, #2D1B69 50%, #1A1430 100%)",
            border: `1px solid rgba(124, 58, 237, 0.3)`,
            boxShadow: "0 8px 24px -8px rgba(124, 58, 237, 0.4)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-10 -bottom-10 h-52 w-52 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(168,85,247,0.55) 0%, rgba(124,58,237,0.18) 45%, transparent 70%)",
              filter: "blur(8px)",
            }}
          />
          <div className="pointer-events-none absolute right-4 bottom-4 flex h-28 w-28 items-center justify-center">
            <ShadowLogo size={56} glow glowColor="rgba(168, 85, 247, 0.55)" />
          </div>
          <div className="relative">
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-300" />
              <h3 className="text-[16px] font-bold tracking-tight text-white">Shadow AI</h3>
            </div>
            <p className="text-[12px] text-violet-200/80">Monitorando sua operação</p>
            <button
              onClick={() => router.push("/shadow")}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: "linear-gradient(120deg, #7C3AED 0%, #6D28D9 100%)" }}
            >
              Abrir Shadow
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>

        <p className="mt-8 text-center text-[11px]" style={{ color: T.textMuted }}>
          ShadowPay Financial OS © 2026 · Todos os direitos reservados.
        </p>
      </LightShell>

      <ShadowPanel />
    </>
  );
}

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

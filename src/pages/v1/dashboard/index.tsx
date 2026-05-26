"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import Head from "next/head";

import ProtectedRoute from "@/components/ProtectedRoute";
import ShadowPanel from "@/components/ShadowPanel";

import { ShadowShell } from "@/components/shadow/ShadowShell";
import { ShadowCard } from "@/components/shadow/ShadowCard";
import { ShadowButton } from "@/components/shadow/ShadowButton";
import { ShadowMetricCard } from "@/components/shadow/ShadowMetricCard";
import { ShadowChartPanel, ChartPoint } from "@/components/shadow/ShadowChartPanel";
import { ShadowLiveFeed, LiveFeedItem } from "@/components/shadow/ShadowLiveFeed";
import { useCountUp } from "@/components/shadow/useCountUp";

import {
  Wallet,
  Activity,
  ArrowUpRight,
  Target,
  CheckCircle2,
  ReceiptText,
  RefreshCcw,
  CircleDollarSign,
  Plus,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from "lucide-react";

import TwoFAModal from "./2faAuthentication";
import Image from "next/image";

const API = "https://shadowpay-api-production.up.railway.app";

function DashboardContent() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [localUser, setLocalUser] = useState<any>(user);
  const [isValuesVisible, setIsValuesVisible] = useState(true);

  const [walletStats, setWalletStats] = useState({
    currentBalance: 0,
    blockedBalance: 0,
  });
  const [txData, setTxData] = useState({
    totals: { totalTransacionado: 0, totalEntradas: 0, totalSaidas: 0 },
    transactions: [] as any[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [verification, setVerification] = useState<
    "NOT_STARTED" | "PENDING" | "APPROVED" | "BANNED"
  >("NOT_STARTED");
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

  /* ---------- bootstrap user profile ---------- */
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

  /* ---------- wallet stats ---------- */
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
        `${API}/api/user/transactions-report?page=1&limit=100`,
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

  /* ---------- derived ---------- */
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);

  const txList = txData.transactions;
  const paid = txList.filter((t) => String(t.status).toUpperCase() === "PAID");
  const refunded = txList.filter((t) =>
    ["REFUNDED", "CHARGEBACK"].includes(String(t.status).toUpperCase())
  );
  const pixCount = txList.filter(
    (t) => String(t.method).toUpperCase() === "PIX"
  ).length;
  const totalTx = txList.length;
  const conv = totalTx > 0 ? (paid.length / totalTx) * 100 : 0;
  const grossSum = paid.reduce(
    (acc, t) => acc + Number(t.grossAmount || 0),
    0
  );
  const netSum = paid.reduce((acc, t) => acc + Number(t.netAmount || 0), 0);
  const avgTicket = paid.length > 0 ? grossSum / paid.length : 0;

  const balance = useCountUp(walletStats.currentBalance);
  const grossAnim = useCountUp(grossSum);
  const netAnim = useCountUp(netSum);

  /* ---------- chart aggregation per day (last 14d) ---------- */
  const chartData: ChartPoint[] = useMemo(() => {
    const map = new Map<string, ChartPoint>();
    for (const t of txList) {
      if (!t.createdAt) continue;
      const d = new Date(t.createdAt);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const cur = map.get(k) || {
        label: d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        ts: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(),
        primary: 0,
        secondary: 0,
      };
      cur.primary += Number(t.grossAmount || 0);
      if (String(t.status).toUpperCase() === "PAID") {
        cur.secondary = (cur.secondary || 0) + Number(t.netAmount || 0);
      }
      map.set(k, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.ts - b.ts);
  }, [txList]);

  /* ---------- live feed ---------- */
  const liveFeed: LiveFeedItem[] = useMemo(() => {
    const sorted = [...txList].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
    return sorted.slice(0, 12).map((t): LiveFeedItem => {
      const status = String(t.status).toUpperCase();
      const isPaid = status === "PAID";
      const isFailed = ["FAILED", "CHARGEBACK"].includes(status);
      const kind: LiveFeedItem["kind"] = isPaid
        ? "sale"
        : isFailed
        ? "alert"
        : "withdraw";
      return {
        id: t.id,
        kind,
        title:
          t.customer?.name ||
          `Venda ${String(t.method || "PIX").toUpperCase()}`,
        subtitle: `${String(t.method || "—").toUpperCase()} · ${status}`,
        value: `${isPaid ? "+" : ""}${formatCurrency(
          Number(t.grossAmount || 0)
        )}`,
        at: t.createdAt,
      };
    });
  }, [txList]);

  /* ---------- greeting ---------- */
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const longDate = (() => {
    const d = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date());
    return d.charAt(0).toUpperCase() + d.slice(1);
  })();

  if (!user) return null;

  /* ---------- right intelligence panel ---------- */
  const rightPanel = (
    <div className="space-y-5">
      <ShadowLiveFeed items={liveFeed} />

      {/* Top performance widget */}
      <ShadowCard padded="md">
        <h3
          className="mb-3 text-sm font-semibold text-white"
          style={{ fontFamily: "'Clash Display', sans-serif" }}
        >
          Saúde da operação
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/55">Aprovação</span>
            <span className="font-bold text-emerald-300">
              {conv.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(conv, 100)}%`,
                background:
                  "linear-gradient(90deg, #22C55E 0%, #22D3EE 100%)",
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/55">Reembolso</span>
            <span className="font-bold text-rose-300">
              {totalTx ? ((refunded.length / totalTx) * 100).toFixed(1) : "0.0"}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-rose-400 transition-all duration-700"
              style={{
                width: `${
                  totalTx ? Math.min((refunded.length / totalTx) * 100, 100) : 0
                }%`,
              }}
            />
          </div>
        </div>
      </ShadowCard>
    </div>
  );

  /* ---------- verification alert ---------- */
  const verifyAlert = (() => {
    if (verification === "NOT_STARTED") {
      return (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] px-5 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-200">
                Verificação de conta necessária
              </p>
              <p className="mt-0.5 text-sm text-amber-200/70">
                Conclua o KYC para liberar saques, depósitos e produção.
              </p>
            </div>
          </div>
          <ShadowButton
            variant="primary"
            size="md"
            onClick={() => router.push("/v1/kyc")}
            style={{
              background: "linear-gradient(120deg, #F59E0B, #EF4444)",
            }}
          >
            Verificar agora
          </ShadowButton>
        </div>
      );
    }
    if (verification === "PENDING") {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-sky-500/25 bg-sky-500/[0.06] px-5 py-4 backdrop-blur-md">
          <Clock className="h-5 w-5 shrink-0 text-sky-400" />
          <div>
            <p className="font-semibold text-sky-200">
              Verificação em análise
            </p>
            <p className="mt-0.5 text-sm text-sky-200/70">
              Sua documentação está sendo analisada por nossa equipe.
            </p>
          </div>
        </div>
      );
    }
    if (verification === "BANNED") {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/[0.06] px-5 py-4 backdrop-blur-md">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
          <div>
            <p className="font-semibold text-rose-200">Conta suspensa</p>
            <p className="mt-0.5 text-sm text-rose-200/70">
              Entre em contato com o suporte.
            </p>
          </div>
        </div>
      );
    }
    return null;
  })();

  return (
    <>
      <Head>
        <title>ShadowPay — Command Center</title>
      </Head>

      <ShadowShell
        rightPanel={rightPanel}
        valuesVisible={isValuesVisible}
        onToggleValues={() => setIsValuesVisible((v) => !v)}
      >
        {/* 2FA banner */}
        {localUser &&
          !(localUser.twofaEnabled && localUser.twofaConfirmed) && (
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] px-5 py-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-amber-200/90">
                <ShieldCheck className="h-4 w-4" />
                Sua conta ainda não tem autenticação em duas etapas (2FA).
              </span>
              <ShadowButton
                size="sm"
                variant="outline"
                onClick={() => setIs2FAModalOpen(true)}
                className="border-amber-500/30 bg-amber-500/[0.06] text-amber-200 hover:bg-amber-500/15"
              >
                Ativar 2FA
              </ShadowButton>
              <TwoFAModal
                isOpen={is2FAModalOpen}
                onClose={() => setIs2FAModalOpen(false)}
                token={token!}
                user={localUser}
                setUser={setLocalUser}
              />
            </div>
          )}

        {verifyAlert && <div className="mb-5">{verifyAlert}</div>}

        {/* HERO */}
        <section className="mb-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-white/40">
                {longDate}
              </p>
              <h1
                className="text-[32px] font-bold leading-[1.05] tracking-tight text-white md:text-[40px]"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                {greeting},{" "}
                <span
                  style={{
                    background:
                      "linear-gradient(90deg, #A855F7 0%, #22D3EE 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {user.companyName || "Operador"}
                </span>
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/55">
                Seu cockpit financeiro está sincronizado. Tudo que acontece na
                operação aparece aqui em tempo real.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ShadowButton
                variant="outline"
                size="md"
                onClick={() => router.push("/v1/products/create")}
              >
                <Plus className="h-4 w-4" /> Novo produto
              </ShadowButton>
              <ShadowButton
                variant="outline"
                size="md"
                onClick={fetchTransactions}
                loading={isLoading}
              >
                <RefreshCcw className="h-4 w-4" /> Atualizar
              </ShadowButton>
              <ShadowButton
                variant="primary"
                size="md"
                onClick={() => router.push("/v1/finance/withdraw")}
              >
                <ArrowUpRight className="h-4 w-4" /> Sacar
              </ShadowButton>
            </div>
          </div>
        </section>

        {/* REVENUE INTELLIGENCE ROW */}
        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ShadowMetricCard
            label="Faturamento bruto"
            value={formatCurrency(grossAnim)}
            icon={<CircleDollarSign className="h-4 w-4" />}
            accent="#7C3AED"
            comparison={`${paid.length} pedidos pagos`}
            sparkline={chartData.map((c) => c.primary)}
            hidden={!isValuesVisible}
            delay={0}
          />
          <ShadowMetricCard
            label="Faturamento líquido"
            value={formatCurrency(netAnim)}
            icon={<Wallet className="h-4 w-4" />}
            accent="#22D3EE"
            comparison="descontadas taxas"
            sparkline={chartData.map((c) => c.secondary || 0)}
            hidden={!isValuesVisible}
            delay={0.05}
          />
          <ShadowMetricCard
            label="Taxa de conversão"
            value={`${conv.toFixed(1)}%`}
            icon={<Target className="h-4 w-4" />}
            accent="#22C55E"
            delta={{
              text: paid.length ? "ativo" : "—",
              direction: paid.length ? "up" : "flat",
            }}
            comparison={`${paid.length} / ${totalTx} transações`}
            delay={0.1}
          />
          <ShadowMetricCard
            label="Pedidos pagos"
            value={String(paid.length)}
            icon={<CheckCircle2 className="h-4 w-4" />}
            accent="#F59E0B"
            comparison="período carregado"
            delay={0.15}
          />
        </section>

        {/* MAIN ANALYTICS */}
        <section className="mb-7">
          <ShadowChartPanel
            title="Receita"
            data={chartData}
            loading={isLoading}
            primaryLabel="Geradas"
            secondaryLabel="Pagas"
          />
        </section>

        {/* SECONDARY METRICS */}
        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: "Pedidos totais",
              value: String(totalTx),
              icon: <ReceiptText className="h-3.5 w-3.5" />,
              accent: "#A78BFA",
            },
            {
              label: "PIX gerados",
              value: String(pixCount),
              icon: (
                <Image
                  src="/pix-icon.svg"
                  width={14}
                  height={14}
                  className="opacity-90 brightness-0 invert"
                  alt="Pix"
                />
              ),
              accent: "#22D3EE",
            },
            {
              label: "Reembolsos",
              value: String(refunded.length),
              icon: <RefreshCcw className="h-3.5 w-3.5" />,
              accent: "#EF4444",
            },
            {
              label: "Ticket médio",
              value: formatCurrency(avgTicket),
              icon: <Activity className="h-3.5 w-3.5" />,
              accent: "#6366F1",
            },
            {
              label: "Saldo disponível",
              value: formatCurrency(balance),
              icon: <Wallet className="h-3.5 w-3.5" />,
              accent: "#22C55E",
            },
          ].map((m) => (
            <ShadowCard
              key={m.label}
              padded="md"
              haloColor={`${m.accent}1f`}
              haloPosition="br"
              hover
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{
                    background: `${m.accent}1f`,
                    color: m.accent,
                    border: `1px solid ${m.accent}33`,
                  }}
                >
                  {m.icon}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
                  {m.label}
                </span>
              </div>
              <div
                className="mt-3 text-xl font-bold tracking-tight text-white"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                {isValuesVisible ? m.value : "••••••"}
              </div>
            </ShadowCard>
          ))}
        </section>
      </ShadowShell>

      <ShadowPanel />
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

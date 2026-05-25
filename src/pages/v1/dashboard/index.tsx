import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  User,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Radio,
  Wallet,
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import TwoFAModal from "./2faAuthentication";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import Image from "next/image";
import Head from "next/head";
import { motion } from "framer-motion";
import ShadowPanel from "@/components/ShadowPanel";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* Count-up suave (Shadow Design Language) */
function useCountUp(target: number, duration = 1300) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function DashboardContent() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [localUser, setLocalUser] = useState(user);
  const [, setIsLoadingProfile] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [dashboardStats, setDashboardStats] = useState({
    currentBalance: 0,
    blockedBalance: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isValuesVisible, setIsValuesVisible] = useState(true);
  const [transactionsData, setTransactionsData] = useState({
    totals: { totalTransacionado: 0, totalEntradas: 0, totalSaidas: 0 },
    transactions: [] as any[],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 20,
      hasNextPage: false,
      hasPrevPage: false,
    },
  });
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [verificationStatus, setVerificationStatus] = useState<
    "NOT_STARTED" | "PENDING" | "APPROVED" | "BANNED"
  >("NOT_STARTED");
  const withdrawUrl = "/v1/finance/withdraw";
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (
      user &&
      (user as any).kycStatus &&
      verificationStatus !== (user as any).kycStatus
    ) {
      setVerificationStatus((user as any).kycStatus);
    }
  }, [user, verificationStatus]);

  // Fetch seller profile (2FA info)
  useEffect(() => {
    if (token) {
      (async () => {
        try {
          const res = await axios.get(
            "https://shadowpay-api-production.up.railway.app/api/user/profile",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.data.success && res.data.data) {
            const profile = res.data.data;
            setLocalUser({
              ...profile,
              twofaEnabled: Boolean(profile.twofaEnabled),
              twofaConfirmed: Boolean(profile.twofaConfirmed),
            });
          }
        } catch (err) {
          console.error("Erro ao buscar seller logado:", err);
        } finally {
          setIsLoadingProfile(false);
        }
      })();
    }
  }, [token]);

  // Utils
  const toggleValuesVisibility = () => setIsValuesVisible((v) => !v);
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  const formatDate = (s: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(s));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const longDate = (() => {
    const d = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date());
    return d.charAt(0).toUpperCase() + d.slice(1);
  })();

  const getStatusBadge = (status: string) => {
    const s = String(status || "").toUpperCase();
    const map: Record<string, { color: string; text: string }> = {
      PAID: { color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", text: "PAGO" },
      PENDING: { color: "bg-amber-500/15 text-amber-300 border-amber-500/30", text: "PENDENTE" },
      PROCESSING: { color: "bg-sky-500/15 text-sky-300 border-sky-500/30", text: "PROCESSANDO" },
      FAILED: { color: "bg-rose-500/15 text-rose-300 border-rose-500/30", text: "FALHOU" },
      REFUNDED: { color: "bg-white/10 text-white/60 border-white/15", text: "EXTORNADO" },
      CHARGEBACK: { color: "bg-rose-500/15 text-rose-300 border-rose-500/30", text: "CHARGEBACK" },
      EXPIRED: { color: "bg-white/10 text-white/50 border-white/15", text: "EXPIRADO" },
    };
    const cfg = map[s] || { color: "bg-white/10 text-white/60 border-white/15", text: s };
    return (
      <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${cfg.color}`}>
        {cfg.text}
      </span>
    );
  };

  const getMethodLabel = (method: string) => {
    const m = String(method || "").toLowerCase();
    const labels: Record<string, string> = { pix: "PIX", card: "Cartão", boleto: "Boleto", crypto: "Cripto" };
    return labels[m] || (method || "—");
  };
  const getMethodIcon = (method: string) => {
    if (String(method).toLowerCase() === "pix") {
      return <Image src="/pix-icon.svg" width={14} height={14} className="brightness-0 invert opacity-70" alt="Pix" />;
    }
    return null;
  };

  // Fetch stats
  useEffect(() => {
    if (user && token) {
      (async () => {
        setIsLoadingStats(true);
        try {
          const res = await axios.get(
            "https://shadowpay-api-production.up.railway.app/api/user/dashboard-stats",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.data.success) {
            const stats = res.data.data;
            setDashboardStats({
              currentBalance: Number(stats.currentBalance) || 0,
              blockedBalance: Number(stats.blockedBalance) || 0,
            });
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoadingStats(false);
        }
      })();
    }
  }, [user, token]);

  // Fetch transactions
  const fetchTransactions = async (page = 1) => {
    if (!token) return;
    setIsLoadingTransactions(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      const res = await axios.get(
        `https://shadowpay-api-production.up.railway.app/api/user/transactions-report?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const apiData = res.data.data;
        setTransactionsData({
          totals: {
            totalTransacionado: Number(apiData.summary?.totalTransactionado) || 0,
            totalEntradas: Number(apiData.summary?.totalEntradas) || 0,
            totalSaidas: Number(apiData.summary?.totalSaidas) || 0,
          },
          transactions: apiData.transactions || [],
          pagination: {
            currentPage: apiData.pagination.currentPage,
            totalPages: apiData.pagination.totalPages,
            totalItems: apiData.pagination.totalCount,
            itemsPerPage: apiData.pagination.limit,
            hasNextPage: apiData.pagination.hasNext,
            hasPrevPage: apiData.pagination.hasPrev,
          },
        });
        setCurrentPage(page);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (user && token) fetchTransactions(1);
  }, [user, token]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= transactionsData.pagination.totalPages && page !== currentPage)
      fetchTransactions(page);
  };
  const handleRefreshTransactions = () => fetchTransactions(currentPage);
  const handleStartVerification = () => router.push("/v1/kyc");

  const animatedBalance = useCountUp(dashboardStats.currentBalance);
  const animatedEntradas = useCountUp(transactionsData.totals.totalEntradas);
  const animatedSaidas = useCountUp(transactionsData.totals.totalSaidas);
  const animatedTotal = useCountUp(transactionsData.totals.totalTransacionado);

  // Agrega transações por dia para o gráfico
  const chartData = useMemo(() => {
    const byDay = new Map<string, any>();
    for (const t of transactionsData.transactions) {
      if (!t?.createdAt) continue;
      const d = new Date(t.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const cur =
        byDay.get(key) || {
          label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          ts: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(),
          geradas: 0,
          pagas: 0,
        };
      cur.geradas += Number(t.grossAmount ?? 0);
      if (String(t.status).toUpperCase() === "PAID") cur.pagas += Number(t.netAmount ?? 0);
      byDay.set(key, cur);
    }
    return Array.from(byDay.values()).sort((a, b) => a.ts - b.ts);
  }, [transactionsData.transactions]);

  const renderVerificationAlert = () => {
    const base =
      "flex flex-col gap-3 rounded-2xl border px-5 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between";
    if (verificationStatus === "NOT_STARTED") {
      return (
        <div className={`${base} border-amber-500/30 bg-amber-500/[0.07]`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-200">Verificação de conta necessária</p>
              <p className="mt-0.5 text-sm text-amber-200/70">
                Conclua o KYC pra liberar toda a operação.
              </p>
            </div>
          </div>
          <Button onClick={handleStartVerification} className="border-0 bg-amber-500 font-semibold text-black hover:bg-amber-400">
            Verificar agora
          </Button>
        </div>
      );
    }
    if (verificationStatus === "PENDING") {
      return (
        <div className={`${base} border-sky-500/30 bg-sky-500/[0.07]`}>
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
            <div>
              <p className="font-semibold text-sky-200">Verificação em análise</p>
              <p className="mt-0.5 text-sm text-sky-200/70">Sua documentação está sendo analisada.</p>
            </div>
          </div>
        </div>
      );
    }
    if (verificationStatus === "BANNED") {
      return (
        <div className={`${base} border-rose-500/30 bg-rose-500/[0.07]`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold text-rose-200">Conta suspensa</p>
              <p className="mt-0.5 text-sm text-rose-200/70">Entre em contato com o suporte.</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!user) return <p className="p-6 text-white/60">Carregando…</p>;

  const SHADOW_BG =
    "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

  const kpis = [
    {
      label: "Saldo disponível",
      value: animatedBalance,
      sub: `Bloqueado: ${isValuesVisible ? formatCurrency(dashboardStats.blockedBalance) : "••••"}`,
      icon: <Wallet className="h-4 w-4" />,
      accent: "#8B5CF6",
    },
    {
      label: "Total transacionado",
      value: animatedTotal,
      sub: "no período",
      icon: <Activity className="h-4 w-4" />,
      accent: "#6366F1",
    },
    {
      label: "Entradas",
      value: animatedEntradas,
      sub: "vendas líquidas",
      icon: <ArrowDownLeft className="h-4 w-4" />,
      accent: "#34D399",
    },
    {
      label: "Saídas",
      value: animatedSaidas,
      sub: "saques pagos",
      icon: <ArrowUpRight className="h-4 w-4" />,
      accent: "#F59E0B",
    },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Cockpit</title>
      </Head>

      <div className="min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="text-white" style={{ background: SHADOW_BG }}>
            {/* 2FA banner */}
            {localUser &&
              !(localUser.twofaEnabled && (localUser as any).twofaConfirmed) && (
                <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 backdrop-blur-md lg:mx-8">
                  <span className="text-sm font-medium text-amber-200/90">
                    Sua conta ainda não tem autenticação em duas etapas (2FA).
                  </span>
                  <Button
                    size="sm"
                    className="shrink-0 border border-amber-500/40 bg-transparent text-amber-300 hover:bg-amber-500/10"
                    onClick={() => setIs2FAModalOpen(true)}
                  >
                    Ativar 2FA
                  </Button>
                  <TwoFAModal
                    isOpen={is2FAModalOpen}
                    onClose={() => setIs2FAModalOpen(false)}
                    token={token!}
                    user={localUser}
                    setUser={setLocalUser}
                  />
                </div>
              )}

            {/* Header */}
            <header className="flex items-center justify-between gap-3 px-4 pt-6 lg:px-8">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-white/60 hover:text-white" />
                <div>
                  <h1
                    className="text-2xl font-bold tracking-tight text-white md:text-[28px]"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    {greeting}, {user?.companyName || "Operador"} <span className="align-middle">👋</span>
                  </h1>
                  <p className="mt-1 text-xs text-white/40">{longDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleValuesVisibility}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white"
                  aria-label="Alternar valores"
                >
                  {isValuesVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={handleRefreshTransactions}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white"
                  aria-label="Atualizar"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingTransactions ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => router.push("/v1/configs/profile")}
                  className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  <User className="h-4 w-4" /> Perfil
                </button>
              </div>
            </header>

            <main className="flex flex-col gap-5 p-4 lg:p-8">
              {renderVerificationAlert()}

              {/* KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                  >
                    <div
                      className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-80"
                      style={{ background: `${k.accent}22` }}
                    />
                    <div className="relative mb-4 flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: `${k.accent}1f`, color: k.accent }}
                      >
                        {k.icon}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                        {k.label}
                      </span>
                    </div>
                    <div
                      className="relative text-2xl font-semibold tracking-tight text-white"
                      style={{ fontFamily: "'Clash Display', sans-serif" }}
                    >
                      {isValuesVisible ? formatCurrency(k.value) : "••••••"}
                    </div>
                    <p className="relative mt-1.5 text-xs text-white/35">{k.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Chart + side */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl xl:col-span-2"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                      Seu desempenho
                    </h2>
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </span>
                      ao vivo
                    </span>
                  </div>

                  <div className="mt-4 h-[280px] w-full">
                    {mounted && chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gGeradas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gPagas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="label" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis
                            stroke="#6B7280"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            width={46}
                            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#0B1020",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: 12,
                              color: "#fff",
                              fontSize: 12,
                            }}
                            labelStyle={{ color: "#A4ACBE" }}
                            formatter={(v: any, name: any) => [formatCurrency(Number(v)), name === "geradas" ? "Geradas" : "Pagas"]}
                          />
                          <Area type="monotone" dataKey="geradas" stroke="#8B5CF6" strokeWidth={2} fill="url(#gGeradas)" />
                          <Area type="monotone" dataKey="pagas" stroke="#22D3EE" strokeWidth={2} fill="url(#gPagas)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <Radio className="mb-3 h-7 w-7 text-violet-400/50" />
                        <p className="text-sm font-medium text-white/70">Nenhuma atividade detectada</p>
                        <p className="mt-1 text-xs text-white/35">Sua infraestrutura está pronta. As vendas aparecem aqui em tempo real.</p>
                      </div>
                    )}
                  </div>

                  {/* mini-stats */}
                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
                    {[
                      { l: "Transacionado", v: transactionsData.totals.totalTransacionado, c: "#fff" },
                      { l: "Geradas", v: transactionsData.totals.totalEntradas, c: "#A78BFA" },
                      { l: "Pagas", v: transactionsData.totals.totalEntradas, c: "#22D3EE" },
                    ].map((m) => (
                      <div key={m.l} className="text-center">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">{m.l}</p>
                        <p className="mt-1 text-sm font-semibold" style={{ color: m.c, fontFamily: "'Clash Display', sans-serif" }}>
                          {isValuesVisible ? formatCurrency(m.v) : "••••"}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Side: ação rápida */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                >
                  <div
                    className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl"
                    style={{ background: "rgba(139,92,246,0.18)" }}
                  />
                  <div className="relative">
                    <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                      <Wallet className="h-3.5 w-3.5" /> Carteira
                    </span>
                    <div
                      className="mt-3 text-3xl font-semibold tracking-tight text-white"
                      style={{ fontFamily: "'Clash Display', sans-serif" }}
                    >
                      {isValuesVisible ? formatCurrency(animatedBalance) : "••••••"}
                    </div>
                    <p className="mt-1 text-xs text-white/40">
                      Bloqueado:{" "}
                      <span className="text-white/65">
                        {isValuesVisible ? formatCurrency(dashboardStats.blockedBalance) : "••••"}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(withdrawUrl)}
                    className="group relative mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(120deg, #7C3AED, #6366F1)",
                      boxShadow: "0 14px 36px -14px rgba(124,58,237,0.7)",
                    }}
                  >
                    Sacar
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </motion.div>
              </div>

              {/* Transações */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                  <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                    Histórico de transações
                  </h2>
                  <button
                    onClick={handleRefreshTransactions}
                    disabled={isLoadingTransactions}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoadingTransactions ? "animate-spin" : ""}`} />
                    {isLoadingTransactions ? "Atualizando…" : "Atualizar"}
                  </button>
                </div>

                <div className="overflow-x-auto p-2 sm:p-4">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-white/40">
                        <th className="px-3 py-2 font-medium">Transação</th>
                        <th className="px-3 py-2 font-medium">Data</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 text-right font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingTransactions ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i} className="animate-pulse border-t border-white/[0.05]">
                            <td className="px-3 py-3"><div className="h-4 w-40 rounded bg-white/10" /></td>
                            <td className="px-3 py-3"><div className="h-4 w-24 rounded bg-white/10" /></td>
                            <td className="px-3 py-3"><div className="h-6 w-20 rounded-full bg-white/10" /></td>
                            <td className="px-3 py-3 text-right"><div className="ml-auto h-4 w-20 rounded bg-white/10" /></td>
                          </tr>
                        ))
                      ) : transactionsData.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center">
                            <Radio className="mx-auto mb-3 h-6 w-6 text-violet-400/40" />
                            <p className="text-sm font-medium text-white/60">Nenhuma atividade detectada</p>
                            <p className="mt-1 text-xs text-white/35">Sua infraestrutura está pronta.</p>
                          </td>
                        </tr>
                      ) : (
                        transactionsData.transactions.map((t: any) => {
                          const gross = Number(t.grossAmount ?? 0);
                          const net = Number(t.netAmount ?? 0);
                          return (
                            <tr key={t.id} className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.03]">
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                                    <ArrowDownLeft className="h-3.5 w-3.5" />
                                  </span>
                                  <div>
                                    <p className="font-medium text-white/90">
                                      {t.customer?.name || `Venda ${getMethodLabel(t.method)}`}
                                    </p>
                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/40">
                                      {getMethodIcon(t.method)} {getMethodLabel(t.method)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-white/50">{t.createdAt ? formatDate(t.createdAt) : "—"}</td>
                              <td className="px-3 py-3">{getStatusBadge(t.status)}</td>
                              <td className="px-3 py-3 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-semibold text-white">
                                    {isValuesVisible ? formatCurrency(gross) : "••••••"}
                                  </span>
                                  {net !== gross && (
                                    <span className="text-xs text-white/40">
                                      Líq. {isValuesVisible ? formatCurrency(net) : "••••"}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {transactionsData.pagination.totalPages > 1 && (
                  <div className="flex flex-col gap-3 border-t border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-center text-xs text-white/40 sm:text-left">
                      Página {currentPage} de {transactionsData.pagination.totalPages} · {transactionsData.pagination.totalItems} transações
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        disabled={currentPage === 1 || isLoadingTransactions}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:bg-white/[0.07] disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        disabled={currentPage === transactionsData.pagination.totalPages || isLoadingTransactions}
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:bg-white/[0.07] disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </main>
          </SidebarInset>
        </SidebarProvider>
        <ShadowPanel />
      </div>
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

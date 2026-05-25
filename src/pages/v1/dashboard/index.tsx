import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Coins,
  Eye,
  EyeOff,
  User,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Radio,
  ArrowUpRight,
} from "lucide-react";
import TwoFAModal from "./2faAuthentication";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import Image from "next/image";
import Head from "next/head";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown } from "lucide-react";
import ShadowPanel from "@/components/ShadowPanel";

/* Count-up suave (Shadow Design Language) */
function useCountUp(target: number, duration = 1300) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setValue(from + (target - from) * eased);
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
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Estados
  const [dashboardStats, setDashboardStats] = useState({
    currentBalance: 0,
    blockedBalance: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isValuesVisible, setIsValuesVisible] = useState(true);
  const [transactionsData, setTransactionsData] = useState({
    totals: {
      totalTransacionado: 0,
      totalEntradas: 0,
      totalSaidas: 0,
    },
    transactions: [],
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
  const withdrawUrl = "/v1/finance/withdraw"; // rota padrão
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const toBoolean = (val: any) => val === true || val === "t" || val === "1";

  // Detectar mobile
  const [isMobile, setIsMobile] = useState(false);
  const itemsPerPage = isMobile ? 4 : 3; // 4 registros mobile, 3 desktop

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (
      user &&
      (user as any).kycStatus &&
      verificationStatus !== (user as any).kycStatus
    ) {
      setVerificationStatus((user as any).kycStatus);
    }
  }, [user, verificationStatus]);

  // Fetch seller profile including 2FA info
  useEffect(() => {
    if (token) {
      (async () => {
        try {
          const res = await axios.get(
            "https://shadowpay-api-production.up.railway.app/api/user/profile",
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
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

  // Funções utilitárias
  const toggleValuesVisibility = () => setIsValuesVisible((v) => !v);
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      approved: { color: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30", text: "APROVADO" },
      pending: { color: "bg-amber-500/15 text-amber-300 border border-amber-500/30", text: "PENDENTE" },
      refunded: { color: "bg-white/10 text-white/60 border border-white/15", text: "EXTORNADO" },
      rejected: { color: "bg-rose-500/15 text-rose-300 border border-rose-500/30", text: "REJEITADO" },
      cancelled: { color: "bg-white/10 text-white/50 border border-white/15", text: "CANCELADO" },
    };
    const config = statusConfig[status.toLowerCase()] || {
      color: "bg-white/10 text-white/60 border border-white/15",
      text: status.toUpperCase(),
    };
    return (
      <span
        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const getTransactionTypeLabel = (type: string) => {
    if (!type) return "Desconhecido";
    const normalized = type.toLowerCase().trim();
    const typeLabels: Record<string, string> = {
      deposit: "Depósito",
      withdraw: "Saque",
      withdrawal: "Saque",
      sale: "Venda",
    };
    return typeLabels[normalized] || type;
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "pix":
        return (
          <Image
            src="/pix-icon.svg"
            width={16}
            height={16}
            className="brightness-0 invert opacity-80"
            alt="Pix"
          />
        );
      case "card":
        return (
          <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center text-white text-xs font-bold">
            C
          </div>
        );
      case "boleto":
        return (
          <div className="w-4 h-4 bg-orange-500 rounded-sm flex items-center justify-center text-white text-xs font-bold">
            B
          </div>
        );
      default:
        return null;
    }
  };

  const getMethodLabel = (method: string) => {
    const methodLabels = { pix: "PIX", card: "Cartão", boleto: "Boleto" };
    return methodLabels[method as keyof typeof methodLabels] || method;
  };

  // Fetch dashboard stats
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
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      const res = await axios.get(
        `https://shadowpay-api-production.up.railway.app/api/user/transactions-report?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.data.success) {
        const apiData = res.data.data;
        setTransactionsData({
          totals: {
            totalTransacionado: apiData.summary.totalTransactionado,
            totalEntradas: apiData.summary.totalEntradas,
            totalSaidas: apiData.summary.totalSaidas,
          },
          transactions: apiData.transactions,
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
    if (
      page >= 1 &&
      page <= transactionsData.pagination.totalPages &&
      page !== currentPage
    )
      fetchTransactions(page);
  };
  const handleRefreshTransactions = () => fetchTransactions(currentPage);
  const handleStartVerification = () => router.push("/v1/kyc");

  const animatedBalance = useCountUp(dashboardStats.currentBalance);

  const renderVerificationAlert = () => {
    if (verificationStatus === "NOT_STARTED") {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] px-5 py-4 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">Verificação de conta necessária</p>
              <p className="text-sm text-amber-200/70 mt-0.5">
                Para começar a operar, conclua a verificação (KYC) da sua conta.
              </p>
            </div>
          </div>
          <Button
            onClick={handleStartVerification}
            className="cursor-pointer bg-amber-500 hover:bg-amber-400 text-black font-semibold border-0"
          >
            Verificar agora
          </Button>
        </div>
      );
    }
    if (verificationStatus === "PENDING") {
      return (
        <div className="flex items-start gap-3 rounded-2xl border border-sky-500/30 bg-sky-500/[0.07] px-5 py-4 backdrop-blur-md">
          <Clock className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sky-200">Verificação em análise</p>
            <p className="text-sm text-sky-200/70 mt-0.5">
              Sua documentação está sendo analisada. Você será notificado em breve.
            </p>
          </div>
        </div>
      );
    }
    if (verificationStatus === "BANNED") {
      return (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.07] px-5 py-4 backdrop-blur-md">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Conta suspensa</p>
            <p className="text-sm text-rose-200/70 mt-0.5">
              Sua conta foi suspensa. Entre em contato com o suporte.
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!user) return <p className="p-6 text-white/60">Carregando…</p>;

  const SHADOW_BG =
    "radial-gradient(1100px 700px at 80% -10%, #0B1020 0%, #050816 55%, #02030A 100%)";

  return (
    <>
      <Head>
        <title>ShadowPay — Cockpit</title>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen" style={{ fontFamily: "'Satoshi', system-ui, sans-serif" }}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset
            className="text-white"
            style={{ background: SHADOW_BG }}
          >
            {/* 2FA banner */}
            {localUser &&
              !(localUser.twofaEnabled && (localUser as any).twofaConfirmed) && (
                <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 backdrop-blur-md lg:mx-8">
                  <span className="text-sm font-medium text-amber-200/90">
                    Sua conta ainda não tem autenticação em duas etapas (2FA).
                  </span>
                  <Button
                    size="sm"
                    className="cursor-pointer shrink-0 border border-amber-500/40 bg-transparent text-amber-300 hover:bg-amber-500/10"
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
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 lg:px-8">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-white/70 hover:text-white" />
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                    Shadow Online
                  </div>
                  <h1
                    className="text-lg font-bold tracking-tight text-white"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    {user?.companyName || "Operador"}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="cursor-pointer text-white/60 hover:text-white hover:bg-white/5"
                  variant="ghost"
                  size="icon"
                  onClick={toggleValuesVisibility}
                  aria-label={isValuesVisible ? "Ocultar valores" : "Mostrar valores"}
                >
                  {isValuesVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </Button>
                <Button
                  className="cursor-pointer border-white/12 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/v1/configs/profile")}
                >
                  <User className="h-4 w-4 mr-1" />
                  Perfil
                </Button>
              </div>
            </header>

            <main className="flex flex-col gap-6 p-4 lg:p-8">
              {renderVerificationAlert()}

              {/* Saldo */}
              <motion.div
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl"
                style={{ boxShadow: "0 30px 80px -45px rgba(139,92,246,0.6)" }}
              >
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
                  style={{ background: "rgba(139,92,246,0.25)" }}
                />
                <div className="relative flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
                    <Coins className="h-3.5 w-3.5" /> Saldo disponível
                  </span>
                  <Radio className="h-4 w-4 text-violet-400/60" />
                </div>
                <div
                  className="relative mt-3 text-4xl font-semibold tracking-tight text-white"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  {isValuesVisible ? formatCurrency(animatedBalance) : "••••••"}
                </div>
                <p className="relative mt-2 text-sm text-white/45">
                  Bloqueado:{" "}
                  <span className="text-white/70">
                    {isValuesVisible ? formatCurrency(dashboardStats.blockedBalance) : "••••••"}
                  </span>
                </p>
                <div className="relative mt-5">
                  <button
                    onClick={() => router.push(withdrawUrl)}
                    className="group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(120deg, #8B5CF6, #6366F1)",
                      boxShadow: "0 14px 36px -14px rgba(139,92,246,0.7)",
                    }}
                  >
                    Sacar
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </div>
              </motion.div>

              {/* Transações */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                  <h2 className="text-sm font-semibold text-white/90">
                    {isMobile ? "Transações" : "Histórico de Transações"}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshTransactions}
                    disabled={isLoadingTransactions}
                    className="cursor-pointer border-white/12 bg-white/[0.03] text-white/70 hover:bg-white/[0.07] hover:text-white"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingTransactions ? "animate-spin" : ""}`} />
                    {isLoadingTransactions ? "Atualizando…" : "Atualizar"}
                  </Button>
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
                            <td className="px-3 py-3">
                              <div className="h-4 w-40 rounded bg-white/10" />
                            </td>
                            <td className="px-3 py-3">
                              <div className="h-4 w-24 rounded bg-white/10" />
                            </td>
                            <td className="px-3 py-3">
                              <div className="h-6 w-20 rounded-full bg-white/10" />
                            </td>
                            <td className="px-3 py-3 text-right">
                              <div className="ml-auto h-4 w-20 rounded bg-white/10" />
                            </td>
                          </tr>
                        ))
                      ) : transactionsData.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-10 text-center text-white/40">
                            Nenhuma transação ainda. Sua operação aparece aqui em tempo real.
                          </td>
                        </tr>
                      ) : (
                        transactionsData.transactions
                          .slice(0, isMobile ? itemsPerPage : undefined)
                          .map((transaction: any) => (
                            <tr
                              key={transaction.id}
                              className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.03]"
                            >
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  {["withdraw", "withdrawal"].includes(
                                    transaction.transactionType?.toLowerCase()
                                  ) ? (
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-300">
                                      <ArrowUp className="h-3.5 w-3.5" />
                                    </span>
                                  ) : (
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                                      <ArrowDown className="h-3.5 w-3.5" />
                                    </span>
                                  )}
                                  <div>
                                    <p className="font-medium text-white/90">
                                      {transaction.description || getTransactionTypeLabel(transaction.transactionType)}
                                    </p>
                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/40">
                                      {getMethodIcon(transaction.paymentMethod)}
                                      {getMethodLabel(transaction.paymentMethod)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-white/50">
                                {formatDate(transaction.createdAt)}
                              </td>
                              <td className="px-3 py-3">{getStatusBadge(transaction.status)}</td>
                              <td className="px-3 py-3 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-semibold text-white">
                                    {isValuesVisible ? formatCurrency(transaction.amountGross ?? 0) : "••••••"}
                                  </span>
                                  {transaction.amountNet !== transaction.amountGross && (
                                    <span className="text-xs text-white/40">
                                      Líq.{" "}
                                      {isValuesVisible ? formatCurrency(transaction.amountNet) : "••••••"}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {transactionsData.pagination.totalPages > 1 && (
                  <div className="flex flex-col gap-3 border-t border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-center text-xs text-white/40 sm:text-left">
                      Página {currentPage} de {transactionsData.pagination.totalPages} ·{" "}
                      {transactionsData.pagination.totalItems} transações
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1 || isLoadingTransactions}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="h-8 cursor-pointer border-white/12 bg-white/[0.03] text-white/70 hover:bg-white/[0.07] hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from(
                        { length: Math.min(transactionsData.pagination.totalPages, 3) },
                        (_, i) => {
                          const pageNum =
                            Math.max(
                              1,
                              Math.min(
                                currentPage - 1,
                                transactionsData.pagination.totalPages - 2
                              )
                            ) + i;
                          const active = currentPage === pageNum;
                          return (
                            <Button
                              key={pageNum}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              disabled={isLoadingTransactions}
                              className={`h-8 w-8 cursor-pointer p-0 ${
                                active
                                  ? "border-0 text-white"
                                  : "border border-white/12 bg-white/[0.03] text-white/70 hover:bg-white/[0.07]"
                              }`}
                              style={
                                active
                                  ? { background: "linear-gradient(120deg, #8B5CF6, #6366F1)" }
                                  : undefined
                              }
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          currentPage === transactionsData.pagination.totalPages ||
                          isLoadingTransactions
                        }
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="h-8 cursor-pointer border-white/12 bg-white/[0.03] text-white/70 hover:bg-white/[0.07] hover:text-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
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

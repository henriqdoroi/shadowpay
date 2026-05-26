import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  RefreshCw,
  PiggyBank,
  HandCoins,
  ShoppingBag,
  Users,
  Filter,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import Head from "next/head";
import { motion } from "framer-motion";
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

interface TransactionTotals {
  totalTransacionado: number;
  totalEntradas: number;
  totalSaidas: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface TransactionsResponse {
  totals: TransactionTotals;
  transactions: Transaction[];
  pagination: Pagination;
}

const SHADOW_BG =
  "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

function ReportsContent() {
  const { user, token } = useAuth();

  const [data, setData] = useState<TransactionsResponse>({
    totals: { totalTransacionado: 0, totalEntradas: 0, totalSaidas: 0 },
    transactions: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 5,
      hasNextPage: false,
      hasPrevPage: false,
    },
  });

  const [dashboardStats, setDashboardStats] = useState({
    blockedBalance: 0,
    grossRevenue: 0,
    netRevenue: 0,
    totalPixGenerated: 0,
    totalSales: 0,
    uniqueCustomers: 0,
  });

  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [, setCurrentPage] = useState(1);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Carrega transações filtradas
  const fetchTransactions = async (page: number = 1) => {
    if (!token) return;

    setIsLoadingStats(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: data.pagination.itemsPerPage.toString(),
      });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await axios.get(
        `https://shadowpay-api-production.up.railway.app/api/user/transactions-report?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const apiData = response.data.data;

        setData({
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

        // Atualiza dashboard a partir das transações filtradas
        // (serializer retorna status PAID/PENDING/... , grossAmount/netAmount, method, customer)
        const approved: Transaction[] = (apiData.transactions || []).filter(
          (t: Transaction) => String(t.status).toUpperCase() === "PAID"
        );

        setDashboardStats({
          blockedBalance: dashboardStats.blockedBalance, // não muda com filtro
          grossRevenue: approved.reduce(
            (sum: number, t: Transaction) => sum + Number(t.grossAmount || 0),
            0
          ),
          netRevenue: approved.reduce(
            (sum: number, t: Transaction) => sum + Number(t.netAmount || 0),
            0
          ),
          totalPixGenerated: approved.filter(
            (t: Transaction) => String(t.method).toUpperCase() === "PIX"
          ).length,
          totalSales: approved.length,
          uniqueCustomers: new Set(
            approved.map(
              (t: Transaction) => t.customer?.email || t.customer?.name || t.id
            )
          ).size,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Carrega dashboard inicial do mês atual
  const fetchDashboardStats = async () => {
    if (!token) return;

    setIsLoadingStats(true);
    try {
      const response = await axios.get(
        "https://shadowpay-api-production.up.railway.app/api/user/dashboard-stats",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const stats = response.data.data;
        setDashboardStats({
          blockedBalance: Number(stats.blockedBalance) || 0,
          grossRevenue: Number(stats.grossRevenue) || 0,
          netRevenue: Number(stats.netRevenue) || 0,
          totalPixGenerated: Number(stats.totalPixGenerated?.id) || 0,
          totalSales: Number(stats.totalSales) || 0,
          uniqueCustomers: Number(stats.uniqueCustomers) || 0,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas do dashboard:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchTransactions(1); // sempre traz mês atual
      fetchDashboardStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const handleRefreshStats = () => fetchDashboardStats();
  const handleFilterApply = () => fetchTransactions(1);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);

  const cards = [
    {
      title: "Faturamento bruto",
      icon: <PiggyBank className="h-4 w-4" />,
      accent: "#34D399",
      value: formatCurrency(dashboardStats.grossRevenue),
      subtitle: "no período",
    },
    {
      title: "Faturamento líquido",
      icon: <HandCoins className="h-4 w-4" />,
      accent: "#22D3EE",
      value: formatCurrency(dashboardStats.netRevenue),
      subtitle: "no período",
    },
    {
      title: "Qtd. de vendas",
      icon: <ShoppingBag className="h-4 w-4" />,
      accent: "#8B5CF6",
      value: String(dashboardStats.totalSales),
      subtitle: "vendas aprovadas",
    },
    {
      title: "Pix gerados",
      icon: (
        <Image
          src="/pix-icon.svg"
          width={16}
          height={16}
          className="object-contain brightness-0 invert"
          alt="Pix"
        />
      ),
      accent: "#6366F1",
      value: String(dashboardStats.totalPixGenerated),
      subtitle: "transações",
    },
    {
      title: "Qtd. de clientes",
      icon: <Users className="h-4 w-4" />,
      accent: "#F59E0B",
      value: String(dashboardStats.uniqueCustomers),
      subtitle: "clientes únicos",
    },
  ];

  const inputCls =
    "h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/[0.05] [color-scheme:dark]";

  return (
    <>
      <Head>
        <title>ShadowPay — Relatórios</title>
      </Head>

      <div className="min-h-screen w-full overflow-x-hidden">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="text-white" style={{ background: SHADOW_BG }}>
            {/* Header */}
            <header className="flex flex-col gap-4 px-4 pt-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-white/60 hover:text-white" />
                <div>
                  <h1
                    className="text-2xl font-bold tracking-tight text-white md:text-[28px]"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Relatórios
                  </h1>
                  <p className="mt-1 text-xs text-white/40">
                    Analise o desempenho do seu negócio por período
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefreshStats}
                disabled={isLoadingStats}
                className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoadingStats ? "animate-spin" : ""}`}
                />
                {isLoadingStats ? "Atualizando…" : "Atualizar"}
              </button>
            </header>

            <main className="flex flex-col gap-5 p-4 lg:p-8">
              {/* Filtro de período */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
              >
                <div className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                  <Filter className="h-3.5 w-3.5" /> Filtrar período
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-xs text-white/50">
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
                    <label className="mb-1.5 block text-xs text-white/50">
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
                    onClick={handleFilterApply}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(120deg, #7C3AED, #6366F1)",
                      boxShadow: "0 14px 36px -14px rgba(124,58,237,0.7)",
                    }}
                  >
                    Aplicar filtro
                  </button>
                </div>
              </motion.div>

              {/* KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((c, i) => (
                  <motion.div
                    key={c.title}
                    initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.7,
                      delay: i * 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                  >
                    <div
                      className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-80"
                      style={{ background: `${c.accent}22` }}
                    />
                    <div className="relative mb-4 flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: `${c.accent}1f`, color: c.accent }}
                      >
                        {c.icon}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                        {c.title}
                      </span>
                    </div>
                    <div
                      className="relative text-2xl font-semibold tracking-tight text-white"
                      style={{ fontFamily: "'Clash Display', sans-serif" }}
                    >
                      {c.value}
                    </div>
                    <p className="relative mt-1.5 text-xs text-white/35">
                      {c.subtitle}
                    </p>
                  </motion.div>
                ))}
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
        <ShadowPanel />
      </div>
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

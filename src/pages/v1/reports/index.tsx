import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  PiggyBank,
  HandCoins,
  ShoppingBag,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Transaction {
  id: string;
  transactionType: "deposit" | "withdraw" | "sale";
  paymentMethod: "pix" | "card" | "boleto";
  status: "pending" | "approved" | "rejected" | "cancelled";
  amountGross: number;
  amountNet: number;
  description: string;
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
  const [currentPage, setCurrentPage] = useState(1);

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
        `https://shadowpay-production-2ca8.up.railway.app/api/user/transactions-report?${params.toString()}`,
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
        const approved: Transaction[] = apiData.transactions.filter(
          (t: Transaction) => t.status === "approved"
        );

        setDashboardStats({
          blockedBalance: dashboardStats.blockedBalance, // não muda com filtro
          grossRevenue: approved.reduce(
            (sum: number, t: Transaction) => sum + t.amountGross,
            0
          ),
          netRevenue: approved.reduce(
            (sum: number, t: Transaction) => sum + t.amountNet,
            0
          ),
          totalPixGenerated: approved.filter(
            (t: Transaction) => t.paymentMethod === "pix"
          ).length,
          totalSales: approved.filter(
            (t: Transaction) => t.transactionType === "sale"
          ).length,
          uniqueCustomers: new Set(
            approved.map((t: Transaction) => t.description)
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
        "https://shadowpay-production-2ca8.up.railway.app/api/user/dashboard-stats",
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
  }, [user, token]);

  const handleRefreshStats = () => fetchDashboardStats();
  const handleFilterApply = () => fetchTransactions(1);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between px-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Safira Cash</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Relatórios</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <Button
              onClick={handleRefreshStats}
              disabled={isLoadingStats}
              variant="outline"
              className="flex items-center gap-2 h-8 text-sm"
            >
              <RefreshCw
                className={`h-3 w-3 ${isLoadingStats ? "animate-spin" : ""}`}
              />
              {isLoadingStats ? "Atualizando..." : "Atualizar"}
            </Button>
          </header>

          <div className="flex flex-col gap-4 px-2 pt-4 w-full max-w-full">
            <div className="flex gap-2 justify-between">
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm w-1/2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm w-1/2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleFilterApply}
              variant="outline"
              className="mt-2 h-8 text-sm w-full"
            >
              Aplicar Filtro
            </Button>

            <div className="grid gap-2 grid-cols-2 w-full mt-2">
              {[
                {
                  title: "Faturamento bruto",
                  icon: (
                    <PiggyBank className="h-5 w-5 flex-shrink-0 text-green-500" />
                  ),
                  value: formatCurrency(dashboardStats.grossRevenue),
                  subtitle: "30 dias",
                  type: "square",
                },
                {
                  title: "Faturamento líquido",
                  icon: (
                    <HandCoins className="h-5 w-5 flex-shrink-0 text-blue-500" />
                  ),
                  value: formatCurrency(dashboardStats.netRevenue),
                  subtitle: "30 dias",
                  type: "square",
                },
                {
                  title: "Qtd. de vendas",
                  icon: (
                    <ShoppingBag className="h-5 w-5 flex-shrink-0 text-purple-500" />
                  ),
                  value: (
                    <>
                      {dashboardStats.totalSales}{" "}
                      <span className="font-normal text-xs opacity-40">
                        vendas
                      </span>
                    </>
                  ),
                  subtitle: "30 dias",
                  type: "square",
                },
                {
                  title: "Pix Gerados",
                  icon: (
                    <Image
                      src="/pix-icon.svg"
                      width={20}
                      height={20}
                      className="brightness-0 invert object-contain flex-shrink-0"
                      alt="Pix icon"
                    />
                  ),
                  value: (
                    <>
                      {dashboardStats.totalPixGenerated}{" "}
                      <span className="font-normal text-xs opacity-40">
                        transações
                      </span>
                    </>
                  ),
                  subtitle: "30 dias",
                  type: "square",
                },
                {
                  title: "Qtd. de clientes",
                  icon: (
                    <Users className="h-5 w-5 flex-shrink-0 text-orange-500" />
                  ),
                  value: (
                    <>
                      {dashboardStats.uniqueCustomers}{" "}
                      <span className="font-normal text-xs opacity-40">
                        clientes
                      </span>
                    </>
                  ),
                  type: "rectangle",
                },
              ].map(({ title, icon, value, subtitle, type }) => (
                <Card
                  key={title}
                  className={`
                    p-3
                    w-full
                    ${type === "square" ? "aspect-square" : "h-28"}
                    flex flex-col justify-between
                    ${type === "rectangle" ? "col-span-2" : ""}
                  `}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm font-semibold break-words">
                      <span>{title}</span>
                      {icon}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-lg font-bold leading-tight break-words">
                      {value}
                    </h3>
                    {subtitle && (
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        {subtitle}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default function Reports() {
  return (
    <ProtectedRoute>
      <ReportsContent />
    </ProtectedRoute>
  );
}

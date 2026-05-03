import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import TwoFAModal from "./2faAuthentication";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import Image from "next/image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowUp, ArrowDown } from "lucide-react";

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
            "https://api.safira.cash/api/user/profile",
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
          setIsLoadingProfile(false); // <- Marca que terminou de carregar
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
      approved: { color: "bg-green-100 text-green-800", text: "APROVADO" },
      pending: { color: "bg-orange-100 text-orange-800", text: "PENDENTE" },
      refunded: { color: "bg-gray-200 text-gray-800", text: "EXTORNADO" },
      rejected: { color: "bg-red-100 text-red-800", text: "REJEITADO" },
      cancelled: { color: "bg-gray-100 text-gray-800", text: "CANCELADO" },
    };
    const config = statusConfig[status.toLowerCase()] || {
      color: "bg-gray-100 text-gray-800",
      text: status.toUpperCase(),
    };
    return (
      <span
        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}
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
            className="brightness-0 invert"
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
            "https://api.safira.cash/api/user/dashboard-stats",
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
        `https://api.safira.cash/api/user/transactions-report?${params.toString()}`,
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

  const renderVerificationAlert = () => {
    if (verificationStatus === "NOT_STARTED") {
      return (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="flex items-center justify-between w-full">
            <div>
              <span className="font-semibold text-orange-800 dark:text-orange-200">
                Verificação de conta necessária
              </span>
              <p className="text-orange-700 dark:text-orange-300 mt-1">
                Para começar a utilizar nossos serviços, você precisa verificar
                sua conta.
              </p>
            </div>
            <Button
              onClick={handleStartVerification}
              className="cursor-pointer bg-orange-600 hover:bg-orange-700 text-white ml-4"
            >
              Verificar Agora
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    if (verificationStatus === "PENDING") {
      return (
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <span className="font-semibold text-blue-800 dark:text-blue-200">
              Verificação em análise
            </span>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Sua documentação está sendo analisada. Você receberá uma
              notificação em breve.
            </p>
          </AlertDescription>
        </Alert>
      );
    }
    if (verificationStatus === "BANNED") {
      return (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <span className="font-semibold text-red-800 dark:text-red-200">
              Conta suspensa
            </span>
            <p className="text-red-700 dark:text-red-300 mt-1">
              Sua conta foi suspensa. Entre em contato com o suporte para mais
              informações.
            </p>
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  if (!user) return <p>Carregando...</p>;

  return (
    <div className="min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {localUser &&
            !(localUser.twofaEnabled && (localUser as any).twofaConfirmed) && (
              <div className="border border-orange-500 bg-transparent text-orange-500 px-4 py-4 flex items-center justify-between rounded-md mx-4 lg:mx-8 max-w-[calc(100%-2rem)]">
                <span className="text-sm font-medium">
                  Sua conta ainda não possui autenticação em duas etapas (2FA)
                  habilitada.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer border-orange-500 text-orange-500 hover:bg-orange-50"
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
          <header className="flex h-16 shrink-0 items-center justify-between px-4">
            <h1 className="text-xl font-bold tracking-tight">
              Bem-vindo, {user?.companyName || "Usuário"}
            </h1>
            <div className="flex items-center gap-2">
              <Button
                className="cursor-pointer"
                variant="ghost"
                size="icon"
                onClick={toggleValuesVisibility}
                aria-label={
                  isValuesVisible ? "Ocultar valores" : "Mostrar valores"
                }
              >
                {isValuesVisible ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
              </Button>
              <Button
                className="cursor-pointer"
                variant="outline"
                size="sm"
                onClick={() => router.push("/v1/configs/profile")}
              >
                <User className="h-4 w-4 mr-1" />
                Perfil
              </Button>
            </div>
          </header>

          <main className="p-6 flex flex-col gap-6">
            {renderVerificationAlert()}

            {/* Cards de saldo */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="bg-card text-card-foreground flex flex-col gap-4 border p-3 w-full max-w-full shadow-md rounded-lg">
                <CardHeader className="pb-1">
                  <CardTitle className="flex items-center justify-between text-base font-semibold">
                    <span className="flex items-center gap-2">
                      Saldo disponível <Coins className="opacity-70" />
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold text-primary">
                      {isValuesVisible
                        ? formatCurrency(dashboardStats.currentBalance)
                        : "••••••"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Saldo bloqueado:{" "}
                      {isValuesVisible
                        ? formatCurrency(dashboardStats.blockedBalance)
                        : "••••••"}
                    </p>
                    {isMobile && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <Button
                          className="h-8 text-sm font-medium rounded-md w-full bg-black text-white hover:bg-[#6a0dad] transition-colors cursor-pointer"
                          onClick={() => router.push(withdrawUrl)}
                        >
                          Sacar
                        </Button>

                        {/* <Button
                          className="h-8 text-sm font-medium rounded-md w-full bg-white text-black border hover:bg-[#6a0dad] hover:text-white transition-colors cursor-pointer"
                          onClick={() => router.push("/v1/deposit")}
                        >
                          Depositar
                        </Button> */}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Histórico de transações: desktop vs mobile */}
              {isMobile ? (
                /* Mobile layout simplificado */
                <Card className="p-4 w-full max-w-full shadow-md rounded-lg">
                  <CardHeader className="flex flex-row items-center justify-between pb-1">
                    <CardTitle className="text-base font-semibold">
                      Transações
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshTransactions}
                      disabled={isLoadingTransactions}
                      className="cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${
                          isLoadingTransactions ? "animate-spin" : ""
                        }`}
                      />
                      {isLoadingTransactions ? "Atualizando..." : "Atualizar"}
                    </Button>
                  </CardHeader>

                  <CardContent className="p-0 overflow-x-hidden">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="p-2 text-left">Data</th>
                          <th className="p-2 text-left">Tipo</th>
                          <th className="p-2 text-center">Status</th>
                          <th className="p-2 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactionsData.transactions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center py-4 text-muted-foreground"
                            >
                              Nenhuma transação encontrada
                            </td>
                          </tr>
                        ) : (
                          transactionsData.transactions
                            .slice(0, itemsPerPage)
                            .map((transaction: any) => (
                              <tr key={transaction.id} className="border-b">
                                <td className="p-2 break-words whitespace-normal">
                                  {formatDate(transaction.createdAt)}
                                </td>
                                <td className="p-2 flex items-center justify-center break-words whitespace-normal">
                                  {["withdraw", "withdrawal"].includes(
                                    transaction.transactionType?.toLowerCase()
                                  ) ? (
                                    <ArrowUp className="w-4 h-4 text-red-500" />
                                  ) : (
                                    <ArrowDown className="w-4 h-4 text-green-500" />
                                  )}
                                </td>
                                <td className="p-2 text-center break-words whitespace-normal">
                                  {getStatusBadge(transaction.status)}
                                </td>
                                <td className="p-2 text-right font-medium break-words whitespace-normal">
                                  {isValuesVisible
                                    ? formatCurrency(
                                        transaction.amountGross ?? 0
                                      )
                                    : "••••••"}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>

                    {/* Paginação mobile */}
                    {transactionsData.pagination.totalPages > 1 && (
                      <div className="flex justify-center mt-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="cursor-pointer h-8 w-8 p-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium self-center">
                          Página {currentPage} de{" "}
                          {transactionsData.pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            currentPage ===
                            transactionsData.pagination.totalPages
                          }
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="cursor-pointer h-8 w-8 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* Desktop layout completo */
                <Card className="p-6 max-w-full w-full overflow-x-auto">
                  <CardHeader>
                    <CardTitle>Histórico de Transações</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshTransactions}
                      disabled={isLoadingTransactions}
                      className="ml-auto cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${
                          isLoadingTransactions ? "animate-spin" : ""
                        }`}
                      />
                      {isLoadingTransactions ? "Atualizando..." : "Atualizar"}
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="border-b p-3">Transação</th>
                          <th className="border-b p-3">Data</th>
                          <th className="border-b p-3">Status</th>
                          <th className="border-b p-3 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingTransactions ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="animate-pulse">
                              <td className="border-b p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-gray-200" />
                                  <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                                  </div>
                                </div>
                              </td>
                              <td className="border-b p-3">
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                              </td>
                              <td className="border-b p-3">
                                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                              </td>
                              <td className="border-b p-3 text-right">
                                <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
                              </td>
                            </tr>
                          ))
                        ) : transactionsData.transactions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Nenhuma transação encontrada
                            </td>
                          </tr>
                        ) : (
                          transactionsData.transactions.map(
                            (transaction: any) => (
                              <tr key={transaction.id} className="border-b">
                                <td className="p-3">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        transaction.transactionType ===
                                          "deposit" ||
                                        transaction.transactionType === "sale"
                                          ? "bg-green-600"
                                          : "bg-gray-400"
                                      }`}
                                    />
                                    <div>
                                      <p className="font-medium">
                                        {transaction.description}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        {getMethodIcon(
                                          transaction.paymentMethod
                                        )}
                                        <span className="text-sm text-muted-foreground">
                                          {getMethodLabel(
                                            transaction.paymentMethod
                                          )}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {getTransactionTypeLabel(
                                          transaction.transactionType
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  {formatDate(transaction.createdAt)}
                                </td>
                                <td className="p-3">
                                  {getStatusBadge(transaction.status)}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex flex-col items-end font-medium text-foreground">
                                    <span>
                                      {isValuesVisible
                                        ? formatCurrency(
                                            transaction.amountGross ?? 0
                                          )
                                        : "••••••"}
                                    </span>
                                    {transaction.amountNet !==
                                      transaction.amountGross && (
                                      <span className="text-xs text-muted-foreground">
                                        Líquido:{" "}
                                        {isValuesVisible
                                          ? formatCurrency(
                                              transaction.amountNet
                                            )
                                          : "••••••"}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>

                    {/* Paginação desktop */}
                    {transactionsData.pagination.totalPages > 1 && (
                      <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-muted-foreground text-center sm:text-left">
                          Mostrando{" "}
                          {(transactionsData.pagination.currentPage - 1) *
                            transactionsData.pagination.itemsPerPage +
                            1}{" "}
                          -{" "}
                          {Math.min(
                            transactionsData.pagination.currentPage *
                              transactionsData.pagination.itemsPerPage,
                            transactionsData.pagination.totalItems
                          )}{" "}
                          de {transactionsData.pagination.totalItems} transações
                        </div>
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              transactionsData.pagination.currentPage === 1 ||
                              isLoadingTransactions
                            }
                            onClick={() =>
                              handlePageChange(
                                transactionsData.pagination.currentPage - 1
                              )
                            }
                            className="px-2 sm:px-3 cursor-pointer"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline ml-1">
                              Anterior
                            </span>
                          </Button>

                          {Array.from(
                            {
                              length: Math.min(
                                transactionsData.pagination.totalPages,
                                3
                              ),
                            },
                            (_, i) => {
                              const pageNum =
                                Math.max(
                                  1,
                                  Math.min(
                                    transactionsData.pagination.currentPage - 1,
                                    transactionsData.pagination.totalPages - 2
                                  )
                                ) + i;
                              return (
                                <Button
                                  key={pageNum}
                                  variant={
                                    transactionsData.pagination.currentPage ===
                                    pageNum
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  className="w-8 h-8 p-0 cursor-pointer"
                                  onClick={() => handlePageChange(pageNum)}
                                  disabled={isLoadingTransactions}
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
                              transactionsData.pagination.currentPage ===
                                transactionsData.pagination.totalPages ||
                              isLoadingTransactions
                            }
                            onClick={() =>
                              handlePageChange(
                                transactionsData.pagination.currentPage + 1
                              )
                            }
                            className="px-2 sm:px-3 cursor-pointer"
                          >
                            <span className="hidden sm:inline mr-1">
                              Próximo
                            </span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

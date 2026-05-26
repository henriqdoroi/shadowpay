import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Activity,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Head from "next/head";
import { motion } from "framer-motion";
import ShadowPanel from "@/components/ShadowPanel";

interface Transaction {
  id: string;
  transactionId: string;
  externalTransactionId: string;
  sellerId: string;
  productId: string | null;
  customerId: string | null;
  amount: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  paymentMethod: "PIX" | "CARD" | "BOLETO" | "CRYPTO";
  transactionType: string;
  amountGross: string;
  amountNet: string;
  amountFee: string;
  paymentData: any;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    companyName: string;
    email: string;
  };
  product: {
    id: string;
    name: string;
    price: number;
  } | null;
  customer: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface TransactionsResponse {
  success: boolean;
  data: {
    transactions: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface Filters {
  page: number;
  limit: number;
  status?: string;
  paymentMethod?: string;
  sellerId?: string;
  startDate?: string;
  endDate?: string;
  transactionType?: string;
}

const SHADOW_BG =
  "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

const formatCurrency = (value: string | number) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue || 0);
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getStatusBadge = (status: string) => {
  const map: Record<
    string,
    { color: string; label: string; Icon: any }
  > = {
    APPROVED: {
      color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      label: "Aprovada",
      Icon: CheckCircle,
    },
    PENDING: {
      color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      label: "Pendente",
      Icon: Clock,
    },
    REJECTED: {
      color: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      label: "Rejeitada",
      Icon: XCircle,
    },
    CANCELLED: {
      color: "bg-white/10 text-white/55 border-white/15",
      label: "Cancelada",
      Icon: AlertCircle,
    },
  };
  const cfg = map[status] ?? {
    color: "bg-white/10 text-white/60 border-white/15",
    label: status,
    Icon: AlertCircle,
  };
  const Icon = cfg.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${cfg.color}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
};

const getTransactionTypeText = (type: string) => {
  const types: Record<string, string> = {
    DEPOSIT: "Depósito",
    WITHDRAW: "Saque",
  };
  return types[type?.toUpperCase()] || type || "—";
};

const getPaymentMethodText = (method: string) => {
  const methods: Record<string, string> = {
    PIX: "PIX",
    CARD: "Cartão",
    BOLETO: "Boleto",
    CRYPTO: "Cripto",
  };
  return methods[method] || method;
};

export default function TransactionsPage() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 20,
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        setError("Token de autenticação não encontrado");
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          const paramKey = key === "transactionType" ? "transaction_type" : key;
          queryParams.append(paramKey, value.toString());
        }
      });

      const response = await fetch(
        `https://shadowpay-api-production.up.railway.app/api/admin/transactions?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar transações");
      }

      const data: TransactionsResponse = await response.json();
      setTransactions(data.data.transactions);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, token]);

  const handleFilterChange = (key: keyof Filters, value: string | number) => {
    const filterValue = value === "all" ? undefined : value;
    setFilters((prev) => ({
      ...prev,
      [key]: filterValue,
      page: key !== "page" ? 1 : (value as number),
    }));
  };

  const inputCls =
    "h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/[0.05] [color-scheme:dark]";
  const selectCls =
    "h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white outline-none transition-colors focus:border-violet-500/50 [color-scheme:dark]";

  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Transações (Admin)</title>
      </Head>
      <div className="min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="text-white" style={{ background: SHADOW_BG }}>
            <header className="flex items-center gap-3 px-4 pt-6 lg:px-8">
              <SidebarTrigger className="text-white/60 hover:text-white" />
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight text-white md:text-[28px]"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  Gerenciamento de Transações
                </h1>
                <p className="mt-1 text-xs text-white/40">
                  Monitore todas as transações da plataforma em tempo real
                </p>
              </div>
            </header>

            <main className="flex flex-col gap-5 p-4 lg:p-8">
              {/* Filtros */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
              >
                <div className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                  <Filter className="h-3.5 w-3.5" /> Filtros
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <label className="mb-1.5 block text-xs text-white/50">
                      Status
                    </label>
                    <select
                      className={selectCls}
                      value={filters.status || "all"}
                      onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                      }
                    >
                      {[
                        { v: "all", l: "Todos os status" },
                        { v: "PENDING", l: "Pendente" },
                        { v: "APPROVED", l: "Aprovada" },
                        { v: "REJECTED", l: "Rejeitada" },
                        { v: "CANCELLED", l: "Cancelada" },
                      ].map((o) => (
                        <option key={o.v} value={o.v} className="bg-[#0B1020]">
                          {o.l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs text-white/50">
                      Método de pagamento
                    </label>
                    <select
                      className={selectCls}
                      value={filters.paymentMethod || "all"}
                      onChange={(e) =>
                        handleFilterChange("paymentMethod", e.target.value)
                      }
                    >
                      {[
                        { v: "all", l: "Todos os métodos" },
                        { v: "PIX", l: "PIX" },
                        { v: "CARD", l: "Cartão" },
                        { v: "BOLETO", l: "Boleto" },
                        { v: "CRYPTO", l: "Cripto" },
                      ].map((o) => (
                        <option key={o.v} value={o.v} className="bg-[#0B1020]">
                          {o.l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs text-white/50">
                      Tipo de transação
                    </label>
                    <select
                      className={selectCls}
                      value={filters.transactionType || "all"}
                      onChange={(e) =>
                        handleFilterChange("transactionType", e.target.value)
                      }
                    >
                      {[
                        { v: "all", l: "Todos os tipos" },
                        { v: "DEPOSIT", l: "Depósitos" },
                        { v: "WITHDRAW", l: "Saques" },
                      ].map((o) => (
                        <option key={o.v} value={o.v} className="bg-[#0B1020]">
                          {o.l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs text-white/50">
                      Data inicial
                    </label>
                    <input
                      type="date"
                      value={filters.startDate || ""}
                      onChange={(e) =>
                        handleFilterChange("startDate", e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs text-white/50">
                      Data final
                    </label>
                    <input
                      type="date"
                      value={filters.endDate || ""}
                      onChange={(e) =>
                        handleFilterChange("endDate", e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Tabela */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                  <h2
                    className="text-sm font-semibold text-white"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Lista de transações
                  </h2>
                  <span className="text-xs text-white/40">
                    {pagination.total}{" "}
                    {pagination.total === 1 ? "transação" : "transações"}
                  </span>
                </div>

                {error && (
                  <div className="m-4 rounded-xl border border-rose-500/30 bg-rose-500/[0.07] p-3 text-sm text-rose-300">
                    {error}
                  </div>
                )}

                <div className="overflow-x-auto p-2 sm:p-4">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-white/40">
                        <th className="px-3 py-2 font-medium">ID</th>
                        <th className="px-3 py-2 font-medium">Vendedor</th>
                        <th className="px-3 py-2 font-medium">Cliente</th>
                        <th className="px-3 py-2 font-medium">Produto</th>
                        <th className="px-3 py-2 font-medium">Tipo</th>
                        <th className="px-3 py-2 font-medium">Valor</th>
                        <th className="px-3 py-2 font-medium">Método</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <tr
                            key={i}
                            className="animate-pulse border-t border-white/[0.05]"
                          >
                            {Array.from({ length: 9 }).map((__, j) => (
                              <td key={j} className="px-3 py-3">
                                <div className="h-4 w-full max-w-[120px] rounded bg-white/10" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : transactions.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-14 text-center">
                            <Activity className="mx-auto mb-3 h-7 w-7 text-violet-400/40" />
                            <p className="text-sm font-medium text-white/60">
                              Nenhuma transação encontrada
                            </p>
                          </td>
                        </tr>
                      ) : (
                        transactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.03]"
                          >
                            <td className="px-3 py-3 font-mono text-xs text-white/70">
                              {transaction.transactionId}
                            </td>
                            <td className="px-3 py-3">
                              <p className="font-medium text-white/90">
                                {transaction.seller.companyName}
                              </p>
                              <p className="text-xs text-white/40">
                                {transaction.seller.email}
                              </p>
                            </td>
                            <td className="px-3 py-3">
                              {transaction.customer ? (
                                <>
                                  <p className="text-white/85">
                                    {transaction.customer.name}
                                  </p>
                                  <p className="text-xs text-white/40">
                                    {transaction.customer.email}
                                  </p>
                                </>
                              ) : (
                                <span className="text-white/35">N/A</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {transaction.product ? (
                                <>
                                  <p className="text-white/85">
                                    {transaction.product.name}
                                  </p>
                                  <p className="text-xs text-white/40">
                                    {formatCurrency(transaction.product.price)}
                                  </p>
                                </>
                              ) : (
                                <span className="text-white/35">N/A</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-xs text-white/70">
                              {getTransactionTypeText(
                                transaction.transactionType
                              )}
                            </td>
                            <td className="px-3 py-3 font-medium text-white/90">
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="px-3 py-3 text-xs text-white/65">
                              {getPaymentMethodText(transaction.paymentMethod)}
                            </td>
                            <td className="px-3 py-3">
                              {getStatusBadge(transaction.status)}
                            </td>
                            <td className="px-3 py-3 text-xs text-white/50">
                              {formatDate(transaction.createdAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {pagination.pages > 1 && (
                  <div className="flex flex-col gap-3 border-t border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-center text-xs text-white/40 sm:text-left">
                      Mostrando{" "}
                      {(pagination.page - 1) * pagination.limit + 1} a{" "}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}{" "}
                      de {pagination.total} transações
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() =>
                          handleFilterChange("page", pagination.page - 1)
                        }
                        disabled={pagination.page <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:bg-white/[0.07] disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2 text-xs text-white/55">
                        {pagination.page} / {pagination.pages}
                      </span>
                      <button
                        onClick={() =>
                          handleFilterChange("page", pagination.page + 1)
                        }
                        disabled={pagination.page >= pagination.pages}
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
    </ProtectedRoute>
  );
}

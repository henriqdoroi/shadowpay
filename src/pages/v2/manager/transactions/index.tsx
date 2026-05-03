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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

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

const formatCurrency = (value: string | number) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    APPROVED: {
      label: "Aprovada",
      variant: "default" as const,
      icon: CheckCircle,
      color: "text-green-600",
    },
    PENDING: {
      label: "Pendente",
      variant: "secondary" as const,
      icon: Clock,
      color: "text-yellow-600",
    },
    REJECTED: {
      label: "Rejeitada",
      variant: "destructive" as const,
      icon: XCircle,
      color: "text-red-600",
    },
    CANCELLED: {
      label: "Cancelada",
      variant: "outline" as const,
      icon: AlertCircle,
      color: "text-gray-600",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};
const getTransactionTypeText = (type: string) => {
  const types = {
    DEPOSIT: "Depósito",
    WITHDRAW: "Saque", // Alterado para WITHDRAW
  };
  return types[type.toUpperCase() as keyof typeof types] || type;
};

const getPaymentMethodText = (method: string) => {
  const methods = {
    PIX: "PIX",
    CARD: "Cartão",
    BOLETO: "Boleto",
    CRYPTO: "Cripto",
  };
  return methods[method as keyof typeof methods] || method;
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

  // Função para buscar as transações com base nos filtros e token
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
          const paramKey = key === "transactionType" ? "transaction_type" : key; // <-- ajuste aqui
          queryParams.append(paramKey, value.toString());
        }
      });

      const response = await fetch(
        `https://api.safira.cash/api/admin/transactions?${queryParams.toString()}`,
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

  // Atualiza a lista sempre que filtros ou token mudam
  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
  }, [filters, token]);

  // Atualiza filtros e reseta página para 1 se filtro diferente de página for alterado
  const handleFilterChange = (key: keyof Filters, value: string | number) => {
    const filterValue = value === "all" ? undefined : value;
    setFilters((prev) => ({
      ...prev,
      [key]: filterValue,
      page: key !== "page" ? 1 : (value as number),
    }));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
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
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/v2/manager">
                        Administrativo
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Transações</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-4 pt-0 min-h-screen">
              {/* Título */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  Gerenciamento de Transações
                </h1>
                <p className="text-muted-foreground">
                  Monitore e gerencie todas as transações da plataforma em tempo
                  real.
                </p>
              </div>

              {/* Filtros */}
              <Card className="p-6 min-w-[280px] max-w-[360px] w-full md:min-w-auto md:max-w-none flex flex-col justify-between">
                <CardHeader>
                  <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={filters.status || "all"}
                        onValueChange={(value) =>
                          handleFilterChange("status", value)
                        }
                      >
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os status</SelectItem>
                          <SelectItem value="PENDING">Pendente</SelectItem>
                          <SelectItem value="APPROVED">Aprovada</SelectItem>
                          <SelectItem value="REJECTED">Rejeitada</SelectItem>
                          <SelectItem value="CANCELLED">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Método de Pagamento */}
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                      <Select
                        value={filters.paymentMethod || "all"}
                        onValueChange={(value) =>
                          handleFilterChange("paymentMethod", value)
                        }
                      >
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Todos os métodos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os métodos</SelectItem>
                          <SelectItem value="PIX">PIX</SelectItem>
                          <SelectItem value="CARD">Cartão</SelectItem>
                          <SelectItem value="BOLETO">Boleto</SelectItem>
                          <SelectItem value="CRYPTO">Cripto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tipo de Transação */}
                    <div className="space-y-2">
                      <Label htmlFor="transactionType">Tipo de Transação</Label>
                      <Select
                        value={filters.transactionType || "all"}
                        onValueChange={(value) =>
                          handleFilterChange("transactionType", value)
                        }
                      >
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os tipos</SelectItem>
                          <SelectItem value="DEPOSIT">Depósitos</SelectItem>
                          <SelectItem value="WITHDRAW">Saques</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Data Inicial */}
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Data Inicial</Label>
                      <Input
                        className="cursor-pointer"
                        id="startDate"
                        type="date"
                        value={filters.startDate || ""}
                        onChange={(e) =>
                          handleFilterChange("startDate", e.target.value)
                        }
                      />
                    </div>

                    {/* Data Final */}
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Data Final</Label>
                      <Input
                        className="cursor-pointer"
                        id="endDate"
                        type="date"
                        value={filters.endDate || ""}
                        onChange={(e) =>
                          handleFilterChange("endDate", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela de Transações */}
              <Card className="w-full p-6 flex flex-col min-w-[280px] max-w-[360px] md:min-w-auto md:max-w-none md:p-6">
                <CardHeader>
                  <CardTitle>Lista de Transações</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-2 flex flex-col gap-4 w-full">
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-600">{error}</p>
                    </div>
                  )}

                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border w-full overflow-x-auto">
                        <Table className="w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Vendedor</TableHead>
                              <TableHead>Cliente</TableHead>
                              <TableHead>Produto</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>Método</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Data</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={9}
                                  className="text-center py-8"
                                >
                                  Nenhuma transação encontrada
                                </TableCell>
                              </TableRow>
                            ) : (
                              transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                  <TableCell className="font-mono text-xs">
                                    {transaction.transactionId}
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">
                                        {transaction.seller.companyName}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {transaction.seller.email}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {transaction.customer ? (
                                      <div>
                                        <div className="font-medium">
                                          {transaction.customer.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {transaction.customer.email}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        N/A
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {transaction.product ? (
                                      <div>
                                        <div className="font-medium">
                                          {transaction.product.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {formatCurrency(
                                            transaction.product.price
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        N/A
                                      </span>
                                    )}
                                  </TableCell>

                                  <TableCell>
                                    {getTransactionTypeText(
                                      transaction.transactionType
                                    )}
                                  </TableCell>

                                  <TableCell className="font-medium">
                                    {formatCurrency(transaction.amount)}
                                  </TableCell>
                                  <TableCell>
                                    {getPaymentMethodText(
                                      transaction.paymentMethod
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(transaction.status)}
                                  </TableCell>
                                  <TableCell>
                                    {formatDate(transaction.createdAt)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Paginação */}
                      {pagination.pages > 1 && (
                        <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-sm text-muted-foreground text-center sm:text-left">
                            Mostrando{" "}
                            {(pagination.page - 1) * pagination.limit + 1} a{" "}
                            {Math.min(
                              pagination.page * pagination.limit,
                              pagination.total
                            )}{" "}
                            de {pagination.total} transações
                          </div>
                          <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                            <Button
                              className="cursor-pointer"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleFilterChange("page", pagination.page - 1)
                              }
                              disabled={pagination.page <= 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Anterior
                            </Button>
                            <span className="text-sm">
                              Página {pagination.page} de {pagination.pages}
                            </span>
                            <Button
                              className="cursor-pointer"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleFilterChange("page", pagination.page + 1)
                              }
                              disabled={pagination.page >= pagination.pages}
                            >
                              Próxima
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </ProtectedRoute>
  );
}

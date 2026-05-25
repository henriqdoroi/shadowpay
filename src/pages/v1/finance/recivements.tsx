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
import { QRCodeSVG } from "qrcode.react"; // QR Code em SVG

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Wallet,
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  Copy,
  ArrowUpIcon,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";

interface Deposit {
  id: string;
  paymentMethod: "pix" | "card" | "boleto";
  status: "pending" | "approved" | "rejected" | "cancelled" | "refunded";
  amountGross: number;
  amountNet: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
  };
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ApiFeeData {
  percentualin: number;
  fixoin: number;
}

interface FeesResponse {
  success: boolean;
  data: {
    sellerId: string;
    companyName: string;
    fees: {
      pix: ApiFeeData;
      card: ApiFeeData;
      boleto: ApiFeeData;
      crypto: ApiFeeData;
    };
  };
}

function RecivementsContent() {
  const { user, token } = useAuth();
  const [depositoValue, setDepositoValue] = useState("");
  const [showPixModal, setShowPixModal] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [totalDepositos, setTotalDepositos] = useState(0);
  const [quantidadeDepositos, setQuantidadeDepositos] = useState(0);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pixCode, setPixCode] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [pixFees, setPixFees] = useState<ApiFeeData>({
    percentualin: 0,
    fixoin: 0,
  });
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const periodOptions = [
    { label: "Hoje", days: 0 },
    { label: "Últimos 5 dias", days: 5 },
    { label: "Últimos 16 dias", days: 16 },
    { label: "Últimos 30 dias", days: 30 },
  ];
  const [selectedPeriod, setSelectedPeriod] = useState(periodOptions[0]);

  const valorBruto = parseFloat(depositoValue) || 0;
  const valorTaxaFixa = pixFees.fixoin || 0;
  const valorTaxaPercentual = valorBruto * ((pixFees.percentualin || 0) / 100);
  const valorTaxaTotal = valorTaxaFixa + valorTaxaPercentual;
  const valorLiquido = valorBruto - valorTaxaTotal;

  const fetchFees = async () => {
    if (!token) return;
    setIsLoadingFees(true);
    try {
      const { data } = await axios.get<FeesResponse>(
        "https://shadowpay-api-production.up.railway.app/api/user/fees",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) setPixFees(data.data.fees.pix);
    } catch (error) {
      console.error("Erro ao buscar taxas:", error);
    } finally {
      setIsLoadingFees(false);
    }
  };

  const getPeriodDates = (days: number) => {
    const now = new Date();
    let startISO: string;
    let endISO: string;

    if (days === 0) {
      startISO = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      ).toISOString();
      endISO = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
      ).toISOString();
    } else {
      startISO = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - (days - 1),
        0,
        0,
        0
      ).toISOString();
      endISO = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
      ).toISOString();
    }

    return { startISO, endISO };
  };

  const fetchDeposits = async (
    page: number = 1,
    startDateParam?: string,
    endDateParam?: string
  ) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (startDateParam) params.append("startDate", startDateParam);
      if (endDateParam) params.append("endDate", endDateParam);

      const response = await axios.get(
        `https://shadowpay-api-production.up.railway.app/api/user/deposits-report?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const apiData = response.data.data;
        setDeposits(apiData.deposits);
        setCurrentPage(apiData.pagination.currentPage);
        setTotalPages(apiData.pagination.totalPages);
        setTotalItems(apiData.pagination.totalCount);
      }
    } catch (error) {
      console.error("Erro ao buscar depósitos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTotalDepositsOfDay = async (start: string, end: string) => {
    if (!token) return;
    try {
      const params = new URLSearchParams({
        limit: "1000",
        startDate: start,
        endDate: end,
      });
      const response = await axios.get(
        `https://shadowpay-api-production.up.railway.app/api/user/deposits-report?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        const approvedDeposits = response.data.data.deposits.filter(
          (d: Deposit) => d.status.toLowerCase() === "approved"
        );
        const total = approvedDeposits.reduce(
          (sum: number, d: Deposit) => sum + Number(d.amountGross || 0),
          0
        );
        setTotalDepositos(total);
        setQuantidadeDepositos(approvedDeposits.length);
      }
    } catch (error) {
      console.error("Erro ao buscar total de depósitos do dia:", error);
    }
  };

  useEffect(() => {
    if (user && token && selectedPeriod) {
      // <- adiciona selectedPeriod aqui
      const { startISO, endISO } = getPeriodDates(selectedPeriod.days);
      setStartDate(startISO);
      setEndDate(endISO);
      fetchDeposits(1, startISO, endISO);
      fetchFees();
      fetchTotalDepositsOfDay(startISO, endISO);
    }
  }, [selectedPeriod, user, token]);

  useEffect(() => {
    if (!transactionId) return;
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/transactions/${transactionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.status === "approved") {
          toast.success("Depósito aprovado!");
          setShowPixModal(false);
          fetchDeposits(currentPage);
          clearInterval(interval);
        }
      } catch (e) {
        console.error(e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [transactionId, token, currentPage]);

  const handlePageChange = (page: number) => {
    fetchDeposits(page, startDate || undefined, endDate || undefined);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  const getMethodLabel = (method: string) =>
    ({ pix: "PIX", card: "Cartão", boleto: "Boleto" }[method] || method);
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const handleDeposito = async () => {
    if (valorBruto <= 0 || !token) return;
    setIsProcessingDeposit(true);
    try {
      const response = await axios.post(
        "https://shadowpay-api-production.up.railway.app/api/payments/internal/deposit",
        {
          amount: valorBruto,
          paymentMethod: "pix",
          metadata: { description: "Depósito interno" },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        const { pixQrCode, qrCode, code, transactionId } = response.data.data;
        setPixCode(pixQrCode || qrCode || code || "");
        setTransactionId(transactionId);
        setShowPixModal(true);
      } else {
        toast.error("Erro ao processar depósito: " + response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar depósito. Tente novamente.");
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast.success("Código PIX copiado!");
  };

  const closeModal = () => {
    setShowPixModal(false);
    setDepositoValue("");
    setPixCode("");
    setTransactionId("");
    if (user && token) fetchDeposits(currentPage);
  };

  return (
    <div className="min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-2 sm:px-4">
            <div className="flex items-center gap-2 px-2 sm:px-4">
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
                    <BreadcrumbPage>Recebimentos</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-6 p-4 pt-0 min-h-screen sm:p-6 md:p-8">
            {/* Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Card className="p-4 w-full sm:p-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-xl sm:text-2xl font-semibold">
                      Total Transacionado
                    </span>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl sm:text-3xl font-bold">
                        {formatCurrency(totalDepositos)}
                      </h3>
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        value={selectedPeriod ? selectedPeriod.days : 7} // ou outro valor padrão
                        onChange={(e) => {
                          const selected = periodOptions.find(
                            (opt) => opt.days === Number(e.target.value)
                          );
                          if (selected) setSelectedPeriod(selected);
                        }}
                      >
                        {periodOptions.map((option) => (
                          <option key={option.days} value={option.days}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {quantidadeDepositos} transações
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                      <span>Período Hoje</span>
                      <ArrowUpIcon className="w-4 h-4" />
                      <span>{((totalDepositos / 1000) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hidden sm:block">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-xl sm:text-2xl font-semibold">
                      Depositar Dinheiro
                    </span>
                    <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="valor-deposito">Valor do Depósito</Label>
                      <div className="relative">
                        <Input
                          id="valor-deposito"
                          type="number"
                          placeholder="0,00"
                          value={depositoValue}
                          onChange={(e) => setDepositoValue(e.target.value)}
                          className="w-full pr-20 sm:pr-32 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                        {valorBruto > 0 && !isLoadingFees && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                            = {formatCurrency(valorLiquido)}
                          </div>
                        )}
                      </div>
                      {valorBruto > 0 && !isLoadingFees && (
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Taxa fixa: {formatCurrency(valorTaxaFixa)} + Taxa
                            percentual: {(pixFees.percentualin || 0).toFixed(2)}
                            %
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Valor líquido que você receberá:{" "}
                            <span className="font-medium text-green-600">
                              {formatCurrency(valorLiquido)}
                            </span>
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Total a pagar:{" "}
                            <span className="font-medium">
                              {formatCurrency(valorBruto)}
                            </span>
                          </p>
                        </div>
                      )}
                      {isLoadingFees && (
                        <p className="text-xs text-muted-foreground animate-pulse">
                          Carregando taxas...
                        </p>
                      )}
                    </div>
                    <Button
                      className="w-full cursor-pointer"
                      onClick={handleDeposito}
                      disabled={
                        valorBruto <= 0 || isProcessingDeposit || isLoadingFees
                      }
                    >
                      {isProcessingDeposit
                        ? "Processando..."
                        : "Confirmar Depósito"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Histórico */}
            <Card className="min-w-[280px] max-w-[360px] w-full md:min-w-auto md:max-w-none">
              <CardHeader>
                <CardTitle>Histórico de Recebimentos PIX</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="hidden sm:table-cell">
                          Transação
                        </TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deposits.map((deposit) => (
                        <TableRow key={deposit.id}>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-foreground" />
                              <div>
                                <p className="font-medium">
                                  {deposit.description ||
                                    `Depósito via ${getMethodLabel(
                                      deposit.paymentMethod
                                    )}`}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Image
                                    src="/pix-icon.svg"
                                    width={16}
                                    height={16}
                                    className="brightness-0 invert"
                                    alt="Pix"
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    {getMethodLabel(deposit.paymentMethod)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(deposit.createdAt)}</TableCell>
                          <TableCell>
                            {getStatusBadge(deposit.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium text-foreground">
                              +{formatCurrency(deposit.amountGross)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex flex-col gap-3 mt-4 items-center sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        Mostrando {(currentPage - 1) * 10 + 1}-
                        {Math.min(currentPage * 10, totalItems)} de {totalItems}{" "}
                        recebimentos
                      </div>
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1 || isLoading}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="px-2 sm:px-3 cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">
                            Anterior
                          </span>
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from(
                            { length: Math.min(totalPages, 3) },
                            (_, i) => {
                              const pageNum =
                                Math.max(
                                  1,
                                  Math.min(currentPage - 1, totalPages - 2)
                                ) + i;
                              return (
                                <Button
                                  key={pageNum}
                                  variant={
                                    currentPage === pageNum
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  className="w-8 h-8 p-0 cursor-pointer"
                                  onClick={() => handlePageChange(pageNum)}
                                  disabled={isLoading}
                                >
                                  {pageNum}
                                </Button>
                              );
                            }
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages || isLoading}
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="px-2 sm:px-3 cursor-pointer"
                        >
                          <span className="hidden sm:inline mr-1">Próximo</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Modal PIX */}
      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="sm:max-w-md w-full px-4">
          <DialogHeader>
            <DialogTitle className="text-center">Pagamento PIX</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 text-center">
            <p className="text-sm text-muted-foreground">Valor do depósito</p>
            <p className="text-2xl font-bold">{formatCurrency(valorBruto)}</p>
            {pixCode && (
              <div className="flex justify-center my-4">
                <QRCodeSVG
                  value={pixCode}
                  size={200}
                  bgColor="#fff"
                  fgColor="#000"
                  level="Q"
                  includeMargin
                />
              </div>
            )}
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa fixa:</span>
                <span className="text-red-600">
                  -{formatCurrency(valorTaxaFixa)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Taxa percentual ({pixFees.percentualin.toFixed(2)}%):
                </span>
                <span className="text-red-600">
                  -{formatCurrency(valorTaxaPercentual)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm font-medium">
                <span>Total das taxas:</span>
                <span className="text-red-600">
                  -{formatCurrency(valorTaxaTotal)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm font-bold">
                <span>Valor líquido que você receberá:</span>
                <span className="text-green-600">
                  {formatCurrency(valorLiquido)}
                </span>
              </div>
            </div>

            <Label className="text-sm font-medium">
              Código PIX (Copiar e Colar)
            </Label>
            <div className="flex gap-2">
              <Input
                className="w-full text-sm sm:text-base"
                value={pixCode}
                readOnly
                placeholder="Código PIX será gerado..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyPixCode}
                disabled={!pixCode}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-center space-y-3 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <p className="font-medium">Aguardando pagamento...</p>
              <p>• Escaneie o QR Code ou copie o código PIX</p>
              <p>• Abra seu app de banco e faça o pagamento</p>
              <p>• O depósito será processado automaticamente</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={closeModal}
                className="flex-1 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button onClick={closeModal} className="flex-1 cursor-pointer">
                Já Paguei
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Recivements() {
  return (
    <ProtectedRoute>
      <RecivementsContent />
    </ProtectedRoute>
  );
}

import { AppSidebar } from "@/components/app-sidebar";
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
import Head from "next/head";
import { motion } from "framer-motion";
import ShadowPanel from "@/components/ShadowPanel";

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

const SHADOW_BG =
  "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const map: Record<string, { color: string; text: string }> = {
      approved: {
        color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        text: "APROVADO",
      },
      pending: {
        color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        text: "PENDENTE",
      },
      refunded: {
        color: "bg-white/10 text-white/60 border-white/15",
        text: "EXTORNADO",
      },
      rejected: {
        color: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        text: "REJEITADO",
      },
      cancelled: {
        color: "bg-white/10 text-white/50 border-white/15",
        text: "CANCELADO",
      },
    };
    const config = map[status.toLowerCase()] || {
      color: "bg-white/10 text-white/60 border-white/15",
      text: status.toUpperCase(),
    };
    return (
      <span
        className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${config.color}`}
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

  const selectCls =
    "rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-sm text-white outline-none focus:border-violet-500/50 [color-scheme:dark]";

  return (
    <>
      <Head>
        <title>ShadowPay — Recebimentos</title>
      </Head>

      <div className="min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="text-white" style={{ background: SHADOW_BG }}>
            {/* Header */}
            <header className="flex items-center gap-3 px-4 pt-6 lg:px-8">
              <SidebarTrigger className="text-white/60 hover:text-white" />
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight text-white md:text-[28px]"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  Recebimentos
                </h1>
                <p className="mt-1 text-xs text-white/40">
                  Receba via PIX e acompanhe seus depósitos
                </p>
              </div>
            </header>

            <main className="flex flex-col gap-5 p-4 lg:p-8">
              {/* Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Total transacionado */}
                <motion.div
                  initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                >
                  <div
                    className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl"
                    style={{ background: "#8B5CF622" }}
                  />
                  <div className="relative mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                        <Wallet className="h-4 w-4" />
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                        Total transacionado
                      </span>
                    </span>
                    <select
                      className={selectCls}
                      value={selectedPeriod ? selectedPeriod.days : 7}
                      onChange={(e) => {
                        const selected = periodOptions.find(
                          (opt) => opt.days === Number(e.target.value)
                        );
                        if (selected) setSelectedPeriod(selected);
                      }}
                    >
                      {periodOptions.map((option) => (
                        <option
                          key={option.days}
                          value={option.days}
                          className="bg-[#0B1020] text-white"
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    className="relative text-3xl font-semibold tracking-tight text-white"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    {formatCurrency(totalDepositos)}
                  </div>
                  <p className="relative mt-1.5 text-xs text-white/35">
                    {quantidadeDepositos} transações aprovadas no período
                  </p>
                  <div className="relative mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                    <span>{((totalDepositos / 1000) * 100).toFixed(1)}%</span>
                  </div>
                </motion.div>

                {/* Depositar */}
                <motion.div
                  initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                >
                  <div className="mb-4 flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                      <ArrowDownToLine className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                      Depositar dinheiro
                    </span>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs text-white/50">
                      Valor do depósito
                    </label>
                    <div className="relative">
                      <input
                        id="valor-deposito"
                        type="number"
                        placeholder="0,00"
                        value={depositoValue}
                        onChange={(e) => setDepositoValue(e.target.value)}
                        className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 pr-28 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/[0.05] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      {valorBruto > 0 && !isLoadingFees && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/50">
                          = {formatCurrency(valorLiquido)}
                        </div>
                      )}
                    </div>
                    {valorBruto > 0 && !isLoadingFees && (
                      <div className="space-y-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-white/50">
                        <p>
                          Taxa fixa: {formatCurrency(valorTaxaFixa)} + percentual:{" "}
                          {(pixFees.percentualin || 0).toFixed(2)}%
                        </p>
                        <p>
                          Você receberá:{" "}
                          <span className="font-medium text-emerald-400">
                            {formatCurrency(valorLiquido)}
                          </span>
                        </p>
                        <p>
                          Total a pagar:{" "}
                          <span className="font-medium text-white/80">
                            {formatCurrency(valorBruto)}
                          </span>
                        </p>
                      </div>
                    )}
                    {isLoadingFees && (
                      <p className="animate-pulse text-xs text-white/40">
                        Carregando taxas...
                      </p>
                    )}
                    <button
                      onClick={handleDeposito}
                      disabled={
                        valorBruto <= 0 || isProcessingDeposit || isLoadingFees
                      }
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                      style={{
                        background: "linear-gradient(120deg, #7C3AED, #6366F1)",
                        boxShadow: "0 14px 36px -14px rgba(124,58,237,0.7)",
                      }}
                    >
                      {isProcessingDeposit
                        ? "Processando..."
                        : "Confirmar Depósito"}
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Histórico */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl"
              >
                <div className="border-b border-white/[0.06] px-5 py-4">
                  <h2
                    className="text-sm font-semibold text-white"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Histórico de Recebimentos PIX
                  </h2>
                </div>
                <div className="overflow-x-auto p-2 sm:p-4">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-white/40">
                        <th className="hidden px-3 py-2 font-medium sm:table-cell">
                          Transação
                        </th>
                        <th className="px-3 py-2 font-medium">Data</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 text-right font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center">
                            <Wallet className="mx-auto mb-3 h-6 w-6 text-violet-400/40" />
                            <p className="text-sm font-medium text-white/60">
                              Nenhum recebimento no período
                            </p>
                            <p className="mt-1 text-xs text-white/35">
                              Seus depósitos PIX aparecem aqui.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        deposits.map((deposit) => (
                          <tr
                            key={deposit.id}
                            className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.03]"
                          >
                            <td className="hidden px-3 py-3 sm:table-cell">
                              <div className="flex items-center gap-3">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15">
                                  <Image
                                    src="/pix-icon.svg"
                                    width={14}
                                    height={14}
                                    className="opacity-80 brightness-0 invert"
                                    alt="Pix"
                                  />
                                </span>
                                <div>
                                  <p className="font-medium text-white/90">
                                    {deposit.description ||
                                      `Depósito via ${getMethodLabel(
                                        deposit.paymentMethod
                                      )}`}
                                  </p>
                                  <span className="text-xs text-white/40">
                                    {getMethodLabel(deposit.paymentMethod)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-white/50">
                              {formatDate(deposit.createdAt)}
                            </td>
                            <td className="px-3 py-3">
                              {getStatusBadge(deposit.status)}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-emerald-400">
                              +{formatCurrency(deposit.amountGross)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex flex-col gap-3 border-t border-white/[0.06] px-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-center text-xs text-white/40 sm:text-left">
                        Mostrando {(currentPage - 1) * 10 + 1}-
                        {Math.min(currentPage * 10, totalItems)} de {totalItems}{" "}
                        recebimentos
                      </div>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          disabled={currentPage === 1 || isLoading}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:bg-white/[0.07] disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        {Array.from(
                          { length: Math.min(totalPages, 3) },
                          (_, i) => {
                            const pageNum =
                              Math.max(
                                1,
                                Math.min(currentPage - 1, totalPages - 2)
                              ) + i;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                disabled={isLoading}
                                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors ${
                                  currentPage === pageNum
                                    ? "bg-violet-500/20 text-violet-200"
                                    : "border border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.07]"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}
                        <button
                          disabled={currentPage === totalPages || isLoading}
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:bg-white/[0.07] disabled:opacity-40"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </main>
          </SidebarInset>
        </SidebarProvider>

        {/* Modal PIX */}
        <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
          <DialogContent className="w-full px-4 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Pagamento PIX</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 text-center">
              <p className="text-sm text-white/50">Valor do depósito</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(valorBruto)}
              </p>
              {pixCode && (
                <div className="my-4 flex justify-center">
                  <div className="rounded-2xl bg-white p-3">
                    <QRCodeSVG
                      value={pixCode}
                      size={200}
                      bgColor="#fff"
                      fgColor="#000"
                      level="Q"
                      includeMargin
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Taxa fixa:</span>
                  <span className="text-rose-400">
                    -{formatCurrency(valorTaxaFixa)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">
                    Taxa percentual ({pixFees.percentualin.toFixed(2)}%):
                  </span>
                  <span className="text-rose-400">
                    -{formatCurrency(valorTaxaPercentual)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/[0.08] pt-2 text-sm font-medium">
                  <span className="text-white/70">Total das taxas:</span>
                  <span className="text-rose-400">
                    -{formatCurrency(valorTaxaTotal)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/[0.08] pt-2 text-sm font-bold">
                  <span className="text-white/80">Você receberá:</span>
                  <span className="text-emerald-400">
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

              <div className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-xs text-white/50">
                <p className="font-medium text-white/70">Aguardando pagamento...</p>
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
        <ShadowPanel />
      </div>
    </>
  );
}

export default function Recivements() {
  return (
    <ProtectedRoute>
      <RecivementsContent />
    </ProtectedRoute>
  );
}

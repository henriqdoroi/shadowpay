import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
  RefreshCw,
  ArrowUp,
  Wallet,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  Key,
  Eye,
  EyeOff,
  Lock,
  Receipt,
  Hash,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";
import Head from "next/head";
import { motion } from "framer-motion";
import ShadowPanel from "@/components/ShadowPanel";

interface Withdraw {
  id: string;
  paymentMethod: "pix" | "card" | "boleto";
  status: "pending" | "approved" | "rejected" | "cancelled";
  amountGross: number;
  amountNet: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
  };
}
interface ApiFeeData {
  percentual: number;
  txCashOut: number;
  fixo: number;
}

interface FeesResponse {
  success: boolean;
  data: {
    sellerId: string;
    companyName: string;
    adquerer: {
      txCashOut: number;
      txCashIn?: number;
    } | null;
    fees: {
      pix: ApiFeeData;
      boleto?: ApiFeeData;
      card?: ApiFeeData;
    };
  };
}

interface Acquirer {
  id: string;
  reference: string;
  url: string;
  txCashIn: number;
  txCashOut: number;
}

const SHADOW_BG =
  "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

function WithdrawContent() {
  const { user, token } = useAuth();
  const [saqueValue, setSaqueValue] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [blockedBalance, setBlockedBalance] = useState(0);
  const [totalSaques, setTotalSaques] = useState(0);
  const [quantidadeSaques, setQuantidadeSaques] = useState(0);
  const [withdraws, setWithdraws] = useState<Withdraw[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [withdrawPixFees, setWithdrawPixFees] = useState<ApiFeeData>({
    percentual: 0,
    txCashOut: 0,
    fixo: 0,
  });
  const [sellerFees, setSellerFees] = useState<ApiFeeData>({
    percentual: 0,
    txCashOut: 0,
    fixo: 0,
  });
  const [acquirerFees, setAcquirerFees] = useState<ApiFeeData>({
    percentual: 0,
    txCashOut: 0,
    fixo: 0,
  });
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [, setIs2FAValid] = useState(false);
  const [localUser, setLocalUser] = useState<{
    twofaEnabled?: boolean;
    twofaConfirmed?: boolean;
    [key: string]: any;
  }>({});

  const [acquirers] = useState<Acquirer[]>([]);
  const acquiredTxCashOut = acquirers[0]?.txCashOut ?? 0;
  const valorSaque = parseFloat(saqueValue.replace(",", ".")) || 0;
  const itemsPerPage = 4;
  const [isValuesVisible, setIsValuesVisible] = useState(true);
  // Soma percentual: seller + acquirer
  const totalPercentual =
    (sellerFees.percentual || 0) + (acquirerFees.percentual || 0);

  // Soma fixa: seller + acquirer
  const totalFixa =
    (sellerFees.fixo || 0) +
    (acquirerFees.txCashOut || 0) +
    (acquirerFees.fixo || 0);

  // Calcula valores das taxas
  const valorTaxaPercentual = valorSaque * (totalPercentual / 100);
  const valorTaxaFixa = totalFixa;

  // Total taxas e valor líquido
  const valorTaxaTotal = valorTaxaPercentual + valorTaxaFixa;
  const valorLiquido = valorSaque - valorTaxaTotal;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) throw new Error("Token não encontrado");
        if (!user?.id) throw new Error("Usuário não identificado");

        const response = await axios.get<FeesResponse>(
          "https://shadowpay-api-production.up.railway.app/api/user/fees",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.data.success) throw new Error("Erro ao buscar taxas");

        const { adquerer, fees } = response.data.data;

        const sellerPixFee = fees.pix || { percentual: 0, txCashOut: 0 };
        setSellerFees({
          percentual: Number(sellerPixFee.percentual ?? 0),
          txCashOut: Number(sellerPixFee.txCashOut ?? 0),
          fixo: Number(sellerPixFee.fixo ?? 0),
        });

        setAcquirerFees({
          percentual: 0,
          txCashOut: Number(adquerer?.txCashOut ?? 0),
          fixo: 0,
        });
      } catch (error) {
        toast.error("Erro ao buscar dados do seller e taxas");
        console.error(error);
      }
    };

    if (user && token) {
      fetchData();
    }
  }, [user, token]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (show2FAModal && !is2FALoading) {
          confirm2FA();
        } else if (showWithdrawModal && !isProcessingWithdraw) {
          confirmarSaque();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    show2FAModal,
    showWithdrawModal,
    twoFACode,
    pixKey,
    saqueValue,
    isProcessingWithdraw,
    is2FALoading,
  ]);

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
          console.error("Erro ao buscar perfil do usuário:", err);
        }
      })();
    }
  }, [token]);

  const fetchFees = async () => {
    if (!token) return;

    try {
      const response = await axios.get<FeesResponse>(
        "https://shadowpay-api-production.up.railway.app/api/user/fees",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const { fees } = response.data.data;

        const pixFee = fees.pix || {
          percentual: 0,
          fixo: 0,
        };

        setWithdrawPixFees({
          percentual: Number(pixFee.percentual ?? 0),
          txCashOut: Number(acquiredTxCashOut ?? 0),
          fixo: 0,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar taxas de saque:", error);
    }
  };

  const fetchWithdraws = async (page: number = 1) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      const response = await axios.get(
        `https://shadowpay-api-production.up.railway.app/api/user/withdraws-report?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const apiData = response.data.data;
        setCurrentBalance(apiData.wallet.currentBalance);
        setBlockedBalance(apiData.wallet.blockedBalance);
        setTotalSaques(apiData.summary.totalSaques);
        setQuantidadeSaques(apiData.summary.quantidadeSaques);
        setWithdraws(apiData.withdraws);
        setCurrentPage(apiData.pagination.currentPage);
        setTotalPages(apiData.pagination.totalPages);
        setTotalItems(apiData.pagination.totalCount);
      }
    } catch (error) {
      console.error("Erro ao buscar saques:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchWithdraws(1);
      fetchFees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const handlePageChange = (page: number) => {
    fetchWithdraws(page);
  };
  const handleRefreshTransactions = () => {
    fetchWithdraws(currentPage);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
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

  type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE";

  const detectPixKeyType = (key: string): PixKeyType | "invalid" => {
    if (!key || key.trim() === "") return "invalid";

    const cleaned = key.replace(/\D/g, "");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(?:\+?55)?\d{10,11}$/;

    if (cleaned.length === 11 && validateCPF(cleaned)) return "CPF";
    if (cleaned.length === 14 && validateCNPJ(cleaned)) return "CNPJ";
    if (emailRegex.test(key)) return "EMAIL";
    if (phoneRegex.test(cleaned)) return "PHONE";

    return "invalid";
  };

  function validateCPF(cpf: string): boolean {
    if (!/^\d{11}$/.test(cpf)) return false;
    let sum = 0;
    let rest: number;
    for (let i = 1; i <= 9; i++)
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++)
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    return rest === parseInt(cpf.substring(10, 11));
  }

  function validateCNPJ(cnpj: string): boolean {
    if (!/^\d{14}$/.test(cnpj)) return false;
    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    const digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;
    length += 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1));
  }

  const confirm2FA = async () => {
    if (!twoFACode.trim()) {
      toast.error("Código 2FA vazio");
      return;
    }

    if (!token) {
      toast.error("Token não encontrado. Faça login novamente.");
      return;
    }

    setIs2FALoading(true);

    try {
      const res = await fetch(
        "https://shadowpay-api-production.up.railway.app/api/pages/2fa/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token: twoFACode }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setIs2FAValid(true);
        setShow2FAModal(false);
        toast.success("Código 2FA confirmado com sucesso!");
        setShowWithdrawModal(true);
      } else {
        setIs2FAValid(false);
        toast.error(data.message || "Código 2FA inválido!");
      }
    } catch (err) {
      console.error("Erro ao verificar 2FA:", err);
      toast.error("Erro ao verificar 2FA");
    } finally {
      setIs2FALoading(false);
      setTwoFACode("");
    }
  };

  const handleSaque = () => {
    if (!localUser.twofaEnabled) {
      alert("Ative a autenticação de dois fatores antes de sacar.");
      return;
    }

    setShow2FAModal(true);
  };

  const confirmarSaque = async () => {
    if (!pixKey.trim() || valorSaque <= 0) return;

    const pixKeyType = detectPixKeyType(pixKey);
    if (pixKeyType === "invalid") {
      toast.error("Chave PIX inválida. Use email, telefone ou CPF.");
      return;
    }

    setIsProcessingWithdraw(true);
    try {
      const response = await axios.post(
        "https://shadowpay-api-production.up.railway.app/api/payments/internal/withdraw",
        {
          amount: valorSaque,
          pixKey: pixKey.trim(),
          pixKeyType: pixKeyType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const { data } = response.data;

        toast.success("Saque processado com sucesso!", {
          description: `ID: ${data.transactionId} • Status: ${
            data.status
          } • Valor Líquido: R$ ${parseFloat(data.amountNet).toFixed(2)}`,
        });

        try {
          await axios.post(
            "https://shadowpay-api-production.up.railway.app/api/webhooks/notifications/send",
            {
              title: "Saque aprovado",
              body: `Seu saque de R$ ${parseFloat(data.amountNet).toFixed(
                2
              )} foi aprovado e está sendo processado.`,
              url: "/v1/withdraws",
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
        } catch (notifError) {
          console.error("Erro ao enviar notificação de saque:", notifError);
        }

        closeModal();
        fetchWithdraws(currentPage);
      } else {
        toast.error("Erro ao processar saque", {
          description: response.data.message || "Erro desconhecido",
        });
      }
    } catch (error: any) {
      console.error("Erro ao processar saque:", error);
      toast.error("Erro ao processar saque", {
        description: error.response?.data?.message || "Erro de conexão",
      });
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  const closeModal = () => {
    setShowWithdrawModal(false);
    setSaqueValue("");
    setPixKey("");
  };
  const valorSaqueNum = Math.round(valorSaque * 100) / 100;

  const kpis = [
    {
      label: "Saldo disponível",
      value: isValuesVisible ? formatCurrency(currentBalance) : "••••••",
      icon: <Wallet className="h-4 w-4" />,
      accent: "#8B5CF6",
    },
    {
      label: "Saldo bloqueado",
      value: isValuesVisible ? formatCurrency(blockedBalance) : "••••••",
      icon: <Lock className="h-4 w-4" />,
      accent: "#F59E0B",
    },
    {
      label: "Total sacado",
      value: isValuesVisible ? formatCurrency(totalSaques) : "••••••",
      icon: <Receipt className="h-4 w-4" />,
      accent: "#22D3EE",
    },
    {
      label: "Qtd. saques",
      value: String(quantidadeSaques),
      icon: <Hash className="h-4 w-4" />,
      accent: "#34D399",
    },
  ];

  return (
    <>
      <Head>
        <title>ShadowPay — Saídas</title>
      </Head>

      <div className="min-h-screen">
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
                    Saídas
                  </h1>
                  <p className="mt-1 text-xs text-white/40">
                    Saque seu saldo via PIX com 2FA obrigatório
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsValuesVisible((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white"
                  aria-label="Alternar valores"
                >
                  {isValuesVisible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={handleRefreshTransactions}
                  disabled={isLoading}
                  className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  {isLoading ? "Atualizando…" : "Atualizar"}
                </button>
              </div>
            </header>

            <main className="flex flex-col gap-5 p-4 lg:p-8">
              {/* KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((k, i) => (
                  <motion.div
                    key={k.label}
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
                      {k.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Card de Saque */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
              >
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl"
                  style={{ background: "rgba(139,92,246,0.18)" }}
                />
                <div className="relative mb-4 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                    <ArrowUpFromLine className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                    Sacar dinheiro
                  </span>
                </div>

                <div className="relative space-y-3">
                  <label className="block text-xs text-white/50">
                    Valor do saque
                  </label>
                  <div className="relative">
                    <input
                      id="valor-saque"
                      type="tel"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={saqueValue}
                      onChange={(e) => setSaqueValue(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 pr-32 text-base text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/[0.05]"
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          valorSaqueNum > 0 &&
                          valorSaqueNum <= currentBalance
                        ) {
                          e.preventDefault();
                          handleSaque();
                        }
                      }}
                    />
                    {valorSaque > 0 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/50">
                        = {formatCurrency(valorLiquido)}
                      </div>
                    )}
                  </div>

                  {valorSaque > 0 && (
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-white/55">
                      <p>
                        Taxa fixa: {formatCurrency(valorTaxaFixa)} + percentual:{" "}
                        {totalPercentual.toFixed(2)}%
                      </p>
                      <p>
                        Valor líquido:{" "}
                        <span className="font-medium text-emerald-400">
                          {formatCurrency(valorLiquido)}
                        </span>
                      </p>
                    </div>
                  )}
                  {valorSaqueNum > currentBalance && (
                    <p className="text-xs font-medium text-rose-300">
                      Valor excede o saldo disponível
                    </p>
                  )}

                  <button
                    onClick={handleSaque}
                    disabled={
                      valorSaqueNum <= 0 || valorSaqueNum > currentBalance
                    }
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    style={{
                      background: "linear-gradient(120deg, #7C3AED, #6366F1)",
                      boxShadow: "0 14px 36px -14px rgba(124,58,237,0.7)",
                    }}
                  >
                    Continuar saque
                  </button>
                </div>
              </motion.div>

              {/* Histórico de saques */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                  <h2
                    className="text-sm font-semibold text-white"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Histórico de saques
                  </h2>
                  <span className="text-xs text-white/40">
                    {totalItems} {totalItems === 1 ? "saque" : "saques"}
                  </span>
                </div>
                <div className="overflow-x-auto p-2 sm:p-4">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-white/40">
                        <th className="px-3 py-2 font-medium">Data</th>
                        <th className="px-3 py-2 font-medium">Tipo</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 text-right font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <tr
                            key={i}
                            className="animate-pulse border-t border-white/[0.05]"
                          >
                            <td className="px-3 py-3">
                              <div className="h-4 w-28 rounded bg-white/10" />
                            </td>
                            <td className="px-3 py-3">
                              <div className="h-4 w-10 rounded bg-white/10" />
                            </td>
                            <td className="px-3 py-3">
                              <div className="h-6 w-16 rounded-full bg-white/10" />
                            </td>
                            <td className="px-3 py-3 text-right">
                              <div className="ml-auto h-4 w-20 rounded bg-white/10" />
                            </td>
                          </tr>
                        ))
                      ) : withdraws.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-14 text-center">
                            <ArrowUpFromLine className="mx-auto mb-3 h-6 w-6 text-violet-400/40" />
                            <p className="text-sm font-medium text-white/60">
                              Nenhum saque ainda
                            </p>
                            <p className="mt-1 text-xs text-white/35">
                              Seus saques aparecem aqui em tempo real.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        withdraws.slice(0, itemsPerPage).map((withdraw) => (
                          <tr
                            key={withdraw.id}
                            className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.03]"
                          >
                            <td className="px-3 py-3 text-white/60">
                              {formatDate(withdraw.createdAt)}
                            </td>
                            <td className="px-3 py-3">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-300">
                                <ArrowUp className="h-3.5 w-3.5" />
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {getStatusBadge(withdraw.status)}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-white/90">
                              {isValuesVisible
                                ? formatCurrency(withdraw.amountGross)
                                : "••••••"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="mt-3 flex flex-col gap-3 border-t border-white/[0.06] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-center text-xs text-white/40 sm:text-left">
                        Página {currentPage} de {totalPages}
                      </span>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          disabled={currentPage === 1 || isLoading}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:bg-white/[0.07] disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
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

        {/* Modal 2FA */}
        <Dialog open={show2FAModal} onOpenChange={setShow2FAModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Verificação 2FA</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-center text-sm text-white/50">
                Digite o código gerado pelo seu aplicativo de autenticação
              </p>

              <div className="flex justify-center gap-2">
                {[...Array(6)].map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="h-12 w-12 rounded-md border border-white/[0.08] bg-white/[0.03] text-center text-xl text-white outline-none transition-colors focus:border-violet-500/50 focus:bg-white/[0.05]"
                    value={twoFACode[i] || ""}
                    disabled={is2FALoading}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const newCode = twoFACode.split("");
                      newCode[i] = val || "";
                      setTwoFACode(newCode.join(""));
                      if (val && i < 5) {
                        const nextInput = document.getElementById(
                          `code-${i + 1}`
                        );
                        if (nextInput) (nextInput as HTMLInputElement).focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !twoFACode[i] && i > 0) {
                        const prevInput = document.getElementById(
                          `code-${i - 1}`
                        );
                        if (prevInput) (prevInput as HTMLInputElement).focus();
                      }
                    }}
                    id={`code-${i}`}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => setShow2FAModal(false)}
                  disabled={is2FALoading}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 cursor-pointer"
                  onClick={confirm2FA}
                  disabled={twoFACode.length !== 6 || is2FALoading}
                >
                  {is2FALoading ? "Validando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Saque */}
        <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Confirmar saque</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
                <p className="text-sm text-white/50">Valor do saque</p>
                <p
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  {formatCurrency(valorSaque)}
                </p>
                <div className="space-y-1 text-xs text-white/50">
                  <p>
                    Taxa: {formatCurrency(valorTaxaTotal)} (
                    {withdrawPixFees.percentual.toFixed(2)}%)
                  </p>
                  <p className="font-medium text-emerald-400">
                    Valor líquido: {formatCurrency(valorLiquido)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Key className="h-4 w-4" />
                  Chave PIX de destino
                </Label>
                <Input
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Digite sua chave PIX (CPF, e-mail, telefone ou CNPJ)"
                  className="text-sm"
                  disabled={isProcessingWithdraw}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      pixKey.trim() &&
                      detectPixKeyType(pixKey) !== "invalid"
                    ) {
                      e.preventDefault();
                      confirmarSaque();
                    }
                  }}
                />
                <p className="text-xs text-white/40">
                  Aceitamos chaves PIX do tipo: CPF, CNPJ, e-mail ou telefone
                </p>
                {!pixKey.trim() && !isProcessingWithdraw && (
                  <p className="text-xs text-rose-300">Chave PIX obrigatória</p>
                )}
                {pixKey.trim() && detectPixKeyType(pixKey) === "invalid" && (
                  <p className="text-xs text-rose-300">
                    Formato de chave PIX inválido
                  </p>
                )}
              </div>

              <div className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-xs text-white/50">
                <p className="font-medium text-white/70">Informações importantes</p>
                <p>• O saque será processado em até 1 hora útil</p>
                <p>• Verifique se a chave PIX está correta</p>
                <p>• Não é possível cancelar após a confirmação</p>
                <p>
                  • Taxa de {withdrawPixFees.percentual.toFixed(2)}% será descontada
                  do valor
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={closeModal}
                  disabled={isProcessingWithdraw}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 cursor-pointer"
                  onClick={confirmarSaque}
                  disabled={
                    !pixKey.trim() ||
                    detectPixKeyType(pixKey) === "invalid" ||
                    isProcessingWithdraw
                  }
                >
                  {isProcessingWithdraw ? "Processando..." : "Confirmar saque"}
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

export default function Withdraw() {
  return (
    <ProtectedRoute>
      <WithdrawContent />
    </ProtectedRoute>
  );
}

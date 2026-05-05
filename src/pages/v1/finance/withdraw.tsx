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
import { validate } from "@napunda/pix-key-ts";
import { useRef } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
  RefreshCw,
  ArrowUp,
  Wallet,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  Key,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";

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
interface Seller {
  id: string;
  companyName: string;
  email: string;
  cpf_cnpj?: string;
  saldo?: string;
  adquererId?: string;
  kycStatus: "PENDING" | "APPROVED" | "BANNED" | "NOT_STARTED";
  createdAt: string;
  suspendedAt: string | null;
  number: string;
  _count: {
    transactions: number;
    products: number;
  };
  wallet: {
    balance: string;
    isBlocked: boolean;
  }[];
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
      // outros campos do adquirente se precisar
    } | null;
    fees: {
      pix: ApiFeeData;
      boleto?: ApiFeeData;
      card?: ApiFeeData;
    };
  };
}
type PixKeyType = "CPF" | "CNPJ" | "PHONE" | "EMAIL";

interface Acquirer {
  id: string;
  reference: string;
  url: string;
  txCashIn: number; // taxa cash-in do adquirente
  txCashOut: number; // taxa cash-out do adquirente
  // ... outras propriedades
}

interface AcquirersResponse {
  success: boolean;
  data: Acquirer[];
}

interface WithdrawsResponse {
  wallet: {
    currentBalance: number;
    blockedBalance: number;
  };
  summary: {
    totalSaques: number;
    quantidadeSaques: number;
  };
  withdraws: Withdraw[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    status: string | null;
    paymentMethod: string | null;
    startDate: string | null;
    endDate: string | null;
    search: string | null;
  };
}

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
  const [is2FAValid, setIs2FAValid] = useState(false);
  const [localUser, setLocalUser] = useState<{
    twofaEnabled?: boolean;
    twofaConfirmed?: boolean;
    [key: string]: any;
  }>({});

  const [acquirers, setAcquirers] = useState<Acquirer[]>([]);
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
          "https://shadowpay-production-2ca8.up.railway.app/api/user/fees",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.data.success) throw new Error("Erro ao buscar taxas");

        const { adquerer, fees } = response.data.data;

        // Seller fees (fixa e percentual) - do objeto fees (pix, boleto, card)
        const sellerPixFee = fees.pix || { percentual: 0, txCashOut: 0 };
        setSellerFees({
          percentual: Number(sellerPixFee.percentual ?? 0),
          txCashOut: Number(sellerPixFee.txCashOut ?? 0),
          fixo: Number(sellerPixFee.fixo ?? 0), // <== pega o fixo real do seller
        });

        // Acquirer fees (fixa e percentual)
        setAcquirerFees({
          percentual: 0, // Remove reference to non-existent property
          txCashOut: Number(adquerer?.txCashOut ?? 0),
          fixo: 0, // Add default value for 'fixo'
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
        e.preventDefault(); // evita comportamento padrão de form
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
            "https://shadowpay-production-2ca8.up.railway.app/api/user/profile",
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
        "https://shadowpay-production-2ca8.up.railway.app/api/user/fees",
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
          percentualin: 0,
          fixoin: 0,
        };

        setWithdrawPixFees({
          percentual: Number(pixFee.percentual ?? 0),
          txCashOut: Number(acquiredTxCashOut ?? 0), // pega do adquirente aqui
          fixo: 0, // Add default value for 'fixo'
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
        `https://shadowpay-production-2ca8.up.railway.app/api/user/withdraws-report?${params.toString()}`,
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
      fetchFees(); // <- aqui
    }
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
    }).format(value);
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

  const getMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      pix: "PIX",
      card: "Cartão",
      boleto: "Boleto",
    };
    return methodMap[method] || method;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      approved: {
        color: "bg-green-100 text-green-800",
        text: "APROVADO",
      },
      pending: {
        color: "bg-orange-100 text-orange-800",
        text: "PENDENTE",
      },
      refunded: {
        color: "bg-gray-200 text-gray-800",
        text: "EXTORNADO",
      },
      rejected: {
        color: "bg-red-100 text-red-800",
        text: "REJEITADO",
      },
      cancelled: {
        color: "bg-gray-100 text-gray-800",
        text: "CANCELADO",
      },
    };

    const config = statusConfig[status.toLowerCase()];

    if (!config) {
      return (
        <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
          {status.toUpperCase()}
        </span>
      );
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };
  const pixTypeMap: Record<string, PixKeyType> = {
    cpf: "CPF",
    cnpj: "CNPJ",
    phone: "PHONE",
    email: "EMAIL",
  };

  type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE";

  const detectPixKeyType = (key: string): PixKeyType | "invalid" => {
    if (!key || key.trim() === "") return "invalid";

    const cleaned = key.replace(/\D/g, ""); // remove tudo que não é número
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(?:\+?55)?\d{10,11}$/; // DDD + número 8 ou 9 dígitos

    // CPF válido: 11 dígitos
    if (cleaned.length === 11 && validateCPF(cleaned)) return "CPF";

    // CNPJ válido: 14 dígitos
    if (cleaned.length === 14 && validateCNPJ(cleaned)) return "CNPJ";

    // E-mail
    if (emailRegex.test(key)) return "EMAIL";

    // Telefone
    if (phoneRegex.test(cleaned)) return "PHONE";

    return "invalid";
  };

  // Validação de CPF
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

  // Validação de CNPJ
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
      const res = await fetch("https://shadowpay-production-2ca8.up.railway.app/api/pages/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: twoFACode }),
      });

      const data = await res.json();

      if (data.success) {
        setIs2FAValid(true);
        setShow2FAModal(false);

        // Toast de sucesso
        toast.success("Código 2FA confirmado com sucesso!");

        // Abre o modal de saque
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
      setTwoFACode(""); // limpa o código 2FA após tentativa
    }
  };

  const handleSaque = () => {
    if (!localUser.twofaEnabled) {
      alert("Ative a autenticação de dois fatores antes de sacar.");
      return;
    }

    setShow2FAModal(true); // abre modal pedindo código
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
        "https://shadowpay-production-2ca8.up.railway.app/api/payments/internal/withdraw",
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

        // Enviar notificação push para saque
        try {
          await axios.post(
            "https://shadowpay-production-2ca8.up.railway.app/api/webhooks/notifications/send", // Ajuste a rota correta para enviar notificação saque
            {
              title: "Saque aprovado",
              body: `Seu saque de R$ ${parseFloat(data.amountNet).toFixed(
                2
              )} foi aprovado e está sendo processado.`,
              url: "/v1/withdraws", // link para histórico de saques ou página relevante
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
        // Atualizar a lista de saques
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
                    <BreadcrumbPage>Saídas</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-6 p-4 pt-0 min-h-screen sm:p-6 md:p-8">
            {/* Cards Principais */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {/* Saque com saldo integrado - apenas mobile */}
              <Card className="relative p-6 min-w-[280px] max-w-[360px] w-full md:min-w-auto md:max-w-none">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Sacar Dinheiro
                    <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Saldo integrado no card do input */}
                  <p className="text-sm text-muted-foreground mb-2 md:hidden">
                    Saldo disponível:{" "}
                    <span className="font-medium">
                      {formatCurrency(currentBalance)}
                    </span>
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="valor-saque">Valor do Saque</Label>
                      <div className="relative">
                        <Input
                          id="valor-saque"
                          type="tel"
                          inputMode="numeric"
                          step="0.01"
                          placeholder="0,00"
                          value={saqueValue}
                          onChange={(e) => setSaqueValue(e.target.value)}
                          className="w-full pr-20 sm:pr-32 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              valorSaqueNum > 0 &&
                              valorSaqueNum <= currentBalance
                            ) {
                              e.preventDefault();
                              handleSaque(); // abre modal de 2FA
                            }
                          }}
                        />
                        {valorSaque > 0 && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                            = {formatCurrency(valorLiquido)}
                          </div>
                        )}
                      </div>

                      {valorSaque > 0 && (
                        <p className="text-xs sm:text-sm">
                          Taxa fixa total: {formatCurrency(valorTaxaFixa)} +
                          Taxa percentual: {totalPercentual.toFixed(2)}%
                          <br />
                          Valor líquido:{" "}
                          <span className="font-medium text-green-600">
                            {formatCurrency(valorLiquido)}
                          </span>
                        </p>
                      )}
                      {valorSaqueNum > currentBalance && (
                        <p className="text-xs text-destructive">
                          Valor excede o saldo disponível
                        </p>
                      )}
                    </div>

                    <Button
                      className="w-full cursor-pointer"
                      onClick={handleSaque}
                      disabled={
                        valorSaqueNum <= 0 || valorSaqueNum > currentBalance
                      }
                    >
                      Continuar Saque
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Saques */}
            <Card className="p-4 w-full max-w-full shadow-md rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-1">
                <CardTitle className="text-base font-semibold">
                  Histórico de Saques
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshTransactions}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                  {isLoading ? "Atualizando..." : "Atualizar"}
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
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <tr key={index} className="animate-pulse border-b">
                          <td className="p-2 h-4 bg-gray-200 rounded w-24"></td>
                          <td className="p-2 h-4 bg-gray-200 rounded w-16"></td>
                          <td className="p-2 h-4 bg-gray-200 rounded w-16 mx-auto"></td>
                          <td className="p-2 h-4 bg-gray-200 rounded w-20 ml-auto"></td>
                        </tr>
                      ))
                    ) : withdraws.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-4 text-muted-foreground"
                        >
                          Nenhum saque encontrado
                        </td>
                      </tr>
                    ) : (
                      withdraws.slice(0, itemsPerPage).map((withdraw) => (
                        <tr key={withdraw.id} className="border-b">
                          <td className="p-2 break-words whitespace-normal">
                            {formatDate(withdraw.createdAt)}
                          </td>
                          <td className="p-2 flex items-center justify-center break-words whitespace-normal">
                            <ArrowUp className="w-4 h-4 text-red-500" />
                          </td>
                          <td className="p-2 text-center break-words whitespace-normal">
                            {getStatusBadge(withdraw.status)}
                          </td>
                          <td className="p-2 text-right font-medium break-words whitespace-normal">
                            {isValuesVisible
                              ? `${formatCurrency(withdraw.amountGross)}`
                              : "••••••"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Paginação mobile */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1 || isLoading}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="cursor-pointer h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium self-center">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || isLoading}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="cursor-pointer h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Dialog open={show2FAModal} onOpenChange={setShow2FAModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Verificação 2FA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Digite o código gerado pelo seu aplicativo de autenticação
            </p>

            {/* Inputs 2FA */}
            <div className="flex justify-center gap-2">
              {[...Array(6)].map((_, i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="w-12 h-12 text-center text-xl border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={twoFACode[i] || ""}
                  disabled={is2FALoading}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ""); // só número
                    const newCode = twoFACode.split("");

                    // Atualiza ou limpa a posição atual
                    newCode[i] = val || "";
                    setTwoFACode(newCode.join(""));

                    // Se digitou número válido, move para próximo campo
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
            <DialogTitle className="text-center">Confirmar Saque</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Informações do Saque */}
            <div className="text-center space-y-2 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Valor do saque</p>
              <p className="text-2xl font-bold">{formatCurrency(valorSaque)}</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Taxa: {formatCurrency(valorTaxaTotal)} (
                  {withdrawPixFees.percentual.toFixed(2)}%)
                </p>
                <p className="font-medium">
                  Valor líquido: {formatCurrency(valorLiquido)}
                </p>
              </div>
            </div>

            {/* Chave PIX */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Chave PIX de Destino
              </Label>
              <Input
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Digite sua chave PIX (CPF, e-mail ou telefone)"
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

              <p className="text-xs text-muted-foreground">
                Aceitamos chaves PIX do tipo: CPF, E-mail Telefone ou Cnpj
              </p>

              {/* Mensagens de erro */}
              {!pixKey.trim() && !isProcessingWithdraw && (
                <p className="text-xs text-destructive">
                  Chave PIX obrigatória
                </p>
              )}
              {pixKey.trim() && detectPixKeyType(pixKey) === "invalid" && (
                <p className="text-xs text-destructive">
                  Formato de chave PIX inválido
                </p>
              )}
            </div>

            {/* Informações Importantes */}
            <div className="text-center space-y-3 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Informações Importantes</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• O saque será processado em até 1 hora útil</p>
                <p>• Verifique se a chave PIX está correta</p>
                <p>• Não é possível cancelar após a confirmação</p>
                <p>
                  • Taxa de {withdrawPixFees.percentual.toFixed(2)}% será
                  descontada do valor
                </p>
              </div>
            </div>

            {/* Botões */}
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
                {isProcessingWithdraw ? "Processando..." : "Confirmar Saque"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Withdraw() {
  return (
    <ProtectedRoute>
      <WithdrawContent />
    </ProtectedRoute>
  );
}

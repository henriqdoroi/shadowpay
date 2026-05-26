import { LightShell } from "@/components/LightShell";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner"; // se for com sonner
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import bcrypt from "bcryptjs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Wallet,
  ShieldOff,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

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
type UserFormData = {
  id: string;
  companyName: string;
  email: string;
  number: string;
  cpf_cnpj: string;
  saldo: string;
  adquererId: string;
};

interface SellerDetails {
  id: string;
  companyName: string;
  email: string;
  number: string;
  cpf_cnpj: string;
  adquererId: string;
  kycStatus: "PENDING" | "APPROVED" | "BANNED" | "NOT_STARTED";
  createdAt: string;
  suspendedAt: string | null;
  wallet: {
    id: string;
    sellerId: string;
    balance: string;
    blockedBalance: string;
    reservedBalance: string;
    isBlocked: boolean;
  }[];
  kyc: {
    id: string;
    sellerId: string;
    cpf_cnpj: string;
    companyName: string;
    documentFrontImage: string;
    documentBackImage: string;
    selfieImage: string;
    companyDocumentImage: string;
    status: string;
    reason: string | null;
    approvedAt: string | null;
    rejectedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
  _count: {
    transactions: number;
    products: number;
    webhooks: number;
    credentials: number;
  };
  stats: {
    totalTransactions: number;
    totalVolume: string;
    approvedTransactions: number;
    approvedVolume: string;
    totalTaxasPagas: string;
    taxaAdquirente: number;
    lucroLiquidoParaEmpresa: number;
  };
}

interface SellersApiResponse {
  success: boolean;
  data: {
    sellers: Seller[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface Adquerer {
  id: string;
  reference: string;
}

interface UserStats {
  today: number;
  yesterday: number;
  thisMonth: number;
  total: number;
}

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

function KycDocPreview({ url, label }: { url?: string | null; label: string }) {
  const u = url?.trim();
  if (!u) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Documento não disponível
      </p>
    );
  }
  const isPdf =
    u.startsWith("data:application/pdf") || u.toLowerCase().includes(".pdf");
  return (
    <div className="space-y-2">
      {isPdf ? (
        <iframe src={u} title={label} className="w-full h-72 rounded bg-white" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={u} alt={label} className="max-h-72 w-auto mx-auto rounded" />
      )}
      <a
        href={u}
        download={label}
        target="_blank"
        rel="noreferrer"
        className="block text-center text-xs text-blue-600 hover:underline"
      >
        Abrir / Baixar
      </a>
    </div>
  );
}

const getKycStatusBadge = (status: string) => {
  const statusConfig = {
    NOT_STARTED: {
      label: "Não Iniciado",
      variant: "outline" as const,
      icon: ShieldOff, // ou outro ícone que faça sentido
    },
    PENDING: {
      label: "Pendente",
      variant: "secondary" as const,
      icon: Shield,
    },
    APPROVED: {
      label: "Aprovado",
      variant: "default" as const,
      icon: UserCheck,
    },
    BANNED: {
      label: "Banido",
      variant: "destructive" as const,
      icon: UserX,
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

const getWalletStatusBadge = (isBlocked: boolean) => {
  return (
    <Badge
      variant={isBlocked ? "destructive" : "default"}
      className="flex items-center gap-1"
    >
      {isBlocked ? (
        <UserX className="h-3 w-3" />
      ) : (
        <UserCheck className="h-3 w-3" />
      )}
      {isBlocked ? "Bloqueada" : "Ativa"}
    </Badge>
  );
};

// Dados mockados para estatísticas (serão substituídos por dados reais posteriormente)
const userStats: UserStats = {
  today: 0,
  yesterday: 0,
  thisMonth: 0,
  total: 0,
};

function UsersManagerContent() {
  const { user } = useAuth();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    kycStatus: "",
    isActive: "",
    adquererId: "", // <-- novo filtro
  });

  const [selectedSeller, setSelectedSeller] = useState<SellerDetails | null>(
    null
  );
  // Estados para modal de confirmação de exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState<Seller | null>(null);
  const [adquerers, setAdquerers] = useState<Adquerer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycSeller, setKycSeller] = useState<SellerDetails | null>(null);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processingKyc, setProcessingKyc] = useState(false);
  const [editFeesModalOpen, setEditFeesModalOpen] = useState(false);
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
  const [fees, setFees] = useState({
    feePercentPix: 0,
    feeFixedPix: 0,
    feePercentPixCashOut: 0,
    feeFixedPixCashOut: 0,
    feePercentCard: 0,
    feeFixedCard: 0,
    feePercentBoleto: 0,
    feeFixedBoleto: 0,
    feePercentCrypto: 0,
    feeFixedCrypto: 0,
  });
  const [updatingFees, setUpdatingFees] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    id: "", // ID do usuário para editar
    companyName: "",
    email: "",
    number: "",
    cpf_cnpj: "",
    saldo: "",
    adquererId: "",
  });
  const [changePassword, setChangePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  // Função para atualizar campos do formulário
  const handleUserFormChange = (field: keyof UserFormData, value: string) => {
    setUserFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handlePasswordChange = (
    field: "password" | "passwordConfirm",
    value: string
  ) => {
    if (field === "password") setPassword(value);
    else if (field === "passwordConfirm") setPasswordConfirm(value);
  };
  const confirmDeleteSeller = (seller: Seller) => {
    setSellerToDelete(seller);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSeller = async (sellerId: string, sellerName: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token de acesso não encontrado");

      const response = await fetch(
        `https://shadowpay-api-production.up.railway.app/api/admin/sellers/${sellerId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API: ${response.status} - ${errorText}`);
      }

      // Usando toast ao invés de alert
      toast.success(`Seller "${sellerName}" excluído com sucesso!`);
    } catch (err) {
      console.error("Erro ao deletar seller:", err);
      toast.error(
        "Erro ao excluir seller: " +
          (err instanceof Error ? err.message : "Erro desconhecido")
      );
    }
  };

  const handleUserFormSubmit = async () => {
    if (!userFormData.id) {
      toast.error("Nenhum usuário selecionado.");
      return;
    }

    if (changePassword) {
      if (!password) {
        toast.error("Por favor, digite a nova senha.");
        return;
      }
      if (password !== passwordConfirm) {
        toast.error("As senhas não conferem.");
        return;
      }
    }

    // Gera hash da senha se for para alterar
    let hashedPassword = undefined;
    if (changePassword) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    const dataToSend = {
      ...userFormData,
      ...(changePassword ? { password: hashedPassword } : {}),
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Token não encontrado. Faça login novamente.");
        return;
      }

      const sellerPayload = {
        companyName: dataToSend.companyName,
        email: dataToSend.email,
        number: dataToSend.number,
        cpf_cnpj: dataToSend.cpf_cnpj,
        adquererId: dataToSend.adquererId || null,
        ...(changePassword ? { password: dataToSend.password } : {}),
      };

      const sellerResponse = await fetch(
        `https://shadowpay-api-production.up.railway.app/api/admin/sellers/${userFormData.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sellerPayload),
        }
      );
      if (!sellerResponse.ok) {
        const errorText = await sellerResponse.text();
        throw new Error(`Erro ao atualizar seller: ${errorText}`);
      }

      const saldoNumber = Number(
        (dataToSend.saldo ?? "0")
          .toString()
          .replace(/\./g, "") // remove pontos (milhares)
          .replace(",", ".") // troca vírgula por ponto
      );

      if (!Number.isNaN(saldoNumber)) {
        const payload = {
          amount: saldoNumber,
          type: "SET",
          reason: "Ajuste manual via painel admin",
        };

        const walletResponse = await fetch(
          `https://shadowpay-api-production.up.railway.app/api/admin/wallets/${userFormData.id}/adjust-balance`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!walletResponse.ok) {
          const errorText = await walletResponse.text();
          console.error("Erro API:", errorText);
          throw new Error(`Erro ao atualizar saldo da wallet: ${errorText}`);
        }
      }

      toast.success("Seller atualizado com sucesso!");
      setIsEditUserModalOpen(false);
      fetchSellers();
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error("Erro ao salvar os dados do usuário.");
    }
  };
  //funcao para buscar adquerers
  const fetchAdquerers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado");

      const response = await fetch(
        "https://shadowpay-api-production.up.railway.app/api/admin/adquerers",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar adquerers: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setAdquerers(result.data);
      } else {
        throw new Error("Resposta da API sem sucesso");
      }
    } catch (error) {
      console.error("Erro ao buscar adquerers:", error);
    }
  };

  // Buscar adquerers ao montar o componentes
  useEffect(() => {
    fetchAdquerers();
  }, []);
  useEffect(() => {
    const fetchSellers = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token de acesso não encontrado");

        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append("search", filters.search);
        if (filters.kycStatus)
          queryParams.append("kycStatus", filters.kycStatus);
        if (filters.isActive) queryParams.append("isActive", filters.isActive);
        if (filters.adquererId)
          queryParams.append("adquererId", filters.adquererId);

        const response = await fetch(
          `https://shadowpay-api-production.up.railway.app/api/admin/sellers?${queryParams.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok)
          throw new Error(
            `Erro na API: ${response.status} - ${response.statusText}`
          );

        const result = await response.json();

        if (result.success && result.data) {
          setSellers(result.data.sellers || []);
        } else {
          throw new Error("Resposta da API inválida");
        }
      } catch (err: any) {
        setError(err.message || "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, [filters]);

  // Quando filtros mudarem, atualiza a lista
  useEffect(() => {
    fetchSellers();
  }, [filters]);
  // Função para buscar sellers
  const fetchSellers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token de acesso não encontrado");
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (filters.search) queryParams.append("search", filters.search);
      if (filters.kycStatus) queryParams.append("kycStatus", filters.kycStatus);
      if (filters.isActive) queryParams.append("isActive", filters.isActive);

      const response = await fetch(
        `https://shadowpay-api-production.up.railway.app/api/admin/sellers?${queryParams}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro na API: ${response.status} - ${response.statusText}`
        );
      }

      const result: SellersApiResponse = await response.json();

      if (result.success && result.data) {
        setSellers(result.data.sellers || []);
        setPagination(
          result.data.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            pages: 0,
          }
        );

        // Atualizar estatísticas com o total
        if (result.data.pagination?.total) {
          userStats.total = result.data.pagination.total;
        }
      } else {
        throw new Error("Resposta da API inválida");
      }
    } catch (err) {
      console.error("Erro ao buscar sellers:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const applySearchFilter = () => {
    setFilters((prev) => ({ ...prev, search: searchInput.trim() }));
  };
  // Buscar dados quando o componente montar
  useEffect(() => {
    if (user?.isAdministrator) {
      fetchSellers();
    }
  }, [user]);

  // Buscar dados quando os filtros mudarem
  useEffect(() => {
    if (user?.isAdministrator) {
      fetchSellers(1);
    }
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    fetchSellers(newPage);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  const handleResetClick = () => {
    setSearchInput("");
    setFilters({
      search: "",
      kycStatus: "",
      isActive: "",
      adquererId: "",
    });
  };
  const fetchSellerDetails = async (sellerId: string) => {
    try {
      setLoadingDetails(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token de acesso não encontrado");
      }

      const response = await fetch(
        `https://shadowpay-api-production.up.railway.app/api/admin/sellers/${sellerId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro na API: ${response.status} - ${response.statusText}`
        );
      }

      const result = await response.json();
      if (result.success && result.data) {
        setSelectedSeller(result.data);
      } else {
        throw new Error("Resposta inválida da API");
      }
      setIsModalOpen(true);
    } catch (err) {
      console.error("Erro ao buscar detalhes do seller:", err);
      alert("Erro ao carregar detalhes do seller");
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchKycDetails = async (sellerId: string) => {
    try {
      setLoadingKyc(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token de acesso não encontrado");
      }

      const response = await fetch(
        `https://shadowpay-api-production.up.railway.app/api/admin/sellers/${sellerId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro na API: ${response.status} - ${response.statusText}`
        );
      }

      const result = await response.json();
      if (result.success && result.data) {
        setKycSeller(result.data);
      } else {
        throw new Error("Resposta inválida da API");
      }
      setKycModalOpen(true);
    } catch (err) {
      console.error("Erro ao buscar detalhes do KYC:", err);
      alert("Erro ao carregar detalhes do KYC");
    } finally {
      setLoadingKyc(false);
    }
  };

  const approveKyc = async (kycId: string) => {
    try {
      setProcessingKyc(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token de acesso não encontrado");
      }

      const response = await fetch(
        `https://shadowpay-api-production.up.railway.app/api/admin/kyc/${kycId}/approve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro na API: ${response.status} - ${response.statusText}`
        );
      }

      const result = await response.json();
      if (result.success) {
        alert("KYC aprovado com sucesso!");
        setKycModalOpen(false);
        fetchSellers(pagination.page); // Atualizar a lista
      } else {
        throw new Error("Erro ao aprovar KYC");
      }
    } catch (err) {
      console.error("Erro ao aprovar KYC:", err);
      alert(
        "Erro ao aprovar KYC: " +
          (err instanceof Error ? err.message : "Erro desconhecido")
      );
    } finally {
      setProcessingKyc(false);
    }
  };

  const rejectKyc = async (kycId: string, reason: string) => {
    try {
      setProcessingKyc(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token de acesso não encontrado");
      }

      const response = await fetch(
        `https://shadowpay-api-production.up.railway.app/api/admin/kyc/${kycId}/reject`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro na API: ${response.status} - ${response.statusText}`
        );
      }

      const result = await response.json();
      if (result.success) {
        alert("KYC rejeitado com sucesso!");
        setKycModalOpen(false);
        setRejectModalOpen(false);
        setRejectReason("");
        fetchSellers(pagination.page); // Atualizar a lista
      } else {
        throw new Error("Erro ao rejeitar KYC");
      }
    } catch (err) {
      console.error("Erro ao rejeitar KYC:", err);
      alert(
        "Erro ao rejeitar KYC: " +
          (err instanceof Error ? err.message : "Erro desconhecido")
      );
    } finally {
      setProcessingKyc(false);
    }
  };

  const handleRejectKyc = () => {
    if (!rejectReason.trim()) {
      alert("Por favor, informe o motivo da rejeição.");
      return;
    }

    const firstKycId = kycSeller?.kyc?.[0]?.id;

    if (firstKycId) {
      rejectKyc(firstKycId, rejectReason);
    } else {
      alert("Nenhum registro de KYC encontrado para rejeição.");
    }
  };

  const updateSellerFees = async (sellerId: string, feesData: typeof fees) => {
    try {
      setUpdatingFees(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token de acesso não encontrado");
      }

      const response = await fetch(
        `https://shadowpay-api-production.up.railway.app/api/admin/sellers/${sellerId}/fees`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(feesData),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro na API: ${response.status} - ${response.statusText}`
        );
      }

      const result = await response.json();
      if (result.success) {
        toast.success("Taxas atualizadas com sucesso!");
        setEditFeesModalOpen(false);
        setEditingSellerId(null);
        fetchSellers(pagination.page);
      } else {
        throw new Error("Erro ao atualizar taxas");
      }
    } catch (err) {
      console.error("Erro ao atualizar taxas:", err);
      toast.error(
        "Erro ao atualizar taxas: " +
          (err instanceof Error ? err.message : "Erro desconhecido")
      );
    } finally {
      setUpdatingFees(false);
    }
  };

  const handleEditFees = async (sellerId: string) => {
    try {
      setEditingSellerId(sellerId);
      setLoadingDetails(true);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token de acesso não encontrado");
      }

      const response = await fetch(
        `https://shadowpay-api-production.up.railway.app/api/admin/sellers/${sellerId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro na API: ${response.status} - ${response.statusText}`
        );
      }

      const result = await response.json();
      if (result.success && result.data) {
        // Preencher os campos com as taxas existentes
        setFees({
          feePercentPix: result.data.feePercentPix || 0,
          feeFixedPix: parseFloat(result.data.feeFixedPix) || 0,
          feePercentPixCashOut: result.data.feePercentPixCashOut || 0,
          feeFixedPixCashOut: parseFloat(result.data.feeFixedPixCashOut) || 0,
          feePercentCard: result.data.feePercentCard || 0,
          feeFixedCard: parseFloat(result.data.feeFixedCard) || 0,
          feePercentBoleto: result.data.feePercentBoleto || 0,
          feeFixedBoleto: parseFloat(result.data.feeFixedBoleto) || 0,
          feePercentCrypto: result.data.feePercentCrypto || 0,
          feeFixedCrypto: parseFloat(result.data.feeFixedCrypto) || 0,
        });
        setEditFeesModalOpen(true);
      } else {
        throw new Error("Resposta inválida da API");
      }
    } catch (err) {
      console.error("Erro ao buscar taxas do seller:", err);
      alert(
        "Erro ao carregar taxas do seller: " +
          (err instanceof Error ? err.message : "Erro desconhecido")
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveFees = () => {
    if (editingSellerId) {
      updateSellerFees(editingSellerId, fees);
    }
  };
  // Função truncate (pode ficar antes do componente)
  function truncate(text: string, maxLength: number) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  }

  const handleFeeChange = (field: keyof typeof fees, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFees((prev) => ({ ...prev, [field]: numValue }));
  };

  const formatCurrencyInput = (value: string): string => {
    const onlyDigits = value.replace(/\D/g, ""); // remove tudo que não for número

    const numeric = Number(onlyDigits) / 100;

    return numeric.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleAction = (action: string, sellerId: string) => {
    switch (action) {
      case "details":
        fetchSellerDetails(sellerId);
        break;
      case "edit":
        handleEditFees(sellerId);
        break;
      case "kyc":
        fetchKycDetails(sellerId);
        break;
      case "delete":
        if (confirm("Tem certeza que deseja excluir este seller?")) {
          alert(`Seller ${sellerId} excluído`);
        }
        break;
    }
  };

  // Se estiver carregando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando sellers...</p>
        </div>
      </div>
    );
  }

  // Se houver erro, mostrar mensagem de erro
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold text-red-600">
              Erro ao Carregar Sellers
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button className="cursor-pointer" onClick={() => fetchSellers()}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
    <LightShell>
      <header className="mb-6">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
          Admin
        </p>
        <h1
          className="text-[28px] font-bold tracking-tight text-slate-900"
          style={{
            fontFamily: "'Clash Display', sans-serif",
            letterSpacing: "-0.005em",
          }}
        >
          Gerenciamento de Sellers
        </h1>
        <p className="mt-1 text-[14px] text-slate-500">
          Visualize e gerencie todos os sellers cadastrados.
        </p>
      </header>

      <div className="flex flex-col gap-5">

            {/* Filtros */}
            <Card
              className="
      p-6
      min-w-[280px] max-w-[360px] w-full
      md:min-w-auto md:max-w-none md:p-6
      flex flex-col justify-between
    "
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base sm:text-lg font-semibold truncate">
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-2 flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="search">Buscar</Label>
                    <div className="flex gap-2">
                      <Input
                        id="search"
                        type="text"
                        placeholder="Nome, email ou cnpj"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault(); // evita comportamento padrão, ex: submit form se houver
                            applySearchFilter();
                          }
                        }}
                        className="flex-grow"
                      />
                      <Button
                        size="sm"
                        className="cursor-pointer"
                        onClick={applySearchFilter}
                      >
                        Buscar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={handleResetClick}
                      >
                        Redefinir
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Adquirente</Label>
                    <Select
                      value={filters.adquererId || "all"}
                      onValueChange={(value) =>
                        handleFilterChange(
                          "adquererId",
                          value === "all" ? "" : value
                        )
                      }
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {adquerers.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.reference}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status KYC</Label>
                    <Select
                      value={filters.kycStatus || "all"}
                      onValueChange={(value) =>
                        handleFilterChange(
                          "kycStatus",
                          value === "all" ? "" : value
                        )
                      }
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="NOT_STARTED">
                          Não Iniciado
                        </SelectItem>
                        <SelectItem value="PENDING">Pendente</SelectItem>
                        <SelectItem value="APPROVED">Aprovado</SelectItem>
                        <SelectItem value="BANNED">Banido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status Ativo</Label>
                    <Select
                      value={filters.isActive || "all"}
                      onValueChange={(value) =>
                        handleFilterChange(
                          "isActive",
                          value === "all" ? "" : value
                        )
                      }
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Sellers */}
            <Card
              className="
    w-full
    p-6 flex flex-col justify-between
    min-w-[280px] max-w-[360px]
    md:min-w-auto md:max-w-none md:p-6
  "
            >
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Lista de Sellers</CardTitle>
                  <Button
                    className="cursor-pointer"
                    onClick={() => fetchSellers(pagination.page)}
                    disabled={loading}
                  >
                    {loading ? "Atualizando..." : "Atualizar"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 mt-2 flex flex-col gap-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>cpf/cnpj</TableHead>
                        <TableHead>Saldo</TableHead>
                        <TableHead>Transações</TableHead>
                        <TableHead>Produtos</TableHead>
                        <TableHead>KYC Status</TableHead>
                        <TableHead>Adquirente</TableHead>
                        <TableHead>Carteira</TableHead>
                        <TableHead>Data de Cadastro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sellers.map((seller) => (
                        <TableRow key={seller.id}>
                          <TableCell
                            className="font-medium"
                            title={seller.companyName}
                          >
                            {truncate(seller.companyName, 20)}
                          </TableCell>

                          <TableCell>{seller.email}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {seller.cpf_cnpj}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(
                              Number(seller.wallet[0]?.balance || 0)
                            )}
                          </TableCell>
                          <TableCell>{seller._count.transactions}</TableCell>
                          <TableCell>{seller._count.products}</TableCell>
                          <TableCell>
                            {getKycStatusBadge(seller.kycStatus)}
                          </TableCell>
                          <TableCell>
                            {adquerers.find((a) => a.id === seller.adquererId)
                              ?.reference || "—"}
                          </TableCell>
                          <TableCell>
                            {getWalletStatusBadge(
                              seller.wallet[0]?.isBlocked || false
                            )}
                          </TableCell>
                          <TableCell>{formatDate(seller.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <div className="flex items-center justify-end gap-2">
                                {/* Botão para editar o usuário */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setUserFormData({
                                          id: seller.id,
                                          companyName: seller.companyName,
                                          email: seller.email,
                                          number: seller.number ?? "",
                                          cpf_cnpj: seller.cpf_cnpj ?? "",
                                          adquererId: seller.adquererId || "",
                                          saldo:
                                            seller.wallet?.[0]?.balance !==
                                              undefined &&
                                            seller.wallet?.[0]?.balance !== null
                                              ? formatCurrencyInput(
                                                  seller.wallet[0].balance.toString()
                                                )
                                              : "",
                                        });
                                        setIsEditUserModalOpen(true);
                                      }}
                                      className="cursor-pointer h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar Usuário</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleAction("details", seller.id)
                                      }
                                      className="cursor-pointer h-8 w-8 p-0"
                                      disabled={loadingDetails || loadingKyc}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Visualizar detalhes</p>
                                  </TooltipContent>
                                </Tooltip>
                                {seller.kycStatus === "PENDING" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleAction("kyc", seller.id)
                                        }
                                        className="cursor-pointer h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        disabled={loadingKyc}
                                      >
                                        <Shield className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Verificar KYC</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleAction("edit", seller.id)
                                      }
                                      className="cursor-pointer h-8 w-8 p-0"
                                    >
                                      <Wallet className="h-4 w-4 text-green-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar seller</p>
                                  </TooltipContent>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          confirmDeleteSeller(seller)
                                        }
                                        className="cursor-pointer h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Excluir Usuário</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {pagination.pages > 1 && (
                  <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground text-center sm:text-left">
                      Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}{" "}
                      de {pagination.total} sellers
                    </div>
                    <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                      <Button
                        className="cursor-pointer"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1 || loading}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm">
                        Página {pagination.page} de {pagination.pages}
                      </span>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          className="cursor-pointer"
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={
                            pagination.page >= pagination.pages || loading
                          }
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
      </div>
    </LightShell>

      {/* Modal de Detalhes do Seller */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Seller</DialogTitle>
            <DialogDescription>
              Informações completas do seller selecionado
            </DialogDescription>
          </DialogHeader>

          {selectedSeller && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ID</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedSeller.id}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nome da Empresa</Label>
                  <p className="text-sm">{selectedSeller.companyName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedSeller.email}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">cpf/cnpj</Label>
                  <p className="text-sm">{selectedSeller.cpf_cnpj}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status KYC</Label>
                  <Badge
                    variant={
                      selectedSeller.kycStatus === "APPROVED"
                        ? "default"
                        : selectedSeller.kycStatus === "PENDING"
                        ? "secondary"
                        : selectedSeller.kycStatus === "NOT_STARTED"
                        ? "outline"
                        : "destructive" // fallback para status como "BANNED" ou outros
                    }
                  >
                    {selectedSeller.kycStatus === "NOT_STARTED"
                      ? "Não Iniciado"
                      : selectedSeller.kycStatus}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Data de Criação</Label>
                  <p className="text-sm">
                    {new Date(selectedSeller.createdAt).toLocaleDateString(
                      "pt-BR"
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Informações da Carteira */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Carteira</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      ID da Carteira
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedSeller.wallet[0]?.id || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Saldo</Label>
                    <p className="text-sm font-semibold">
                      R${" "}
                      {parseFloat(
                        selectedSeller.wallet[0]?.balance || "0"
                      ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge
                      variant={
                        selectedSeller.wallet[0]?.isBlocked
                          ? "destructive"
                          : "default"
                      }
                    >
                      {selectedSeller.wallet[0]?.isBlocked
                        ? "Bloqueada"
                        : "Ativa"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contadores */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Contadores</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">
                      {selectedSeller._count.transactions}
                    </p>
                    <p className="text-sm text-muted-foreground">Transações</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">
                      {selectedSeller._count.products}
                    </p>
                    <p className="text-sm text-muted-foreground">Produtos</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">
                      {selectedSeller._count.webhooks}
                    </p>
                    <p className="text-sm text-muted-foreground">Webhooks</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">
                      {selectedSeller._count.credentials}
                    </p>
                    <p className="text-sm text-muted-foreground">Credenciais</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Estatísticas */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Total de Transações:</span>
                      <span className="font-semibold">
                        {selectedSeller.stats.totalTransactions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Volume Total:</span>
                      <span className="font-semibold">
                        R${" "}
                        {parseFloat(
                          selectedSeller.stats.totalVolume
                        ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Transações Aprovadas:</span>
                      <span className="font-semibold">
                        {selectedSeller.stats.approvedTransactions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Volume Aprovado:</span>
                      <span className="font-semibold">
                        R${" "}
                        {parseFloat(
                          selectedSeller.stats.approvedVolume
                        ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Taxas Pagas:</span>
                      <span className="font-semibold">
                        R${" "}
                        {parseFloat(
                          selectedSeller.stats.totalTaxasPagas
                        ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Taxa Adquirente:</span>
                      <span className="font-semibold">
                        R${" "}
                        {selectedSeller.stats.taxaAdquirente.toLocaleString(
                          "pt-BR",
                          { minimumFractionDigits: 2 }
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Lucro Líquido:</span>
                      <span className="font-semibold text-green-600">
                        R${" "}
                        {selectedSeller.stats.lucroLiquidoParaEmpresa.toLocaleString(
                          "pt-BR",
                          { minimumFractionDigits: 2 }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Histórico KYC */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Histórico KYC</h3>
                <div className="space-y-2">
                  {selectedSeller.kyc.map((kycItem, index) => (
                    <div
                      key={kycItem.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">KYC #{index + 1}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(kycItem.createdAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                      <Badge
                        variant={
                          kycItem.status === "APPROVED"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {kycItem.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmação de Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o seller{" "}
              <strong>{sellerToDelete?.companyName}</strong>? Esta ação não
              poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="cursor-pointer"
              variant="destructive"
              onClick={async () => {
                if (!sellerToDelete) return;
                // ⚠️ Passe o nome do seller também
                await handleDeleteSeller(
                  sellerToDelete.id,
                  sellerToDelete.companyName
                );
                setIsDeleteModalOpen(false);
                setSellerToDelete(null);
                fetchSellers(pagination.page);
              }}
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Verificação KYC */}
      <Dialog open={kycModalOpen} onOpenChange={setKycModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verificação KYC</DialogTitle>
            <DialogDescription>
              Documentos e informações para verificação do KYC
            </DialogDescription>
          </DialogHeader>

          {kycSeller && kycSeller.kyc.length > 0 && (
            <div className="space-y-6">
              {/* Informações Básicas do KYC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Empresa</Label>
                  <p className="text-sm">
                    {kycSeller?.kyc?.[0]?.companyName ?? "—"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">cpf/cnpj</Label>
                  <p className="text-sm">
                    {kycSeller?.kyc?.[0]?.cpf_cnpj ?? "—"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge
                    variant={
                      kycSeller?.kyc?.[0]?.status === "APPROVED"
                        ? "default"
                        : kycSeller?.kyc?.[0]?.status === "PENDING"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {kycSeller?.kyc?.[0]?.status ?? "—"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Data de Submissão
                  </Label>
                  <p className="text-sm">
                    {kycSeller?.kyc?.[0]?.createdAt
                      ? new Date(kycSeller.kyc[0].createdAt).toLocaleDateString(
                          "pt-BR"
                        )
                      : "—"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Documentos */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Documentos Enviados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Documento Frente */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Documento (Frente)
                    </Label>
                    <div className="border rounded-lg p-2 bg-muted">
                      <KycDocPreview
                        url={kycSeller?.kyc?.[0]?.documentFrontImage}
                        label="Documento (Frente)"
                      />
                    </div>
                  </div>

                  {/* Documento Verso */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Documento (Verso)
                    </Label>
                    <div className="border rounded-lg p-2 bg-muted">
                      <KycDocPreview
                        url={kycSeller?.kyc?.[0]?.documentBackImage}
                        label="Documento (Verso)"
                      />
                    </div>
                  </div>

                  {/* Selfie */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selfie</Label>
                    <div className="border rounded-lg p-2 bg-muted">
                      <KycDocPreview
                        url={kycSeller?.kyc?.[0]?.selfieImage}
                        label="Selfie"
                      />
                    </div>
                  </div>

                  {/* Documento da Empresa */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Documento da Empresa
                    </Label>
                    <div className="border rounded-lg p-2 bg-muted">
                      <KycDocPreview
                        url={kycSeller?.kyc?.[0]?.companyDocumentImage}
                        label="Documento da Empresa"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Ações de Aprovação/Rejeição */}
              <div className="flex justify-end gap-4">
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  onClick={() => setKycModalOpen(false)}
                  disabled={processingKyc}
                >
                  Fechar
                </Button>
                {kycSeller?.kyc?.[0]?.status === "PENDING" && (
                  <>
                    <Button
                      className="cursor-pointer"
                      variant="destructive"
                      onClick={() => setRejectModalOpen(true)}
                      disabled={processingKyc}
                    >
                      {processingKyc ? "Processando..." : "Rejeitar KYC"}
                    </Button>
                    <Button
                      className="cursor-pointer"
                      variant="default"
                      onClick={() => {
                        const kycId = kycSeller?.kyc?.[0]?.id;
                        if (kycId) approveKyc(kycId);
                        else alert("ID do KYC não disponível");
                      }}
                      disabled={processingKyc}
                    >
                      {processingKyc ? "Processando..." : "Aprovar KYC"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Rejeição */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar KYC</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição do KYC. Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Motivo da Rejeição</Label>
              <textarea
                id="reject-reason"
                className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                placeholder="Descreva o motivo da rejeição..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                disabled={processingKyc}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectReason("");
                }}
                disabled={processingKyc}
              >
                Cancelar
              </Button>
              <Button
                className="cursor-pointer"
                variant="destructive"
                onClick={handleRejectKyc}
                disabled={processingKyc || !rejectReason.trim()}
              >
                {processingKyc ? "Rejeitando..." : "Confirmar Rejeição"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <p>Atualize as informações do usuário abaixo.</p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Seus inputs existentes */}
            <div>
              <Label className="text-sm font-medium">Empresa</Label>
              <Input
                value={userFormData.companyName}
                onChange={(e) =>
                  handleUserFormChange("companyName", e.target.value)
                }
                placeholder="Nome da Empresa"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                value={userFormData.email}
                onChange={(e) => handleUserFormChange("email", e.target.value)}
                placeholder="Email"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Número</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={userFormData.number}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, number: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-sm font-medium">cpf/cnpj</Label>
              <Input
                value={userFormData.cpf_cnpj}
                onChange={(e) =>
                  handleUserFormChange("cpf_cnpj", e.target.value)
                }
                placeholder="cpf_cnpj"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Saldo</Label>
              <Input
                value={userFormData.saldo}
                onChange={(e) => {
                  let raw = e.target.value;

                  // Permite apenas dígitos, vírgula e o sinal de menos
                  raw = raw.replace(/[^\d,-]/g, "");

                  // Garante que o sinal de menos só apareça no início
                  if (raw.includes("-")) {
                    raw = "-" + raw.replace(/-/g, "");
                  }

                  // Se tiver mais de uma vírgula, mantém só a primeira
                  const parts = raw.split(",");
                  if (parts.length > 2) {
                    raw = parts[0] + "," + parts[1];
                  }

                  handleUserFormChange("saldo", raw);
                }}
                onBlur={() => {
                  let saldoStr = userFormData.saldo || "0";

                  // Converte vírgula em ponto para parseFloat
                  const parsed = parseFloat(saldoStr.replace(",", "."));

                  // Se não for número válido, zera
                  const safeValue = isNaN(parsed) ? 0 : parsed;

                  // Formata como moeda brasileira (2 casas decimais)
                  const formatted = safeValue.toFixed(2).replace(".", ",");

                  handleUserFormChange("saldo", formatted);
                }}
                placeholder="R$ 0,00"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Adquirente</Label>
              <select
                value={userFormData.adquererId}
                onChange={(e) =>
                  handleUserFormChange("adquererId", e.target.value)
                }
                className="cursor-pointer w-full p-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="" disabled>
                  Selecione o adquirente
                </option>
                {adquerers.map((adq) => (
                  <option key={adq.id} value={adq.id}>
                    {adq.reference}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox para mostrar campos de senha */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="changePassword"
                checked={changePassword}
                onChange={() => setChangePassword(!changePassword)}
              />
              <Label htmlFor="changePassword" className="cursor-pointer">
                Alterar senha do usuário
              </Label>
            </div>

            {/* Inputs de senha aparecem só se changePassword = true */}
            {changePassword && (
              <>
                <div>
                  <Label className="text-sm font-medium">Nova Senha</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      handlePasswordChange("password", e.target.value)
                    }
                    placeholder="Digite a nova senha"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Confirmar Senha</Label>
                  <Input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) =>
                      handlePasswordChange("passwordConfirm", e.target.value)
                    }
                    placeholder="Confirme a nova senha"
                  />
                </div>
              </>
            )}

            <div className="pt-2">
              <Button
                className="cursor-pointer w-full"
                onClick={handleUserFormSubmit}
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal de Edição de Taxas */}
      <Dialog open={editFeesModalOpen} onOpenChange={setEditFeesModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Taxas do Seller</DialogTitle>
            <DialogDescription>
              Configure as taxas de transação para este seller.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Taxas PIX */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">PIX</h3>

              {/* Linha 1: Percentuais (Cash In e Cash Out) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="feePercentPix">% Cash Out</Label>
                  <Input
                    id="feePercentPix"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 1.5"
                    value={fees.feePercentPix}
                    onChange={(e) =>
                      handleFeeChange("feePercentPix", e.target.value)
                    }
                    disabled={updatingFees}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feePercentPixCashOut">% Cash In</Label>
                  <Input
                    id="feePercentPixCashOut"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 1.5"
                    value={fees.feePercentPixCashOut}
                    onChange={(e) =>
                      handleFeeChange("feePercentPixCashOut", e.target.value)
                    }
                    disabled={updatingFees}
                  />
                </div>
              </div>

              {/* Linha 2: Fixas (Cash In e Cash Out) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="feeFixedPix">Fixa Cash Out (R$)</Label>
                  <Input
                    id="feeFixedPix"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 0.50"
                    value={fees.feeFixedPix}
                    onChange={(e) =>
                      handleFeeChange("feeFixedPix", e.target.value)
                    }
                    disabled={updatingFees}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feeFixedPixCashOut">Fixa Cash In (R$)</Label>
                  <Input
                    id="feeFixedPixCashOut"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 0.50"
                    value={fees.feeFixedPixCashOut}
                    onChange={(e) =>
                      handleFeeChange("feeFixedPixCashOut", e.target.value)
                    }
                    disabled={updatingFees}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Taxas Cartão */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Cartão</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="feePercentCard">Taxa Percentual (%)</Label>
                  <Input
                    id="feePercentCard"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 3.2"
                    value={fees.feePercentCard}
                    onChange={(e) =>
                      handleFeeChange("feePercentCard", e.target.value)
                    }
                    disabled={updatingFees}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feeFixedCard">Taxa Fixa (R$)</Label>
                  <Input
                    id="feeFixedCard"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 0.30"
                    value={fees.feeFixedCard}
                    onChange={(e) =>
                      handleFeeChange("feeFixedCard", e.target.value)
                    }
                    disabled={updatingFees}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Taxas Boleto */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Boleto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="feePercentBoleto">Taxa Percentual (%)</Label>
                  <Input
                    id="feePercentBoleto"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 2.8"
                    value={fees.feePercentBoleto}
                    onChange={(e) =>
                      handleFeeChange("feePercentBoleto", e.target.value)
                    }
                    disabled={updatingFees}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feeFixedBoleto">Taxa Fixa (R$)</Label>
                  <Input
                    id="feeFixedBoleto"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 2.00"
                    value={fees.feeFixedBoleto}
                    onChange={(e) =>
                      handleFeeChange("feeFixedBoleto", e.target.value)
                    }
                    disabled={updatingFees}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Taxas Crypto */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Criptomoedas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="feePercentCrypto">Taxa Percentual (%)</Label>
                  <Input
                    id="feePercentCrypto"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 2.0"
                    value={fees.feePercentCrypto}
                    onChange={(e) =>
                      handleFeeChange("feePercentCrypto", e.target.value)
                    }
                    disabled={updatingFees}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feeFixedCrypto">Taxa Fixa (R$)</Label>
                  <Input
                    id="feeFixedCrypto"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 1.00"
                    value={fees.feeFixedCrypto}
                    onChange={(e) =>
                      handleFeeChange("feeFixedCrypto", e.target.value)
                    }
                    disabled={updatingFees}
                  />
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={() => {
                  setEditFeesModalOpen(false);
                  setEditingSellerId(null);
                }}
                disabled={updatingFees}
              >
                Cancelar
              </Button>
              <Button
                className="cursor-pointer"
                variant="default"
                onClick={handleSaveFees}
                disabled={updatingFees}
              >
                {updatingFees ? "Salvando..." : "Salvar Taxas"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function UsersManager() {
  return (
    <ProtectedRoute>
      <UsersManagerContent />
    </ProtectedRoute>
  );
}

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

/** "1.234,56" / "1234,56" / "1234.56" -> 1234.56 (null se não for valor). */
const parseBRL = (v: string): number | null => {
  const s = String(v ?? "").replace(/[R$\s]/g, "").trim();
  if (!s) return null;
  const norm = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(norm);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

/** Mensagem de erro do backend ({ message } ou { error: { message } }). */
const readApiError = async (res: Response, fallback: string): Promise<string> => {
  try {
    const j = await res.json();
    const m = j?.error?.message ?? j?.message;
    if (Array.isArray(m)) return m.join(" ");
    if (typeof m === "string" && m.trim()) return m;
  } catch {
    /* corpo vazio */
  }
  return fallback;
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
  // Taxa PIX própria do seller ("" = usa a taxa da adquirente)
  const [fees, setFees] = useState({ pixFeePercent: "", pixFeeFixed: "" });
  const [feesSellerName, setFeesSellerName] = useState("");
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
  // saldo quando o modal abriu (pra só ajustar se o admin mudou)
  const [originalBalance, setOriginalBalance] = useState<number | null>(null);
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
        `https://shadowpay-backend.onrender.com/api/admin/sellers/${sellerId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(await readApiError(response, "Erro ao excluir seller."));

      toast.success(`Seller "${sellerName}" excluído.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir seller.");
    }
  };

  const [savingUser, setSavingUser] = useState(false);

  const handleUserFormSubmit = async () => {
    if (!userFormData.id) {
      toast.error("Nenhum usuário selecionado.");
      return;
    }

    if (changePassword) {
      if (password.length < 8) {
        toast.error("A nova senha precisa de pelo menos 8 caracteres.");
        return;
      }
      if (password !== passwordConfirm) {
        toast.error("As senhas não conferem.");
        return;
      }
    }

    const newBalance = parseBRL(userFormData.saldo);
    if (userFormData.saldo.trim() && newBalance === null) {
      toast.error("Saldo inválido. Use o formato 1234,56.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Token não encontrado. Faça login novamente.");
      return;
    }

    setSavingUser(true);
    try {
      // A senha vai em texto (HTTPS) e o servidor faz o hash.
      const sellerPayload = {
        companyName: userFormData.companyName,
        email: userFormData.email,
        number: userFormData.number,
        cpf_cnpj: userFormData.cpf_cnpj,
        adquererId: userFormData.adquererId || null,
        ...(changePassword ? { password } : {}),
      };

      const sellerResponse = await fetch(
        `https://shadowpay-backend.onrender.com/api/admin/sellers/${userFormData.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sellerPayload),
        }
      );
      if (!sellerResponse.ok) throw new Error(await readApiError(sellerResponse, "Erro ao atualizar seller."));

      // Saldo: só mexe se o admin mudou o valor. expectedBalance impede de
      // sobrescrever uma venda/saque que caiu enquanto o modal estava aberto.
      if (newBalance !== null && originalBalance !== null && Math.abs(newBalance - originalBalance) >= 0.005) {
        const walletResponse = await fetch(
          `https://shadowpay-backend.onrender.com/api/admin/wallets/${userFormData.id}/adjust-balance`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              amount: newBalance,
              type: "SET",
              expectedBalance: originalBalance,
              reason: "Ajuste manual via painel admin",
            }),
          }
        );
        if (!walletResponse.ok) {
          throw new Error(await readApiError(walletResponse, "Dados salvos, mas o saldo não foi alterado."));
        }
      }

      toast.success("Seller atualizado com sucesso!");
      setIsEditUserModalOpen(false);
      setChangePassword(false);
      setPassword("");
      setPasswordConfirm("");
      fetchSellers(pagination.page);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar os dados do usuário.");
    } finally {
      setSavingUser(false);
    }
  };
  //funcao para buscar adquerers
  const fetchAdquerers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado");

      const response = await fetch(
        "https://shadowpay-backend.onrender.com/api/admin/adquerers",
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
          `https://shadowpay-backend.onrender.com/api/admin/sellers?${queryParams.toString()}`,
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
        `https://shadowpay-backend.onrender.com/api/admin/sellers?${queryParams}`,
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
        `https://shadowpay-backend.onrender.com/api/admin/sellers/${sellerId}`,
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
        `https://shadowpay-backend.onrender.com/api/admin/sellers/${sellerId}`,
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
        `https://shadowpay-backend.onrender.com/api/admin/kyc/${kycId}/approve`,
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
        `https://shadowpay-backend.onrender.com/api/admin/kyc/${kycId}/reject`,
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
    const toNum = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
    const pixFeePercent = toNum(feesData.pixFeePercent);
    const pixFeeFixed = toNum(feesData.pixFeeFixed);
    if ((pixFeePercent !== null && !(pixFeePercent >= 0 && pixFeePercent <= 50)) || (pixFeeFixed !== null && !(pixFeeFixed >= 0))) {
      toast.error("Confira as taxas: use números (ex.: 4,99 e 1,00).");
      return;
    }
    try {
      setUpdatingFees(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token de acesso não encontrado");
      }

      const response = await fetch(
        `https://shadowpay-backend.onrender.com/api/admin/sellers/${sellerId}/fees`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pixFeePercent, pixFeeFixed }),
        }
      );

      if (!response.ok) throw new Error(await readApiError(response, "Erro ao atualizar taxas."));

      toast.success("Taxas atualizadas! Valem para as próximas vendas.");
      setEditFeesModalOpen(false);
      setEditingSellerId(null);
      fetchSellers(pagination.page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar taxas.");
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
        `https://shadowpay-backend.onrender.com/api/admin/sellers/${sellerId}`,
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
        // Preencher com a taxa própria atual (vazio = taxa da adquirente)
        const show = (v: unknown) => (v === null || v === undefined || v === "" ? "" : String(v).replace(".", ","));
        setFees({
          pixFeePercent: show(result.data.pixFeePercentOverride),
          pixFeeFixed: show(result.data.pixFeeFixedOverride),
        });
        setFeesSellerName(result.data.companyName || "");
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
    const clean = value.replace(/\./g, ",").replace(/[^\d,]/g, "");
    setFees((prev) => ({ ...prev, [field]: clean }));
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
          className="text-[22px] font-bold tracking-tight sm:text-[28px] text-slate-900"
          style={{
            fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
            letterSpacing: "-0.005em",
          }}
        >
          Gerenciamento de Sellers
        </h1>
        <p className="mt-1 text-[14px] text-slate-500">
          Visualize e gerencie todos os sellers cadastrados.
        </p>
      </header>

      <div
        className="flex flex-col gap-5"
        style={{
          // força tokens shadcn pra LIGHT só nessa subtree
          ["--background" as any]: "#FFFFFF",
          ["--foreground" as any]: "#0F172A",
          ["--card" as any]: "#FFFFFF",
          ["--card-foreground" as any]: "#0F172A",
          ["--popover" as any]: "#FFFFFF",
          ["--popover-foreground" as any]: "#0F172A",
          ["--primary" as any]: "#7C3AED",
          ["--primary-foreground" as any]: "#FFFFFF",
          ["--secondary" as any]: "#F1F5F9",
          ["--secondary-foreground" as any]: "#0F172A",
          ["--muted" as any]: "#F8FAFC",
          ["--muted-foreground" as any]: "#64748B",
          ["--accent" as any]: "#F1F5F9",
          ["--accent-foreground" as any]: "#0F172A",
          ["--destructive" as any]: "#EF4444",
          ["--border" as any]: "rgba(15, 23, 42, 0.08)",
          ["--input" as any]: "rgba(15, 23, 42, 0.10)",
          ["--ring" as any]: "rgba(124, 58, 237, 0.30)",
          color: "#0F172A",
        }}
      >
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
                                        // "1000" (Decimal sem casas) era lido como R$ 10,00
                                        const bal = Number(seller.wallet?.[0]?.balance ?? 0);
                                        const safeBal = Number.isFinite(bal) ? bal : 0;
                                        setOriginalBalance(safeBal);
                                        setChangePassword(false);
                                        setPassword("");
                                        setPasswordConfirm("");
                                        setUserFormData({
                                          id: seller.id,
                                          companyName: seller.companyName,
                                          email: seller.email,
                                          number: seller.number ?? "",
                                          cpf_cnpj: seller.cpf_cnpj ?? "",
                                          adquererId: seller.adquererId || "",
                                          saldo: safeBal.toFixed(2).replace(".", ","),
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
                                    <p>Taxas do seller</p>
                                  </TooltipContent>
                                </Tooltip>
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
              <strong>{sellerToDelete?.companyName}</strong>? A conta deixa de
              entrar, as chaves de API são revogadas e o checkout para de vender.
              Vendas e extrato ficam guardados. Só dá pra excluir com saldo zerado.
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
                inputMode="decimal"
                onChange={(e) => {
                  // só dígitos e UMA vírgula (saldo não fica negativo)
                  let raw = e.target.value.replace(/\./g, ",").replace(/[^\d,]/g, "");
                  const parts = raw.split(",");
                  if (parts.length > 2) raw = parts[0] + "," + parts.slice(1).join("");
                  handleUserFormChange("saldo", raw);
                }}
                onBlur={() => {
                  const parsed = parseBRL(userFormData.saldo);
                  if (parsed !== null) handleUserFormChange("saldo", parsed.toFixed(2).replace(".", ","));
                }}
                placeholder="0,00"
              />
              {originalBalance !== null && (
                <p className="mt-1 text-xs text-slate-500">
                  Saldo atual: {formatCurrency(originalBalance)}. Mudar aqui gera um ajuste no extrato do seller.
                </p>
              )}
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
                disabled={savingUser}
              >
                {savingUser ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal de Edição de Taxas — taxa PIX própria do seller */}
      <Dialog open={editFeesModalOpen} onOpenChange={setEditFeesModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Taxas do seller</DialogTitle>
            <DialogDescription>
              {feesSellerName ? <strong>{feesSellerName}</strong> : "Este seller"} paga esta taxa em cada venda PIX
              aprovada, em qualquer adquirente. Deixe em branco pra usar a taxa padrão da adquirente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pixFeePercent">PIX recebido — percentual (%)</Label>
                <Input
                  id="pixFeePercent"
                  inputMode="decimal"
                  placeholder="Padrão da adquirente"
                  value={fees.pixFeePercent}
                  onChange={(e) => handleFeeChange("pixFeePercent", e.target.value)}
                  disabled={updatingFees}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pixFeeFixed">PIX recebido — fixa (R$)</Label>
                <Input
                  id="pixFeeFixed"
                  inputMode="decimal"
                  placeholder="Padrão da adquirente"
                  value={fees.pixFeeFixed}
                  onChange={(e) => handleFeeChange("pixFeeFixed", e.target.value)}
                  disabled={updatingFees}
                />
              </div>
            </div>

            {(() => {
              const p = fees.pixFeePercent.trim() === "" ? null : Number(fees.pixFeePercent.replace(",", "."));
              const x = fees.pixFeeFixed.trim() === "" ? null : Number(fees.pixFeeFixed.replace(",", "."));
              if (p === null && x === null) return null;
              const fee = Math.round((100 * (p ?? 0) / 100 + (x ?? 0)) * 100) / 100;
              return (
                <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-800">
                  Exemplo: numa venda de R$ 100,00 o seller paga {formatCurrency(fee)} e recebe {formatCurrency(Math.max(0, 100 - fee))}.
                </p>
              );
            })()}

            <p className="text-xs text-slate-500">
              Taxa diferente só numa adquirente? Use Adquirentes &gt; vincular seller. Taxa de saque é definida por adquirente.
            </p>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={() => setFees({ pixFeePercent: "", pixFeeFixed: "" })}
                disabled={updatingFees}
              >
                Usar padrão
              </Button>
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
              <Button className="cursor-pointer" variant="default" onClick={handleSaveFees} disabled={updatingFees}>
                {updatingFees ? "Salvando..." : "Salvar taxas"}
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

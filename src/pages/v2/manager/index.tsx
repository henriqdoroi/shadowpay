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
import {
  Wallet,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  ShieldX,
  FileText,
  ArrowDown,
  Hourglass,
  DollarSign,
  Activity,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import axios from "axios";

interface MetricCard {
  id: string;
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color: string;
}
interface PositiveAccount {
  saldo: number;
  gatewayId?: string;
  [key: string]: any;
}
interface NegativeAccount {
  saldo: number;
  gatewayId?: string;
  [key: string]: any;
}
interface SaldoGatewaysData {
  saldoGateways: number;
  positivos: PositiveAccount[];
  negativos: NegativeAccount[];
  detalhado: PositiveAccount[];
}
interface Transaction {
  id?: string;
  transactionId?: string;
  amount?: number | string;
  amountFee?: number | string;
  valor?: number | string;
  taxa?: number | string;
  status?: string;
  paymentMethod?: string;
  paymentData?: { name?: string };
  transactionType?: string; // <-- adiciona aqui
}

interface DashboardData {
  transacoesDetalhadas?: {
    id: string;
    gatewayId: string;
    valor: number;
    amountNet?: number;
    taxa?: number;
    status: string;
  }[];
  totalEmCarteiras: {
    valor: string;
    crescimento: number;
  };
  lucroLiquido: {
    valor: string;
    crescimento: number;
  };
  transacoesAprovadas: {
    valor: number;
    crescimento: number;
  };
  transacoesPendentes: {
    valor: number;
  };
  usuariosCadastrados: {
    valor: number;
    crescimento: number;
  };
  kycPendentes: {
    valor: number;
  };
  totalEmRetiradas: {
    valor: number;
    crescimento: number;
  };
  retiradasPendentes: {
    valor: string;
  };
  resumoFinanceiro: {
    totalEmCarteiras: string;
    lucroLiquido: string;
    totalRetiradas: number;
    pendentes: string;
  };
  transacoes: {
    aprovadas: number;
    pendentes: number;
    emAnalise: number;
    totalProcessadas: number;
  };
  usuarios: {
    cadastrados: number;
    bloqueados: number;
    kycPendentes: number;
    taxaAprovacao: number;
  };
  saldoGateways: number | SaldoGatewaysData;
  negativeAccounts: NegativeAccount[];
}

function formatCurrency(value: any): string {
  if (value === null || value === undefined || value === "") return "R$ 0,00";
  let numericValue: number;
  if (typeof value === "string") {
    const cleaned = value.trim();
    if (cleaned.match(/[\.,]/)) {
      const normalized = cleaned.replace(/\./g, "").replace(",", ".");
      numericValue = parseFloat(normalized);
    } else {
      numericValue = parseFloat(cleaned) / 100;
    }
  } else if (typeof value === "number") {
    numericValue = value;
  } else {
    numericValue = Number(value) || 0;
  }
  numericValue = parseFloat(numericValue.toFixed(2));
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value);

const calculateAvailableProfit = (
  transactions: Transaction[] = [],
  saldoData?: SaldoGatewaysData
): number => {
  if (!transactions.length) return 0;

  // Função para extrair valor e taxa da transação
  const extractValues = (tx: Transaction) => {
    const valor = Number(tx.amount ?? 0);
    const fee = Number(tx.amountFee ?? 0);
    return { valor, fee };
  };

  // Apenas transações aprovadas e do tipo depósito
  const approvedTx = transactions.filter(
    (tx) => tx.status === "APPROVED" && tx.transactionType !== "WITHDRAW"
  );

  if (!saldoData) {
    const totalProfit = approvedTx.reduce((acc, tx) => {
      const { valor, fee } = extractValues(tx);
      return acc + (valor - fee);
    }, 0);
    return totalProfit;
  }

  // Mapeia gateways positivos e seus saldos
  const saldoMap: Record<string, number> = {};
  saldoData.positivos.forEach((g) => {
    if (g.name) saldoMap[g.name.toLowerCase().trim()] = g.saldo;
  });

  // Map de paymentMethod para nomes de gateways
  const gatewayMap: Record<string, string> = {
    PIX: "xgate",
    CARD: "medusawhite",
    // adicione outros mapeamentos conforme necessário
  };

  let totalProfit = 0;

  approvedTx.forEach((tx) => {
    const txGatewayKey =
      gatewayMap[tx.paymentMethod ?? ""]?.toLowerCase() ??
      tx.paymentData?.name?.toLowerCase().trim() ??
      "";

    if (!txGatewayKey || !(txGatewayKey in saldoMap)) return;

    const { valor, fee } = extractValues(tx);

    const saldoDisponivel = saldoMap[txGatewayKey] ?? 0; // <-- valor padrão

    if (saldoDisponivel <= 0) return;

    // Lucro proporcional ao saldo disponível
    const valorConsiderado = Math.min(valor, saldoDisponivel);
    const taxaProporcional = fee * (valorConsiderado / valor);
    const lucroTx = valorConsiderado - taxaProporcional;
    totalProfit += lucroTx;

    // Atualiza saldo restante do gateway
    saldoMap[txGatewayKey] = saldoDisponivel - valorConsiderado;
  });

  return totalProfit;
};

const createMetricsFromData = (
  data: DashboardData,
  saldoData: SaldoGatewaysData,
  lucroDisponivel: number
): MetricCard[] => {
  const saldoGatewaysNumber =
    typeof data.saldoGateways === "number"
      ? data.saldoGateways
      : data.saldoGateways?.positivos?.reduce((acc, g) => acc + g.saldo, 0) ||
        0;

  return [
    {
      id: "lucro-disponivel",
      title: "Lucro Líquido",
      value: formatCurrency(lucroDisponivel),
      icon: <TrendingUp className="h-6 w-6" />,
      description:
        "Lucro líquido das transações aprovadas com saldo positivo nos gateways",
      color: "text-orange-600",
    },
    {
      id: "saldo-gateways",
      title: "Saldo Gateways",
      value: formatCurrency(saldoGatewaysNumber),
      icon: <DollarSign className="h-6 w-6" />,
      description: "Saldo total combinado das contas gateways (saldo positivo)",
      color: "text-teal-600",
    },
    {
      id: "total-carteiras",
      title: "Total em Carteiras",
      value: formatCurrency(Number(data.totalEmCarteiras.valor)),
      icon: <Wallet className="h-6 w-6" />,
      description: "Valor total em todas as carteiras",
      trend: {
        value: `${data.totalEmCarteiras.crescimento > 0 ? "+" : ""}${
          data.totalEmCarteiras.crescimento
        }%`,
        isPositive: data.totalEmCarteiras.crescimento > 0,
      },
      color: "text-blue-600",
    },

    {
      id: "transacoes-aprovadas",
      title: "Transações Aprovadas",
      value: formatNumber(data.transacoesAprovadas.valor),
      icon: <CheckCircle className="h-6 w-6" />,
      description: "Transações aprovadas hoje",
      trend: {
        value: `${data.transacoesAprovadas.crescimento > 0 ? "+" : ""}${
          data.transacoesAprovadas.crescimento
        }%`,
        isPositive: data.transacoesAprovadas.crescimento > 0,
      },
      color: "text-green-600",
    },
    {
      id: "transacoes-pendentes",
      title: "Transações Pendentes",
      value: formatNumber(data.transacoesPendentes.valor),
      icon: <Clock className="h-6 w-6" />,
      description: "Aguardando processamento",
      color: "text-yellow-600",
    },
    {
      id: "usuarios-cadastrados",
      title: "Usuários Cadastrados",
      value: formatNumber(data.usuariosCadastrados.valor),
      icon: <Users className="h-6 w-6" />,
      description: "Total de usuários ativos",
      trend: {
        value: `${data.usuariosCadastrados.crescimento > 0 ? "+" : ""}${
          data.usuariosCadastrados.crescimento
        }%`,
        isPositive: data.usuariosCadastrados.crescimento > 0,
      },
      color: "text-blue-600",
    },
    {
      id: "kyc-pendentes",
      title: "KYC Pendentes",
      value: formatNumber(data.kycPendentes.valor),
      icon: <FileText className="h-6 w-6" />,
      description: "Verificações KYC aguardando análise",
      color: "text-purple-600",
    },
    {
      id: "total-retiradas",
      title: "Total em Retiradas",
      value: formatNumber(data.totalEmRetiradas.valor),
      icon: <ArrowDown className="h-6 w-6" />,
      description: "Valor total retirado hoje",
      trend: {
        value: `${data.totalEmRetiradas.crescimento > 0 ? "+" : ""}${
          data.totalEmRetiradas.crescimento
        }%`,
        isPositive: data.totalEmRetiradas.crescimento > 0,
      },
      color: "text-indigo-600",
    },
    {
      id: "retiradas-pendentes",
      title: "Retiradas Pendentes",
      value: formatCurrency(Number(data.retiradasPendentes.valor)),
      icon: <Hourglass className="h-6 w-6" />,
      description: "Retiradas aguardando processamento",
      color: "text-amber-600",
    },
  ];
};

export function ManagerDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );

  // Filtros
  const [filterStartDate, setFilterStartDate] = useState<string | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<string | null>(null);
  const [filterAdquirente, setFilterAdquirente] = useState("");
  const [filterSeller, setFilterSeller] = useState<string>("Todos");

  interface Seller {
    id: string;
    name: string;
  }
  const [sellers, setSellers] = useState<Seller[]>([]);

  // Dados para selects dinâmicos
  const [adquirentes, setAdquirentes] = useState<string[]>([]);

  // UI e erros
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValuesVisible, setIsValuesVisible] = useState(true);

  // Filtro para saldo gateways (todos, positivos, negativos)
  const [saldoFilter, setSaldoFilter] = useState<
    "all" | "positivos" | "negativos"
  >("all");

  // Converte saldoGateways em objeto estruturado se possível
  const saldoData: SaldoGatewaysData =
    typeof dashboardData?.saldoGateways === "object"
      ? (dashboardData.saldoGateways as SaldoGatewaysData)
      : {
          saldoGateways:
            typeof dashboardData?.saldoGateways === "number"
              ? dashboardData.saldoGateways
              : 0,
          positivos: [],
          negativos: [],
          detalhado: [],
        };
  let saldoExibido = 0;

  if (saldoFilter === "all") {
    saldoExibido = saldoData.saldoGateways;
  } else if (saldoFilter === "positivos") {
    saldoExibido = saldoData.positivos.reduce((acc, cur) => acc + cur.saldo, 0);
  } else if (saldoFilter === "negativos") {
    saldoExibido = saldoData.negativos.reduce((acc, cur) => acc + cur.saldo, 0);
  }

  // Buscar sellers do backend para popular o select
  useEffect(() => {
    async function fetchAllSellers() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        let page = 1;
        let allSellers: Seller[] = [];
        let totalPages = 1;

        do {
          const res = await fetch(
            `https://shadowpay-api-production.up.railway.app/api/admin/sellers?page=${page}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const json = await res.json();

          if (!json.success) break;

          const { pagination, sellers } = json.data;

          totalPages = pagination.pages || 1;

          allSellers = allSellers.concat(
            sellers.map((s: any) => ({
              id: String(s.id),
              name: s.companyName || `Seller ${s.id}`,
            }))
          );

          page++;
        } while (page <= totalPages);

        setSellers(allSellers);
      } catch (error) {
        console.error("Erro ao buscar sellers", error);
        setSellers([]);
      }
    }

    fetchAllSellers();
  }, []);

  // Buscar adquirentes do backend para popular o select
  useEffect(() => {
    async function fetchAdquirentes() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("https://shadowpay-api-production.up.railway.app/api/admin/adquerers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const list = json.data.map((item: any) =>
            typeof item === "string" ? item : item.reference || item.name || ""
          );
          setAdquirentes(list);
        } else {
          setAdquirentes([]);
        }
      } catch (err) {
        console.error("Erro ao buscar adquirentes", err);
      }
    }
    fetchAdquirentes();
  }, []);

  const toggleValuesVisibility = () => setIsValuesVisible((prev) => !prev);
  const [dashboardCards, setDashboardCards] = useState<any[]>([]);
  const [transacoesDetalhadas, setTransacoesDetalhadas] = useState<
    Transaction[]
  >([]);

  // Buscar dados do dashboard com filtros
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token de acesso não encontrado");

      // Monta os parâmetros de filtro
      const params = new URLSearchParams();
      if (filterSeller && filterSeller !== "Todos")
        params.append("seller", filterSeller);
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);
      if (filterAdquirente && filterAdquirente !== "Todos")
        params.append("adquirente", filterAdquirente);

      const url = `https://shadowpay-api-production.up.railway.app/api/admin/dashboard/stats${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      // Busca os dados do dashboard
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`Erro na API: ${response.status}`);

      const result = await response.json();

      if (!result.success || !result.data)
        throw new Error("Dados inválidos recebidos da API");

      setDashboardData(result.data);

      // ----------------------------
      // Saldo dos gateways
      // ----------------------------
      const saldoData: SaldoGatewaysData = result.data
        .saldoGateways as SaldoGatewaysData;

      // ----------------------------
      // Buscar transações reais
      // ----------------------------
      const fetchTransactions = async (): Promise<Transaction[]> => {
        try {
          const token = localStorage.getItem("token");
          if (!token) throw new Error("Token de acesso não encontrado");

          const res = await axios.get(
            "https://shadowpay-api-production.up.railway.app/api/admin/transactions",
            {
              headers: { Authorization: `Bearer ${token}` },
              params: {
                startDate: filterStartDate,
                endDate: filterEndDate,
                status: "APPROVED",
              },
            }
          );
          return Array.isArray(res.data.data?.transactions)
            ? res.data.data.transactions
            : [];
        } catch (err) {
          console.error("Erro ao buscar transações:", err);
          return [];
        }
      };

      const transacoesDetalhadas = await fetchTransactions();
      setTransacoesDetalhadas(transacoesDetalhadas); // ← atualiza o esta

      // ----------------------------
      // Calcula lucro disponível respeitando saldo
      // ----------------------------
      const lucroDisponivel = calculateAvailableProfit(
        transacoesDetalhadas,
        saldoData
      );

      // ----------------------------
      // Atualiza cards do dashboard
      // ----------------------------
      const cardsData = [
        {
          id: "lucro-disponivel",
          title: "Lucro Líquido",
          value: formatCurrency(lucroDisponivel),
          icon: <TrendingUp className="h-6 w-6" />,
          description:
            "Lucro líquido das transações aprovadas com saldo positivo nos gateways",
          color: "text-orange-600",
        },
        // ... outros cards
      ];

      setDashboardCards(cardsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchDashboardData();
  };

  // Redirecionar se não for admin
  useEffect(() => {
    if (user && !user.isAdministrator) {
      router.push("/v1/dashboard");
    }
  }, [user, router]);

  // Carregar dados ao montar e quando filtros mudarem
  useEffect(() => {
    if (user?.isAdministrator) {
      fetchDashboardData();
    }
  }, [user]);

  if (!user?.isAdministrator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <ShieldX className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-red-600">
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Você não tem permissão para acessar o painel administrativo.
            </p>
            <p className="text-sm text-muted-foreground">
              Esta área é restrita apenas para administradores do sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Carregando dados do dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-red-600">
              Erro ao Carregar Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Nenhum dado disponível</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Não foi possível carregar os dados do dashboard.
            </p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Recarregar
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lucroDisponivel = calculateAvailableProfit(
    transacoesDetalhadas,
    saldoData
  );
  const metrics = createMetricsFromData(
    dashboardData,
    saldoData,
    lucroDisponivel
  );

  return (
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
                  <BreadcrumbItem>
                    <BreadcrumbPage>Painel Administrativo</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-6 p-4 pt-0 min-h-screen">
            {/* Título e descrição */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Painel Administrativo
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-lg font-semibold">
                  Bem-vindo, {user?.companyName || "Usuário"}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleValuesVisibility}
                  className="cursor-pointer"
                >
                  {isValuesVisible ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground">
                Visão geral das métricas e indicadores da plataforma Safira
                Cash.
              </p>
            </div>

            {/* Formulário de filtros */}
            <form
              onSubmit={handleSearch}
              className="p-6 rounded-md shadow-md border border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                {/* Select Sellers */}
                <div className="flex flex-col">
                  <Label
                    htmlFor="filter-seller"
                    className="mb-1 text-sm font-semibold text-gray-700"
                  >
                    Seller
                  </Label>
                  <Select onValueChange={setFilterSeller} value={filterSeller}>
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="Selecione o Seller" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="Todos">Todos</SelectItem>
                      {sellers.map((seller) => (
                        <SelectItem
                          key={seller.id}
                          value={seller.id || seller.name}
                        >
                          {seller.name || seller.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Início */}
                <div className="flex flex-col">
                  <Label
                    htmlFor="filter-start-date"
                    className="mb-1 text-sm font-semibold text-gray-700"
                  >
                    Data Início
                  </Label>
                  <Input
                    id="filter-start-date"
                    type="date"
                    value={filterStartDate ?? ""}
                    onChange={(e) => setFilterStartDate(e.target.value || null)}
                    className="w-full cursor-pointer"
                  />
                </div>

                {/* Data Fim */}
                <div className="flex flex-col">
                  <Label
                    htmlFor="filter-end-date"
                    className="mb-1 text-sm font-semibold text-gray-700"
                  >
                    Data Fim
                  </Label>
                  <Input
                    id="filter-end-date"
                    type="date"
                    value={filterEndDate ?? ""}
                    onChange={(e) => setFilterEndDate(e.target.value || null)}
                    className="w-full cursor-pointer"
                  />
                </div>

                {/* Select Adquirentes (Carteiras) */}
                <div className="flex flex-col">
                  <Label
                    htmlFor="filter-adquirente"
                    className="mb-1 text-sm font-semibold text-gray-700"
                  >
                    Adquirente
                  </Label>
                  <Select
                    onValueChange={setFilterAdquirente}
                    value={filterAdquirente}
                  >
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="Selecione o Adquirente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Todos</SelectItem>
                      {adquirentes.map((item, idx) => (
                        <SelectItem key={idx} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Botão Buscar */}
                <div className="flex justify-start md:justify-end">
                  <Button
                    type="submit"
                    className="h-10 cursor-pointer px-6"
                    variant="default"
                  >
                    Buscar
                  </Button>
                </div>
              </div>
            </form>

            {/* Botão Atualizar */}
            <div className="flex justify-end mt-4 mb-4">
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                {loading ? "Atualizando..." : "Atualizar Dados"}
              </button>
            </div>

            {/* Cards de métricas */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {metrics.map((metric) => (
                <Card key={metric.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`${metric.color}`}>{metric.icon}</div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {metric.title}
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">
                        {isValuesVisible ? metric.value : "••••••"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {metric.description}
                      </p>
                    </div>

                    {metric.trend && (
                      <div className="flex items-center gap-2 pt-2">
                        <div
                          className={`flex items-center gap-1 text-sm font-medium ${
                            metric.trend.isPositive
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          <Activity className="h-3 w-3" />
                          {metric.trend.value}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          vs. período anterior
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {/* Card do saldo com filtro */}
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-purple-600">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Saldo{" "}
                        {saldoFilter === "all"
                          ? "Total"
                          : saldoFilter === "positivos"
                          ? "Positivo"
                          : "Negativo"}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <p
                      className={`text-2xl font-bold ${
                        saldoExibido < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {saldoExibido < 0
                        ? `-${formatCurrency(Math.abs(saldoExibido))}`
                        : formatCurrency(saldoExibido)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Saldo{" "}
                      {saldoFilter === "all"
                        ? "total combinado"
                        : saldoFilter === "positivos"
                        ? "somente contas positivas"
                        : "somente contas negativas"}
                    </p>

                    <div className="flex gap-2 pt-2">
                      <Button
                        className="cursor-pointer"
                        size="sm"
                        variant={saldoFilter === "all" ? "default" : "outline"}
                        onClick={() => setSaldoFilter("all")}
                      >
                        Todos
                      </Button>
                      <Button
                        className="cursor-pointer"
                        size="sm"
                        variant={
                          saldoFilter === "positivos" ? "default" : "outline"
                        }
                        onClick={() => setSaldoFilter("positivos")}
                      >
                        Positivos
                      </Button>
                      <Button
                        className="cursor-pointer"
                        size="sm"
                        variant={
                          saldoFilter === "negativos" ? "default" : "outline"
                        }
                        onClick={() => setSaldoFilter("negativos")}
                      >
                        Negativos
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumo Financeiro, Transações e Usuários */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Resumo Financeiro */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Resumo Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Total em Carteiras
                      </span>
                      <span className="font-medium">
                        {formatCurrency(
                          Number(
                            dashboardData.resumoFinanceiro.totalEmCarteiras
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Lucro Líquido
                      </span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(
                          Number(dashboardData.resumoFinanceiro.lucroLiquido)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Total Retiradas
                      </span>
                      <span className="font-medium">
                        {formatNumber(
                          dashboardData.resumoFinanceiro.totalRetiradas
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Pendentes
                      </span>
                      <span className="font-medium text-amber-600">
                        {formatCurrency(
                          Number(dashboardData.resumoFinanceiro.pendentes)
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo de Transações */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Transações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Aprovadas
                      </span>
                      <span className="font-medium text-green-600">
                        {formatNumber(dashboardData.transacoes.aprovadas)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Pendentes
                      </span>
                      <span className="font-medium text-yellow-600">
                        {formatNumber(dashboardData.transacoes.pendentes)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Em Análise
                      </span>
                      <span className="font-medium text-orange-600">
                        {formatNumber(dashboardData.transacoes.emAnalise)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Total Processadas
                      </span>
                      <span className="font-medium">
                        {formatNumber(
                          dashboardData.transacoes.totalProcessadas
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo de Usuários */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Cadastrados
                      </span>
                      <span className="font-medium text-blue-600">
                        {formatNumber(dashboardData.usuarios.cadastrados)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Bloqueados
                      </span>
                      <span className="font-medium text-red-600">
                        {formatNumber(dashboardData.usuarios.bloqueados)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        KYC Pendentes
                      </span>
                      <span className="font-medium text-purple-600">
                        {formatNumber(dashboardData.usuarios.kycPendentes)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Taxa de Aprovação
                      </span>
                      <span className="font-medium text-green-600">
                        {dashboardData.usuarios.taxaAprovacao}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default function ManagerDashboard() {
  return (
    <ProtectedRoute>
      <ManagerDashboardContent />
    </ProtectedRoute>
  );
}

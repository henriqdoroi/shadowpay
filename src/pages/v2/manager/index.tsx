import { AppSidebar } from "@/components/app-sidebar";
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
  RefreshCw,
  Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import axios from "axios";
import Head from "next/head";
import { motion } from "framer-motion";
import ShadowPanel from "@/components/ShadowPanel";

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
  accent: string;
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
  transactionType?: string;
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
  totalEmCarteiras: { valor: string; crescimento: number };
  lucroLiquido: { valor: string; crescimento: number };
  transacoesAprovadas: { valor: number; crescimento: number };
  transacoesPendentes: { valor: number };
  usuariosCadastrados: { valor: number; crescimento: number };
  kycPendentes: { valor: number };
  totalEmRetiradas: { valor: number; crescimento: number };
  retiradasPendentes: { valor: string };
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
  new Intl.NumberFormat("pt-BR").format(value || 0);

const calculateAvailableProfit = (
  transactions: Transaction[] = [],
  saldoData?: SaldoGatewaysData
): number => {
  if (!transactions.length) return 0;

  const extractValues = (tx: Transaction) => {
    const valor = Number(tx.amount ?? 0);
    const fee = Number(tx.amountFee ?? 0);
    return { valor, fee };
  };

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

  const saldoMap: Record<string, number> = {};
  saldoData.positivos.forEach((g) => {
    if (g.name) saldoMap[g.name.toLowerCase().trim()] = g.saldo;
  });

  const gatewayMap: Record<string, string> = {
    PIX: "xgate",
    CARD: "medusawhite",
  };

  let totalProfit = 0;

  approvedTx.forEach((tx) => {
    const txGatewayKey =
      gatewayMap[tx.paymentMethod ?? ""]?.toLowerCase() ??
      tx.paymentData?.name?.toLowerCase().trim() ??
      "";

    if (!txGatewayKey || !(txGatewayKey in saldoMap)) return;

    const { valor, fee } = extractValues(tx);

    const saldoDisponivel = saldoMap[txGatewayKey] ?? 0;

    if (saldoDisponivel <= 0) return;

    const valorConsiderado = Math.min(valor, saldoDisponivel);
    const taxaProporcional = fee * (valorConsiderado / valor);
    const lucroTx = valorConsiderado - taxaProporcional;
    totalProfit += lucroTx;

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
      icon: <TrendingUp className="h-4 w-4" />,
      description: "Lucro líquido das transações aprovadas",
      accent: "#F59E0B",
    },
    {
      id: "saldo-gateways",
      title: "Saldo Gateways",
      value: formatCurrency(saldoGatewaysNumber),
      icon: <DollarSign className="h-4 w-4" />,
      description: "Saldo combinado das contas gateways",
      accent: "#22D3EE",
    },
    {
      id: "total-carteiras",
      title: "Total em Carteiras",
      value: formatCurrency(Number(data.totalEmCarteiras.valor)),
      icon: <Wallet className="h-4 w-4" />,
      description: "Valor total em todas as carteiras",
      trend: {
        value: `${data.totalEmCarteiras.crescimento > 0 ? "+" : ""}${
          data.totalEmCarteiras.crescimento
        }%`,
        isPositive: data.totalEmCarteiras.crescimento > 0,
      },
      accent: "#8B5CF6",
    },
    {
      id: "transacoes-aprovadas",
      title: "Transações Aprovadas",
      value: formatNumber(data.transacoesAprovadas.valor),
      icon: <CheckCircle className="h-4 w-4" />,
      description: "Transações aprovadas hoje",
      trend: {
        value: `${data.transacoesAprovadas.crescimento > 0 ? "+" : ""}${
          data.transacoesAprovadas.crescimento
        }%`,
        isPositive: data.transacoesAprovadas.crescimento > 0,
      },
      accent: "#34D399",
    },
    {
      id: "transacoes-pendentes",
      title: "Transações Pendentes",
      value: formatNumber(data.transacoesPendentes.valor),
      icon: <Clock className="h-4 w-4" />,
      description: "Aguardando processamento",
      accent: "#FBBF24",
    },
    {
      id: "usuarios-cadastrados",
      title: "Usuários Cadastrados",
      value: formatNumber(data.usuariosCadastrados.valor),
      icon: <Users className="h-4 w-4" />,
      description: "Total de usuários ativos",
      trend: {
        value: `${data.usuariosCadastrados.crescimento > 0 ? "+" : ""}${
          data.usuariosCadastrados.crescimento
        }%`,
        isPositive: data.usuariosCadastrados.crescimento > 0,
      },
      accent: "#6366F1",
    },
    {
      id: "kyc-pendentes",
      title: "KYC Pendentes",
      value: formatNumber(data.kycPendentes.valor),
      icon: <FileText className="h-4 w-4" />,
      description: "Verificações KYC aguardando análise",
      accent: "#A78BFA",
    },
    {
      id: "total-retiradas",
      title: "Total em Retiradas",
      value: formatNumber(data.totalEmRetiradas.valor),
      icon: <ArrowDown className="h-4 w-4" />,
      description: "Valor total retirado hoje",
      trend: {
        value: `${data.totalEmRetiradas.crescimento > 0 ? "+" : ""}${
          data.totalEmRetiradas.crescimento
        }%`,
        isPositive: data.totalEmRetiradas.crescimento > 0,
      },
      accent: "#818CF8",
    },
    {
      id: "retiradas-pendentes",
      title: "Retiradas Pendentes",
      value: formatCurrency(Number(data.retiradasPendentes.valor)),
      icon: <Hourglass className="h-4 w-4" />,
      description: "Retiradas aguardando processamento",
      accent: "#F59E0B",
    },
  ];
};

const SHADOW_BG =
  "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

export function ManagerDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );

  const [filterStartDate, setFilterStartDate] = useState<string | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<string | null>(null);
  const [filterAdquirente, setFilterAdquirente] = useState("");
  const [filterSeller, setFilterSeller] = useState<string>("Todos");

  interface Seller {
    id: string;
    name: string;
  }
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [adquirentes, setAdquirentes] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValuesVisible, setIsValuesVisible] = useState(true);

  const [saldoFilter, setSaldoFilter] = useState<
    "all" | "positivos" | "negativos"
  >("all");

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

  useEffect(() => {
    async function fetchAdquirentes() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(
          "https://shadowpay-api-production.up.railway.app/api/admin/adquerers",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
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
  const [transacoesDetalhadas, setTransacoesDetalhadas] = useState<
    Transaction[]
  >([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token de acesso não encontrado");

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
      setTransacoesDetalhadas(transacoesDetalhadas);
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

  useEffect(() => {
    if (user && !user.isAdministrator) {
      router.push("/v1/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.isAdministrator) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Estilos compartilhados
  const inputCls =
    "h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/[0.05] [color-scheme:dark]";
  const selectCls =
    "h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white outline-none transition-colors focus:border-violet-500/50 [color-scheme:dark]";

  // Estados de erro/sem dados/loading
  if (user && !user.isAdministrator) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4 text-white"
        style={{ background: SHADOW_BG }}
      >
        <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.025] p-8 text-center backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15">
            <ShieldX className="h-6 w-6 text-rose-300" />
          </div>
          <h2
            className="text-xl font-semibold text-rose-300"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            Acesso Negado
          </h2>
          <p className="mt-2 text-sm text-white/55">
            Você não tem permissão para acessar o painel administrativo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>ShadowPay — Painel Admin</title>
      </Head>

      <div className="min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset
            className="text-white"
            style={{ background: SHADOW_BG }}
          >
            <header className="flex flex-col gap-4 px-4 pt-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-white/60 hover:text-white" />
                <div>
                  <h1
                    className="text-2xl font-bold tracking-tight text-white md:text-[28px]"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Painel Administrativo
                  </h1>
                  <p className="mt-1 text-xs text-white/40">
                    Bem-vindo, {user?.companyName || "Operador"} · métricas em
                    tempo real
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleValuesVisibility}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/55 hover:bg-white/[0.07] hover:text-white"
                  aria-label="Alternar valores"
                >
                  {isValuesVisible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  {loading ? "Atualizando…" : "Atualizar"}
                </button>
              </div>
            </header>

            <main className="flex flex-col gap-5 p-4 lg:p-8">
              {/* Filtros */}
              <motion.form
                onSubmit={handleSearch}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
              >
                <div className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                  <Filter className="h-3.5 w-3.5" /> Filtrar dados
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                  <div>
                    <label className="mb-1.5 block text-xs text-white/50">
                      Seller
                    </label>
                    <select
                      className={selectCls}
                      value={filterSeller}
                      onChange={(e) => setFilterSeller(e.target.value)}
                    >
                      <option value="Todos" className="bg-[#0B1020]">
                        Todos
                      </option>
                      {sellers.map((seller) => (
                        <option
                          key={seller.id}
                          value={seller.id || seller.name}
                          className="bg-[#0B1020]"
                        >
                          {seller.name || seller.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs text-white/50">
                      Data Início
                    </label>
                    <input
                      type="date"
                      value={filterStartDate ?? ""}
                      onChange={(e) =>
                        setFilterStartDate(e.target.value || null)
                      }
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs text-white/50">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      value={filterEndDate ?? ""}
                      onChange={(e) => setFilterEndDate(e.target.value || null)}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs text-white/50">
                      Adquirente
                    </label>
                    <select
                      className={selectCls}
                      value={filterAdquirente}
                      onChange={(e) => setFilterAdquirente(e.target.value)}
                    >
                      <option value="" className="bg-[#0B1020]">
                        Todos
                      </option>
                      {adquirentes.map((item, idx) => (
                        <option key={idx} value={item} className="bg-[#0B1020]">
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                      style={{
                        background: "linear-gradient(120deg, #7C3AED, #6366F1)",
                        boxShadow: "0 14px 36px -14px rgba(124,58,237,0.7)",
                      }}
                    >
                      Buscar
                    </button>
                  </div>
                </div>
              </motion.form>

              {loading && !dashboardData ? (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center backdrop-blur-xl">
                  <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin text-violet-300" />
                  <p className="text-sm text-white/60">
                    Carregando dados do dashboard…
                  </p>
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.07] p-5">
                  <div className="mb-2 flex items-center gap-2 text-rose-300">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">Erro ao carregar</span>
                  </div>
                  <p className="text-sm text-rose-200/80">{error}</p>
                  <button
                    onClick={fetchDashboardData}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : !dashboardData ? (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center backdrop-blur-xl">
                  <p className="text-sm text-white/60">Nenhum dado disponível</p>
                </div>
              ) : (
                <>
                  {/* Metrics grid */}
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {createMetricsFromData(
                      dashboardData,
                      saldoData,
                      calculateAvailableProfit(transacoesDetalhadas, saldoData)
                    ).map((metric, i) => (
                      <motion.div
                        key={metric.id}
                        initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{
                          duration: 0.7,
                          delay: i * 0.04,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                      >
                        <div
                          className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-80"
                          style={{ background: `${metric.accent}22` }}
                        />
                        <div className="relative mb-4 flex items-center gap-2.5">
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{
                              background: `${metric.accent}1f`,
                              color: metric.accent,
                            }}
                          >
                            {metric.icon}
                          </span>
                          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                            {metric.title}
                          </span>
                        </div>
                        <div
                          className="relative text-2xl font-semibold tracking-tight text-white"
                          style={{ fontFamily: "'Clash Display', sans-serif" }}
                        >
                          {isValuesVisible ? metric.value : "••••••"}
                        </div>
                        <p className="relative mt-1.5 text-xs text-white/35">
                          {metric.description}
                        </p>
                        {metric.trend && (
                          <div className="relative mt-2 flex items-center gap-2">
                            <span
                              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                metric.trend.isPositive
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-rose-500/15 text-rose-300"
                              }`}
                            >
                              <Activity className="h-3 w-3" />
                              {metric.trend.value}
                            </span>
                            <span className="text-[10px] text-white/35">
                              vs. período anterior
                            </span>
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {/* Card de saldo com filtro */}
                    <motion.div
                      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{
                        duration: 0.7,
                        delay: 0.4,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                    >
                      <div
                        className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl"
                        style={{ background: "#A78BFA22" }}
                      />
                      <div className="relative mb-4 flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                          <Wallet className="h-4 w-4" />
                        </span>
                        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                          Saldo{" "}
                          {saldoFilter === "all"
                            ? "Total"
                            : saldoFilter === "positivos"
                            ? "Positivo"
                            : "Negativo"}
                        </span>
                      </div>
                      <div
                        className={`relative text-2xl font-semibold tracking-tight ${
                          saldoExibido < 0 ? "text-rose-300" : "text-emerald-300"
                        }`}
                        style={{ fontFamily: "'Clash Display', sans-serif" }}
                      >
                        {isValuesVisible
                          ? saldoExibido < 0
                            ? `-${formatCurrency(Math.abs(saldoExibido))}`
                            : formatCurrency(saldoExibido)
                          : "••••••"}
                      </div>
                      <p className="relative mt-1.5 text-xs text-white/35">
                        Saldo{" "}
                        {saldoFilter === "all"
                          ? "total combinado"
                          : saldoFilter === "positivos"
                          ? "somente contas positivas"
                          : "somente contas negativas"}
                      </p>
                      <div className="relative mt-3 flex gap-1.5">
                        {(["all", "positivos", "negativos"] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setSaldoFilter(f)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                              saldoFilter === f
                                ? "bg-violet-500/20 text-violet-200"
                                : "border border-white/[0.08] bg-white/[0.03] text-white/60 hover:bg-white/[0.07]"
                            }`}
                          >
                            {f === "all"
                              ? "Todos"
                              : f === "positivos"
                              ? "Positivos"
                              : "Negativos"}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Summary grid */}
                  <div className="grid gap-4 lg:grid-cols-3">
                    {/* Resumo Financeiro */}
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.7,
                        delay: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                    >
                      <div className="mb-4 flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                          <DollarSign className="h-4 w-4" />
                        </span>
                        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                          Resumo financeiro
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          {
                            l: "Total em Carteiras",
                            v: formatCurrency(
                              Number(
                                dashboardData.resumoFinanceiro.totalEmCarteiras
                              )
                            ),
                            c: "text-white/85",
                          },
                          {
                            l: "Lucro Líquido",
                            v: formatCurrency(
                              Number(dashboardData.resumoFinanceiro.lucroLiquido)
                            ),
                            c: "text-emerald-400",
                          },
                          {
                            l: "Total Retiradas",
                            v: formatNumber(
                              dashboardData.resumoFinanceiro.totalRetiradas
                            ),
                            c: "text-white/85",
                          },
                          {
                            l: "Pendentes",
                            v: formatCurrency(
                              Number(dashboardData.resumoFinanceiro.pendentes)
                            ),
                            c: "text-amber-300",
                          },
                        ].map((row) => (
                          <div
                            key={row.l}
                            className="flex items-center justify-between border-b border-white/[0.04] pb-2 last:border-none last:pb-0"
                          >
                            <span className="text-xs text-white/50">{row.l}</span>
                            <span className={`text-sm font-semibold ${row.c}`}>
                              {isValuesVisible ? row.v : "••••"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Transações */}
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.7,
                        delay: 0.56,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                    >
                      <div className="mb-4 flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
                          <Activity className="h-4 w-4" />
                        </span>
                        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                          Transações
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          {
                            l: "Aprovadas",
                            v: formatNumber(dashboardData.transacoes.aprovadas),
                            c: "text-emerald-400",
                          },
                          {
                            l: "Pendentes",
                            v: formatNumber(dashboardData.transacoes.pendentes),
                            c: "text-amber-300",
                          },
                          {
                            l: "Em Análise",
                            v: formatNumber(dashboardData.transacoes.emAnalise),
                            c: "text-orange-300",
                          },
                          {
                            l: "Total Processadas",
                            v: formatNumber(
                              dashboardData.transacoes.totalProcessadas
                            ),
                            c: "text-white/85",
                          },
                        ].map((row) => (
                          <div
                            key={row.l}
                            className="flex items-center justify-between border-b border-white/[0.04] pb-2 last:border-none last:pb-0"
                          >
                            <span className="text-xs text-white/50">{row.l}</span>
                            <span className={`text-sm font-semibold ${row.c}`}>
                              {row.v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Usuários */}
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.7,
                        delay: 0.62,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                    >
                      <div className="mb-4 flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                          <Users className="h-4 w-4" />
                        </span>
                        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                          Usuários
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          {
                            l: "Cadastrados",
                            v: formatNumber(dashboardData.usuarios.cadastrados),
                            c: "text-sky-300",
                          },
                          {
                            l: "Bloqueados",
                            v: formatNumber(dashboardData.usuarios.bloqueados),
                            c: "text-rose-300",
                          },
                          {
                            l: "KYC Pendentes",
                            v: formatNumber(dashboardData.usuarios.kycPendentes),
                            c: "text-violet-300",
                          },
                          {
                            l: "Taxa de Aprovação",
                            v: `${dashboardData.usuarios.taxaAprovacao}%`,
                            c: "text-emerald-400",
                          },
                        ].map((row) => (
                          <div
                            key={row.l}
                            className="flex items-center justify-between border-b border-white/[0.04] pb-2 last:border-none last:pb-0"
                          >
                            <span className="text-xs text-white/50">{row.l}</span>
                            <span className={`text-sm font-semibold ${row.c}`}>
                              {row.v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </>
              )}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <ShadowPanel />
      </div>
    </>
  );
}

export default function ManagerDashboard() {
  return (
    <ProtectedRoute>
      <ManagerDashboardContent />
    </ProtectedRoute>
  );
}

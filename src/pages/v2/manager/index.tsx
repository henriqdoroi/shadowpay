"use client";

import { useEffect, useState } from "react";
import { useValuesVisible } from "@/lib/useValuesVisible";
import { useAuth } from "@/contexts/AuthContext";
import { PushPromptBanner } from "@/components/PushPromptBanner";
import { useRouter } from "next/router";
import axios from "axios";
import Head from "next/head";
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
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import { PeriodPicker } from "@/components/PeriodPicker";
import { resolvePeriod, type Period } from "@/lib/period";
import { IconChip, type Tone } from "@/components/PanelBits";

/* cor de cada métrica pelo que ela significa (dinheiro, pendência, gente...) */
const METRIC_TONE: Record<string, Tone> = {
  lucro: "violet",
  saldoGw: "blue",
  carteiras: "violet",
  txAp: "green",
  txPend: "amber",
  usuarios: "blue",
  kycPend: "amber",
  totalRet: "teal",
  retPend: "amber",
};

const API = "https://shadowpay-backend.onrender.com";

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
  status?: string;
  paymentMethod?: string;
  paymentData?: { name?: string };
  transactionType?: string;
}
interface DashboardData {
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

function fmtCurrency(value: any): string {
  if (value === null || value === undefined || value === "") return "R$ 0,00";
  let n: number;
  if (typeof value === "string") {
    const c = value.trim();
    if (c.match(/[\.,]/)) {
      const norm = c.replace(/\./g, "").replace(",", ".");
      n = parseFloat(norm);
    } else {
      n = parseFloat(c) / 100;
    }
  } else if (typeof value === "number") {
    n = value;
  } else {
    n = Number(value) || 0;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(parseFloat(n.toFixed(2)));
}
const fmtNum = (v: number) =>
  new Intl.NumberFormat("pt-BR").format(v || 0);

function calcProfit(
  txs: Transaction[] = [],
  saldoData?: SaldoGatewaysData
): number {
  if (!txs.length) return 0;
  const extract = (tx: Transaction) => ({
    valor: Number(tx.amount ?? 0),
    fee: Number(tx.amountFee ?? 0),
  });
  const approved = txs.filter(
    (tx) => tx.status === "APPROVED" && tx.transactionType !== "WITHDRAW"
  );
  if (!saldoData) {
    return approved.reduce((acc, tx) => {
      const { valor, fee } = extract(tx);
      return acc + (valor - fee);
    }, 0);
  }
  const saldoMap: Record<string, number> = {};
  saldoData.positivos.forEach((g) => {
    if (g.name) saldoMap[g.name.toLowerCase().trim()] = g.saldo;
  });
  const gatewayMap: Record<string, string> = {
    PIX: "xgate",
    CARD: "medusawhite",
  };
  let total = 0;
  approved.forEach((tx) => {
    const key =
      gatewayMap[tx.paymentMethod ?? ""]?.toLowerCase() ??
      tx.paymentData?.name?.toLowerCase().trim() ??
      "";
    if (!key || !(key in saldoMap)) return;
    const { valor, fee } = extract(tx);
    const disp = saldoMap[key] ?? 0;
    if (disp <= 0) return;
    const considerado = Math.min(valor, disp);
    const taxaProp = fee * (considerado / valor);
    total += considerado - taxaProp;
    saldoMap[key] = disp - considerado;
  });
  return total;
}

function ManagerDashboardContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  // período (mesmo seletor do dashboard): "Máximo" = sem filtro de data
  const [period, setPeriod] = useState<Period>({ preset: "max" });
  const range = resolvePeriod(period);
  const filterStartDate = range.start ? range.start.toISOString() : null;
  const filterEndDate = range.end ? range.end.toISOString() : null;
  const [filterAdquirente, setFilterAdquirente] = useState("");
  const [filterSeller, setFilterSeller] = useState<string>("Todos");
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [adquirentes, setAdquirentes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Olho da barra do topo (salvo no navegador, igual em todas as páginas)
  const [visible, toggleVisible] = useValuesVisible();
  const [saldoFilter, setSaldoFilter] = useState<"all" | "positivos" | "negativos">(
    "all"
  );
  const [txs, setTxs] = useState<Transaction[]>([]);

  const saldoData: SaldoGatewaysData =
    typeof data?.saldoGateways === "object"
      ? (data.saldoGateways as SaldoGatewaysData)
      : {
          saldoGateways:
            typeof data?.saldoGateways === "number" ? data.saldoGateways : 0,
          positivos: [],
          negativos: [],
          detalhado: [],
        };

  let saldoExibido = 0;
  if (saldoFilter === "all") saldoExibido = saldoData.saldoGateways;
  else if (saldoFilter === "positivos")
    saldoExibido = saldoData.positivos.reduce((a, c) => a + c.saldo, 0);
  else saldoExibido = saldoData.negativos.reduce((a, c) => a + c.saldo, 0);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        let page = 1,
          all: any[] = [],
          totalPages = 1;
        do {
          const r = await fetch(
            `${API}/api/admin/sellers?page=${page}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const j = await r.json();
          if (!j.success) break;
          const { pagination, sellers: s } = j.data;
          totalPages = pagination.pages || 1;
          all = all.concat(
            s.map((sl: any) => ({
              id: String(sl.id),
              name: sl.companyName || `Seller ${sl.id}`,
            }))
          );
          page++;
        } while (page <= totalPages);
        setSellers(all);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const r = await fetch(`${API}/api/admin/adquerers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await r.json();
        if (j.success && Array.isArray(j.data)) {
          setAdquirentes(
            j.data.map((item: any) =>
              typeof item === "string" ? item : item.reference || item.name || ""
            )
          );
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado");
      const params = new URLSearchParams();
      if (filterSeller && filterSeller !== "Todos")
        params.append("seller", filterSeller);
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);
      if (filterAdquirente && filterAdquirente !== "Todos")
        params.append("adquirente", filterAdquirente);
      const url = `${API}/api/admin/dashboard/stats${
        params.toString() ? `?${params}` : ""
      }`;
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`Erro ${r.status}`);
      const result = await r.json();
      if (!result.success || !result.data) throw new Error("Dados inválidos");
      setData(result.data);
      try {
        const tr = await axios.get(`${API}/api/admin/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            startDate: filterStartDate,
            endDate: filterEndDate,
            status: "APPROVED",
          },
        });
        setTxs(
          Array.isArray(tr.data.data?.transactions)
            ? tr.data.data.transactions
            : []
        );
      } catch (e) {
        console.error(e);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !user.isAdministrator) router.push("/v1/dashboard");
  }, [user, router]);

  // carrega na entrada e de novo quando o período muda (os outros filtros usam "Buscar")
  useEffect(() => {
    if (user?.isAdministrator) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, period]);

  const inputCls =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100";

  if (user && !user.isAdministrator) {
    return (
      <LightShell>
        <div className="mx-auto max-w-md py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
            <ShieldX className="h-6 w-6 text-rose-600" />
          </div>
          <h2
            className="text-xl font-semibold text-rose-700"
            style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
          >
            Acesso negado
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Você não tem permissão para acessar o painel administrativo.
          </p>
        </div>
      </LightShell>
    );
  }

  const metrics = data
    ? [
        {
          id: "lucro",
          title: "Lucro líquido",
          value: fmtCurrency(calcProfit(txs, saldoData)),
          icon: <TrendingUp className="h-4 w-4" />,
          color: "#F59E0B",
        },
        {
          id: "saldoGw",
          title: "Saldo nas adquirentes",
          value: fmtCurrency(
            typeof data.saldoGateways === "number"
              ? data.saldoGateways
              : (data.saldoGateways as SaldoGatewaysData)?.positivos?.reduce(
                  (a, g) => a + g.saldo,
                  0
                ) || 0
          ),
          icon: <DollarSign className="h-4 w-4" />,
          color: "#22D3EE",
        },
        {
          id: "carteiras",
          title: "Total em carteiras",
          value: fmtCurrency(Number(data.totalEmCarteiras.valor)),
          icon: <Wallet className="h-4 w-4" />,
          color: "#8A1EF7",
        },
        {
          id: "txAp",
          title: "Transações aprovadas",
          value: fmtNum(data.transacoesAprovadas.valor),
          icon: <CheckCircle className="h-4 w-4" />,
          color: "#22C55E",
        },
        {
          id: "txPend",
          title: "Transações pendentes",
          value: fmtNum(data.transacoesPendentes.valor),
          icon: <Clock className="h-4 w-4" />,
          color: "#FBBF24",
        },
        {
          id: "usuarios",
          title: "Usuários cadastrados",
          value: fmtNum(data.usuariosCadastrados.valor),
          icon: <Users className="h-4 w-4" />,
          color: "#6366F1",
        },
        {
          id: "kycPend",
          title: "KYC pendentes",
          value: fmtNum(data.kycPendentes.valor),
          icon: <FileText className="h-4 w-4" />,
          color: "#B552F9",
        },
        {
          id: "totalRet",
          title: "Total em retiradas",
          value: fmtNum(data.totalEmRetiradas.valor),
          icon: <ArrowDown className="h-4 w-4" />,
          color: "#818CF8",
        },
        {
          id: "retPend",
          title: "Retiradas pendentes",
          value: fmtCurrency(Number(data.retiradasPendentes.valor)),
          icon: <Hourglass className="h-4 w-4" />,
          color: "#F59E0B",
        },
      ]
    : [];

  return (
    <>
      <Head>
        <title>ShadowPay — Painel Admin</title>
      </Head>
      <LightShell
        valuesVisible={visible}
        onToggleValues={toggleVisible}
      >
        <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:gap-4 sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-[22px] font-semibold sm:text-[26px] text-slate-900"
              style={{
                fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                letterSpacing: "-0.005em",
              }}
            >
              Painel administrativo
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              Visão geral da plataforma.
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
        </header>

        {/* Convite pra ativar as notificações neste aparelho */}
        <PushPromptBanner token={token} />

        {/* Filtros */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchData();
          }}
          className="mb-6 rounded-xl p-5"
          style={{
            background: "#FFFFFF",
            border: "1px solid #ECECF0",
          }}
        >
          <div className="mb-4 text-[15px] font-semibold text-slate-900">
            Filtrar dados
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-600">
                Seller
              </label>
              <select
                className={inputCls}
                value={filterSeller}
                onChange={(e) => setFilterSeller(e.target.value)}
              >
                <option value="Todos">Todos</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id || s.name}>
                    {s.name || s.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="mb-1.5 block text-[13px] font-medium text-slate-600">
                Período
              </label>
              <PeriodPicker value={period} onChange={setPeriod} block />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-600">
                Adquirente
              </label>
              <select
                className={inputCls}
                value={filterAdquirente}
                onChange={(e) => setFilterAdquirente(e.target.value)}
              >
                <option value="">Todos</option>
                {adquirentes.map((a, i) => (
                  <option key={i} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium text-white transition-colors hover:bg-[#6C0DE0]"
                style={{
                  background: "#8A1EF7",
                }}
              >
                Buscar
              </button>
            </div>
          </div>
        </form>

        {loading && !data ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{
              background: "#FFFFFF",
              border: "1px solid #ECECF0",
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            }}
          >
            <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin text-violet-400" />
            <p className="text-sm text-slate-500">Carregando…</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
            <div className="mb-2 flex items-center gap-2 text-rose-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Erro ao carregar</span>
            </div>
            <p className="text-sm text-rose-700/80">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
            >
              Tentar novamente
            </button>
          </div>
        ) : !data ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Nenhum dado disponível
          </div>
        ) : (
          <>
            <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {metrics.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl p-3 sm:p-4 md:p-5"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #ECECF0",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <IconChip tone={METRIC_TONE[m.id] ?? "violet"}>{m.icon}</IconChip>
                    <p className="text-[13px] font-medium text-slate-500">
                      {m.title}
                    </p>
                  </div>
                  <div
                    className="mt-3 text-[22px] font-semibold tabular-nums text-slate-900"
                    style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
                  >
                    {visible ? m.value : "••••••"}
                  </div>
                </div>
              ))}

              {/* Card saldo com filtro */}
              <div
                className="rounded-xl p-3 sm:p-4 md:p-5"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #ECECF0",
                }}
              >
                <p className="text-[13px] font-medium text-slate-500">
                  Saldo{" "}
                  {saldoFilter === "all"
                    ? "total"
                    : saldoFilter === "positivos"
                    ? "positivo"
                    : "negativo"}
                </p>
                <div
                  className={`mt-1.5 text-[22px] font-semibold tabular-nums ${
                    saldoExibido < 0 ? "text-rose-700" : "text-emerald-700"
                  }`}
                  style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
                >
                  {visible
                    ? saldoExibido < 0
                      ? `-${fmtCurrency(Math.abs(saldoExibido))}`
                      : fmtCurrency(saldoExibido)
                    : "••••••"}
                </div>
                <div className="mt-3 flex gap-1.5">
                  {(["all", "positivos", "negativos"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setSaldoFilter(f)}
                      className="rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors"
                      style={{
                        background: saldoFilter === f ? "#F6E9FE" : "transparent",
                        color: saldoFilter === f ? "#5105B9" : "#6B7280",
                      }}
                    >
                      {f === "all"
                        ? "Todos"
                        : f === "positivos"
                        ? "Positivos"
                        : "Negativos"}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Summary grid */}
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                {
                  title: "Resumo financeiro",
                  icon: <DollarSign className="h-4 w-4" />,
                  color: "#22C55E",
                  rows: [
                    {
                      l: "Total em carteiras",
                      v: fmtCurrency(
                        Number(data.resumoFinanceiro.totalEmCarteiras)
                      ),
                      c: "text-slate-900",
                    },
                    {
                      l: "Lucro líquido",
                      v: fmtCurrency(Number(data.resumoFinanceiro.lucroLiquido)),
                      c: "text-slate-900",
                    },
                    {
                      l: "Total de retiradas",
                      v: fmtNum(data.resumoFinanceiro.totalRetiradas),
                      c: "text-slate-900",
                    },
                    {
                      l: "Pendentes",
                      v: fmtCurrency(Number(data.resumoFinanceiro.pendentes)),
                      c: "text-slate-900",
                    },
                  ],
                },
                {
                  title: "Transações",
                  icon: <Activity className="h-4 w-4" />,
                  color: "#3B82F6",
                  rows: [
                    {
                      l: "Aprovadas",
                      v: fmtNum(data.transacoes.aprovadas),
                      c: "text-slate-900",
                    },
                    {
                      l: "Pendentes",
                      v: fmtNum(data.transacoes.pendentes),
                      c: "text-slate-900",
                    },
                    {
                      l: "Em análise",
                      v: fmtNum(data.transacoes.emAnalise),
                      c: "text-slate-900",
                    },
                    {
                      l: "Total",
                      v: fmtNum(data.transacoes.totalProcessadas),
                      c: "text-slate-900",
                    },
                  ],
                },
                {
                  title: "Usuários",
                  icon: <Users className="h-4 w-4" />,
                  color: "#8A1EF7",
                  rows: [
                    {
                      l: "Cadastrados",
                      v: fmtNum(data.usuarios.cadastrados),
                      c: "text-slate-900",
                    },
                    {
                      l: "Bloqueados",
                      v: fmtNum(data.usuarios.bloqueados),
                      c: "text-slate-900",
                    },
                    {
                      l: "KYC pendentes",
                      v: fmtNum(data.usuarios.kycPendentes),
                      c: "text-slate-900",
                    },
                    {
                      l: "Aprovação",
                      v: `${Number(data.usuarios.taxaAprovacao || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
                      c: "text-slate-900",
                    },
                  ],
                },
              ].map((sec) => (
                <div
                  key={sec.title}
                  className="rounded-xl p-3 sm:p-4 md:p-5"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #ECECF0",
                  }}
                >
                  <div className="mb-4 text-[15px] font-semibold text-slate-900">
                    {sec.title}
                  </div>
                  <div className="space-y-2.5">
                    {sec.rows.map((row) => (
                      <div
                        key={row.l}
                        className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-none last:pb-0"
                      >
                        <span className="text-[13px] text-slate-500">{row.l}</span>
                        <span className={`text-[14px] font-semibold tabular-nums ${row.c}`}>
                          {visible ? row.v : "••••"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </LightShell>
      <ShadowPanel />
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

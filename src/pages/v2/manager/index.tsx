"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  Filter,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

const API = "https://shadowpay-api-production.up.railway.app";

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
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [filterStartDate, setFilterStartDate] = useState<string | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<string | null>(null);
  const [filterAdquirente, setFilterAdquirente] = useState("");
  const [filterSeller, setFilterSeller] = useState<string>("Todos");
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [adquirentes, setAdquirentes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
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

  useEffect(() => {
    if (user?.isAdministrator) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
          title: "Lucro Líquido",
          value: fmtCurrency(calcProfit(txs, saldoData)),
          icon: <TrendingUp className="h-4 w-4" />,
          color: "#F59E0B",
        },
        {
          id: "saldoGw",
          title: "Saldo Gateways",
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
          title: "Total em Carteiras",
          value: fmtCurrency(Number(data.totalEmCarteiras.valor)),
          icon: <Wallet className="h-4 w-4" />,
          color: "#7C3AED",
        },
        {
          id: "txAp",
          title: "Transações Aprovadas",
          value: fmtNum(data.transacoesAprovadas.valor),
          icon: <CheckCircle className="h-4 w-4" />,
          color: "#22C55E",
        },
        {
          id: "txPend",
          title: "Transações Pendentes",
          value: fmtNum(data.transacoesPendentes.valor),
          icon: <Clock className="h-4 w-4" />,
          color: "#FBBF24",
        },
        {
          id: "usuarios",
          title: "Usuários Cadastrados",
          value: fmtNum(data.usuariosCadastrados.valor),
          icon: <Users className="h-4 w-4" />,
          color: "#6366F1",
        },
        {
          id: "kycPend",
          title: "KYC Pendentes",
          value: fmtNum(data.kycPendentes.valor),
          icon: <FileText className="h-4 w-4" />,
          color: "#A78BFA",
        },
        {
          id: "totalRet",
          title: "Total em Retiradas",
          value: fmtNum(data.totalEmRetiradas.valor),
          icon: <ArrowDown className="h-4 w-4" />,
          color: "#818CF8",
        },
        {
          id: "retPend",
          title: "Retiradas Pendentes",
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
        onToggleValues={() => setVisible((v) => !v)}
      >
        <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:gap-4 sm:items-end sm:justify-between">
          <div>
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
              Painel Administrativo
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              Bem-vindo, {user?.companyName || "Operador"} · métricas em tempo
              real
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
        </header>

        {/* Filtros */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchData();
          }}
          className="mb-6 rounded-2xl p-5"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            <Filter className="h-3.5 w-3.5" /> Filtrar dados
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">
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
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">
                Data início
              </label>
              <input
                type="date"
                value={filterStartDate ?? ""}
                onChange={(e) => setFilterStartDate(e.target.value || null)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">
                Data fim
              </label>
              <input
                type="date"
                value={filterEndDate ?? ""}
                onChange={(e) => setFilterEndDate(e.target.value || null)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">
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
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white"
                style={{
                  background: "#7C3AED",
                  boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
                }}
              >
                Buscar
              </button>
            </div>
          </div>
        </form>

        {loading && !data ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(15,23,42,0.06)",
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            }}
          >
            <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin text-violet-400" />
            <p className="text-sm text-slate-500">Carregando…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
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
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Nenhum dado disponível
          </div>
        ) : (
          <>
            <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {metrics.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl p-3 sm:p-4 md:p-5"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(15,23,42,0.06)",
                    boxShadow:
                      "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-slate-500">
                      {m.title}
                    </p>
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: `${m.color}14`, color: m.color }}
                    >
                      {m.icon}
                    </span>
                  </div>
                  <div
                    className="mt-2 text-[24px] font-bold tracking-tight text-slate-900"
                    style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
                  >
                    {visible ? m.value : "••••••"}
                  </div>
                </div>
              ))}

              {/* Card saldo com filtro */}
              <div
                className="rounded-2xl p-3 sm:p-4 md:p-5"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(15,23,42,0.06)",
                  boxShadow:
                    "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-500">
                    Saldo{" "}
                    {saldoFilter === "all"
                      ? "Total"
                      : saldoFilter === "positivos"
                      ? "Positivo"
                      : "Negativo"}
                  </p>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <Wallet className="h-4 w-4" />
                  </span>
                </div>
                <div
                  className={`mt-2 text-[24px] font-bold tracking-tight ${
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
                      className="rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors"
                      style={{
                        background:
                          saldoFilter === f ? "rgba(124,58,237,0.10)" : "white",
                        border:
                          saldoFilter === f
                            ? "1px solid rgba(124,58,237,0.20)"
                            : "1px solid #E2E8F0",
                        color: saldoFilter === f ? "#7C3AED" : "#475569",
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
                      l: "Total em Carteiras",
                      v: fmtCurrency(
                        Number(data.resumoFinanceiro.totalEmCarteiras)
                      ),
                      c: "text-slate-900",
                    },
                    {
                      l: "Lucro Líquido",
                      v: fmtCurrency(Number(data.resumoFinanceiro.lucroLiquido)),
                      c: "text-emerald-600",
                    },
                    {
                      l: "Total Retiradas",
                      v: fmtNum(data.resumoFinanceiro.totalRetiradas),
                      c: "text-slate-900",
                    },
                    {
                      l: "Pendentes",
                      v: fmtCurrency(Number(data.resumoFinanceiro.pendentes)),
                      c: "text-amber-600",
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
                      c: "text-emerald-600",
                    },
                    {
                      l: "Pendentes",
                      v: fmtNum(data.transacoes.pendentes),
                      c: "text-amber-600",
                    },
                    {
                      l: "Em Análise",
                      v: fmtNum(data.transacoes.emAnalise),
                      c: "text-orange-600",
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
                  color: "#7C3AED",
                  rows: [
                    {
                      l: "Cadastrados",
                      v: fmtNum(data.usuarios.cadastrados),
                      c: "text-sky-600",
                    },
                    {
                      l: "Bloqueados",
                      v: fmtNum(data.usuarios.bloqueados),
                      c: "text-rose-600",
                    },
                    {
                      l: "KYC Pendentes",
                      v: fmtNum(data.usuarios.kycPendentes),
                      c: "text-violet-600",
                    },
                    {
                      l: "Aprovação",
                      v: `${data.usuarios.taxaAprovacao}%`,
                      c: "text-emerald-600",
                    },
                  ],
                },
              ].map((sec) => (
                <div
                  key={sec.title}
                  className="rounded-2xl p-3 sm:p-4 md:p-5"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(15,23,42,0.06)",
                    boxShadow:
                      "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
                  }}
                >
                  <div className="mb-4 flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        background: `${sec.color}14`,
                        color: sec.color,
                      }}
                    >
                      {sec.icon}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {sec.title}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {sec.rows.map((row) => (
                      <div
                        key={row.l}
                        className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-none last:pb-0"
                      >
                        <span className="text-xs text-slate-500">{row.l}</span>
                        <span className={`text-sm font-semibold ${row.c}`}>
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

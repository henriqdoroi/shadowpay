"use client";

/**
 * /v1/products/sales — Transações: TODAS as vendas (pagas, pendentes,
 * reembolsadas, expiradas/falhas).
 *
 * Colunas exibidas:
 *   Produto / Cliente / Email / Celular / Documento / Valor / Pagamento / Status / Data
 *
 * Abas de status com contagem + filtros de método, busca e período. Os
 * cartões e as contagens vêm de `data.stats` (calculados no banco pro filtro
 * inteiro — não só pra página exibida).
 *
 * Tudo conectado em /api/user/transactions-report (real, sem mock).
 */

import { useEffect, useState } from "react";
import axios from "axios";
import Head from "next/head";
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  Receipt,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import { EMPTY_STATS, TX_STATUS_STYLE, txStatus, type SalesStats } from "@/lib/txStatus";
import { IconChip, StatusBadge, TX_TONE, type Tone } from "@/components/PanelBits";

/** Abas de status -> valor enviado pro backend (aceita grupos com vírgula). */
const STATUS_TABS: { key: string; label: string; filter: string; count: (s: SalesStats) => number }[] = [
  { key: "all", label: "Todas", filter: "", count: (s) => s.total },
  { key: "paid", label: "Pagas", filter: "PAID", count: (s) => s.paid.count },
  { key: "pending", label: "Pendentes", filter: "PENDING,PROCESSING", count: (s) => s.pending.count },
  { key: "refunded", label: "Reembolsadas", filter: "REFUNDED,CHARGEBACK", count: (s) => s.refunded.count },
  { key: "failed", label: "Expiradas", filter: "FAILED,EXPIRED", count: (s) => s.failed.count },
];

const API = "https://shadowpay-backend.onrender.com";

const T = {
  text: "#111827",
  text2: "#475569",
  textMuted: "#9CA3AF",
  primary: "#7C3AED",
  primaryBg: "rgba(124,58,237,0.08)",
  border: "#E5E7EB",
  borderSoft: "#ECECF0",
  card: "#FFFFFF",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
};

type Tx = {
  id: string;
  externalId?: string | null;
  status: string;
  statusRaw?: string | null;
  method: string;
  grossAmount: number | string;
  netAmount: number | string;
  feeAmount: number | string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    cpf?: string;
  } | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerCpfCnpj?: string | null;
  product?: {
    id?: string;
    name?: string;
  } | null;
  productName?: string;
  productId?: string;
  createdAt: string;
  paidAt?: string | null;
};

function SalesContent() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [stats, setStats] = useState<SalesStats>(EMPTY_STATS);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>(""); // "" | "today" | "7d" | "30d"
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<Tx | null>(null);
  const limit = 20;

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  // ---- fetch
  const fetchSales = async (p = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(limit),
      });
      if (statusFilter) params.append("status", statusFilter);
      if (methodFilter) params.append("method", methodFilter);
      if (search.trim()) params.append("search", search.trim());
      if (periodFilter === "today") {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        params.append("startDate", d.toISOString());
      } else if (periodFilter === "7d") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        params.append("startDate", d.toISOString());
      } else if (periodFilter === "30d") {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        params.append("startDate", d.toISOString());
      }

      const r = await axios.get(
        `${API}/api/user/transactions-report?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        const data = r.data.data;
        const list: Tx[] = data.transactions || [];
        setTxs(list);
        setPage(data.pagination?.currentPage || 1);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
        // totais calculados no banco pro filtro inteiro (não só esta página)
        setStats(data.stats || EMPTY_STATS);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao buscar vendas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSales(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter, methodFilter, periodFilter]);

  // refresh ao vivo
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => fetchSales(page), 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page]);

  // formatters
  const fmt = (v: number | string) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof v === "string" ? parseFloat(v) : v || 0);

  const fmtDate = (s?: string | null) => {
    if (!s) return "—";
    const d = new Date(s);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fmtCpfCnpj = (raw?: string | null) => {
    if (!raw) return "—";
    const c = raw.replace(/\D/g, "");
    if (c.length === 11)
      return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (c.length === 14)
      return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return raw;
  };

  const fmtPhone = (raw?: string | null) => {
    if (!raw) return "—";
    const c = raw.replace(/\D/g, "");
    if (c.length === 11)
      return `(${c.slice(0, 2)}) ${c.slice(2, 7)}-${c.slice(7)}`;
    if (c.length === 10)
      return `(${c.slice(0, 2)}) ${c.slice(2, 6)}-${c.slice(6)}`;
    return raw;
  };

  // status pill (status vem como apelido; o tradutor usa statusRaw)
  const statusPill = (t: Pick<Tx, "status" | "statusRaw">) => {
    const s = txStatus(t);
    return <StatusBadge tone={TX_TONE[s]}>{TX_STATUS_STYLE[s].label}</StatusBadge>;
  };

  // method pill
  const methodPill = (m: string) => {
    const k = (m || "").toUpperCase();
    const labels: Record<string, string> = {
      PIX: "PIX",
      CARD: "Cartão",
      BOLETO: "Boleto",
      CRYPTO: "Cripto",
    };
    return (
      <StatusBadge tone={k === "PIX" ? "teal" : "gray"} plain>
        {k === "PIX" ? "Pix" : labels[k] || m}
      </StatusBadge>
    );
  };

  const copyId = (txId: string) => {
    navigator.clipboard.writeText(txId).then(
      () => toast.success("ID copiado"),
      () => toast.error("Falha ao copiar")
    );
  };

  return (
    <>
      <Head>
        <title>ShadowPay — Transações</title>
      </Head>

      <LightShell>
        {/* HEADER */}
        <header className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:gap-4 sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-slate-900 sm:text-[26px]">
              Transações
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              Vendas pagas, pendentes e reembolsadas.
            </p>
          </div>
          <button
            onClick={() => fetchSales(page)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border bg-white px-3.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
            style={{ borderColor: T.border }}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </header>

        {/* RESUMO — uma faixa só (mesmo desenho do Dashboard) */}
        <section
          className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 rounded-xl border bg-white p-5 sm:p-6 lg:grid-cols-5"
          style={{ borderColor: T.borderSoft }}
        >
          {[
            {
              label: "Faturamento (pagas)",
              value: fmt(stats.paid.gross),
              icon: <Wallet />,
              tone: "green" as Tone,
            },
            {
              label: "Vendas pagas",
              value: stats.paid.count.toLocaleString("pt-BR"),
              icon: <CheckCircle2 />,
              tone: "green" as Tone,
            },
            {
              label: "Pendentes",
              value: stats.pending.count.toLocaleString("pt-BR"),
              icon: <Clock />,
              tone: "amber" as Tone,
            },
            {
              label: "Reembolsadas",
              value: stats.refunded.count.toLocaleString("pt-BR"),
              icon: <RotateCcw />,
              tone: "red" as Tone,
            },
            {
              label: "Conversão",
              value: `${stats.conversion.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
              icon: <TrendingUp />,
              tone: "violet" as Tone,
            },
          ].map((c) => (
            <div key={c.label} className="min-w-0">
              <div className="flex items-center gap-2.5">
                <IconChip tone={c.tone}>{c.icon}</IconChip>
                <p className="min-w-0 text-[13px] font-medium leading-tight text-slate-500">{c.label}</p>
              </div>
              <p className="mt-2.5 text-[20px] font-semibold leading-tight text-slate-900 tabular-nums">
                {c.value}
              </p>
            </div>
          ))}
        </section>

        {/* FILTROS */}
        <section
          className="mb-4 rounded-xl p-4"
          style={{
            background: T.card,
            border: `1px solid ${T.borderSoft}`,
          }}
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
            {/* Busca — full em mobile */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <label className="mb-1.5 block text-[13px] font-medium text-slate-600">
                Buscar
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: T.textMuted }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchSales(1);
                  }}
                  placeholder="Nome, email, CPF, ID"
                  className="h-10 w-full rounded-xl border bg-white pl-9 pr-3 text-[13px] outline-none"
                  style={{ borderColor: T.border }}
                />
              </div>
            </div>
            {/* Método */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-600">
                Método
              </label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="h-10 w-full rounded-xl border bg-white px-3 text-[13px] font-semibold outline-none"
                style={{ borderColor: T.border, color: T.text }}
              >
                <option value="">Todos</option>
                <option value="PIX">Pix</option>
                <option value="CARD">Cartão</option>
                <option value="BOLETO">Boleto</option>
                <option value="CRYPTO">Cripto</option>
              </select>
            </div>
            {/* Período rápido */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-600">
                Período
              </label>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="h-10 w-full rounded-xl border bg-white px-3 text-[13px] font-semibold outline-none"
                style={{ borderColor: T.border, color: T.text }}
              >
                <option value="">Tudo</option>
                <option value="today">Hoje</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
              </select>
            </div>
            <button
              onClick={() => fetchSales(1)}
              className="inline-flex h-10 items-center gap-2 rounded-lg px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#6D28D9]"
              style={{ background: T.primary }}
            >
              <Filter className="h-4 w-4" />
              Aplicar
            </button>
          </div>
        </section>

        {/* ABAS DE STATUS (contagens do filtro inteiro) */}
        <div className="-mx-3 mb-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
          <div className="inline-flex min-w-full gap-1.5 sm:min-w-0" role="tablist" aria-label="Status das vendas">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.filter;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusFilter(tab.filter)}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-[13px] font-medium transition-colors hover:bg-[#F6F6F8]"
                  style={{
                    background: active ? "#F5F3FF" : "transparent",
                    color: active ? "#5B21B6" : "#6B7280",
                  }}
                >
                  {tab.label}
                  <span
                    className="text-[12px] font-medium tabular-nums"
                    style={{ color: active ? T.primary : "#9CA3AF" }}
                  >
                    {tab.count(stats).toLocaleString("pt-BR")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TABELA */}
        <section
          className="overflow-hidden rounded-xl"
          style={{
            background: T.card,
            border: `1px solid ${T.borderSoft}`,
          }}
        >
          <div className="-mx-3 overflow-x-auto sm:mx-0">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr
                  className="text-left text-[12.5px] font-medium"
                  style={{ color: "#6B7280" }}
                >
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Celular</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3">Pagamento</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading && txs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                      Carregando…
                    </td>
                  </tr>
                ) : txs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center">
                      <Receipt
                        className="mx-auto mb-2 h-8 w-8"
                        style={{ color: T.textMuted }}
                      />
                      <p className="text-[13px] font-semibold text-slate-700">
                        Nenhuma venda encontrada
                      </p>
                      <p className="text-[11.5px] text-slate-500">
                        Ajuste os filtros ou aguarde novas vendas.
                      </p>
                    </td>
                  </tr>
                ) : (
                  txs.map((t) => {
                    const name =
                      t.customer?.name || t.customerName || "Cliente";
                    const email = t.customer?.email || t.customerEmail || "—";
                    const phone =
                      t.customer?.phone ||
                      (t.customer as any)?.celular ||
                      "—";
                    const doc =
                      t.customer?.cpf ||
                      t.customerCpfCnpj ||
                      (t.customer as any)?.document ||
                      "—";
                    const productName =
                      t.product?.name || t.productName || "—";
                    return (
                      <tr
                        key={t.id}
                        className="transition-colors hover:bg-slate-50"
                        style={{ borderTop: `1px solid ${T.borderSoft}` }}
                      >
                        <td className="px-4 py-3.5 font-medium text-slate-900">
                          {productName}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">{name}</td>
                        <td className="px-4 py-3.5 text-slate-600">{email}</td>
                        <td className="px-4 py-3.5 font-mono text-[12px] text-slate-700">
                          {phone === "—" ? "—" : fmtPhone(phone)}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[12px] text-slate-700">
                          {fmtCpfCnpj(doc)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                          {fmt(t.grossAmount)}
                        </td>
                        <td className="px-4 py-3.5">{methodPill(t.method)}</td>
                        <td className="px-4 py-3.5">{statusPill(t)}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                          {fmtDate(t.createdAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setSelected(t)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Ver detalhes"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINACAO */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: `1px solid ${T.borderSoft}` }}
            >
              <p className="text-[11.5px] text-slate-500">
                Página {page} de {totalPages} · {totalCount.toLocaleString("pt-BR")}{" "}
                vendas
              </p>
              <div className="flex gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => fetchSales(page - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                  style={{ borderColor: T.border }}
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => fetchSales(page + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                  style={{ borderColor: T.border }}
                  aria-label="Próxima"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </LightShell>

      {/* DETALHE MODAL */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6"
            style={{ boxShadow: "0 16px 48px rgba(17,24,39,0.16)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[16px] font-semibold text-slate-900">
                Detalhe da venda
              </p>
              <button
                onClick={() => setSelected(null)}
                className="text-[12px] text-slate-500 hover:text-slate-700"
              >
                Fechar
              </button>
            </div>
            <div className="space-y-3 text-[13px]">
              <Row
                label="ID interno"
                value={
                  <span className="font-mono text-[11.5px]">
                    {selected.id}{" "}
                    <button
                      onClick={() => copyId(selected.id)}
                      className="inline-flex items-center gap-0.5 text-violet-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </span>
                }
              />
              {selected.externalId && (
                <Row
                  label="ID PSP"
                  value={
                    <span className="font-mono text-[11.5px]">
                      {selected.externalId}
                    </span>
                  }
                />
              )}
              <Row
                label="Produto"
                value={selected.product?.name || selected.productName || "—"}
              />
              <Row
                label="Cliente"
                value={
                  selected.customer?.name || selected.customerName || "—"
                }
              />
              <Row
                label="Email"
                value={
                  selected.customer?.email || selected.customerEmail || "—"
                }
              />
              <Row
                label="Celular"
                value={fmtPhone(
                  selected.customer?.phone ||
                    (selected.customer as any)?.celular ||
                    ""
                )}
              />
              <Row
                label="Documento"
                value={fmtCpfCnpj(
                  selected.customer?.cpf ||
                    selected.customerCpfCnpj ||
                    (selected.customer as any)?.document ||
                    ""
                )}
              />
              <Row label="Pagamento" value={methodPill(selected.method)} />
              <Row label="Status" value={statusPill(selected)} />
              <Row label="Valor bruto" value={fmt(selected.grossAmount)} />
              <Row label="Valor líquido" value={fmt(selected.netAmount)} />
              <Row label="Taxa" value={fmt(selected.feeAmount)} />
              <Row label="Criado em" value={fmtDate(selected.createdAt)} />
              {selected.paidAt && (
                <Row label="Pago em" value={fmtDate(selected.paidAt)} />
              )}
            </div>
          </div>
        </div>
      )}

      <ShadowPanel />
    </>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b pb-2.5 last:border-none last:pb-0"
      style={{ borderColor: "rgba(15,23,42,0.06)" }}
    >
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="text-right text-[13px] text-slate-800">{value}</span>
    </div>
  );
}

export default function SalesPage() {
  return (
    <ProtectedRoute>
      <SalesContent />
    </ProtectedRoute>
  );
}

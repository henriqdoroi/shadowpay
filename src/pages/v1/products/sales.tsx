"use client";

/**
 * /v1/products/sales — Vendas (pendentes + aprovadas + rejeitadas).
 *
 * Colunas exibidas:
 *   Produto / Cliente / Email / Celular / Documento / Valor / Pagamento / Status / Data
 *
 * Filtros:
 *   - Status (Todos / Pendentes / Aprovados / Rejeitados)
 *   - Método (PIX / CARD / BOLETO / CRYPTO)
 *   - Busca livre (nome, email, CPF, ID)
 *   - Período (hoje / 7d / 30d)
 *
 * Tudo conectado em /api/user/transactions-report (real, sem mock).
 */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Head from "next/head";
import {
  ShoppingCart,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

const API = "https://shadowpay-api-production.up.railway.app";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primaryBg: "rgba(124,58,237,0.08)",
  border: "rgba(15,23,42,0.08)",
  borderSoft: "rgba(15,23,42,0.06)",
  card: "#FFFFFF",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
};

type Tx = {
  id: string;
  externalId?: string | null;
  status: string;
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
  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    rejected: 0,
    pix: 0,
    grossSum: 0,
  });
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

        // calcula summary local com a página (não totaliza tudo)
        const paid = list.filter((t) => String(t.status).toUpperCase() === "PAID");
        setSummary({
          total: list.length,
          paid: paid.length,
          pending: list.filter((t) => String(t.status).toUpperCase() === "PENDING").length,
          rejected: list.filter((t) =>
            ["FAILED", "REFUNDED", "CHARGEBACK", "EXPIRED"].includes(
              String(t.status).toUpperCase()
            )
          ).length,
          pix: list.filter((t) => String(t.method).toUpperCase() === "PIX").length,
          grossSum: paid.reduce((acc, t) => acc + Number(t.grossAmount || 0), 0),
        });
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

  // status pill
  const statusPill = (s: string) => {
    const k = (s || "").toUpperCase();
    const map: Record<
      string,
      { label: string; bg: string; color: string; dot: string }
    > = {
      PAID: { label: "Aprovado", bg: "#ECFDF5", color: "#047857", dot: "#10B981" },
      APPROVED: { label: "Aprovado", bg: "#ECFDF5", color: "#047857", dot: "#10B981" },
      PENDING: { label: "Pendente", bg: "#FFFBEB", color: "#B45309", dot: "#F59E0B" },
      PROCESSING: { label: "Processando", bg: "#EFF6FF", color: "#1D4ED8", dot: "#3B82F6" },
      FAILED: { label: "Falhou", bg: "#FEF2F2", color: "#B91C1C", dot: "#EF4444" },
      REFUNDED: { label: "Reembolsado", bg: "#FEF2F2", color: "#B91C1C", dot: "#EF4444" },
      CHARGEBACK: { label: "Chargeback", bg: "#FEF2F2", color: "#B91C1C", dot: "#EF4444" },
      EXPIRED: { label: "Expirado", bg: "#F8FAFC", color: "#475569", dot: "#94A3B8" },
    };
    const cfg = map[k] || {
      label: s,
      bg: "#F8FAFC",
      color: "#475569",
      dot: "#94A3B8",
    };
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
        {cfg.label}
      </span>
    );
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
      <span
        className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
        style={{ background: T.primaryBg, color: T.primary }}
      >
        {labels[k] || m}
      </span>
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
        <title>ShadowPay — Vendas</title>
      </Head>

      <LightShell>
        {/* HEADER */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-[22px] font-bold tracking-tight sm:text-[28px] text-slate-900"
              style={{ letterSpacing: "-0.005em" }}
            >
              Vendas
            </h1>
            <p className="mt-1 text-[13.5px] text-slate-500">
              Pedidos pagos, pendentes e rejeitados em tempo real.
            </p>
          </div>
          <button
            onClick={() => fetchSales(page)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            style={{ borderColor: T.border }}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </header>

        {/* SUMMARY CARDS */}
        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            {
              label: "Faturamento (pagos)",
              value: fmt(summary.grossSum),
              icon: <CheckCircle2 className="h-4 w-4" />,
              color: T.green,
            },
            {
              label: "Pedidos pagos",
              value: summary.paid.toLocaleString("pt-BR"),
              icon: <CheckCircle2 className="h-4 w-4" />,
              color: T.green,
            },
            {
              label: "Pendentes",
              value: summary.pending.toLocaleString("pt-BR"),
              icon: <Clock className="h-4 w-4" />,
              color: T.amber,
            },
            {
              label: "Rejeitados",
              value: summary.rejected.toLocaleString("pt-BR"),
              icon: <XCircle className="h-4 w-4" />,
              color: T.red,
            },
            {
              label: "PIX gerados",
              value: summary.pix.toLocaleString("pt-BR"),
              icon: <ShoppingCart className="h-4 w-4" />,
              color: T.primary,
            },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-2xl p-4"
              style={{
                background: T.card,
                border: `1px solid ${T.borderSoft}`,
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                  {c.label}
                </p>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: `${c.color}14`, color: c.color }}
                >
                  {c.icon}
                </span>
              </div>
              <p className="mt-2 text-[18px] font-bold text-slate-900">{c.value}</p>
            </div>
          ))}
        </section>

        {/* FILTROS */}
        <section
          className="mb-4 rounded-2xl p-4"
          style={{
            background: T.card,
            border: `1px solid ${T.borderSoft}`,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            {/* Busca */}
            <div className="flex-1">
              <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
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
            {/* Status */}
            <div className="lg:w-44">
              <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-xl border bg-white px-3 text-[13px] font-semibold outline-none"
                style={{ borderColor: T.border, color: T.text }}
              >
                <option value="">Todos</option>
                <option value="PAID">Aprovado</option>
                <option value="PENDING">Pendente</option>
                <option value="FAILED">Falhou</option>
                <option value="REFUNDED">Reembolsado</option>
                <option value="EXPIRED">Expirado</option>
              </select>
            </div>
            {/* Método */}
            <div className="lg:w-44">
              <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Método
              </label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="h-10 w-full rounded-xl border bg-white px-3 text-[13px] font-semibold outline-none"
                style={{ borderColor: T.border, color: T.text }}
              >
                <option value="">Todos</option>
                <option value="PIX">PIX</option>
                <option value="CARD">Cartão</option>
                <option value="BOLETO">Boleto</option>
                <option value="CRYPTO">Cripto</option>
              </select>
            </div>
            {/* Período rápido */}
            <div className="lg:w-44">
              <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
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
              className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[13px] font-bold text-white"
              style={{
                background: T.primary,
                boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
              }}
            >
              <Filter className="h-4 w-4" />
              Aplicar
            </button>
          </div>
        </section>

        {/* TABELA */}
        <section
          className="overflow-hidden rounded-2xl"
          style={{
            background: T.card,
            border: `1px solid ${T.borderSoft}`,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr
                  className="text-left text-[10.5px] font-bold uppercase tracking-wider"
                  style={{ color: T.textMuted, background: "#F8FAFC" }}
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
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
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
                        <td className="px-4 py-3.5">{statusPill(t.status)}</td>
                        <td className="px-4 py-3.5 text-slate-600">
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
            className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6"
            style={{ boxShadow: "0 24px 64px rgba(15,23,42,0.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[15px] font-bold text-slate-900">
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
              <Row label="Status" value={statusPill(selected.status)} />
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
      <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
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

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Head from "next/head";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import { PeriodPicker } from "@/components/PeriodPicker";
import { txStatus, type TxStatus } from "@/lib/txStatus";
import { resolvePeriod, type Period } from "@/lib/period";

const API = "https://shadowpay-backend.onrender.com";

interface Transaction {
  id: string;
  transactionId: string;
  externalTransactionId: string;
  sellerId: string;
  productId: string | null;
  customerId: string | null;
  amount: string;
  /** apelido ("approved", "pending"...); o valor do banco vem em statusRaw */
  status: string;
  statusRaw?: string;
  paymentMethod: "PIX" | "CARD" | "BOLETO" | "CRYPTO";
  transactionType: string;
  amountGross: string;
  amountNet: string;
  amountFee: string;
  paymentData: any;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  seller: { id: string; companyName: string; email: string };
  product: { id: string; name: string; price: number } | null;
  customer: { id: string; name: string; email: string } | null;
}

interface Filters {
  page: number;
  limit: number;
  status?: string;
  paymentMethod?: string;
  sellerId?: string;
  startDate?: string;
  endDate?: string;
  transactionType?: string;
}

function TransactionsContent() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 20 });

  const fmt = (v: string | number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof v === "string" ? parseFloat(v) : v || 0);
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusBadge = (t: Pick<Transaction, "status" | "statusRaw">) => {
    const map: Record<TxStatus, { color: string; label: string; Icon: any }> = {
      PAID: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Paga", Icon: CheckCircle },
      PENDING: { color: "bg-amber-50 text-amber-700 border-amber-200", label: "Pendente", Icon: Clock },
      PROCESSING: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "Processando", Icon: Clock },
      REFUNDED: { color: "bg-rose-50 text-rose-700 border-rose-200", label: "Reembolsada", Icon: XCircle },
      CHARGEBACK: { color: "bg-rose-50 text-rose-700 border-rose-200", label: "Chargeback", Icon: XCircle },
      FAILED: { color: "bg-slate-50 text-slate-500 border-slate-200", label: "Falhou", Icon: AlertCircle },
      EXPIRED: { color: "bg-slate-50 text-slate-500 border-slate-200", label: "Expirada", Icon: AlertCircle },
    };
    const cfg = map[txStatus(t)];
    // texto + ponto, sem pílula
    const dot = cfg.color.includes("emerald") ? "#16A34A" : cfg.color.includes("amber") ? "#F59E0B" : cfg.color.includes("blue") ? "#3B82F6" : cfg.color.includes("rose") ? "#DC2626" : "#9CA3AF";
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-slate-700">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
        {cfg.label}
      </span>
    );
  };

  const typeText = (t: string) =>
    ({ DEPOSIT: "Depósito", WITHDRAW: "Saque" }[t?.toUpperCase()] || t || "—");
  const methodText = (m: string) =>
    ({ PIX: "Pix", CARD: "Cartão", BOLETO: "Boleto", CRYPTO: "Cripto" }[m] ||
      m);

  const fetchTx = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!token) {
        setError("Token não encontrado");
        setLoading(false);
        return;
      }
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== "all") {
          const key = k === "transactionType" ? "transaction_type" : k;
          params.append(key, v.toString());
        }
      });
      const r = await fetch(`${API}/api/admin/transactions?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!r.ok) throw new Error("Erro ao carregar transações");
      const d = await r.json();
      setTransactions(d.data.transactions);
      setPagination(d.data.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTx();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, token]);

  // período (mesmo seletor do dashboard) -> startDate/endDate em ISO
  const [period, setPeriod] = useState<Period>({ preset: "max" });
  const changePeriod = (p: Period) => {
    setPeriod(p);
    const r = resolvePeriod(p);
    setFilters((f) => ({ ...f, page: 1, startDate: r.start?.toISOString(), endDate: r.end?.toISOString() }));
  };

  const filterChange = (k: keyof Filters, v: string | number) => {
    const val = v === "all" ? undefined : v;
    setFilters((p) => ({
      ...p,
      [k]: val,
      page: k !== "page" ? 1 : (v as number),
    }));
  };

  const inputCls =
    "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-violet-300 focus:ring-2 focus:ring-violet-100";

  return (
    <>
      <Head>
        <title>ShadowPay — Transações (Admin)</title>
      </Head>
      <LightShell>
        <header className="mb-6">
          <h1
            className="text-[22px] font-semibold sm:text-[26px] text-slate-900"
            style={{
              fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
              letterSpacing: "-0.005em",
            }}
          >
            Todas as transações
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Vendas e saques de todos os sellers.
          </p>
        </header>

        {/* Filtros */}
        <div
          className="mb-6 rounded-xl p-5"
          style={{
            background: "#FFFFFF",
            border: "1px solid #ECECF0",
          }}
        >
          <div className="mb-4 text-[15px] font-semibold text-slate-900">
            Filtros
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-600">
                Status
              </label>
              <select
                className={inputCls}
                value={filters.status || "all"}
                onChange={(e) => filterChange("status", e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="PAID">Pagas</option>
                <option value="PENDING,PROCESSING">Pendentes</option>
                <option value="REFUNDED,CHARGEBACK">Reembolsadas</option>
                <option value="FAILED,EXPIRED">Expiradas / falhas</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-600">
                Método
              </label>
              <select
                className={inputCls}
                value={filters.paymentMethod || "all"}
                onChange={(e) => filterChange("paymentMethod", e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="PIX">Pix</option>
                <option value="CARD">Cartão</option>
                <option value="BOLETO">Boleto</option>
                <option value="CRYPTO">Cripto</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-600">
                Tipo
              </label>
              <select
                className={inputCls}
                value={filters.transactionType || "all"}
                onChange={(e) =>
                  filterChange("transactionType", e.target.value)
                }
              >
                <option value="all">Todos</option>
                <option value="DEPOSIT">Depósitos</option>
                <option value="WITHDRAW">Saques</option>
              </select>
            </div>
            <div className="md:col-span-2 lg:col-span-2">
              <label className="mb-1.5 block text-[13px] font-medium text-slate-600">
                Período
              </label>
              <PeriodPicker value={period} onChange={changePeriod} block />
            </div>
          </div>
        </div>

        <div
          className="overflow-hidden rounded-xl"
          style={{
            background: "#FFFFFF",
            border: "1px solid #ECECF0",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid #ECECF0" }}
          >
            <h2
              className="text-[15px] font-semibold text-slate-900"
              style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
            >
              Transações
            </h2>
            <span className="text-[13px] text-slate-500">
              {pagination.total} {pagination.total === 1 ? "transação" : "transações"}
            </span>
          </div>

          {error && (
            <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[12.5px] text-slate-500">
                  <th className="px-3 py-2.5 pl-5 font-medium">ID</th>
                  <th className="px-3 py-2.5 font-medium">Vendedor</th>
                  <th className="px-3 py-2.5 font-medium">Cliente</th>
                  <th className="px-3 py-2.5 font-medium">Produto</th>
                  <th className="px-3 py-2.5 font-medium">Tipo</th>
                  <th className="px-3 py-2.5 font-medium">Valor</th>
                  <th className="px-3 py-2.5 font-medium">Método</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 pr-5 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr
                      key={i}
                      style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
                    >
                      {Array.from({ length: 9 }).map((__, j) => (
                        <td key={j} className="px-3 py-3">
                          <div
                            className="h-4 w-full max-w-[100px] animate-pulse rounded"
                            style={{ background: "#F1F2F6" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center">
                      <Activity className="mx-auto mb-3 h-6 w-6 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">
                        Nenhuma transação encontrada
                      </p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/50"
                      style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
                    >
                      <td className="px-3 py-3 pl-5 text-[13px] tabular-nums text-slate-500" title={t.transactionId}>
                        {String(t.transactionId || "").slice(0, 8)}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-900">
                          {t.seller.companyName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {t.seller.email}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        {t.customer ? (
                          <>
                            <p className="text-slate-700">{t.customer.name}</p>
                            <p className="text-xs text-slate-400">
                              {t.customer.email}
                            </p>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {t.product ? (
                          <>
                            <p className="text-slate-700">{t.product.name}</p>
                            <p className="text-xs text-slate-400">
                              {fmt(t.product.price)}
                            </p>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-[13px] text-slate-600">
                        {typeText(t.transactionType)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-medium tabular-nums text-slate-900">
                        {fmt(t.amount)}
                      </td>
                      <td className="px-3 py-3 text-[13px] text-slate-600">
                        {methodText(t.paymentMethod)}
                      </td>
                      <td className="px-3 py-3">{statusBadge(t)}</td>
                      <td className="whitespace-nowrap px-3 py-3 pr-5 text-[13px] text-slate-500">
                        {fmtDate(t.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
            >
              <div className="text-center text-xs text-slate-400 sm:text-left">
                {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}{" "}
                de {pagination.total}
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <button
                  onClick={() => filterChange("page", pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-xs text-slate-600">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => filterChange("page", pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </LightShell>
      <ShadowPanel />
    </>
  );
}

export default function Transactions() {
  return (
    <ProtectedRoute>
      <TransactionsContent />
    </ProtectedRoute>
  );
}

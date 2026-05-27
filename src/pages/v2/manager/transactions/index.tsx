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
  Filter,
  Activity,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

const API = "https://shadowpay-api-production.up.railway.app";

interface Transaction {
  id: string;
  transactionId: string;
  externalTransactionId: string;
  sellerId: string;
  productId: string | null;
  customerId: string | null;
  amount: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
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

  const statusBadge = (s: string) => {
    const map: Record<
      string,
      { color: string; label: string; Icon: any }
    > = {
      APPROVED: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Aprovada",
        Icon: CheckCircle,
      },
      PENDING: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Pendente",
        Icon: Clock,
      },
      REJECTED: {
        color: "bg-rose-50 text-rose-700 border-rose-200",
        label: "Rejeitada",
        Icon: XCircle,
      },
      CANCELLED: {
        color: "bg-slate-50 text-slate-500 border-slate-200",
        label: "Cancelada",
        Icon: AlertCircle,
      },
    };
    const cfg = map[s] ?? {
      color: "bg-slate-50 text-slate-600 border-slate-200",
      label: s,
      Icon: AlertCircle,
    };
    const Icon = cfg.Icon;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cfg.color}`}
      >
        <Icon className="h-3 w-3" />
        {cfg.label}
      </span>
    );
  };

  const typeText = (t: string) =>
    ({ DEPOSIT: "Depósito", WITHDRAW: "Saque" }[t?.toUpperCase()] || t || "—");
  const methodText = (m: string) =>
    ({ PIX: "PIX", CARD: "Cartão", BOLETO: "Boleto", CRYPTO: "Cripto" }[m] ||
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

  const filterChange = (k: keyof Filters, v: string | number) => {
    const val = v === "all" ? undefined : v;
    setFilters((p) => ({
      ...p,
      [k]: val,
      page: k !== "page" ? 1 : (v as number),
    }));
  };

  const inputCls =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-violet-300 focus:ring-2 focus:ring-violet-100";

  return (
    <>
      <Head>
        <title>ShadowPay — Transações (Admin)</title>
      </Head>
      <LightShell>
        <header className="mb-6">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            Admin
          </p>
          <h1
            className="text-[28px] font-bold tracking-tight text-slate-900"
            style={{
              fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
              letterSpacing: "-0.005em",
            }}
          >
            Gerenciamento de Transações
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Monitore todas as transações da plataforma em tempo real.
          </p>
        </header>

        {/* Filtros */}
        <div
          className="mb-6 rounded-2xl p-5"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            <Filter className="h-3.5 w-3.5" /> Filtros
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">
                Status
              </label>
              <select
                className={inputCls}
                value={filters.status || "all"}
                onChange={(e) => filterChange("status", e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="PENDING">Pendente</option>
                <option value="APPROVED">Aprovada</option>
                <option value="REJECTED">Rejeitada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">
                Método
              </label>
              <select
                className={inputCls}
                value={filters.paymentMethod || "all"}
                onChange={(e) => filterChange("paymentMethod", e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="PIX">PIX</option>
                <option value="CARD">Cartão</option>
                <option value="BOLETO">Boleto</option>
                <option value="CRYPTO">Cripto</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">
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
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">
                Data inicial
              </label>
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => filterChange("startDate", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">
                Data final
              </label>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => filterChange("endDate", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}
          >
            <h2
              className="text-[14px] font-semibold text-slate-900"
              style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
            >
              Lista de transações
            </h2>
            <span className="text-xs text-slate-400">
              {pagination.total} {pagination.total === 1 ? "transação" : "transações"}
            </span>
          </div>

          {error && (
            <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto p-2 sm:p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  <th className="px-3 py-2.5 font-semibold">ID</th>
                  <th className="px-3 py-2.5 font-semibold">Vendedor</th>
                  <th className="px-3 py-2.5 font-semibold">Cliente</th>
                  <th className="px-3 py-2.5 font-semibold">Produto</th>
                  <th className="px-3 py-2.5 font-semibold">Tipo</th>
                  <th className="px-3 py-2.5 font-semibold">Valor</th>
                  <th className="px-3 py-2.5 font-semibold">Método</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Data</th>
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
                      <Activity className="mx-auto mb-3 h-7 w-7 text-violet-300" />
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
                      <td className="px-3 py-3 font-mono text-xs text-slate-600">
                        {t.transactionId}
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
                          <span className="text-slate-400">N/A</span>
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
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {typeText(t.transactionType)}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {fmt(t.amount)}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {methodText(t.paymentMethod)}
                      </td>
                      <td className="px-3 py-3">{statusBadge(t.status)}</td>
                      <td className="px-3 py-3 text-xs text-slate-500">
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

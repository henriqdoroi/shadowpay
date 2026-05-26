"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Head from "next/head";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Receipt,
  RefreshCw,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

const API = "https://shadowpay-api-production.up.railway.app";

interface Sale {
  id: string;
  productId: string;
  productName: string;
  price: string | number;
  status: "pendente" | "aprovado" | "reprovado";
  paymentMethod: string | null;
  name: string;
  email: string;
  celular: string;
  document: string;
  createdAt: string;
  updatedAt: string;
  paymentType: string;
  externalTransactionId?: string | null;
}

const mapTransactionStatusToSale = (s: string) => {
  switch (s?.toUpperCase()) {
    case "APPROVED":
      return "aprovado";
    case "REJECTED":
      return "reprovado";
    default:
      return "pendente";
  }
};

function SalesContent() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  const formatCurrency = (v: string | number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(v) || 0);

  const formatDate = (s?: string | null) => {
    if (!s) return "-";
    const d = new Date(s);
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const pill = (s: string) => {
    const map: Record<string, { color: string; label: string }> = {
      pendente: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Pendente",
      },
      aprovado: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Aprovado",
      },
      reprovado: {
        color: "bg-rose-50 text-rose-700 border-rose-200",
        label: "Reprovado",
      },
    };
    const cfg = map[s] ?? map.pendente;
    return (
      <span
        className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
          cfg!.color
        }`}
      >
        {cfg!.label}
      </span>
    );
  };

  const fetchSales = async (p: number) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${API}/api/sales?page=${p}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const fetched: Sale[] = res.data.data.sales || [];
      const count: number = res.data.data.totalCount || fetched.length;
      const saleIds = fetched.map((s) => s.id).join(",");
      let transactions: any[] = [];
      if (saleIds) {
        const txRes = await axios.get(
          `${API}/api/admin/transactions?saleIds=${saleIds}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        transactions = txRes.data.data.transactions || [];
      }
      const updated = fetched.map((sale) => {
        const tx = transactions.find((t: any) => t.saleId === sale.id);
        sale.status = tx ? mapTransactionStatusToSale(tx.status) : "pendente";
        sale.externalTransactionId = tx?.transactionId || null;
        return sale;
      });
      setSales(updated);
      setTotalCount(count);
      setTotalPages(count > limit ? Math.ceil(count / limit) : 1);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar vendas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page]);

  const stats = useMemo(() => {
    const approved = sales.filter((s) => s.status === "aprovado").length;
    const pending = sales.filter((s) => s.status === "pendente").length;
    const pageValue = sales
      .filter((s) => s.status === "aprovado")
      .reduce((acc, s) => acc + (Number(s.price) || 0), 0);
    return { approved, pending, pageValue };
  }, [sales]);

  const kpis = [
    {
      label: "Total de pedidos",
      value: String(totalCount),
      icon: <ShoppingCart className="h-4 w-4" />,
      color: "#7C3AED",
    },
    {
      label: "Aprovados (página)",
      value: String(stats.approved),
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "#22C55E",
    },
    {
      label: "Pendentes (página)",
      value: String(stats.pending),
      icon: <Clock className="h-4 w-4" />,
      color: "#F59E0B",
    },
    {
      label: "Receita da página",
      value: formatCurrency(stats.pageValue),
      icon: <Receipt className="h-4 w-4" />,
      color: "#3B82F6",
    },
  ];

  const pageNumbers = () => {
    const max = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);
    if (page <= 3) {
      start = 1;
      end = Math.min(totalPages, max);
    } else if (page >= totalPages - 2) {
      start = Math.max(1, totalPages - max + 1);
      end = totalPages;
    }
    const nums = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums.map((i) => (
      <button
        key={i}
        onClick={() => setPage(i)}
        className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors"
        style={{
          background: page === i ? "rgba(124,58,237,0.10)" : "white",
          border: page === i ? "none" : "1px solid #E2E8F0",
          color: page === i ? "#7C3AED" : "#475569",
        }}
      >
        {i}
      </button>
    ));
  };

  return (
    <>
      <Head>
        <title>ShadowPay — Pedidos</title>
      </Head>
      <LightShell>
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
              Vendas
            </p>
            <h1
              className="text-[28px] font-bold tracking-tight text-slate-900"
              style={{
                fontFamily: "'Clash Display', sans-serif",
                letterSpacing: "-0.005em",
              }}
            >
              Pedidos
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              Acompanhe o status de todas as vendas realizadas.
            </p>
          </div>
          <button
            onClick={() => fetchSales(page)}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl p-5"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(15,23,42,0.06)",
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500">
                  {k.label}
                </p>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: `${k.color}14`, color: k.color }}
                >
                  {k.icon}
                </span>
              </div>
              <div
                className="mt-2 text-[24px] font-bold leading-none tracking-tight text-slate-900"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                {k.value}
              </div>
            </div>
          ))}
        </section>

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
              className="flex items-center gap-2 text-[14px] font-semibold text-slate-900"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              <Receipt className="h-4 w-4 text-violet-500" />
              Lista de pedidos
            </h2>
            <span className="text-xs text-slate-400">
              {totalCount} {totalCount === 1 ? "pedido" : "pedidos"}
            </span>
          </div>

          <div className="overflow-x-auto p-2 sm:p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  <th className="px-3 py-2.5 font-semibold">Produto</th>
                  <th className="px-3 py-2.5 font-semibold">Cliente</th>
                  <th className="px-3 py-2.5 font-semibold">Valor</th>
                  <th className="px-3 py-2.5 font-semibold">Pagamento</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Celular</th>
                  <th className="px-3 py-2.5 font-semibold">Documento</th>
                  <th className="px-3 py-2.5 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr
                      key={i}
                      style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
                    >
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-3 py-3">
                          <div
                            className="h-4 w-full max-w-[120px] animate-pulse rounded"
                            style={{ background: "#F1F2F6" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <Receipt className="mx-auto mb-3 h-7 w-7 text-violet-300" />
                      <p className="text-sm font-medium text-slate-600">
                        Nenhum pedido encontrado
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Suas vendas aparecem aqui em tempo real.
                      </p>
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="transition-colors hover:bg-slate-50/50"
                      style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
                    >
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {sale.productName || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-slate-900">{sale.name || "-"}</p>
                        <p className="text-xs text-slate-400">
                          {sale.email || "-"}
                        </p>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {formatCurrency(sale.price)}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {sale.paymentType || "-"}
                      </td>
                      <td className="px-3 py-3">
                        {pill(sale.status || "pendente")}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {sale.celular || "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {sale.document || "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {formatDate(sale.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
            >
              <div className="text-center text-xs text-slate-400 sm:text-left">
                Mostrando {(page - 1) * limit + 1}-
                {Math.min(page * limit, totalCount)} de {totalCount} pedidos
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageNumbers()}
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page === totalPages}
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

export default function Sales() {
  return (
    <ProtectedRoute>
      <SalesContent />
    </ProtectedRoute>
  );
}

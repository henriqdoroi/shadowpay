"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
import { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import Head from "next/head";
import { motion } from "framer-motion";
import ShadowPanel from "@/components/ShadowPanel";

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

const mapTransactionStatusToSale = (txStatus: string) => {
  switch (txStatus?.toUpperCase()) {
    case "APPROVED":
      return "aprovado";
    case "REJECTED":
      return "reprovado";
    default:
      return "pendente";
  }
};

const SHADOW_BG =
  "radial-gradient(1100px 700px at 85% -10%, #0B1020 0%, #060A14 55%, #03060F 100%)";

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;
  const intervalRef = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  const formatCurrency = (value: string | number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      pendente: {
        color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        label: "Pendente",
      },
      aprovado: {
        color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        label: "Aprovado",
      },
      reprovado: {
        color: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        label: "Reprovado",
      },
    };
    const cfg = map[status] ?? {
      color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      label: status,
    };
    return (
      <span
        className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${cfg.color}`}
      >
        {cfg.label}
      </span>
    );
  };

  const fetchSales = async (page: number) => {
    if (!token) return;
    try {
      setLoading(true);

      // 1️⃣ Busca todas as vendas da página
      const res = await axios.get(
        `https://shadowpay-api-production.up.railway.app/api/sales?page=${page}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const fetchedSales: Sale[] = res.data.data.sales || [];
      const count: number = res.data.data.totalCount || fetchedSales.length;

      // 2️⃣ Pega todos os saleIds válidos das vendas
      const saleIds = fetchedSales.map((s) => s.id).join(",");

      let transactions: any[] = [];
      if (saleIds) {
        // 3️⃣ Busca todas as transações relacionadas pelo saleId
        const txRes = await axios.get(
          `https://shadowpay-api-production.up.railway.app/api/admin/transactions?saleIds=${saleIds}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        transactions = txRes.data.data.transactions || [];
      }
      // 4️⃣ Atualiza status das vendas baseado na transação correspondente
      const updatedSales = fetchedSales.map((sale) => {
        const tx = transactions.find((t: any) => t.saleId === sale.id);
        sale.status = tx ? mapTransactionStatusToSale(tx.status) : "pendente";
        sale.externalTransactionId = tx?.transactionId || null;
        return sale;
      });

      setSales(updatedSales);
      setTotalCount(count);
      setTotalPages(count > limit ? Math.ceil(count / limit) : 1);
    } catch (err) {
      console.error("Erro ao carregar vendas:", err);
      toast.error("Erro ao carregar vendas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(page);

    return () => {
      if (intervalRef.current)
        clearInterval(intervalRef.current as ReturnType<typeof setInterval>);
    };
  }, [token, page]);

  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };
  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };
  const handleGoToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

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
      accent: "#8B5CF6",
    },
    {
      label: "Aprovados (página)",
      value: String(stats.approved),
      icon: <CheckCircle2 className="h-4 w-4" />,
      accent: "#34D399",
    },
    {
      label: "Pendentes (página)",
      value: String(stats.pending),
      icon: <Clock className="h-4 w-4" />,
      accent: "#F59E0B",
    },
    {
      label: "Receita da página",
      value: formatCurrency(stats.pageValue),
      icon: <Receipt className="h-4 w-4" />,
      accent: "#6366F1",
    },
  ];

  const renderPageNumbers = () => {
    const maxPagesToShow = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);
    if (page <= 3) {
      start = 1;
      end = Math.min(totalPages, maxPagesToShow);
    } else if (page >= totalPages - 2) {
      start = Math.max(1, totalPages - maxPagesToShow + 1);
      end = totalPages;
    }
    const nums = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums.map((i) => (
      <button
        key={i}
        onClick={() => handleGoToPage(i)}
        className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors ${
          page === i
            ? "bg-violet-500/20 text-violet-200"
            : "border border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.07]"
        }`}
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

      <div className="min-h-screen">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="text-white" style={{ background: SHADOW_BG }}>
            {/* Header */}
            <header className="flex flex-col gap-4 px-4 pt-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-white/60 hover:text-white" />
                <div>
                  <h1
                    className="text-2xl font-bold tracking-tight text-white md:text-[28px]"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Pedidos de Vendas
                  </h1>
                  <p className="mt-1 text-xs text-white/40">
                    Acompanhe o status de todas as vendas realizadas
                  </p>
                </div>
              </div>
              <button
                onClick={() => fetchSales(page)}
                disabled={loading}
                className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Atualizando…" : "Atualizar"}
              </button>
            </header>

            <main className="flex flex-col gap-5 p-4 lg:p-8">
              {/* KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.7,
                      delay: i * 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 backdrop-blur-xl"
                  >
                    <div
                      className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-80"
                      style={{ background: `${k.accent}22` }}
                    />
                    <div className="relative mb-4 flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: `${k.accent}1f`, color: k.accent }}
                      >
                        {k.icon}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                        {k.label}
                      </span>
                    </div>
                    <div
                      className="relative text-2xl font-semibold tracking-tight text-white"
                      style={{ fontFamily: "'Clash Display', sans-serif" }}
                    >
                      {k.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Tabela */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                  <h2
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    <Receipt className="h-4 w-4 text-violet-300" />
                    Lista de Pedidos
                  </h2>
                  <span className="text-xs text-white/40">
                    {totalCount} {totalCount === 1 ? "pedido" : "pedidos"}
                  </span>
                </div>

                <div className="overflow-x-auto p-2 sm:p-4">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-white/40">
                        <th className="px-3 py-2 font-medium">Produto</th>
                        <th className="px-3 py-2 font-medium">Cliente</th>
                        <th className="px-3 py-2 font-medium">Valor</th>
                        <th className="px-3 py-2 font-medium">Pagamento</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Celular</th>
                        <th className="px-3 py-2 font-medium">Documento</th>
                        <th className="px-3 py-2 font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr
                            key={i}
                            className="animate-pulse border-t border-white/[0.05]"
                          >
                            {Array.from({ length: 8 }).map((__, j) => (
                              <td key={j} className="px-3 py-3">
                                <div className="h-4 w-full max-w-[120px] rounded bg-white/10" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : sales.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-14 text-center">
                            <Receipt className="mx-auto mb-3 h-7 w-7 text-violet-400/40" />
                            <p className="text-sm font-medium text-white/60">
                              Nenhum pedido encontrado
                            </p>
                            <p className="mt-1 text-xs text-white/35">
                              Suas vendas aparecem aqui em tempo real.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        sales.map((sale) => (
                          <tr
                            key={sale.id}
                            className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.03]"
                          >
                            <td className="px-3 py-3 font-medium text-white/90">
                              {sale.productName || "-"}
                            </td>
                            <td className="px-3 py-3">
                              <p className="text-white/90">{sale.name || "-"}</p>
                              <p className="text-xs text-white/40">
                                {sale.email || "-"}
                              </p>
                            </td>
                            <td className="px-3 py-3 font-medium text-white/90">
                              {formatCurrency(sale.price)}
                            </td>
                            <td className="px-3 py-3 text-white/60">
                              {sale.paymentType || "-"}
                            </td>
                            <td className="px-3 py-3">
                              {getStatusBadge(sale.status || "pendente")}
                            </td>
                            <td className="px-3 py-3 text-white/60">
                              {sale.celular || "-"}
                            </td>
                            <td className="px-3 py-3 text-white/60">
                              {sale.document || "-"}
                            </td>
                            <td className="px-3 py-3 text-white/50">
                              {formatDate(sale.createdAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex flex-col gap-3 border-t border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-center text-xs text-white/40 sm:text-left">
                      Mostrando {(page - 1) * limit + 1}-
                      {Math.min(page * limit, totalCount)} de {totalCount} pedidos
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={handlePrevPage}
                        disabled={page === 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:bg-white/[0.07] disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {renderPageNumbers()}
                      <button
                        onClick={handleNextPage}
                        disabled={page === totalPages}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:bg-white/[0.07] disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </main>
          </SidebarInset>
        </SidebarProvider>
        <ShadowPanel />
      </div>
    </>
  );
}

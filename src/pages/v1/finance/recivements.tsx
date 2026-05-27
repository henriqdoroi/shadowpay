"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import Head from "next/head";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  Wallet,
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  Copy,
  ArrowUpIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

const API = "https://shadowpay-api-production.up.railway.app";

interface Deposit {
  id: string;
  paymentMethod: "pix" | "card" | "boleto";
  status: "pending" | "approved" | "rejected" | "cancelled" | "refunded";
  amountGross: number;
  amountNet: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiFeeData {
  percentualin: number;
  fixoin: number;
}

function RecivementsContent() {
  const { user, token } = useAuth();
  const [depositoValue, setDepositoValue] = useState("");
  const [showPixModal, setShowPixModal] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [totalDepositos, setTotalDepositos] = useState(0);
  const [qtdDepositos, setQtdDepositos] = useState(0);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pixCode, setPixCode] = useState("");
  const [pixFees, setPixFees] = useState<ApiFeeData>({
    percentualin: 0,
    fixoin: 0,
  });
  const [loadingFees, setLoadingFees] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const periodOptions = [
    { label: "Hoje", days: 0 },
    { label: "Últimos 5 dias", days: 5 },
    { label: "Últimos 16 dias", days: 16 },
    { label: "Últimos 30 dias", days: 30 },
  ];
  const [period, setPeriod] = useState(periodOptions[0]);

  const valor = parseFloat(depositoValue) || 0;
  const taxaFixa = pixFees.fixoin || 0;
  const taxaPct = valor * ((pixFees.percentualin || 0) / 100);
  const taxaTotal = taxaFixa + taxaPct;
  const liquido = valor - taxaTotal;

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const methodLabel = (m: string) =>
    ({ pix: "PIX", card: "Cartão", boleto: "Boleto" }[m] || m);

  const statusPill = (s: string) => {
    const map: Record<string, { color: string; text: string }> = {
      approved: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        text: "APROVADO",
      },
      pending: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        text: "PENDENTE",
      },
      refunded: {
        color: "bg-slate-50 text-slate-600 border-slate-200",
        text: "EXTORNADO",
      },
      rejected: {
        color: "bg-rose-50 text-rose-700 border-rose-200",
        text: "REJEITADO",
      },
      cancelled: {
        color: "bg-slate-50 text-slate-500 border-slate-200",
        text: "CANCELADO",
      },
    };
    const cfg = map[s.toLowerCase()] ?? {
      color: "bg-slate-50 text-slate-600 border-slate-200",
      text: s.toUpperCase(),
    };
    return (
      <span
        className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${cfg.color}`}
      >
        {cfg.text}
      </span>
    );
  };

  const fetchFees = async () => {
    if (!token) return;
    setLoadingFees(true);
    try {
      const { data } = await axios.get(`${API}/api/user/fees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data?.success) setPixFees(data.data.fees.pix);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFees(false);
    }
  };

  const periodDates = (days: number) => {
    const now = new Date();
    if (days === 0) {
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      ).toISOString();
      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
      ).toISOString();
      return { startISO: start, endISO: end };
    }
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (days - 1),
      0,
      0,
      0
    ).toISOString();
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    ).toISOString();
    return { startISO: start, endISO: end };
  };

  const fetchDeposits = async (p = 1, s?: string, e?: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p.toString(), limit: "10" });
      if (s) params.append("startDate", s);
      if (e) params.append("endDate", e);
      const r = await axios.get(
        `${API}/api/user/deposits-report?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        const d = r.data.data;
        setDeposits(d.deposits);
        setPage(d.pagination.currentPage);
        setTotalPages(d.pagination.totalPages);
        setTotalItems(d.pagination.totalCount);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalDay = async (s: string, e: string) => {
    if (!token) return;
    try {
      const params = new URLSearchParams({
        limit: "1000",
        startDate: s,
        endDate: e,
      });
      const r = await axios.get(
        `${API}/api/user/deposits-report?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        const approved = r.data.data.deposits.filter(
          (d: Deposit) => d.status.toLowerCase() === "approved"
        );
        setTotalDepositos(
          approved.reduce((a: number, d: Deposit) => a + Number(d.amountGross || 0), 0)
        );
        setQtdDepositos(approved.length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user && token && period) {
      const { startISO, endISO } = periodDates(period.days);
      setStartDate(startISO);
      setEndDate(endISO);
      fetchDeposits(1, startISO, endISO);
      fetchFees();
      fetchTotalDay(startISO, endISO);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, user, token]);

  useEffect(() => {
    if (!transactionId) return;
    const interval = setInterval(async () => {
      try {
        const r = await axios.get(`/api/transactions/${transactionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.data?.status === "approved") {
          toast.success("Depósito aprovado!");
          setShowPixModal(false);
          fetchDeposits(page);
          clearInterval(interval);
        }
      } catch (e) {
        console.error(e);
      }
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId, token, page]);

  const handleDeposit = async () => {
    if (valor <= 0 || !token) return;
    setProcessing(true);
    try {
      const r = await axios.post(
        `${API}/api/payments/internal/deposit`,
        {
          amount: valor,
          paymentMethod: "pix",
          metadata: { description: "Depósito interno" },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        const { pixQrCode, qrCode, code, transactionId: tid } = r.data.data;
        setPixCode(pixQrCode || qrCode || code || "");
        setTransactionId(tid);
        setShowPixModal(true);
      } else {
        toast.error("Erro: " + r.data?.message);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao processar depósito");
    } finally {
      setProcessing(false);
    }
  };

  const copyPix = () => {
    navigator.clipboard.writeText(pixCode);
    toast.success("Código PIX copiado!");
  };

  const closePixModal = () => {
    setShowPixModal(false);
    setDepositoValue("");
    setPixCode("");
    setTransactionId("");
    if (user && token) fetchDeposits(page);
  };

  const inputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100";

  return (
    <>
      <Head>
        <title>ShadowPay — Recebimentos</title>
      </Head>
      <LightShell>
        <header className="mb-6">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            Vendas
          </p>
          <h1
            className="text-[28px] font-bold tracking-tight text-slate-900"
            style={{
              fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
              letterSpacing: "-0.005em",
            }}
          >
            Recebimentos
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Receba via PIX e acompanhe seus depósitos.
          </p>
        </header>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Total transacionado */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(15,23,42,0.06)",
              boxShadow:
                "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Wallet className="h-4 w-4" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Total transacionado
                </span>
              </div>
              <select
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"
                value={period ? period.days : 0}
                onChange={(e) => {
                  const sel = periodOptions.find(
                    (o) => o.days === Number(e.target.value)
                  );
                  if (sel) setPeriod(sel);
                }}
              >
                {periodOptions.map((o) => (
                  <option key={o.days} value={o.days}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div
              className="text-[28px] font-bold tracking-tight text-slate-900"
              style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
            >
              {fmt(totalDepositos)}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              {qtdDepositos} transações aprovadas no período
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <ArrowUpIcon className="h-3.5 w-3.5" />
              <span>{((totalDepositos / 1000) * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Depositar */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(15,23,42,0.06)",
              boxShadow:
                "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
            }}
          >
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                <ArrowDownToLine className="h-4 w-4" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Depositar dinheiro
              </span>
            </div>

            <label className="mb-1.5 block text-xs text-slate-500">
              Valor do depósito
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="0,00"
                value={depositoValue}
                onChange={(e) => setDepositoValue(e.target.value)}
                className={inputCls + " pr-28"}
              />
              {valor > 0 && !loadingFees && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  = {fmt(liquido)}
                </div>
              )}
            </div>

            {valor > 0 && !loadingFees && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                <p>
                  Taxa fixa: {fmt(taxaFixa)} + percentual:{" "}
                  {(pixFees.percentualin || 0).toFixed(2)}%
                </p>
                <p>
                  Você receberá:{" "}
                  <span className="font-medium text-emerald-600">
                    {fmt(liquido)}
                  </span>
                </p>
              </div>
            )}

            <button
              onClick={handleDeposit}
              disabled={valor <= 0 || processing || loadingFees}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{
                background: "#7C3AED",
                boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
              }}
            >
              {processing ? "Processando…" : "Confirmar depósito"}
            </button>
          </div>
        </div>

        {/* Histórico */}
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
            className="px-5 py-4"
            style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}
          >
            <h2
              className="text-[14px] font-semibold text-slate-900"
              style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
            >
              Histórico de recebimentos
            </h2>
          </div>
          <div className="overflow-x-auto p-2 sm:p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  <th className="hidden px-3 py-2.5 font-semibold sm:table-cell">
                    Transação
                  </th>
                  <th className="px-3 py-2.5 font-semibold">Data</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {deposits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <Wallet className="mx-auto mb-3 h-6 w-6 text-violet-300" />
                      <p className="text-sm font-medium text-slate-600">
                        Nenhum recebimento no período
                      </p>
                    </td>
                  </tr>
                ) : (
                  deposits.map((d) => (
                    <tr
                      key={d.id}
                      style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
                      className="hover:bg-slate-50/50"
                    >
                      <td className="hidden px-3 py-3 sm:table-cell">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                            <Image
                              src="/pix-icon.svg"
                              width={14}
                              height={14}
                              alt="Pix"
                            />
                          </span>
                          <span className="text-xs text-slate-500">
                            {methodLabel(d.paymentMethod)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {fmtDate(d.createdAt)}
                      </td>
                      <td className="px-3 py-3">{statusPill(d.status)}</td>
                      <td className="px-3 py-3 text-right font-semibold text-emerald-600">
                        +{fmt(d.amountGross)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div
                className="mt-3 flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
              >
                <div className="text-center text-xs text-slate-400 sm:text-left">
                  Mostrando {(page - 1) * 10 + 1}-
                  {Math.min(page * 10, totalItems)} de {totalItems}
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    disabled={page === 1 || loading}
                    onClick={() =>
                      fetchDeposits(
                        page - 1,
                        startDate || undefined,
                        endDate || undefined
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={page === totalPages || loading}
                    onClick={() =>
                      fetchDeposits(
                        page + 1,
                        startDate || undefined,
                        endDate || undefined
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </LightShell>

      {/* PIX Modal */}
      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Pagamento PIX</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <p className="text-sm text-slate-500">Valor do depósito</p>
            <p
              className="text-2xl font-bold text-slate-900"
              style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
            >
              {fmt(valor)}
            </p>
            {pixCode && (
              <div className="my-4 flex justify-center">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <QRCodeSVG
                    value={pixCode}
                    size={200}
                    bgColor="#fff"
                    fgColor="#000"
                    level="Q"
                    includeMargin
                  />
                </div>
              </div>
            )}
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Taxa fixa:</span>
                <span className="text-rose-600">-{fmt(taxaFixa)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Percentual ({pixFees.percentualin.toFixed(2)}%):
                </span>
                <span className="text-rose-600">-{fmt(taxaPct)}</span>
              </div>
              <div
                className="flex justify-between border-t pt-2 font-bold"
                style={{ borderColor: "#E5E7EB" }}
              >
                <span className="text-slate-700">Você receberá:</span>
                <span className="text-emerald-600">{fmt(liquido)}</span>
              </div>
            </div>

            <label className="block text-left text-sm font-medium text-slate-700">
              Código PIX (copiar e colar)
            </label>
            <div className="flex gap-2">
              <input
                value={pixCode}
                readOnly
                className={inputCls + " font-mono text-xs"}
                placeholder="Código PIX..."
              />
              <button
                onClick={copyPix}
                disabled={!pixCode}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={closePixModal}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={closePixModal}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ background: "#7C3AED" }}
              >
                Já paguei
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ShadowPanel />
    </>
  );
}

export default function Recivements() {
  return (
    <ProtectedRoute>
      <RecivementsContent />
    </ProtectedRoute>
  );
}

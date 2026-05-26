"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import Head from "next/head";
import { toast } from "sonner";
import {
  RefreshCw,
  ArrowUp,
  Wallet,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  Key,
  Eye,
  EyeOff,
  Lock,
  Receipt,
  Hash,
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

interface Withdraw {
  id: string;
  paymentMethod: "pix" | "card" | "boleto";
  status: "pending" | "approved" | "rejected" | "cancelled";
  amountGross: number;
  amountNet: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiFeeData {
  percentual: number;
  txCashOut: number;
  fixo: number;
}

function WithdrawContent() {
  const { user, token } = useAuth();
  const [saqueValue, setSaqueValue] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [, setTwoFAValid] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [blockedBalance, setBlockedBalance] = useState(0);
  const [totalSaques, setTotalSaques] = useState(0);
  const [qtdSaques, setQtdSaques] = useState(0);
  const [withdraws, setWithdraws] = useState<Withdraw[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pixFees, setPixFees] = useState<ApiFeeData>({
    percentual: 0,
    txCashOut: 0,
    fixo: 0,
  });
  const [sellerFees, setSellerFees] = useState<ApiFeeData>({
    percentual: 0,
    txCashOut: 0,
    fixo: 0,
  });
  const [acquirerFees, setAcquirerFees] = useState<ApiFeeData>({
    percentual: 0,
    txCashOut: 0,
    fixo: 0,
  });
  const [localUser, setLocalUser] = useState<any>({});
  const [valuesVisible, setValuesVisible] = useState(true);

  const valorSaque = parseFloat(saqueValue.replace(",", ".")) || 0;
  const valorSaqueNum = Math.round(valorSaque * 100) / 100;
  const totalPercentual =
    (sellerFees.percentual || 0) + (acquirerFees.percentual || 0);
  const totalFixa =
    (sellerFees.fixo || 0) +
    (acquirerFees.txCashOut || 0) +
    (acquirerFees.fixo || 0);
  const valorTaxaPercentual = valorSaque * (totalPercentual / 100);
  const valorTaxaFixa = totalFixa;
  const valorTaxaTotal = valorTaxaPercentual + valorTaxaFixa;
  const valorLiquido = valorSaque - valorTaxaTotal;

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
  const hideable = (v: string) => (valuesVisible ? v : "••••••");

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

  // ---- PIX key validation
  type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE";
  const detectPixKeyType = (k: string): PixKeyType | "invalid" => {
    if (!k || k.trim() === "") return "invalid";
    const c = k.replace(/\D/g, "");
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRx = /^(?:\+?55)?\d{10,11}$/;
    if (c.length === 11 && validateCPF(c)) return "CPF";
    if (c.length === 14 && validateCNPJ(c)) return "CNPJ";
    if (emailRx.test(k)) return "EMAIL";
    if (phoneRx.test(c)) return "PHONE";
    return "invalid";
  };
  function validateCPF(cpf: string): boolean {
    if (!/^\d{11}$/.test(cpf)) return false;
    let sum = 0;
    let r: number;
    for (let i = 1; i <= 9; i++)
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++)
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === parseInt(cpf.substring(10, 11));
  }
  function validateCNPJ(cnpj: string): boolean {
    if (!/^\d{14}$/.test(cnpj)) return false;
    let len = cnpj.length - 2;
    let nums = cnpj.substring(0, len);
    const digs = cnpj.substring(len);
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(nums.charAt(len - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let res = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (res !== parseInt(digs.charAt(0))) return false;
    len += 1;
    nums = cnpj.substring(0, len);
    sum = 0;
    pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(nums.charAt(len - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    res = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return res === parseInt(digs.charAt(1));
  }

  // ---- Data fetching
  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        const r = await axios.get(`${API}/api/user/fees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.data?.success) return;
        const { adquerer, fees } = r.data.data;
        const pix = fees.pix || { percentual: 0, txCashOut: 0, fixo: 0 };
        setSellerFees({
          percentual: Number(pix.percentual ?? 0),
          txCashOut: Number(pix.txCashOut ?? 0),
          fixo: Number(pix.fixo ?? 0),
        });
        setAcquirerFees({
          percentual: 0,
          txCashOut: Number(adquerer?.txCashOut ?? 0),
          fixo: 0,
        });
        setPixFees({
          percentual: Number(pix.percentual ?? 0),
          txCashOut: Number(adquerer?.txCashOut ?? 0),
          fixo: 0,
        });
      } catch (e) {
        toast.error("Erro ao buscar taxas");
        console.error(e);
      }
    })();
  }, [user, token]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await axios.get(`${API}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.data?.success && r.data.data) {
          setLocalUser({
            ...r.data.data,
            twofaEnabled: Boolean(r.data.data.twofaEnabled),
            twofaConfirmed: Boolean(r.data.data.twofaConfirmed),
          });
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [token]);

  const fetchWithdraws = async (p = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await axios.get(
        `${API}/api/user/withdraws-report?page=${p}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        const d = r.data.data;
        setCurrentBalance(d.wallet.currentBalance);
        setBlockedBalance(d.wallet.blockedBalance);
        setTotalSaques(d.summary.totalSaques);
        setQtdSaques(d.summary.quantidadeSaques);
        setWithdraws(d.withdraws);
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

  useEffect(() => {
    if (user && token) fetchWithdraws(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  // ---- Handlers
  const handleSaque = () => {
    if (!localUser.twofaEnabled) {
      alert("Ative a autenticação de dois fatores antes de sacar.");
      return;
    }
    setShow2FA(true);
  };

  const confirm2FA = async () => {
    if (!twoFACode.trim()) {
      toast.error("Código 2FA vazio");
      return;
    }
    if (!token) return;
    setTwoFALoading(true);
    try {
      const res = await fetch(`${API}/api/pages/2fa/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: twoFACode }),
      });
      const data = await res.json();
      if (data.success) {
        setTwoFAValid(true);
        setShow2FA(false);
        toast.success("Código 2FA confirmado!");
        setShowWithdrawModal(true);
      } else {
        setTwoFAValid(false);
        toast.error(data.message || "Código 2FA inválido");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao verificar 2FA");
    } finally {
      setTwoFALoading(false);
      setTwoFACode("");
    }
  };

  const confirmarSaque = async () => {
    if (!pixKey.trim() || valorSaque <= 0) return;
    const kind = detectPixKeyType(pixKey);
    if (kind === "invalid") {
      toast.error("Chave PIX inválida");
      return;
    }
    setProcessing(true);
    try {
      const r = await axios.post(
        `${API}/api/payments/internal/withdraw`,
        { amount: valorSaque, pixKey: pixKey.trim(), pixKeyType: kind },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        const d = r.data.data;
        toast.success("Saque processado!", {
          description: `ID: ${d.transactionId} • Líquido: ${fmt(
            parseFloat(d.amountNet)
          )}`,
        });
        closeWithdrawModal();
        fetchWithdraws(page);
      } else {
        toast.error("Erro ao processar saque", {
          description: r.data?.message || "Erro desconhecido",
        });
      }
    } catch (e: any) {
      toast.error("Erro ao processar saque", {
        description: e?.response?.data?.message || "Erro de conexão",
      });
    } finally {
      setProcessing(false);
    }
  };

  const closeWithdrawModal = () => {
    setShowWithdrawModal(false);
    setSaqueValue("");
    setPixKey("");
  };

  const kpis = [
    {
      label: "Saldo disponível",
      value: hideable(fmt(currentBalance)),
      icon: <Wallet className="h-4 w-4" />,
      color: "#7C3AED",
    },
    {
      label: "Saldo bloqueado",
      value: hideable(fmt(blockedBalance)),
      icon: <Lock className="h-4 w-4" />,
      color: "#F59E0B",
    },
    {
      label: "Total sacado",
      value: hideable(fmt(totalSaques)),
      icon: <Receipt className="h-4 w-4" />,
      color: "#22D3EE",
    },
    {
      label: "Qtd. saques",
      value: String(qtdSaques),
      icon: <Hash className="h-4 w-4" />,
      color: "#22C55E",
    },
  ];

  const inputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100";

  return (
    <>
      <Head>
        <title>ShadowPay — Saques</title>
      </Head>
      <LightShell
        valuesVisible={valuesVisible}
        onToggleValues={() => setValuesVisible((v) => !v)}
      >
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
              Saques
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              Saque seu saldo via PIX com 2FA obrigatório.
            </p>
          </div>
          <button
            onClick={() => fetchWithdraws(page)}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
        </header>

        {/* KPIs */}
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

        {/* Card de saque */}
        <div
          className="mb-6 rounded-2xl p-5"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <ArrowUpFromLine className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Sacar dinheiro
            </span>
          </div>

          <label className="mb-1.5 block text-xs text-slate-500">
            Valor do saque
          </label>
          <div className="relative">
            <input
              type="tel"
              inputMode="numeric"
              placeholder="0,00"
              value={saqueValue}
              onChange={(e) => setSaqueValue(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  valorSaqueNum > 0 &&
                  valorSaqueNum <= currentBalance
                ) {
                  e.preventDefault();
                  handleSaque();
                }
              }}
              className={inputCls + " h-12 pr-32 text-base"}
            />
            {valorSaque > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                = {fmt(valorLiquido)}
              </div>
            )}
          </div>

          {valorSaque > 0 && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              <p>
                Taxa fixa: {fmt(valorTaxaFixa)} + percentual:{" "}
                {totalPercentual.toFixed(2)}%
              </p>
              <p>
                Valor líquido:{" "}
                <span className="font-medium text-emerald-600">
                  {fmt(valorLiquido)}
                </span>
              </p>
            </div>
          )}
          {valorSaqueNum > currentBalance && (
            <p className="mt-2 text-xs font-medium text-rose-600">
              Valor excede o saldo disponível
            </p>
          )}

          <button
            onClick={handleSaque}
            disabled={
              valorSaqueNum <= 0 || valorSaqueNum > currentBalance
            }
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{
              background: "#7C3AED",
              boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
            }}
          >
            Continuar saque
          </button>
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
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}
          >
            <h2
              className="text-[14px] font-semibold text-slate-900"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              Histórico de saques
            </h2>
            <span className="text-xs text-slate-400">
              {totalItems} {totalItems === 1 ? "saque" : "saques"}
            </span>
          </div>
          <div className="overflow-x-auto p-2 sm:p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  <th className="px-3 py-2.5 font-semibold">Data</th>
                  <th className="px-3 py-2.5 font-semibold">Tipo</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr
                      key={i}
                      style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
                    >
                      {Array.from({ length: 4 }).map((__, j) => (
                        <td key={j} className="px-3 py-3">
                          <div
                            className="h-4 w-full max-w-[120px] animate-pulse rounded"
                            style={{ background: "#F1F2F6" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : withdraws.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-14 text-center">
                      <ArrowUpFromLine className="mx-auto mb-3 h-6 w-6 text-violet-300" />
                      <p className="text-sm font-medium text-slate-600">
                        Nenhum saque ainda
                      </p>
                    </td>
                  </tr>
                ) : (
                  withdraws.slice(0, 4).map((w) => (
                    <tr
                      key={w.id}
                      style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
                      className="hover:bg-slate-50/50"
                    >
                      <td className="px-3 py-3 text-slate-500">
                        {fmtDate(w.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </span>
                      </td>
                      <td className="px-3 py-3">{statusPill(w.status)}</td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-900">
                        {hideable(fmt(w.amountGross))}
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
                <span className="text-center text-xs text-slate-400 sm:text-left">
                  Página {page} de {totalPages}
                </span>
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    disabled={page === 1 || loading}
                    onClick={() => fetchWithdraws(page - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={page === totalPages || loading}
                    onClick={() => fetchWithdraws(page + 1)}
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

      {/* Modal 2FA */}
      <Dialog open={show2FA} onOpenChange={setShow2FA}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Verificação 2FA</DialogTitle>
          </DialogHeader>
          <p className="text-center text-sm text-slate-500">
            Digite o código gerado pelo seu app de autenticação
          </p>
          <div className="flex justify-center gap-2">
            {[...Array(6)].map((_, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="h-12 w-12 rounded-md border border-slate-200 bg-white text-center text-xl text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                value={twoFACode[i] || ""}
                disabled={twoFALoading}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  const arr = twoFACode.split("");
                  arr[i] = v || "";
                  setTwoFACode(arr.join(""));
                  if (v && i < 5) {
                    const next = document.getElementById(`tfa-${i + 1}`);
                    if (next) (next as HTMLInputElement).focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !twoFACode[i] && i > 0) {
                    const prev = document.getElementById(`tfa-${i - 1}`);
                    if (prev) (prev as HTMLInputElement).focus();
                  }
                }}
                id={`tfa-${i}`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShow2FA(false)}
              disabled={twoFALoading}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirm2FA}
              disabled={twoFACode.length !== 6 || twoFALoading}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#7C3AED" }}
            >
              {twoFALoading ? "Validando…" : "Confirmar"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de saque */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Confirmar saque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">Valor do saque</p>
              <p
                className="text-2xl font-bold text-slate-900"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                {fmt(valorSaque)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Taxa: {fmt(valorTaxaTotal)} ({pixFees.percentual.toFixed(2)}%)
              </p>
              <p className="text-xs font-medium text-emerald-600">
                Líquido: {fmt(valorLiquido)}
              </p>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Key className="h-4 w-4" />
                Chave PIX de destino
              </label>
              <input
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, e-mail, telefone ou CNPJ"
                className={inputCls}
                disabled={processing}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    pixKey.trim() &&
                    detectPixKeyType(pixKey) !== "invalid"
                  ) {
                    e.preventDefault();
                    confirmarSaque();
                  }
                }}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Aceitamos: CPF, CNPJ, e-mail ou telefone
              </p>
              {!pixKey.trim() && (
                <p className="mt-1 text-xs text-rose-600">
                  Chave PIX obrigatória
                </p>
              )}
              {pixKey.trim() && detectPixKeyType(pixKey) === "invalid" && (
                <p className="mt-1 text-xs text-rose-600">
                  Formato de chave PIX inválido
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              <p className="font-medium text-slate-700">
                Informações importantes
              </p>
              <p>• Processado em até 1 hora útil</p>
              <p>• Verifique a chave PIX antes de confirmar</p>
              <p>• Não é possível cancelar após confirmação</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeWithdrawModal}
                disabled={processing}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarSaque}
                disabled={
                  !pixKey.trim() ||
                  detectPixKeyType(pixKey) === "invalid" ||
                  processing
                }
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#7C3AED" }}
              >
                {processing ? "Processando…" : "Confirmar saque"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ShadowPanel />
    </>
  );
}

export default function Withdraw() {
  return (
    <ProtectedRoute>
      <WithdrawContent />
    </ProtectedRoute>
  );
}

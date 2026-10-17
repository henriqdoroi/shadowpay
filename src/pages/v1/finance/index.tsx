"use client";

/**
 * /v1/finance — página única do Financeiro.
 *
 * Antes era: /v1/finance/withdraw + /v1/finance/compliance + /v1/configs/fee
 * Agora: uma única tela com o Saldo (botões de saque e extrato dentro) e o
 * Histórico de saques. Valor e chave PIX são informados na janela de saque.
 *
 * Tudo conectado às APIs reais — sem mock.
 *  - /api/user/dashboard-stats   (saldo / blocked / reserved)
 *  - /api/user/fees              (taxas PIX do seller + adquirente)
 *  - /api/user/withdraws-report  (histórico + agregados de saque)
 *  - /api/user/transactions-report (totalEntradas = total já recebido)
 *  - /api/payments/internal/withdraw (POST: cria saque)
 *  - /api/pages/2fa/verify       (POST: confirma 2FA)
 */

import { useEffect, useMemo, useState } from "react";
import { useValuesVisible } from "@/lib/useValuesVisible";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import Head from "next/head";
import Link from "next/link";
import { toast } from "sonner";
import {
  Wallet,
  ArrowUpFromLine,
  ShieldCheck,
  FileText,
  Receipt,
  Filter,
  RefreshCw,
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

const API = "https://shadowpay-backend.onrender.com";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primaryStrong: "#6D28D9",
  primaryBg: "rgba(124, 58, 237, 0.08)",
  border: "rgba(15, 23, 42, 0.08)",
  borderSoft: "rgba(15, 23, 42, 0.06)",
  green: "#10B981",
  red: "#EF4444",
  amber: "#F59E0B",
  card: "#FFFFFF",
};

type WithdrawRow = {
  id: string;
  amount: number;
  feeAmount: number;
  pixKey: string | null;
  pixKeyType: string | null;
  status: string;
  paidAt: string | null;
  createdAt: string;
};

type FeesShape = {
  pix?: { percentual?: number; fixo?: number };
  card?: { percentual?: number; fixo?: number };
};

function FinanceContent() {
  const { user, token } = useAuth();

  // ---- state
  // Olho da barra do topo (salvo no navegador, igual em todas as páginas)
  const [valuesVisible, toggleValues] = useValuesVisible();
  const [balance, setBalance] = useState({ current: 0, blocked: 0 });
  const [totalReceived, setTotalReceived] = useState(0);
  const [fees, setFees] = useState<{
    salePercent: number;
    saleFixed: number;
    withdrawFixed: number;
    acquirerName?: string;
    acquirerSource?: "seller_acquirer" | "global" | "fallback";
  }>({ salePercent: 0, saleFixed: 0, withdrawFixed: 0 });
  const [withdraws, setWithdraws] = useState<WithdrawRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // simulador
  const [amountInput, setAmountInput] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [twoFAOpen, setTwoFAOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [localUser, setLocalUser] = useState<any>({});

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const hideable = (v: string) => (valuesVisible ? v : "••••••");

  // ---- compute simulator
  const sacarValor =
    parseFloat((amountInput || "").replace(/\./g, "").replace(",", ".")) || 0;
  const totalFee = fees.withdrawFixed; // taxa fixa de saque (mocada por venda nao se aplica)
  const liquido = Math.max(0, sacarValor - totalFee);

  // ---- next payout (D+1 útil)
  const nextPayout = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  // ---- fetch wallet
  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        const r = await axios.get(`${API}/api/user/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.data?.success) {
          setBalance({
            current: Number(r.data.data.currentBalance) || 0,
            blocked: Number(r.data.data.blockedBalance) || 0,
          });
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user, token, refreshKey]);

  // ---- fetch fees (PIX por venda + saque) + perfil pra 2FA
  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        const [feesR, profileR] = await Promise.all([
          axios.get(`${API}/api/user/fees`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (feesR.data?.success) {
          const d = feesR.data.data;
          const adq = d.adquerer || {};
          // taxa POR VENDA vem da adquirente real (resolvida no backend
          // com prioridade SellerAcquirer.customX > Acquirer.X > legado).
          // Se o backend não devolveu adq.salePercent/saleFixed (versão
          // antiga), cai no fees.pix do payload pra não quebrar.
          const pix: any = (d.fees as FeesShape)?.pix || {};
          setFees({
            salePercent: Number(adq.salePercent ?? pix.percentual ?? 0),
            saleFixed: Number(adq.saleFixed ?? pix.fixo ?? 0),
            withdrawFixed: Number(adq.txCashOut ?? 0),
            acquirerName: adq.name,
            acquirerSource: adq.source,
          });
        }
        if (profileR.data?.success && profileR.data.data) {
          setLocalUser({
            ...profileR.data.data,
            twofaEnabled: Boolean(profileR.data.data.twofaEnabled),
            twofaConfirmed: Boolean(profileR.data.data.twofaConfirmed),
          });
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user, token, refreshKey]);

  // ---- fetch withdraws + summary
  const fetchWithdraws = async (p = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: "10",
      });
      if (statusFilter) params.append("status", statusFilter);
      const r = await axios.get(
        `${API}/api/user/withdraws-report?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        const d = r.data.data;
        setWithdraws(d.withdraws || []);
        setPage(d.pagination?.currentPage || 1);
        setTotalPages(d.pagination?.totalPages || 1);
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
  }, [user, token, statusFilter, refreshKey]);

  // ---- total já recebido (vida toda — soma das transactions PAID)
  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        const r = await axios.get(
          `${API}/api/user/transactions-report?page=1&limit=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (r.data?.success) {
          setTotalReceived(Number(r.data.data.summary?.totalEntradas) || 0);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user, token, refreshKey]);

  // ---- saque handlers
  const detectPixKeyType = (k: string): string | null => {
    if (!k) return null;
    // chave aleatória (EVP) primeiro: um UUID também tem dígitos
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k.trim())) return "EVP";
    const c = k.replace(/\D/g, "");
    if (c.length === 11) return "CPF";
    if (c.length === 14) return "CNPJ";
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k)) return "EMAIL";
    if (/^(?:\+?55)?\d{10,11}$/.test(c)) return "PHONE";
    return null;
  };

  // Abre a janela de saque (valor + chave PIX são preenchidos nela).
  const openWithdraw = () => setWithdrawOpen(true);

  const submitWithdraw = async () => {
    if (sacarValor <= 0) {
      toast.error("Informe um valor para sacar.");
      return;
    }
    if (sacarValor <= totalFee) {
      toast.error(`O saque precisa ser maior que a taxa de ${fmt(totalFee)}.`);
      return;
    }
    if (sacarValor > balance.current) {
      toast.error("Valor maior que o saldo disponível.");
      return;
    }
    if (!pixKey.trim()) {
      toast.error("Informe a chave PIX.");
      return;
    }
    const kind = detectPixKeyType(pixKey.trim());
    if (!kind) {
      toast.error("Chave PIX inválida.");
      return;
    }
    // 2FA ativo: o saque só sai com o código do app (o servidor confere)
    if (localUser?.twofaEnabled) {
      setTwoFAOpen(true);
      return;
    }
    await persistWithdraw(kind);
  };

  const persistWithdraw = async (kind: string, code?: string): Promise<boolean> => {
    setProcessing(true);
    try {
      const r = await axios.post(
        `${API}/api/payments/internal/withdraw`,
        { amount: sacarValor, pixKey: pixKey.trim(), pixKeyType: kind, ...(code ? { code } : {}) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        toast.success("Saque solicitado!");
        setWithdrawOpen(false);
        setAmountInput("");
        setPixKey("");
        setRefreshKey((k) => k + 1);
        return true;
      }
      toast.error(r.data?.message || "Erro ao processar saque.");
      return false;
    } catch (e: any) {
      // 2FA ligado em outro aparelho: pede o código aqui também
      if (e?.response?.data?.error?.code === "TWOFA_REQUIRED") {
        setLocalUser((u: any) => (u ? { ...u, twofaEnabled: true } : u));
        setTwoFAOpen(true);
        return false;
      }
      toast.error(e?.response?.data?.message || "Erro de conexão.");
      return false;
    } finally {
      setProcessing(false);
    }
  };

  const confirm2FA = async () => {
    if (twoFACode.length !== 6) {
      toast.error("Informe o código de 6 dígitos do app.");
      return;
    }
    const kind = detectPixKeyType(pixKey.trim());
    if (!kind) return;
    setTwoFALoading(true);
    const ok = await persistWithdraw(kind, twoFACode);
    setTwoFALoading(false);
    if (ok) {
      setTwoFAOpen(false);
      setTwoFACode("");
    }
  };

  // ---- status pill (light)
  const statusPill = (s: string) => {
    const k = (s || "").toLowerCase();
    const map: Record<string, { color: string; bg: string; dot: string; label: string }> = {
      approved: { color: "#047857", bg: "#ECFDF5", dot: "#10B981", label: "Aprovado" },
      paid: { color: "#047857", bg: "#ECFDF5", dot: "#10B981", label: "Aprovado" },
      pending: { color: "#B45309", bg: "#FFFBEB", dot: "#F59E0B", label: "Pendente" },
      rejected: { color: "#B91C1C", bg: "#FEF2F2", dot: "#EF4444", label: "Rejeitado" },
      failed: { color: "#B91C1C", bg: "#FEF2F2", dot: "#EF4444", label: "Falhou" },
      cancelled: { color: "#475569", bg: "#F8FAFC", dot: "#94A3B8", label: "Cancelado" },
    };
    const cfg = map[k] || {
      color: "#475569",
      bg: "#F8FAFC",
      dot: "#94A3B8",
      label: s,
    };
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: cfg.dot }}
        />
        {cfg.label}
      </span>
    );
  };

  return (
    <>
      <Head>
        <title>ShadowPay — Financeiro</title>
      </Head>

      <LightShell
        valuesVisible={valuesVisible}
        onToggleValues={toggleValues}
      >
        {/* HEADER */}
        <header className="mb-6">
          <h1
            className="text-[22px] font-bold tracking-tight sm:text-[28px] text-slate-900"
            style={{ letterSpacing: "-0.005em" }}
          >
            Financeiro
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Acompanhe seu saldo e seus saques.
          </p>
        </header>

        {/* SALDO — largura total (igual ao Histórico), com os botões dentro */}
        <section className="mb-6">
          <div
            className="relative overflow-hidden rounded-[22px] p-5 sm:p-7"
            style={{
              background:
                "linear-gradient(135deg, #FBFAFF 0%, #F4F1FE 58%, #EEF1FF 100%)",
              border: "1px solid rgba(124,58,237,0.10)",
              boxShadow:
                "0 1px 3px rgba(15,23,42,0.04), 0 22px 46px -30px rgba(124,58,237,0.35)",
            }}
          >
            {/* Glow suave */}
            <div
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 62%)",
              }}
            />

            <div className="relative">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p
                    className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: "#8B5CF6" }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "#22C55E" }}
                    />
                    Saldo disponível
                  </p>
                  <p
                    className="mt-3 text-[38px] font-semibold leading-none sm:text-[46px]"
                    style={{
                      color: "#2E1065",
                      letterSpacing: "-0.02em",
                      fontFamily:
                        "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                    }}
                  >
                    {hideable(fmt(balance.current))}
                  </p>
                  <p className="mt-3 text-[12.5px]" style={{ color: "#7C6AAE" }}>
                    Pronto pra saque · taxa{" "}
                    <b style={{ color: "#2E1065" }}>{fmt(fees.withdrawFixed)}</b> por
                    PIX
                  </p>
                </div>

                {/* Ações dentro do card */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                  <Link
                    href="/v1/products/sales"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/80 px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-white"
                    style={{ border: "1px solid rgba(124,58,237,0.16)" }}
                  >
                    <FileText className="h-4 w-4" style={{ color: "#8B5CF6" }} />
                    Extrato
                  </Link>
                  <button
                    onClick={openWithdraw}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5"
                    style={{
                      background: T.primary,
                      boxShadow: "0 8px 20px -8px rgba(124, 58, 237, 0.55)",
                    }}
                  >
                    <ArrowUpFromLine className="h-4 w-4" />
                    Solicitar saque
                  </button>
                </div>
              </div>

              {/* sub-stats com divisórias finas (arejado) */}
              <div
                className="mt-6 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:gap-0"
                style={{ borderColor: "rgba(124,58,237,0.12)" }}
              >
                <div className="flex-1 sm:pr-5">
                  <p
                    className="text-[10.5px] font-medium uppercase tracking-wider"
                    style={{ color: "#9B8BC9" }}
                  >
                    Saldo bloqueado
                  </p>
                  <p
                    className="mt-1.5 text-[18px] font-semibold"
                    style={{
                      color: "#2E1065",
                      fontFamily:
                        "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                    }}
                  >
                    {hideable(fmt(balance.blocked))}
                  </p>
                </div>
                <div
                  className="flex-1 sm:border-l sm:pl-5"
                  style={{ borderColor: "rgba(124,58,237,0.12)" }}
                >
                  <p
                    className="text-[10.5px] font-medium uppercase tracking-wider"
                    style={{ color: "#9B8BC9" }}
                  >
                    Próximo repasse
                  </p>
                  <p
                    className="mt-1.5 text-[15px] font-semibold"
                    style={{ color: "#2E1065" }}
                  >
                    {nextPayout}
                  </p>
                </div>
                <div
                  className="flex-1 sm:border-l sm:pl-5"
                  style={{ borderColor: "rgba(124,58,237,0.12)" }}
                >
                  <p
                    className="text-[10.5px] font-medium uppercase tracking-wider"
                    style={{ color: "#9B8BC9" }}
                  >
                    Total já recebido
                  </p>
                  <p
                    className="mt-1.5 text-[18px] font-semibold"
                    style={{
                      color: "#2E1065",
                      fontFamily:
                        "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                    }}
                  >
                    {hideable(fmt(totalReceived))}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* HISTÓRICO DE SAQUES */}
        <section
          className="rounded-2xl"
          style={{
            background: T.card,
            border: `1px solid ${T.borderSoft}`,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-end sm:justify-between"
            style={{ borderBottom: `1px solid ${T.borderSoft}` }}
          >
            <div>
              <p className="text-[14px] font-bold text-slate-900">
                Histórico de saques
              </p>
              <p className="mt-0.5 text-[12px] text-slate-500">
                Acompanhe todos os saques que você já solicitou.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter
                  className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                  style={{ color: T.textMuted }}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 appearance-none rounded-lg border bg-white pl-9 pr-8 text-[12.5px] font-semibold text-slate-700 outline-none"
                  style={{ borderColor: T.border }}
                >
                  <option value="">Todos os status</option>
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Aprovado</option>
                  <option value="FAILED">Falhou</option>
                </select>
              </div>
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                style={{ borderColor: T.border }}
                aria-label="Atualizar"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {withdraws.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Receipt
                className="mx-auto mb-3 h-10 w-10"
                style={{ color: T.textMuted }}
              />
              <p className="text-[14px] font-semibold text-slate-700">
                Nenhum saque solicitado ainda
              </p>
              <p className="mt-1 text-[12px] text-slate-500">
                Quando você solicitar um saque, ele aparece aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr
                    className="text-left text-[10.5px] font-bold uppercase tracking-wider"
                    style={{ color: T.textMuted, background: "#F8FAFC" }}
                  >
                    <th className="px-5 py-3">Data e hora</th>
                    <th className="px-5 py-3">Valor solicitado</th>
                    <th className="px-5 py-3">Valor recebido</th>
                    <th className="px-5 py-3">Taxa</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdraws.map((w) => {
                    const status = (w.status || "").toLowerCase();
                    const received =
                      status === "paid" || status === "approved"
                        ? w.amount - (w.feeAmount || 0)
                        : null;
                    return (
                      <tr
                        key={w.id}
                        style={{ borderTop: `1px solid ${T.borderSoft}` }}
                      >
                        <td className="px-5 py-3.5 text-slate-700">
                          {fmtDate(w.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                          {hideable(fmt(w.amount))}
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">
                          {received != null
                            ? hideable(fmt(received))
                            : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">
                          {fmt(w.feeAmount)}
                        </td>
                        <td className="px-5 py-3.5">{statusPill(w.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: `1px solid ${T.borderSoft}` }}
            >
              <p className="text-[11px] text-slate-500">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => fetchWithdraws(page - 1)}
                  className="rounded-lg border bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
                  style={{ borderColor: T.border }}
                >
                  Anterior
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => fetchWithdraws(page + 1)}
                  className="rounded-lg border bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
                  style={{ borderColor: T.border }}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </section>
      </LightShell>

      {/* ----- Modal: confirmar saque ----- */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar saque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-[12px] font-semibold text-slate-600">
                  Valor
                </label>
                <span className="text-[11.5px] text-slate-500">
                  Disponível: <b className="text-slate-700">{hideable(fmt(balance.current))}</b>
                </span>
              </div>
              <div
                className="flex h-11 items-center gap-2 rounded-xl border bg-white px-3"
                style={{ borderColor: T.border }}
              >
                <span className="text-[13px] font-semibold" style={{ color: T.textMuted }}>
                  R$
                </span>
                <input
                  value={amountInput}
                  onChange={(e) =>
                    setAmountInput(
                      e.target.value.replace(/[^\d,.]/g, "").replace(".", ",")
                    )
                  }
                  inputMode="decimal"
                  className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none"
                  placeholder="0,00"
                />
                <button
                  type="button"
                  onClick={() => setAmountInput(balance.current.toFixed(2).replace(".", ","))}
                  className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: T.primary, background: T.primaryBg }}
                >
                  Máx
                </button>
              </div>
              {sacarValor > balance.current && (
                <p className="mt-1 text-[11px] font-medium" style={{ color: T.red }}>
                  Valor maior que o saldo disponível.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-slate-600">
                Chave PIX
              </label>
              <input
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="h-11 w-full rounded-xl border bg-white px-3 text-[14px] outline-none"
                style={{ borderColor: T.border }}
                placeholder="CPF, CNPJ, e-mail ou telefone"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Você receberá <b>{fmt(liquido)}</b> após a taxa de{" "}
                {fmt(totalFee)}.
              </p>
            </div>
            <button
              onClick={submitWithdraw}
              disabled={processing || !pixKey.trim() || sacarValor <= 0 || sacarValor > balance.current}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13.5px] font-bold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: T.primary,
                boxShadow: "0 8px 20px -8px rgba(124, 58, 237, 0.55)",
              }}
            >
              {processing ? "Processando…" : "Confirmar saque"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ----- Modal: 2FA ----- */}
      <Dialog open={twoFAOpen} onOpenChange={setTwoFAOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirme o código 2FA</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <p className="text-[12.5px] text-slate-500">
              Para sua segurança, digite o código atual gerado pelo seu app
              autenticador.
            </p>
            <input
              value={twoFACode}
              onChange={(e) =>
                setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              maxLength={6}
              autoFocus
              className="h-12 w-full rounded-xl border bg-white px-3 text-center text-[20px] font-bold tracking-[0.4em] outline-none"
              style={{ borderColor: T.border }}
              placeholder="••••••"
            />
            <button
              onClick={confirm2FA}
              disabled={twoFALoading || twoFACode.length !== 6}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl text-[13px] font-bold text-white disabled:opacity-50"
              style={{ background: T.primary }}
            >
              {twoFALoading ? "Verificando…" : "Confirmar"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ShadowPanel />
    </>
  );
}

export default function FinancePage() {
  return (
    <ProtectedRoute>
      <FinanceContent />
    </ProtectedRoute>
  );
}

"use client";

/**
 * /v2/manager/withdraw — Saques (admin), com dados REAIS.
 *
 * O saque automático pelo PSP ainda não existe: o seller pede, o saldo fica
 * reservado e o admin faz o PIX por fora e marca aqui como pago (o seller
 * recebe e-mail + notificação "Saque pago"). Recusar devolve o valor pro saldo.
 *   GET   /api/admin/withdraw?status=&page=&pageSize=
 *   PATCH /api/admin/withdraw/:id  { status: "PAID" | "FAILED" }
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Head from "next/head";
import axios from "axios";
import { toast } from "sonner";
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, Copy, RefreshCw, Wallet, X, XCircle } from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage } from "@/lib/axiosErrors";
import { Button, C, Card, Pill } from "@/components/account/ui";

const API = "https://shadowpay-backend.onrender.com";
const PAGE_SIZE = 20;

type W = {
  id: string;
  amount: string;
  pixKey: string | null;
  pixKeyType: string | null;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  createdAt: string;
  paidAt: string | null;
  seller?: { id: string; companyName: string; email: string };
};
type Summary = { byStatus: Record<string, { count: number; amount: number }>; paidToday: { count: number; amount: number } };
type Filter = "PENDING" | "PAID" | "FAILED" | "ALL";

const brl = (v: number | string) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const when = (s?: string | null) =>
  s ? new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const KEY_LABEL: Record<string, string> = { cpf: "CPF", cnpj: "CNPJ", email: "E-mail", phone: "Telefone", random: "Aleatória" };

function StatusPill({ s }: { s: W["status"] }) {
  if (s === "PAID") return <Pill tone="green" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>Pago</Pill>;
  if (s === "FAILED") return <Pill tone="rose" icon={<XCircle className="h-3.5 w-3.5" />}>Recusado</Pill>;
  if (s === "PROCESSING") return <Pill tone="blue">Processando</Pill>;
  return <Pill tone="amber" icon={<Clock className="h-3.5 w-3.5" />}>Pendente</Pill>;
}

function copy(text: string) {
  navigator.clipboard
    ?.writeText(text)
    .then(() => toast.success("Chave PIX copiada."))
    .catch(() => toast.error("Não consegui copiar."));
}

function WithdrawAdminContent() {
  const { token, user } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<W[] | null>(null);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<{ w: W; kind: "pay" | "reject" } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (filter !== "ALL") q.set("status", filter === "PENDING" ? "PENDING,PROCESSING" : filter);
      const r = await axios.get(`${API}/api/admin/withdraw?${q}`, { headers });
      setItems(r.data?.data || []);
      setTotal(r.data?.pagination?.total || 0);
      setSummary(r.data?.summary || null);
    } catch (e) {
      setItems((i) => i ?? []);
      setError(apiErrorMessage(e, "Não consegui carregar os saques."));
    }
  }, [token, headers, filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async () => {
    if (!acting) return;
    setBusy(true);
    try {
      await axios.patch(`${API}/api/admin/withdraw/${acting.w.id}`, { status: acting.kind === "pay" ? "PAID" : "FAILED" }, { headers });
      toast.success(acting.kind === "pay" ? "Saque marcado como pago — o seller foi avisado." : "Saque recusado — o valor voltou para o saldo do seller.");
      setActing(null);
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui atualizar o saque."));
    } finally {
      setBusy(false);
    }
  };

  const s = summary?.byStatus || {};
  const pending = { count: (s.PENDING?.count || 0) + (s.PROCESSING?.count || 0), amount: (s.PENDING?.amount || 0) + (s.PROCESSING?.amount || 0) };
  const kpis = [
    { label: "Aguardando pagamento", value: String(pending.count), sub: `${brl(pending.amount)} reservados`, Icon: Clock, color: "#F59E0B" },
    { label: "Pagos hoje", value: String(summary?.paidToday.count ?? 0), sub: brl(summary?.paidToday.amount ?? 0), Icon: Check, color: "#10B981" },
    { label: "Total pago", value: brl(s.PAID?.amount || 0), sub: `${s.PAID?.count || 0} saques`, Icon: Wallet, color: "#7C3AED" },
    { label: "Recusados", value: String(s.FAILED?.count || 0), sub: `${brl(s.FAILED?.amount || 0)} devolvidos`, Icon: X, color: "#F43F5E" },
  ];
  const FILTERS: { id: Filter; label: string; count?: number }[] = [
    { id: "PENDING", label: "Pendentes", count: pending.count },
    { id: "PAID", label: "Pagos", count: s.PAID?.count || 0 },
    { id: "FAILED", label: "Recusados", count: s.FAILED?.count || 0 },
    { id: "ALL", label: "Todos" },
  ];
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Head>
        <title>ShadowPay — Saques (Admin)</title>
      </Head>
      <LightShell>
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">Admin</p>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900 sm:text-[28px]">Gerenciamento de Saques</h1>
            <p className="mt-1 text-[14px] text-slate-500">Faça o PIX para a chave do seller e marque aqui como pago — ele é avisado na hora.</p>
          </div>
          <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={load} icon={<RefreshCw className="h-4 w-4" />}>
            Atualizar
          </Button>
        </header>

        {!user?.isAdministrator ? (
          <Card className="p-6 text-[14px] text-slate-600">Acesso restrito a administradores.</Card>
        ) : (
          <>
            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map(({ label, value, sub, Icon, color }) => (
                <Card key={label} className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-slate-500">{label}</p>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}14`, color }}>
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-2 whitespace-nowrap text-[24px] font-semibold leading-none tabular-nums text-slate-900">{summary ? value : "—"}</p>
                  <p className="mt-1.5 text-[12px] text-slate-400">{summary ? sub : " "}</p>
                </Card>
              ))}
            </section>

            <Card className="mb-10 overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-[#E6E8EB] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Solicitações de saque</h2>
                  <p className="text-[12px] text-slate-500">O saldo fica reservado até você pagar ou recusar.</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFilter(f.id);
                        setPage(1);
                        setItems(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
                      style={filter === f.id ? { background: C.primary, color: "#fff" } : { background: "#F1F5F9", color: "#475569" }}
                    >
                      {f.label}
                      {f.count != null && summary && (
                        <span className="rounded-full px-1.5 text-[11px]" style={{ background: filter === f.id ? "rgba(255,255,255,0.22)" : "#E2E8F0" }}>
                          {f.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {error ? (
                <p className="px-5 py-10 text-center text-[14px] text-rose-600">{error}</p>
              ) : items === null ? (
                <div className="space-y-2 p-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-50" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-14 text-center">
                  <Wallet className="h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-[14px] font-semibold text-slate-700">
                    {filter === "PENDING" ? "Nenhum saque esperando pagamento" : "Nenhum saque aqui"}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-slate-500">Quando um seller pedir saque, ele aparece nesta lista.</p>
                </div>
              ) : (
                <>
                  {/* computador: tabela */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="text-[10.5px] uppercase tracking-[0.12em] text-slate-400">
                          <th className="px-5 py-3 font-semibold">Seller</th>
                          <th className="px-3 py-3 font-semibold">Valor</th>
                          <th className="px-3 py-3 font-semibold">Chave PIX</th>
                          <th className="px-3 py-3 font-semibold">Status</th>
                          <th className="px-5 py-3 text-right font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((w) => (
                          <tr key={w.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                            <td className="max-w-[260px] px-5 py-3.5">
                              <p className="truncate font-semibold text-slate-900">{w.seller?.companyName || "—"}</p>
                              <p className="truncate text-[12px] text-slate-500">{w.seller?.email}</p>
                              <p className="mt-0.5 text-[11.5px] text-slate-400">Pedido em {when(w.createdAt)}</p>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3.5 font-semibold tabular-nums text-slate-900">{brl(w.amount)}</td>
                            <td className="px-3 py-3.5">
                              {w.pixKey ? (
                                <button onClick={() => copy(w.pixKey!)} className="group flex max-w-[220px] items-center gap-1.5 text-left" title="Copiar chave">
                                  <span className="truncate font-mono text-[12.5px] text-slate-700">{w.pixKey}</span>
                                  <Copy className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-violet-600" />
                                </button>
                              ) : (
                                "—"
                              )}
                              <p className="text-[11.5px] text-slate-400">{KEY_LABEL[w.pixKeyType || ""] || w.pixKeyType || ""}</p>
                            </td>
                            <td className="px-3 py-3.5">
                              <StatusPill s={w.status} />
                              {w.status === "PAID" && <p className="mt-1 text-[11px] text-slate-400">{when(w.paidAt)}</p>}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {w.status === "PENDING" || w.status === "PROCESSING" ? (
                                <div className="flex justify-end gap-1.5">
                                  <Button className="h-9 px-3.5 text-[12.5px]" onClick={() => setActing({ w, kind: "pay" })} icon={<Check className="h-3.5 w-3.5" />}>
                                    Marcar pago
                                  </Button>
                                  <Button variant="danger" className="h-9 px-3 text-[12.5px]" onClick={() => setActing({ w, kind: "reject" })}>
                                    Recusar
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-[12px] text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* celular: cartões */}
                  <ul className="divide-y divide-slate-100 md:hidden">
                    {items.map((w) => (
                      <li key={w.id} className="px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-semibold text-slate-900">{w.seller?.companyName || "—"}</p>
                            <p className="truncate text-[12px] text-slate-500">{w.seller?.email}</p>
                          </div>
                          <p className="whitespace-nowrap text-[15px] font-bold tabular-nums text-slate-900">{brl(w.amount)}</p>
                        </div>
                        {w.pixKey && (
                          <button onClick={() => copy(w.pixKey!)} className="mt-2 flex max-w-full items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-left">
                            <span className="text-[11px] font-semibold text-slate-400">{KEY_LABEL[w.pixKeyType || ""] || "PIX"}</span>
                            <span className="truncate font-mono text-[12px] text-slate-700">{w.pixKey}</span>
                            <Copy className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          </button>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <StatusPill s={w.status} />
                          <span className="text-[11.5px] text-slate-400">{when(w.createdAt)}</span>
                        </div>
                        {(w.status === "PENDING" || w.status === "PROCESSING") && (
                          <div className="mt-3 flex gap-2">
                            <Button className="h-10 flex-1 text-[13px]" onClick={() => setActing({ w, kind: "pay" })} icon={<Check className="h-4 w-4" />}>
                              Marcar como pago
                            </Button>
                            <Button variant="danger" className="h-10 px-4 text-[13px]" onClick={() => setActing({ w, kind: "reject" })}>
                              Recusar
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  {pages > 1 && (
                    <div className="flex items-center justify-between border-t border-[#E6E8EB] px-5 py-3 text-[12.5px] text-slate-500">
                      <span>
                        Página {page} de {pages} · {total} saques
                      </span>
                      <div className="flex gap-1.5">
                        <Button variant="outline" className="h-9 w-9 px-0" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Página anterior">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="h-9 w-9 px-0" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Próxima página">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </>
        )}

        {acting &&
          createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={() => !busy && setActing(null)}>
              <div
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-[max(24px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl"
              >
                <p className="text-[17px] font-bold text-slate-900">
                  {acting.kind === "pay" ? `Confirmar pagamento de ${brl(acting.w.amount)}?` : `Recusar saque de ${brl(acting.w.amount)}?`}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                  {acting.kind === "pay"
                    ? `Faça o PIX para ${acting.w.seller?.companyName || "o seller"} antes de confirmar. Ao confirmar, ele recebe a notificação de saque pago.`
                    : `O valor volta para o saldo disponível de ${acting.w.seller?.companyName || "o seller"}.`}
                </p>
                {acting.kind === "pay" && acting.w.pixKey && (
                  <button onClick={() => copy(acting.w.pixKey!)} className="mt-4 flex w-full items-center gap-2 rounded-xl border border-[#E6E8EB] bg-slate-50 px-3.5 py-3 text-left">
                    <span className="text-[11.5px] font-semibold text-slate-400">{KEY_LABEL[acting.w.pixKeyType || ""] || "PIX"}</span>
                    <span className="flex-1 truncate font-mono text-[13px] font-semibold text-slate-800">{acting.w.pixKey}</span>
                    <Copy className="h-4 w-4 shrink-0" style={{ color: C.primary }} />
                  </button>
                )}
                <div className="mt-5 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setActing(null)} disabled={busy}>
                    Cancelar
                  </Button>
                  <Button variant={acting.kind === "pay" ? "primary" : "danger"} className="flex-1" onClick={act} loading={busy}>
                    {acting.kind === "pay" ? "Já paguei, confirmar" : "Recusar saque"}
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </LightShell>
      <ShadowPanel />
    </>
  );
}

export default function WithdrawAdmin() {
  return (
    <ProtectedRoute>
      <WithdrawAdminContent />
    </ProtectedRoute>
  );
}

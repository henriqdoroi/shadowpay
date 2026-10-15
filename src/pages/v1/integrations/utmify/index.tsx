"use client";

/**
 * Integrações -> UTMify (por seller).
 *
 * O token fica SÓ no backend (criptografado); aqui só aparecem os 4 últimos
 * caracteres. As vendas vão pra UTMify pelo servidor, com fila e novas
 * tentativas — esta tela mostra o estado e o histórico desses envios.
 */
import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FlaskConical,
  KeyRound,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage, withRetry } from "@/lib/axiosErrors";

const API = "https://shadowpay-backend.onrender.com";

const T = {
  primary: "#7C3AED",
  primaryStrong: "#6D28D9",
  primaryBg: "rgba(124, 58, 237, 0.08)",
  amber: "#D97706",
  amberBg: "rgba(245, 158, 11, 0.08)",
  green: "#16A34A",
  red: "#DC2626",
  border: "rgba(15, 23, 42, 0.08)",
  borderSoft: "rgba(15, 23, 42, 0.06)",
  textMuted: "#94A3B8",
};

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: `1px solid ${T.borderSoft}`,
  boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
};

type Status = {
  connected: boolean;
  active: boolean;
  tokenHint: string | null;
  credentialUnreadable: boolean;
  credentialInvalid: boolean;
  connectedAt: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  migratedFromProduct: { distinctTokens: number; migratedAt: string | null } | null;
  queue: { pending: number; paused: number; failed: number; sent: number; skipped: number; sentLast24h: number };
  syncEnabled: boolean;
  testMode: boolean;
};

type EventRow = {
  id: string;
  transactionId: string;
  kind: string;
  status: string;
  attempts: number;
  lastHttpStatus: number | null;
  lastError: string | null;
  sentAt: string | null;
  nextAttemptAt: string;
  createdAt: string;
  canRetry: boolean;
  sale: { id: string; amount: string; customerName: string | null; createdAt: string } | null;
};

const KIND_LABEL: Record<string, string> = {
  waiting_payment: "Aguardando pagamento",
  paid: "Pago",
  refused: "Recusado / expirado",
  refunded: "Reembolsado",
  chargedback: "Chargeback",
};

type Badge = { label: string; color: string; bg: string };
const BADGE_NEUTRAL: Badge = { label: "Ignorado", color: "#475569", bg: "#F1F5F9" };
const EVENT_STATUS: Record<string, Badge> = {
  SENT: { label: "Enviado", color: "#047857", bg: "#ECFDF5" },
  PENDING: { label: "Na fila", color: "#B45309", bg: "#FFFBEB" },
  PROCESSING: { label: "Enviando", color: "#B45309", bg: "#FFFBEB" },
  FAILED: { label: "Falhou", color: "#B91C1C", bg: "#FEF2F2" },
  PAUSED: { label: "Pausado", color: "#B91C1C", bg: "#FEF2F2" },
  SKIPPED: { label: "Ignorado", color: "#475569", bg: "#F1F5F9" },
  CANCELLED: { label: "Cancelado", color: "#475569", bg: "#F1F5F9" },
};

const FILTERS = [
  { id: "", label: "Todos" },
  { id: "FAILED", label: "Com falha" },
  { id: "PENDING", label: "Na fila" },
  { id: "PAUSED", label: "Pausados" },
  { id: "SENT", label: "Enviados" },
] as const;

function relTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "agora há pouco";
  const min = Math.round(diff / 60_000);
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} dia${d > 1 ? "s" : ""}`;
}

const dateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "—";

const brl = (v: string | number) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function UtmifyContent() {
  const { token } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newToken, setNewToken] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const h = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const loadStatus = useCallback(async () => {
    if (!token) return;
    try {
      const r = await withRetry(() => axios.get(`${API}/api/integrations/utmify`, h()));
      setStatus(r.data?.data ?? null);
      setLoadError(null);
    } catch (e) {
      setLoadError(apiErrorMessage(e, "Não consegui carregar a integração."));
    } finally {
      setLoading(false);
    }
  }, [token, h]);

  const loadEvents = useCallback(async () => {
    if (!token) return;
    setLoadingEvents(true);
    try {
      const qs = new URLSearchParams({ limit: "50", ...(filter ? { status: filter } : {}) });
      const r = await withRetry(() => axios.get(`${API}/api/integrations/utmify/events?${qs}`, h()));
      setEvents(r.data?.data || []);
    } catch {
      // a lista é secundária: o status já mostra o erro principal
    } finally {
      setLoadingEvents(false);
    }
  }, [token, filter, h]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (status?.connected) loadEvents();
  }, [status?.connected, loadEvents]);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }

  const connect = (e: React.FormEvent) => {
    e.preventDefault();
    const value = newToken.trim();
    if (!value) {
      toast.error("Cole o token da UTMify.");
      return;
    }
    run("connect", async () => {
      try {
        const r = await axios.post(`${API}/api/integrations/utmify`, { token: value }, h());
        const test = r.data?.data?.test;
        if (test?.ok) toast.success(r.data?.message || "UTMify conectada!");
        else toast.warning(r.data?.message || "Token salvo, mas o teste não foi conclusivo.");
        setNewToken("");
        setReveal(false);
        setShowForm(false);
        await loadStatus();
        await loadEvents();
      } catch (err) {
        toast.error(apiErrorMessage(err, "Não foi possível conectar."));
      }
    });
  };

  const testConnection = () =>
    run("test", async () => {
      try {
        const r = await axios.post(`${API}/api/integrations/utmify/test`, {}, h());
        const test = r.data?.data?.test;
        if (test?.ok) toast.success(test.message);
        else toast.error(test?.message || "A UTMify não confirmou o token.");
        await loadStatus();
      } catch (err) {
        toast.error(apiErrorMessage(err, "Não foi possível testar agora."));
      }
    });

  const toggleActive = () =>
    run("active", async () => {
      const next = !status?.active;
      if (!next && !confirm("Pausar os envios? Vendas novas não vão pra UTMify até você retomar.")) return;
      try {
        const r = await axios.post(`${API}/api/integrations/utmify/active`, { active: next }, h());
        setStatus(r.data?.data ?? null);
        toast.success(next ? "Envios retomados." : "Envios pausados.");
        await loadEvents();
      } catch (err) {
        toast.error(apiErrorMessage(err, "Não foi possível alterar."));
      }
    });

  const disconnect = () =>
    run("disconnect", async () => {
      if (!confirm("Desconectar a UTMify? O token é apagado e nada mais é enviado.")) return;
      try {
        await axios.delete(`${API}/api/integrations/utmify`, h());
        toast.success("UTMify desconectada.");
        setEvents([]);
        await loadStatus();
      } catch (err) {
        toast.error(apiErrorMessage(err, "Não foi possível desconectar."));
      }
    });

  const retryOne = (id: string) =>
    run(`retry:${id}`, async () => {
      try {
        await axios.post(`${API}/api/integrations/utmify/events/${id}/retry`, {}, h());
        toast.success("Reenvio agendado.");
        setTimeout(() => {
          loadEvents();
          loadStatus();
        }, 2500);
        await loadEvents();
      } catch (err) {
        toast.error(apiErrorMessage(err, "Não foi possível reenviar."));
      }
    });

  const retryAll = () =>
    run("retryAll", async () => {
      try {
        const r = await axios.post(`${API}/api/integrations/utmify/events/retry-failed`, {}, h());
        const n = r.data?.data?.queued ?? 0;
        toast.success(n ? `${n} envio(s) voltaram pra fila.` : "Nada pra reenviar.");
        setTimeout(() => {
          loadEvents();
          loadStatus();
        }, 2500);
        await loadEvents();
      } catch (err) {
        toast.error(apiErrorMessage(err, "Não foi possível reenviar."));
      }
    });

  // ---------------------------------------------------------------- estado
  const s = status;
  const state: { label: string; color: string; bg: string; icon: React.ReactNode } = !s?.connected
    ? { label: "Não conectada", color: "#475569", bg: "#F1F5F9", icon: <XCircle className="h-3.5 w-3.5" /> }
    : s.credentialInvalid || s.credentialUnreadable
    ? { label: "Token recusado", color: "#B91C1C", bg: "#FEF2F2", icon: <AlertTriangle className="h-3.5 w-3.5" /> }
    : !s.active
    ? { label: "Pausada", color: "#B45309", bg: "#FFFBEB", icon: <PauseCircle className="h-3.5 w-3.5" /> }
    : { label: "Conectada e enviando", color: "#047857", bg: "#ECFDF5", icon: <CheckCircle2 className="h-3.5 w-3.5" /> };

  const tokenForm = (
    <form onSubmit={connect} className="mt-4 rounded-xl p-4" style={{ background: "#F8FAFC", border: `1px solid ${T.borderSoft}` }}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Token da API da UTMify
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            value={newToken}
            onChange={(e) => setNewToken(e.target.value)}
            type={reveal ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            placeholder="Cole aqui o token gerado na UTMify"
            className="h-10 w-full rounded-lg bg-white px-3 pr-10 font-mono text-[13px] outline-none"
            style={{ border: `1px solid ${T.border}` }}
          />
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
            aria-label={reveal ? "Esconder token" : "Mostrar token"}
          >
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button
          type="submit"
          disabled={busy === "connect"}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"
          style={{ background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`, boxShadow: "0 6px 16px -8px rgba(124,58,237,0.45)" }}
        >
          {busy === "connect" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {s?.connected ? "Testar e substituir" : "Conectar e testar"}
        </button>
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">
        Antes de salvar, mandamos um <b>pedido de teste</b> pra UTMify (ela valida e não grava nada). Se ela recusar, o
        token não é salvo. Depois de salvo, o token fica criptografado e só os 4 últimos caracteres aparecem aqui.
      </p>
    </form>
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link href="/v1/integrations" className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" />
        Integrações
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: T.amberBg, color: T.amber }}>
            <BarChart3 className="h-6 w-6" />
          </span>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">INTEGRAÇÕES · RASTREIO</p>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900 sm:text-[28px]" style={{ letterSpacing: "-0.005em" }}>
              UTMify
            </h1>
            <p className="mt-1 max-w-2xl text-[13px] text-slate-500">
              Suas vendas (com as UTMs) chegam sozinhas na sua conta UTMify — pendentes, pagas, recusadas, reembolsos e
              chargebacks. Tudo enviado pelo servidor da ShadowPay.
            </p>
          </div>
        </div>
        {s && (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold" style={{ color: state.color, background: state.bg }}>
            {state.icon}
            {state.label}
          </span>
        )}
      </header>

      {loading ? (
        <div className="rounded-2xl px-5 py-12 text-center text-[13px] text-slate-500" style={cardStyle}>
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-slate-400" />
          Carregando…
        </div>
      ) : loadError && !s ? (
        <div className="rounded-2xl px-5 py-10 text-center" style={cardStyle}>
          <p className="text-[14px] font-semibold text-slate-700">{loadError}</p>
          <button onClick={loadStatus} className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: T.primary }}>
            <RefreshCw className="h-4 w-4" /> Tentar de novo
          </button>
        </div>
      ) : (
        <>
          {/* Avisos */}
          {s?.testMode && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl p-4" style={{ background: T.primaryBg, border: `1px solid ${T.borderSoft}` }}>
              <FlaskConical className="mt-0.5 h-[18px] w-[18px] shrink-0" style={{ color: T.primary }} />
              <p className="text-[12.5px] leading-relaxed text-slate-600">
                <b className="text-slate-900">Ambiente de teste.</b> Os pedidos vão com <b>isTest</b>: a UTMify valida, mas
                não grava nada no seu painel.
              </p>
            </div>
          )}
          {s?.connected && (s.credentialInvalid || s.credentialUnreadable) && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl p-4" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <AlertTriangle className="mt-0.5 h-[18px] w-[18px] shrink-0" style={{ color: T.red }} />
              <div className="text-[12.5px] leading-relaxed text-red-900">
                <b>A UTMify recusou o token salvo — os envios estão pausados.</b> Gere uma nova credencial na UTMify e clique em{" "}
                <b>Substituir token</b>. As vendas que ficaram pausadas são enviadas assim que o token novo for aceito.
              </div>
            </div>
          )}
          {s?.connected && s.migratedFromProduct && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl p-4" style={{ background: T.amberBg, border: `1px solid ${T.borderSoft}` }}>
              <KeyRound className="mt-0.5 h-[18px] w-[18px] shrink-0" style={{ color: T.amber }} />
              <p className="text-[12.5px] leading-relaxed text-slate-600">
                <b className="text-slate-900">Trouxemos o token que estava no seu produto.</b> O token da UTMify agora vale
                pra conta inteira (antes ficava em cada produto e aparecia no checkout).
                {s.migratedFromProduct.distinctTokens > 1 &&
                  ` Seus produtos tinham ${s.migratedFromProduct.distinctTokens} tokens diferentes; ficou o do produto editado por último.`}{" "}
                Clique em <b>Testar conexão</b> pra confirmar.
              </p>
            </div>
          )}

          {/* Conexão */}
          <section className="mb-6 rounded-2xl p-5" style={cardStyle}>
            {!s?.connected ? (
              <>
                <h2 className="text-[15px] font-bold text-slate-900">Conectar sua conta UTMify</h2>
                <p className="mt-1 text-[12.5px] text-slate-500">
                  Cada conta ShadowPay usa o próprio token — suas vendas só vão pra sua UTMify.
                </p>
                {tokenForm}
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat label="Token" value={s.tokenHint || "—"} mono />
                  <Stat label="Conectada" value={dateTime(s.connectedAt)} />
                  <Stat label="Último envio aceito" value={relTime(s.lastSyncedAt)} hint={dateTime(s.lastSyncedAt)} />
                  <Stat label="Enviados (24h)" value={String(s.queue.sentLast24h)} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Chip label="Na fila" value={s.queue.pending} color="#B45309" />
                  <Chip label="Com falha" value={s.queue.failed} color="#B91C1C" />
                  <Chip label="Pausados" value={s.queue.paused} color="#B91C1C" />
                  <Chip label="Enviados (total)" value={s.queue.sent} color="#047857" />
                </div>

                {s.lastError && (
                  <div className="mt-4 rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed" style={{ background: "#FFF7ED", border: "1px solid #FED7AA", color: "#9A3412" }}>
                    <b>Último aviso</b> ({relTime(s.lastErrorAt)}): {s.lastError}
                  </div>
                )}
                {!s.syncEnabled && (
                  <div className="mt-4 rounded-xl px-3.5 py-2.5 text-[12px]" style={{ background: "#F1F5F9", color: "#334155" }}>
                    O envio está desligado no servidor (UTMIFY_SYNC_DISABLED). As vendas ficam na fila até ele ser ligado.
                  </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <ActionButton onClick={testConnection} busy={busy === "test"} icon={<Send className="h-4 w-4" />}>
                    Testar conexão
                  </ActionButton>
                  <ActionButton onClick={() => setShowForm((v) => !v)} icon={<KeyRound className="h-4 w-4" />}>
                    Substituir token
                  </ActionButton>
                  <ActionButton
                    onClick={toggleActive}
                    busy={busy === "active"}
                    icon={s.active ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                  >
                    {s.active ? "Pausar envios" : "Retomar envios"}
                  </ActionButton>
                  <ActionButton onClick={disconnect} busy={busy === "disconnect"} danger icon={<Trash2 className="h-4 w-4" />}>
                    Desconectar
                  </ActionButton>
                </div>
                {showForm && tokenForm}
              </>
            )}
          </section>

          {/* Histórico */}
          {s?.connected && (
            <section className="mb-6 overflow-hidden rounded-2xl" style={cardStyle}>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Envios pra UTMify</h2>
                  <p className="mt-0.5 text-[12px] text-slate-500">Cada mudança de status de uma venda vira um envio.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      loadEvents();
                      loadStatus();
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
                    style={{ border: `1px solid ${T.borderSoft}` }}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingEvents ? "animate-spin" : ""}`} />
                    Atualizar
                  </button>
                  {(s.queue.failed > 0 || s.queue.paused > 0) && (
                    <button
                      onClick={retryAll}
                      disabled={busy === "retryAll"}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold text-white disabled:opacity-60"
                      style={{ background: T.primary }}
                    >
                      {busy === "retryAll" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      Reenviar falhas
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 px-5 pb-3 pt-4">
                {FILTERS.map((f) => (
                  <button
                    key={f.id || "all"}
                    onClick={() => setFilter(f.id)}
                    className="h-7 rounded-full px-3 text-[11.5px] font-semibold transition-colors"
                    style={
                      filter === f.id
                        ? { background: T.primary, color: "#fff" }
                        : { background: "#F1F5F9", color: "#475569" }
                    }
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {events.length === 0 ? (
                <div className="px-5 pb-10 pt-6 text-center">
                  <Clock className="mx-auto mb-2 h-8 w-8" style={{ color: T.textMuted }} />
                  <p className="text-[13px] font-semibold text-slate-700">
                    {loadingEvents ? "Carregando…" : "Nenhum envio por aqui ainda"}
                  </p>
                  {!loadingEvents && (
                    <p className="mt-1 text-[12px] text-slate-500">Assim que entrar uma venda, ela aparece nesta lista.</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-[12.5px]">
                    <thead>
                      <tr className="text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted, background: "#F8FAFC" }}>
                        <th className="px-5 py-2.5">Venda</th>
                        <th className="px-3 py-2.5">Status enviado</th>
                        <th className="px-3 py-2.5">Situação</th>
                        <th className="px-3 py-2.5">Detalhe</th>
                        <th className="px-5 py-2.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e) => {
                        const st = EVENT_STATUS[e.status] ?? BADGE_NEUTRAL;
                        const detail =
                          e.status === "SENT"
                            ? `Aceito ${relTime(e.sentAt)}`
                            : e.status === "PENDING" && e.attempts > 0
                            ? `${e.lastError || "Tentando de novo"} · próxima ${dateTime(e.nextAttemptAt)}`
                            : e.lastError || "—";
                        return (
                          <tr key={e.id} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                            <td className="px-5 py-3 align-top">
                              <p className="font-semibold text-slate-900">
                                {e.sale ? brl(e.sale.amount) : "—"}
                                {e.sale?.customerName && <span className="font-normal text-slate-500"> · {e.sale.customerName}</span>}
                              </p>
                              <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                                #{e.transactionId.slice(0, 8).toUpperCase()} · {dateTime(e.sale?.createdAt ?? e.createdAt)}
                              </p>
                            </td>
                            <td className="px-3 py-3 align-top text-slate-700">{KIND_LABEL[e.kind] || e.kind}</td>
                            <td className="px-3 py-3 align-top">
                              <span className="inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ color: st.color, background: st.bg }}>
                                {st.label}
                              </span>
                              {e.attempts > 1 && <p className="mt-1 text-[10.5px] text-slate-400">{e.attempts} tentativas</p>}
                            </td>
                            <td className="max-w-[300px] px-3 py-3 align-top text-[12px] leading-relaxed text-slate-500">{detail}</td>
                            <td className="px-5 py-3 text-right align-top">
                              {e.canRetry ? (
                                <button
                                  onClick={() => retryOne(e.id)}
                                  disabled={busy === `retry:${e.id}`}
                                  className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11.5px] font-semibold disabled:opacity-60"
                                  style={{ color: T.primary, background: T.primaryBg }}
                                >
                                  {busy === `retry:${e.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                                  Reenviar
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-300">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Como funciona */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl p-5" style={cardStyle}>
              <h2 className="text-[15px] font-bold text-slate-900">Onde pegar o token</h2>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[12.5px] leading-relaxed text-slate-600">
                <li>Entre na sua conta da UTMify.</li>
                <li>
                  Vá em <b>Integrações → Webhooks → Credenciais de API</b>.
                </li>
                <li>
                  Clique em <b>Adicionar Credencial</b> e depois em <b>Criar Credencial</b>.
                </li>
                <li>Copie o token gerado e cole aqui.</li>
              </ol>
              <a
                href="https://docs.utmify.com.br/envio-de-vendas"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-[12px] font-semibold"
                style={{ color: T.primary }}
              >
                Documentação oficial da UTMify →
              </a>
            </div>

            <div className="rounded-2xl p-5" style={cardStyle}>
              <h2 className="text-[15px] font-bold text-slate-900">Como funciona</h2>
              <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-slate-600">
                <li>
                  <b className="text-slate-900">Status:</b> PIX gerado → <i>aguardando pagamento</i>; pago → <i>pago</i>;
                  expirado/recusado → <i>recusado</i>; reembolso → <i>reembolsado</i>; chargeback → <i>chargeback</i>.
                </li>
                <li>
                  <b className="text-slate-900">UTMs:</b> utm_source, utm_medium, utm_campaign, utm_content, utm_term, src e
                  sck do link do checkout vão junto com a venda (último clique com parâmetros, guardado por 30 dias).
                </li>
                <li>
                  <b className="text-slate-900">Sem perder venda:</b> se a UTMify estiver fora do ar, a venda fica na fila e é
                  reenviada sozinha. O pagamento nunca espera a UTMify.
                </li>
                <li>
                  <b className="text-slate-900">Limites da UTMify:</b> ela só aceita pedidos de até 7 dias (reembolso e
                  chargeback até 45 dias) — vendas mais antigas aparecem como &quot;Ignorado&quot;.
                </li>
              </ul>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint, mono }: { label: string; value: string; hint?: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 truncate text-[14px] font-bold text-slate-900 ${mono ? "font-mono" : ""}`} title={hint}>
        {value}
      </p>
    </div>
  );
}

function Chip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: "#F8FAFC", border: `1px solid ${T.borderSoft}` }}>
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-[16px] font-bold" style={{ color: value > 0 ? color : "#0F172A" }}>
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  busy,
  icon,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy?: boolean;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-[12.5px] font-semibold transition-colors disabled:opacity-60 ${
        danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"
      }`}
      style={{ border: `1px solid ${danger ? "#FECACA" : T.border}` }}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

export default function UtmifyIntegrationPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — UTMify</title>
      </Head>
      <LightShell>
        <UtmifyContent />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}

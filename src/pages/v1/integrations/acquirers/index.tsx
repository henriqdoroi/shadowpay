"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  BarChart3,
  GripVertical,
  Loader2,
  Sparkles,
  TrendingUp,
  X,
  Beaker,
  Trophy,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primaryStrong: "#6D28D9",
  primaryBg: "rgba(124, 58, 237, 0.08)",
  border: "rgba(15, 23, 42, 0.08)",
  borderSoft: "rgba(15, 23, 42, 0.06)",
};

type AcquirerRow = {
  id: string;
  acquirerId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  feePercent?: number | null;
  withdrawalFee?: number | null;
  priority: number;
  active: boolean;
  autoOptimize: boolean;
  attempts: number;
  approved: number;
  conversionRate: number;
};

type ABTest = {
  id: string;
  status: "RUNNING" | "COMPLETED" | "CANCELLED";
  goalPerAcquirer: number;
  participantsJson: Array<{
    acquirerId: string;
    attempts: number;
    approved: number;
  }>;
  winnerAcquirerId?: string | null;
  startedAt: string;
  finishedAt?: string | null;
};

function AcquirersContent() {
  const { token } = useAuth();
  const [rows, setRows] = useState<AcquirerRow[]>([]);
  const [autoOpt, setAutoOpt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastTest, setLastTest] = useState<ABTest | null>(null);
  const [showABModal, setShowABModal] = useState(false);

  // perf range filter ("1h" | "today" | "3d")
  const [perfRange, setPerfRange] = useState<"1h" | "today" | "3d">("today");

  async function fetchAll() {
    if (!token) return;
    try {
      const [r1, r2] = await Promise.all([
        axios.get(`${API}/api/adquerers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios
          .get(`${API}/api/adquerers/ab-test`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch(() => null),
      ]);
      if (r1.data?.success) {
        setRows(r1.data.data || []);
        setAutoOpt(Boolean(r1.data.autoOptimize));
      }
      if (r2?.data?.success) setLastTest(r2.data.data);
    } catch (e) {
      console.error("acquirers", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ------- drag & drop pra reordenar prioridade ------- */
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  async function persistOrder(next: AcquirerRow[]) {
    setRows(next);
    try {
      await axios.post(
        `${API}/api/adquerers/reorder`,
        { order: next.map((r) => r.acquirerId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e: any) {
      toast.error("Não foi possível salvar a ordem.");
    }
  }

  function onDragStart(idx: number) {
    setDragIdx(idx);
  }
  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const next = [...rows];
    const moved = next.splice(dragIdx, 1)[0];
    if (!moved) return;
    next.splice(idx, 0, moved);
    setDragIdx(idx);
    setRows(next);
  }
  async function onDragEnd() {
    if (dragIdx !== null) {
      setDragIdx(null);
      await persistOrder(rows);
    }
  }

  async function toggleActive(row: AcquirerRow) {
    try {
      const r = await axios.post(
        `${API}/api/adquerers/${row.id}/toggle`,
        { active: !row.active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        setRows((rs) =>
          rs.map((x) => (x.id === row.id ? { ...x, active: !x.active } : x))
        );
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao atualizar.");
    }
  }

  async function toggleAutoOpt() {
    try {
      const r = await axios.post(
        `${API}/api/adquerers/auto-optimize`,
        { enabled: !autoOpt },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) setAutoOpt(r.data.autoOptimize);
    } catch (e: any) {
      toast.error("Erro ao salvar.");
    }
  }

  /* ------- classificação de performance (top 5 por conversão) ------- */
  const ranking = useMemo(
    () =>
      [...rows]
        .filter((r) => r.active)
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 5),
    [rows]
  );

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            AVANÇADO
          </p>
          <h1
            className="text-[22px] font-bold tracking-tight sm:text-[28px] text-slate-900"
            style={{ letterSpacing: "-0.005em" }}
          >
            Performance das Adquirentes
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Arraste para priorizar. A ordem é salva automaticamente.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="h-10 rounded-xl bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none"
            style={{ border: `1px solid ${T.borderSoft}` }}
            readOnly
          />
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            style={{ border: `1px solid ${T.borderSoft}` }}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Modo Analítico
          </button>
          <button
            onClick={() => setShowABModal(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white"
            style={{
              background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
              boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
            }}
          >
            <Beaker className="h-3.5 w-3.5" />
            Iniciar Teste A/B
          </button>
        </div>
      </header>

      <div
        className="mb-6 rounded-2xl p-4 text-[12.5px] text-slate-600"
        style={{
          background: T.primaryBg,
          border: `1px solid ${T.border}`,
        }}
      >
        <b style={{ color: T.text }}>Como funciona?</b> O sistema tentará
        processar suas vendas usando as adquirentes na ordem que você definir.
        Se a "adquirente 1" falhar, ele automaticamente tentará a "adquirente
        2", e assim por diante. A ordem é salva automaticamente ao arrastar.
      </div>

      {/* Último Teste A/B */}
      <section
        className="mb-6 rounded-2xl p-5"
        style={{
          background: "#FFFFFF",
          border: `1px solid ${T.borderSoft}`,
          boxShadow:
            "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        }}
      >
        <h2 className="mb-3 text-[14px] font-bold text-slate-900">
          Resultados do Último Teste A/B
        </h2>
        {lastTest ? (
          <div>
            <div className="mb-3 flex items-center gap-2 text-[12px]">
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold uppercase tracking-wider"
                style={{
                  background:
                    lastTest.status === "RUNNING"
                      ? "rgba(245,158,11,0.10)"
                      : lastTest.status === "COMPLETED"
                      ? "rgba(22,163,74,0.10)"
                      : "#F1F5F9",
                  color:
                    lastTest.status === "RUNNING"
                      ? "#B45309"
                      : lastTest.status === "COMPLETED"
                      ? "#15803D"
                      : "#64748B",
                }}
              >
                {lastTest.status}
              </span>
              <span className="text-slate-500">
                Meta: {lastTest.goalPerAcquirer} transações por adquirente ·
                iniciado{" "}
                {new Date(lastTest.startedAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {lastTest.participantsJson.map((p) => {
                const acq = rows.find((r) => r.acquirerId === p.acquirerId);
                const conv =
                  p.attempts > 0 ? (p.approved / p.attempts) * 100 : 0;
                const isWinner = lastTest.winnerAcquirerId === p.acquirerId;
                return (
                  <div
                    key={p.acquirerId}
                    className="rounded-xl p-3"
                    style={{
                      background: isWinner ? "rgba(22,163,74,0.06)" : "#F8FAFC",
                      border: `1px solid ${
                        isWinner ? "rgba(22,163,74,0.25)" : T.borderSoft
                      }`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {isWinner && (
                        <Trophy className="h-4 w-4 text-emerald-600" />
                      )}
                      <p className="font-semibold text-slate-800">
                        {acq?.name || p.acquirerId}
                      </p>
                      {acq?.code && (
                        <span
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase"
                          style={{ background: "#F1F5F9", color: T.text2 }}
                        >
                          {acq.code}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-[12px]">
                      <div>
                        <p className="text-[10px] uppercase text-slate-400">
                          Tentativas
                        </p>
                        <p className="font-mono font-bold text-slate-700">
                          {p.attempts}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-400">
                          Aprovadas
                        </p>
                        <p className="font-mono font-bold text-slate-700">
                          {p.approved}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-400">
                          Conv.
                        </p>
                        <p className="font-mono font-bold text-emerald-700">
                          {conv.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-slate-500">
            Nenhum histórico de teste recente. Inicie um novo teste para
            comparar adquirentes.
          </p>
        )}
      </section>

      {/* Auto Optimize */}
      <section
        className="mb-6 flex items-center justify-between gap-4 rounded-2xl p-5"
        style={{
          background: "#FFFFFF",
          border: `1px solid ${T.borderSoft}`,
          boxShadow:
            "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: T.primaryBg, color: T.primary }}
          >
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-slate-900">
              Otimização Automática de Adquirentes
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Quando ativado, nosso sistema reordenará automaticamente suas
              adquirentes a cada hora, priorizando a que possui a melhor taxa
              de conversão em toda a plataforma.
            </p>
            <p className="mt-1 text-[12px] font-semibold text-slate-700">
              Ativar Otimização Automática
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoOpt}
          onClick={toggleAutoOpt}
          className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
          style={{ background: autoOpt ? T.primary : "#E2E8F0" }}
        >
          <span
            className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
            style={{
              transform: autoOpt ? "translateX(22px)" : "translateX(2px)",
            }}
          />
        </button>
      </section>

      {/* Classificação de Performance — top 5 */}
      <section className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-600">
          Classificação de Performance
        </h2>
        <div
          className="inline-flex items-center gap-1 rounded-lg p-1 text-[11px] font-semibold"
          style={{ background: "#F1F5F9" }}
        >
          <span className="px-2 text-slate-400 uppercase tracking-wider">
            Calcular em:
          </span>
          {(["1h", "today", "3d"] as const).map((r) => {
            const label = r === "1h" ? "1 Hora" : r === "today" ? "Hoje" : "3 Dias";
            const active = perfRange === r;
            return (
              <button
                key={r}
                onClick={() => setPerfRange(r)}
                className="rounded-md px-3 py-1 transition-colors"
                style={{
                  background: active ? T.primary : "transparent",
                  color: active ? "#FFFFFF" : T.text2,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {ranking.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-4 text-center text-[12px] text-slate-400"
                style={{
                  background: "#F8FAFC",
                  border: `1px dashed ${T.borderSoft}`,
                }}
              >
                Sem dados
              </div>
            ))
          : ranking.map((r, idx) => (
              <div
                key={r.id}
                className="rounded-xl p-3"
                style={{
                  background: "#FFFFFF",
                  border: `1px solid ${
                    idx === 0 ? T.primary + "55" : T.borderSoft
                  }`,
                  boxShadow:
                    idx === 0
                      ? "0 4px 16px -4px rgba(124,58,237,0.25)"
                      : "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-md font-mono text-[11px] font-bold text-white"
                    style={{
                      background:
                        idx === 0
                          ? T.primary
                          : idx === 1
                          ? "#94A3B8"
                          : "#CBD5E1",
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <p className="truncate text-[12px] font-bold uppercase text-slate-800">
                    {r.name}
                  </p>
                  {r.code && (
                    <span
                      className="rounded-md px-1 py-0.5 text-[9px] font-bold uppercase"
                      style={{ background: "#F1F5F9", color: T.text2 }}
                    >
                      {r.code}
                    </span>
                  )}
                </div>
              </div>
            ))}
      </div>

      {/* Tabela principal */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: "#FFFFFF",
          border: `1px solid ${T.borderSoft}`,
          boxShadow:
            "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        }}
      >
        {loading ? (
          <div className="px-5 py-12 text-center text-[13px] text-slate-500">
            Carregando…
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Activity
              className="mx-auto mb-3 h-10 w-10"
              style={{ color: T.textMuted }}
            />
            <p className="text-[14px] font-semibold text-slate-700">
              Nenhuma adquirente disponível
            </p>
            <p className="mt-1 text-[12px] text-slate-500">
              O admin precisa habilitar adquirentes pro pool global multi-acquirer.
            </p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr
                className="text-left text-[10px] font-bold uppercase tracking-wider"
                style={{ color: T.textMuted, background: "#F8FAFC" }}
              >
                <th className="px-5 py-3 w-12">Prior.</th>
                <th className="px-5 py-3">Nome da Adquirente</th>
                <th className="px-5 py-3 text-right">Tentativas</th>
                <th className="px-5 py-3 text-right">Aprovadas</th>
                <th className="px-5 py-3 w-72">Conversão (%)</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr
                  key={r.id}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDragEnd={onDragEnd}
                  className="cursor-move hover:bg-slate-50"
                  style={{
                    borderTop: `1px solid ${T.borderSoft}`,
                    opacity: r.active ? 1 : 0.5,
                  }}
                >
                  <td className="px-5 py-3">
                    <GripVertical
                      className="h-4 w-4"
                      style={{ color: T.textMuted }}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-bold uppercase"
                        style={{ color: T.text }}
                      >
                        {r.name}
                      </span>
                      {r.code && (
                        <span
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase"
                          style={{ background: "#F1F5F9", color: T.text2 }}
                        >
                          {r.code}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-slate-700">
                    {r.attempts}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-slate-700">
                    {r.approved}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 flex-1 overflow-hidden rounded-full"
                        style={{ background: "#E2E8F0" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, r.conversionRate)}%`,
                            background: `linear-gradient(90deg, ${T.primary}, #06B6D4)`,
                          }}
                        />
                      </div>
                      <span className="w-16 text-right font-mono font-semibold text-slate-700">
                        {r.conversionRate.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => toggleActive(r)}
                      className="inline-flex h-8 items-center rounded-lg px-3 text-[12px] font-semibold transition-colors"
                      style={{
                        background: r.active ? "#FFFFFF" : T.primary,
                        border: `1px solid ${
                          r.active ? T.borderSoft : T.primary
                        }`,
                        color: r.active ? T.text2 : "#FFFFFF",
                      }}
                    >
                      {r.active ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showABModal && (
        <ABTestModal
          rows={rows.filter((r) => r.active)}
          onClose={() => setShowABModal(false)}
          onCreated={() => {
            setShowABModal(false);
            fetchAll();
          }}
          token={token!}
        />
      )}
    </div>
  );
}

/* =================== A/B Test Modal =================== */

function ABTestModal({
  rows,
  onClose,
  onCreated,
  token,
}: {
  rows: AcquirerRow[];
  onClose: () => void;
  onCreated: () => void;
  token: string;
}) {
  const [goal, setGoal] = useState(20);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size < 2) {
      toast.error("Selecione ao menos 2 adquirentes.");
      return;
    }
    setSaving(true);
    try {
      const r = await axios.post(
        `${API}/api/adquerers/ab-test`,
        {
          goalPerAcquirer: goal,
          acquirerIds: Array.from(selected),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        toast.success("Teste A/B iniciado!");
        onCreated();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao iniciar teste.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15, 23, 42, 0.50)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 24px 64px -20px rgba(15,23,42,0.30)",
          border: `1px solid ${T.border}`,
        }}
      >
        <div className="mb-4 flex items-start gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{
              background: `linear-gradient(135deg, ${T.primary}, ${T.primaryStrong})`,
            }}
          >
            <Beaker className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-[15px] font-bold text-slate-900">
              Novo Teste A/B
            </h2>
            <p className="text-[12px] text-slate-500">
              Selecione as adquirentes para competir. O sistema enviará
              transações sequenciais para determinar a vencedora.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Meta de Transações
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={1000}
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
                className="h-10 w-full rounded-lg bg-slate-50 px-3 pr-16 text-[14px] font-bold outline-none"
                style={{ border: `1px solid ${T.borderSoft}` }}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                por adq.
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Participantes (mín. 2)
            </label>
            <div
              className="max-h-64 overflow-y-auto rounded-xl"
              style={{ border: `1px solid ${T.borderSoft}` }}
            >
              {rows.length === 0 ? (
                <p className="px-3 py-4 text-center text-[12px] text-slate-500">
                  Nenhuma adquirente ativa.
                </p>
              ) : (
                rows.map((r) => (
                  <label
                    key={r.id}
                    className="flex cursor-pointer items-center gap-2 border-b border-slate-100 px-3 py-2.5 text-[13px] hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(r.acquirerId)}
                      onChange={() => toggle(r.acquirerId)}
                      className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="font-semibold uppercase text-slate-700">
                      {r.name}
                    </span>
                    {r.code && (
                      <span
                        className="ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase"
                        style={{ background: "#F1F5F9", color: T.text2 }}
                      >
                        {r.code}
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-lg px-5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"
              style={{ border: `1px solid ${T.borderSoft}` }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || selected.size < 2}
              className="inline-flex h-10 items-center gap-2 rounded-lg px-5 text-[13px] font-bold uppercase tracking-wider text-white disabled:opacity-50"
              style={{
                background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Iniciando…
                </>
              ) : (
                "Iniciar Teste"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AcquirersPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Adquirentes</title>
      </Head>
      <LightShell>
        <AcquirersContent />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}

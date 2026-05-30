"use client";

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { toast } from "sonner";
import axios from "axios";
import {
  Plus,
  Trash2,
  Loader2,
  Building2,
  Pencil,
  Users,
  X,
  Check,
  CheckCircle2,
  XCircle,
  Search,
  Globe,
  Calculator,
  Banknote,
  ArrowDownToLine,
  Percent,
  DollarSign,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

const API = "https://shadowpay-api-production.up.railway.app";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primaryStrong: "#6D28D9",
  primarySoft: "rgba(124, 58, 237, 0.10)",
  border: "rgba(15, 23, 42, 0.08)",
  borderSoft: "rgba(15, 23, 42, 0.06)",
  success: "#16A34A",
  successSoft: "rgba(22, 163, 74, 0.10)",
  warn: "#F59E0B",
  warnSoft: "rgba(245, 158, 11, 0.10)",
  blue: "#0EA5E9",
  blueSoft: "rgba(14, 165, 233, 0.10)",
};

type Acquirer = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  enabled: boolean;
  globalPool: boolean;
  feeFixed?: number | null;
  feePercent?: number | null;
  withdrawalFee?: number | null;
};

type SellerSummary = {
  id: string;
  companyName?: string;
  email?: string;
};

type SellerAcquirerRow = {
  acquirerId: string;
  linkId: string | null;
  name: string;
  code?: string | null;
  defaultFeeFixed: number | null;
  defaultFeePercent: number | null;
  defaultWithdrawalFee: number | null;
  customFeeFixed: number | null;
  customFeePercent: number | null;
  customWithdrawalFee: number | null;
  effectiveFeeFixed: number | null;
  effectiveFeePercent: number | null;
  effectiveWithdrawalFee: number | null;
  active: boolean;
  priority: number;
  addedByAdmin: boolean;
  isGlobalPool: boolean;
};

function fmtBRL(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function token() {
  return typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
}
function authHeaders() {
  return { Authorization: `Bearer ${token()}` };
}

/* ============================================================
 * REUSABLE: fee input bonito (R$ + %)
 * ============================================================ */
function FeeInputs({
  fixed,
  percent,
  onFixedChange,
  onPercentChange,
  disabled,
}: {
  fixed: number;
  percent: number;
  onFixedChange: (v: number) => void;
  onPercentChange: (v: number) => void;
  disabled?: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    background: disabled ? "#F1F5F9" : "#FFFFFF",
    border: `1px solid ${T.borderSoft}`,
    color: T.text,
    opacity: disabled ? 0.6 : 1,
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="mb-1 flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
          <DollarSign className="h-3 w-3" />
          Valor fixo
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">
            R$
          </span>
          <input
            type="number"
            step="0.01"
            min={0}
            value={fixed}
            onChange={(e) => onFixedChange(Number(e.target.value))}
            disabled={disabled}
            className="h-10 w-full rounded-lg pl-9 pr-3 text-[14px] font-bold tabular-nums outline-none focus:border-violet-400"
            style={inputStyle}
            placeholder="0,00"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
          <Percent className="h-3 w-3" />
          Percentual
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => onPercentChange(Number(e.target.value))}
            disabled={disabled}
            className="h-10 w-full rounded-lg pl-3 pr-9 text-[14px] font-bold tabular-nums outline-none focus:border-violet-400"
            style={inputStyle}
            placeholder="0,00"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">
            %
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Live preview da taxa em vendas comum (R$100, R$500, R$1000)
 * ============================================================ */
function FeePreview({
  feeFixed,
  feePercent,
}: {
  feeFixed: number;
  feePercent: number;
}) {
  const samples = [100, 500, 1000];
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <Calculator className="h-3 w-3" />
        Como fica
      </p>
      <div className="space-y-1.5">
        {samples.map((value) => {
          const fee = feeFixed + (value * feePercent) / 100;
          const net = value - fee;
          return (
            <div
              key={value}
              className="flex items-center justify-between rounded-md bg-white px-3 py-1.5 text-[12px]"
              style={{ border: `1px solid ${T.borderSoft}` }}
            >
              <span className="text-slate-500">Venda de</span>
              <span className="font-mono font-semibold text-slate-700">
                {fmtBRL(value)}
              </span>
              <span className="text-slate-400">→ desconta</span>
              <span className="font-mono font-bold text-rose-600">
                -{fmtBRL(fee)}
              </span>
              <span className="text-slate-400">→ recebe</span>
              <span className="font-mono font-bold text-emerald-600">
                {fmtBRL(net)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * ACQUIRER CREATE / EDIT MODAL
 * ============================================================ */
function AcquirerFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Acquirer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    name: initial?.name || "",
    code: initial?.code || "",
    description: initial?.description || "",
    feeFixed: initial?.feeFixed ?? 0,
    feePercent: initial?.feePercent ?? 0.99,
    withdrawalFee: initial?.withdrawalFee ?? 3.5,
    globalPool: initial?.globalPool ?? false,
    enabled: initial?.enabled ?? true,
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit && initial?.id) {
        await axios.patch(
          `${API}/api/admin/adquerers/${initial.id}`,
          {
            name: form.name,
            code: form.code || null,
            description: form.description || null,
            feeFixed: Number(form.feeFixed),
            feePercent: Number(form.feePercent),
            withdrawalFee: Number(form.withdrawalFee),
            globalPool: form.globalPool,
            enabled: form.enabled,
          },
          { headers: authHeaders() }
        );
      } else {
        const r = await axios.post(
          `${API}/api/admin/adquerers`,
          { name: form.name, enabled: form.enabled, config: {} },
          { headers: authHeaders() }
        );
        const newId =
          r.data?.data?.id || r.data?.id || r.data?.acquirer?.id || null;
        if (newId) {
          await axios.patch(
            `${API}/api/admin/adquerers/${newId}`,
            {
              code: form.code || null,
              description: form.description || null,
              feeFixed: Number(form.feeFixed),
              feePercent: Number(form.feePercent),
              withdrawalFee: Number(form.withdrawalFee),
              globalPool: form.globalPool,
            },
            { headers: authHeaders() }
          );
        }
      }
      toast.success(isEdit ? "Adquirente atualizada." : "Adquirente criada.");
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "#F8FAFC",
    border: `1px solid ${T.borderSoft}`,
    color: T.text,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15, 23, 42, 0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white"
        style={{
          border: `1px solid ${T.border}`,
          boxShadow: "0 24px 64px -20px rgba(15,23,42,0.30)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4"
          style={{ borderColor: T.borderSoft }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isEdit ? "Editar adquirente" : "Nova adquirente"}
            </p>
            <h2 className="text-[16px] font-bold text-slate-900">
              Configuração de taxas
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-5">
          {/* Identificação */}
          <section>
            <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-slate-500">
              Identificação
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Nome
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="MERITUSPAY - SISTEMA DE TRANSACOES INST..."
                  className="h-10 w-full rounded-lg px-3 text-[13px] outline-none focus:border-violet-400"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Código curto
                </label>
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="MRT"
                  maxLength={6}
                  className="h-10 w-full rounded-lg px-3 text-center font-mono text-[15px] font-bold uppercase outline-none focus:border-violet-400"
                  style={inputStyle}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                Descrição
              </label>
              <input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Adquirente PIX oficial — alta taxa de aprovação"
                className="h-10 w-full rounded-lg px-3 text-[13px] outline-none focus:border-violet-400"
                style={inputStyle}
              />
            </div>
          </section>

          {/* Taxa por venda */}
          <section
            className="rounded-2xl p-4"
            style={{
              background: T.primarySoft,
              border: `1px solid ${T.primary}33`,
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                style={{
                  background: `linear-gradient(135deg, ${T.primary}, ${T.primaryStrong})`,
                }}
              >
                <Banknote className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-[13px] font-bold text-slate-900">
                  Taxa por venda PIX
                </h3>
                <p className="text-[11px] text-slate-600">
                  Cobramos <b>fixo + percentual</b> sobre cada venda
                </p>
              </div>
            </div>

            <FeeInputs
              fixed={form.feeFixed}
              percent={form.feePercent}
              onFixedChange={(v) => setForm({ ...form, feeFixed: v })}
              onPercentChange={(v) => setForm({ ...form, feePercent: v })}
            />

            <div className="mt-3">
              <FeePreview
                feeFixed={form.feeFixed}
                feePercent={form.feePercent}
              />
            </div>
          </section>

          {/* Taxa de saque */}
          <section
            className="rounded-2xl p-4"
            style={{
              background: T.warnSoft,
              border: `1px solid rgba(245, 158, 11, 0.30)`,
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                style={{
                  background: `linear-gradient(135deg, #F59E0B, #D97706)`,
                }}
              >
                <ArrowDownToLine className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-[13px] font-bold text-slate-900">
                  Taxa de saque
                </h3>
                <p className="text-[11px] text-slate-600">
                  Valor <b>fixo</b> cobrado por cada saque solicitado
                </p>
              </div>
            </div>

            <div className="max-w-[200px]">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.withdrawalFee}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      withdrawalFee: Number(e.target.value),
                    })
                  }
                  className="h-10 w-full rounded-lg pl-9 pr-3 text-[14px] font-bold tabular-nums outline-none focus:border-amber-400"
                  style={{
                    background: "#FFFFFF",
                    border: `1px solid ${T.borderSoft}`,
                    color: T.text,
                  }}
                  placeholder="3,50"
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-600">
                Ex: saque de R$ 1.000,00 vai entregar{" "}
                <b className="text-emerald-700">
                  {fmtBRL(1000 - form.withdrawalFee)}
                </b>
              </p>
            </div>
          </section>

          {/* Visibilidade */}
          <section>
            <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-slate-500">
              Acesso
            </h3>
            <div className="space-y-2 rounded-xl bg-slate-50 p-3">
              <label className="flex items-start gap-2.5 rounded-md p-2 hover:bg-white">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) =>
                    setForm({ ...form, enabled: e.target.checked })
                  }
                  className="mt-0.5 h-4 w-4"
                />
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">
                    Habilitada
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Pode receber roteamento de pagamentos
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-2.5 rounded-md p-2 hover:bg-white">
                <input
                  type="checkbox"
                  checked={form.globalPool}
                  onChange={(e) =>
                    setForm({ ...form, globalPool: e.target.checked })
                  }
                  className="mt-0.5 h-4 w-4"
                />
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">
                    Pool global
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Disponível pra <b>todos os sellers</b> automaticamente.
                    Desligue se quiser liberar manualmente por seller.
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* Actions */}
          <div
            className="sticky bottom-0 -mx-5 -mb-5 flex justify-end gap-2 border-t bg-white p-4"
            style={{ borderColor: T.borderSoft }}
          >
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-lg px-4 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50"
              style={{ border: `1px solid ${T.border}` }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-5 text-[12.5px] font-semibold text-white disabled:opacity-50"
              style={{
                background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  {isEdit ? "Salvar alterações" : "Criar adquirente"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
 * SELLERS MANAGER MODAL — vincula sellers à acquirer
 * ============================================================ */
function SellersManagerModal({
  acquirer,
  onClose,
}: {
  acquirer: Acquirer;
  onClose: () => void;
}) {
  const [sellers, setSellers] = useState<SellerSummary[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<SellerSummary | null>(null);
  const [links, setLinks] = useState<SellerAcquirerRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchSellers() {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/admin/sellers?limit=500`, {
        headers: authHeaders(),
      });
      const raw = r.data?.data?.sellers || r.data?.sellers || r.data?.data || [];
      setSellers(
        raw.map((s: any) => ({
          id: s.id,
          companyName: s.companyName || s.nome || s.name,
          email: s.email,
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchSellers();
  }, []);

  async function loadSellerLinks(sellerId: string) {
    try {
      const r = await axios.get(
        `${API}/api/admin/sellers/${sellerId}/acquirers`,
        { headers: authHeaders() }
      );
      if (r.data?.success) setLinks(r.data.data || []);
    } catch (e) {
      console.error(e);
    }
  }
  useEffect(() => {
    if (selectedSeller) loadSellerLinks(selectedSeller.id);
  }, [selectedSeller]);

  async function linkOrUpdate(
    sellerId: string,
    fees: {
      customFeeFixed: number | null;
      customFeePercent: number | null;
      customWithdrawalFee: number | null;
    },
    existingLinkId: string | null
  ) {
    try {
      if (existingLinkId) {
        await axios.patch(
          `${API}/api/admin/seller-acquirers/${existingLinkId}`,
          fees,
          { headers: authHeaders() }
        );
      } else {
        await axios.post(
          `${API}/api/admin/sellers/${sellerId}/acquirers`,
          { acquirerId: acquirer.id, ...fees },
          { headers: authHeaders() }
        );
      }
      toast.success("Vinculado com taxa custom.");
      await loadSellerLinks(sellerId);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao salvar.");
    }
  }

  async function unlink(linkId: string) {
    if (!confirm("Remover vínculo? O seller perde acesso a essa adquirente."))
      return;
    try {
      await axios.patch(
        `${API}/api/admin/seller-acquirers/${linkId}/delete`,
        {},
        { headers: authHeaders() }
      );
      toast.success("Vínculo removido.");
      if (selectedSeller) await loadSellerLinks(selectedSeller.id);
    } catch (e: any) {
      toast.error("Erro ao remover.");
    }
  }

  const filtered = sellers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.companyName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });
  const currentLink = links.find((l) => l.acquirerId === acquirer.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15, 23, 42, 0.55)" }}
      onClick={onClose}
    >
      <div
        className="flex h-[85vh] w-full max-w-5xl flex-col rounded-2xl bg-white"
        style={{
          border: `1px solid ${T.border}`,
          boxShadow: "0 24px 64px -20px rgba(15,23,42,0.30)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: T.borderSoft }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Gerenciar sellers
            </p>
            <h2 className="text-[15px] font-bold text-slate-900">
              {acquirer.name}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Taxa padrão:{" "}
              <b className="text-slate-700">
                {fmtBRL(acquirer.feeFixed ?? 0)} +{" "}
                {(acquirer.feePercent ?? 0).toFixed(2)}%
              </b>{" "}
              por venda · Saque{" "}
              <b className="text-slate-700">
                {fmtBRL(acquirer.withdrawalFee ?? 0)}
              </b>
              {acquirer.globalPool && (
                <>
                  {" · "}
                  <span className="font-semibold" style={{ color: T.primary }}>
                    Pool global ativo
                  </span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-12 overflow-hidden">
          {/* SELLERS LIST */}
          <div
            className="col-span-4 flex flex-col border-r"
            style={{ borderColor: T.borderSoft }}
          >
            <div
              className="flex items-center gap-2 border-b p-3"
              style={{ borderColor: T.borderSoft }}
            >
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar seller…"
                className="flex-1 bg-transparent text-[13px] outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-[13px] text-slate-500">
                  Carregando…
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-slate-500">
                  Nenhum seller.
                </div>
              ) : (
                filtered.map((s) => {
                  const isSelected = selectedSeller?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSeller(s)}
                      className="flex w-full items-center gap-2 border-b px-4 py-3 text-left transition-colors hover:bg-slate-50"
                      style={{
                        borderColor: T.borderSoft,
                        background: isSelected ? T.primarySoft : "transparent",
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-slate-900">
                          {s.companyName || "—"}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {s.email}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* EDITOR */}
          <div className="col-span-8 flex flex-col overflow-y-auto">
            {!selectedSeller ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center text-slate-500">
                <Users className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-[14px] font-semibold text-slate-700">
                  Selecione um seller
                </p>
                <p className="mt-1 text-[12px]">
                  Use a busca à esquerda pra escolher o seller.
                </p>
              </div>
            ) : (
              <SellerEditor
                seller={selectedSeller}
                acquirer={acquirer}
                link={currentLink || null}
                onSave={(fees) =>
                  linkOrUpdate(
                    selectedSeller.id,
                    fees,
                    currentLink?.linkId || null
                  )
                }
                onRemove={() =>
                  currentLink?.linkId ? unlink(currentLink.linkId) : null
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SellerEditor({
  seller,
  acquirer,
  link,
  onSave,
  onRemove,
}: {
  seller: SellerSummary;
  acquirer: Acquirer;
  link: SellerAcquirerRow | null;
  onSave: (fees: {
    customFeeFixed: number | null;
    customFeePercent: number | null;
    customWithdrawalFee: number | null;
  }) => void;
  onRemove: () => void;
}) {
  const [useCustom, setUseCustom] = useState(
    link?.customFeeFixed != null ||
      link?.customFeePercent != null ||
      link?.customWithdrawalFee != null
  );
  const [feeFixed, setFeeFixed] = useState<number>(
    link?.customFeeFixed ?? acquirer.feeFixed ?? 0
  );
  const [feePercent, setFeePercent] = useState<number>(
    link?.customFeePercent ?? acquirer.feePercent ?? 0
  );
  const [withdrawalFee, setWithdrawalFee] = useState<number>(
    link?.customWithdrawalFee ?? acquirer.withdrawalFee ?? 0
  );

  useEffect(() => {
    setUseCustom(
      link?.customFeeFixed != null ||
        link?.customFeePercent != null ||
        link?.customWithdrawalFee != null
    );
    setFeeFixed(link?.customFeeFixed ?? acquirer.feeFixed ?? 0);
    setFeePercent(link?.customFeePercent ?? acquirer.feePercent ?? 0);
    setWithdrawalFee(
      link?.customWithdrawalFee ?? acquirer.withdrawalFee ?? 0
    );
  }, [link, acquirer]);

  const handleSave = () => {
    if (useCustom) {
      onSave({
        customFeeFixed: feeFixed,
        customFeePercent: feePercent,
        customWithdrawalFee: withdrawalFee,
      });
    } else {
      onSave({
        customFeeFixed: null,
        customFeePercent: null,
        customWithdrawalFee: null,
      });
    }
  };

  return (
    <div className="flex-1 p-5">
      <div className="mb-4">
        <h3 className="text-[15px] font-bold text-slate-900">
          {seller.companyName}
        </h3>
        <p className="text-[11px] text-slate-500">{seller.email}</p>
      </div>

      {/* Status */}
      {link?.linkId ? (
        <div
          className="mb-4 flex items-center gap-2 rounded-xl p-3"
          style={{
            background: T.successSoft,
            border: `1px solid rgba(22, 163, 74, 0.25)`,
          }}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="text-[12.5px] font-semibold text-emerald-800">
            Vinculado
          </span>
          <span className="text-[11px] text-emerald-700">
            {link.addedByAdmin ? "(manual)" : link.isGlobalPool ? "(pool global)" : ""}
          </span>
        </div>
      ) : (
        <div
          className="mb-4 rounded-xl p-3 text-[12.5px] text-slate-700"
          style={{
            background: T.warnSoft,
            border: "1px solid rgba(245, 158, 11, 0.25)",
          }}
        >
          Este seller <b>ainda não tem acesso</b> a essa adquirente.
        </div>
      )}

      {/* Toggle custom vs default */}
      <div
        className="mb-4 flex items-center gap-2 rounded-xl p-3"
        style={{
          background: "#F8FAFC",
          border: `1px solid ${T.borderSoft}`,
        }}
      >
        <input
          type="checkbox"
          id="useCustom"
          checked={useCustom}
          onChange={(e) => setUseCustom(e.target.checked)}
          className="h-4 w-4"
        />
        <label
          htmlFor="useCustom"
          className="cursor-pointer text-[13px] font-semibold text-slate-700"
        >
          Definir taxa específica pra esse seller
        </label>
      </div>

      {/* Fee inputs */}
      <section
        className="mb-3 rounded-2xl p-4"
        style={{
          background: useCustom ? T.primarySoft : "#F8FAFC",
          border: `1px solid ${useCustom ? T.primary + "33" : T.borderSoft}`,
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
            style={{
              background: useCustom
                ? `linear-gradient(135deg, ${T.primary}, ${T.primaryStrong})`
                : "#94A3B8",
            }}
          >
            <Banknote className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-[12.5px] font-bold text-slate-900">
              Taxa por venda
            </h4>
            <p className="text-[10.5px] text-slate-600">
              {useCustom ? "Custom pra esse seller" : "Usando padrão da adquirente"}
            </p>
          </div>
        </div>

        <FeeInputs
          fixed={feeFixed}
          percent={feePercent}
          onFixedChange={setFeeFixed}
          onPercentChange={setFeePercent}
          disabled={!useCustom}
        />

        <div className="mt-3">
          <FeePreview feeFixed={feeFixed} feePercent={feePercent} />
        </div>
      </section>

      {/* Withdrawal fee */}
      <section
        className="mb-4 rounded-2xl p-4"
        style={{
          background: useCustom ? T.warnSoft : "#F8FAFC",
          border: `1px solid ${useCustom ? "rgba(245, 158, 11, 0.30)" : T.borderSoft}`,
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
            style={{
              background: useCustom
                ? `linear-gradient(135deg, #F59E0B, #D97706)`
                : "#94A3B8",
            }}
          >
            <ArrowDownToLine className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-[12.5px] font-bold text-slate-900">
              Taxa de saque
            </h4>
            <p className="text-[10.5px] text-slate-600">
              {useCustom ? "Custom pra esse seller" : "Usando padrão"}
            </p>
          </div>
        </div>

        <div className="max-w-[200px]">
          <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
            Valor fixo
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              min={0}
              value={withdrawalFee}
              onChange={(e) => setWithdrawalFee(Number(e.target.value))}
              disabled={!useCustom}
              className="h-10 w-full rounded-lg pl-9 pr-3 text-[14px] font-bold tabular-nums outline-none focus:border-amber-400"
              style={{
                background: useCustom ? "#FFFFFF" : "#F1F5F9",
                border: `1px solid ${T.borderSoft}`,
                color: T.text,
                opacity: useCustom ? 1 : 0.6,
              }}
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold text-white"
          style={{
            background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
            boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
          }}
        >
          <Check className="h-4 w-4" />
          {link?.linkId
            ? "Salvar alterações"
            : useCustom
            ? "Vincular com taxa custom"
            : "Vincular com taxa padrão"}
        </button>
        {link?.linkId && (
          <button
            onClick={onRemove}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-lg px-4 text-[12px] font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            style={{ border: "1px solid rgba(239,68,68,0.30)" }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remover
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * MAIN PAGE
 * ============================================================ */
function AcquirersContent() {
  const [list, setList] = useState<Acquirer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editAcquirer, setEditAcquirer] = useState<Acquirer | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [managingSellers, setManagingSellers] = useState<Acquirer | null>(null);

  async function fetchAll() {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/admin/adquerers`, {
        headers: authHeaders(),
      });
      const data =
        r.data?.data || r.data?.acquirers || r.data?.adquerers || r.data || [];
      setList(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao buscar.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchAll();
  }, []);

  async function toggleEnabled(a: Acquirer) {
    try {
      await axios.patch(
        `${API}/api/admin/adquerers/${a.id}`,
        { enabled: !a.enabled },
        { headers: authHeaders() }
      );
      setList((l) =>
        l.map((x) => (x.id === a.id ? { ...x, enabled: !x.enabled } : x))
      );
    } catch {
      toast.error("Erro ao atualizar.");
    }
  }
  async function toggleGlobal(a: Acquirer) {
    try {
      await axios.patch(
        `${API}/api/admin/adquerers/${a.id}`,
        { globalPool: !a.globalPool },
        { headers: authHeaders() }
      );
      setList((l) =>
        l.map((x) =>
          x.id === a.id ? { ...x, globalPool: !x.globalPool } : x
        )
      );
      toast.success(
        !a.globalPool ? "Adicionada ao pool global." : "Removida do pool global."
      );
    } catch {
      toast.error("Erro ao atualizar.");
    }
  }
  async function removeAcquirer(a: Acquirer) {
    if (!confirm(`Remover "${a.name}"? Vínculos também serão removidos.`))
      return;
    try {
      await axios.patch(
        `${API}/api/admin/adquerers/${a.id}/delete`,
        {},
        { headers: authHeaders() }
      );
      setList((l) => l.filter((x) => x.id !== a.id));
      toast.success("Removida.");
    } catch {
      toast.error("Erro ao remover.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            ADMIN
          </p>
          <h1
            className="text-[22px] font-bold tracking-tight sm:text-[28px] text-slate-900"
            style={{ letterSpacing: "-0.005em" }}
          >
            Adquirentes
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Cadastre nominais MerituSpay/KIKAI, defina taxas{" "}
            <b>fixa + percentual</b> e libere acesso por seller.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white"
          style={{
            background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
            boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
          }}
        >
          <Plus className="h-4 w-4" />
          Nova adquirente
        </button>
      </header>

      {loading ? (
        <div
          className="rounded-2xl bg-white px-5 py-12 text-center text-[13px] text-slate-500"
          style={{ border: `1px solid ${T.borderSoft}` }}
        >
          Carregando…
        </div>
      ) : list.length === 0 ? (
        <div
          className="rounded-2xl bg-white px-5 py-12 text-center"
          style={{ border: `1px solid ${T.borderSoft}` }}
        >
          <Building2
            className="mx-auto mb-3 h-10 w-10"
            style={{ color: T.textMuted }}
          />
          <p className="text-[14px] font-semibold text-slate-700">
            Nenhuma adquirente cadastrada
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {list.map((a) => (
            <AcquirerCard
              key={a.id}
              acquirer={a}
              onEdit={() => setEditAcquirer(a)}
              onManageSellers={() => setManagingSellers(a)}
              onToggleEnabled={() => toggleEnabled(a)}
              onToggleGlobal={() => toggleGlobal(a)}
              onRemove={() => removeAcquirer(a)}
            />
          ))}
        </div>
      )}

      {(showCreate || editAcquirer) && (
        <AcquirerFormModal
          initial={editAcquirer}
          onClose={() => {
            setShowCreate(false);
            setEditAcquirer(null);
          }}
          onSaved={() => {
            setShowCreate(false);
            setEditAcquirer(null);
            fetchAll();
          }}
        />
      )}
      {managingSellers && (
        <SellersManagerModal
          acquirer={managingSellers}
          onClose={() => setManagingSellers(null)}
        />
      )}
    </div>
  );
}

function AcquirerCard({
  acquirer: a,
  onEdit,
  onManageSellers,
  onToggleEnabled,
  onToggleGlobal,
  onRemove,
}: {
  acquirer: Acquirer;
  onEdit: () => void;
  onManageSellers: () => void;
  onToggleEnabled: () => void;
  onToggleGlobal: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background: "#FFFFFF",
        border: `1px solid ${T.borderSoft}`,
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
          }}
        >
          {a.code || a.name.slice(0, 3).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-[14px] font-bold text-slate-900">
              {a.name}
            </h3>
            {a.enabled ? (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                <CheckCircle2 className="h-2.5 w-2.5" /> Ativa
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Inativa
              </span>
            )}
            {a.globalPool && (
              <span
                className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{ background: T.primarySoft, color: T.primary }}
              >
                <Globe className="h-2.5 w-2.5" /> Global
              </span>
            )}
          </div>
          {a.description && (
            <p className="mt-0.5 line-clamp-2 text-[11.5px] text-slate-500">
              {a.description}
            </p>
          )}
        </div>
      </div>

      {/* Fee blocks visuais */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {/* Taxa por venda */}
        <div
          className="rounded-xl p-3"
          style={{
            background: T.primarySoft,
            border: `1px solid ${T.primary}22`,
          }}
        >
          <div className="mb-1.5 flex items-center gap-1">
            <Banknote className="h-3 w-3" style={{ color: T.primary }} />
            <p className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: T.primary }}>
              Taxa por venda
            </p>
          </div>
          <p className="font-mono text-[15px] font-bold leading-none text-slate-900">
            {fmtBRL(a.feeFixed ?? 0)}
          </p>
          <p className="mt-0.5 font-mono text-[10.5px] text-slate-500">
            + {(a.feePercent ?? 0).toFixed(2)}%
          </p>
        </div>

        {/* Taxa de saque */}
        <div
          className="rounded-xl p-3"
          style={{
            background: T.warnSoft,
            border: `1px solid rgba(245, 158, 11, 0.25)`,
          }}
        >
          <div className="mb-1.5 flex items-center gap-1">
            <ArrowDownToLine className="h-3 w-3" style={{ color: "#B45309" }} />
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-amber-700">
              Saque
            </p>
          </div>
          <p className="font-mono text-[15px] font-bold leading-none text-slate-900">
            {fmtBRL(a.withdrawalFee ?? 0)}
          </p>
          <p className="mt-0.5 text-[10.5px] text-slate-500">por saque</p>
        </div>
      </div>

      {/* Exemplo */}
      <div
        className="mt-3 rounded-lg px-3 py-2 text-[11px]"
        style={{
          background: "#F8FAFC",
          border: `1px solid ${T.borderSoft}`,
        }}
      >
        <span className="text-slate-500">Venda de </span>
        <b className="text-slate-900">R$ 100,00</b>
        <span className="text-slate-500"> → seller recebe </span>
        <b className="text-emerald-700">
          {fmtBRL(
            100 - ((a.feeFixed ?? 0) + (100 * (a.feePercent ?? 0)) / 100)
          )}
        </b>
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          onClick={onManageSellers}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold transition-colors hover:bg-slate-50"
          style={{
            background: "#FFFFFF",
            border: `1px solid ${T.borderSoft}`,
            color: T.text2,
          }}
        >
          <Users className="h-3.5 w-3.5" />
          Gerenciar sellers
        </button>
        <button
          onClick={onEdit}
          className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-[12px] font-semibold transition-colors hover:bg-slate-50"
          style={{
            background: "#FFFFFF",
            border: `1px solid ${T.borderSoft}`,
            color: T.text2,
          }}
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onToggleGlobal}
          className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-[12px] font-semibold transition-colors hover:bg-slate-50"
          style={{
            background: a.globalPool ? T.primarySoft : "#FFFFFF",
            border: `1px solid ${
              a.globalPool ? T.primary + "44" : T.borderSoft
            }`,
            color: a.globalPool ? T.primary : T.text2,
          }}
          title={a.globalPool ? "Tirar do pool global" : "Liberar pra todos sellers"}
        >
          <Globe className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onToggleEnabled}
          className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-[12px] font-semibold transition-colors hover:bg-slate-50"
          style={{
            background: a.enabled ? "rgba(22,163,74,0.10)" : "#FFFFFF",
            border: `1px solid ${
              a.enabled ? "rgba(22,163,74,0.30)" : T.borderSoft
            }`,
            color: a.enabled ? "#15803D" : T.text2,
          }}
          title={a.enabled ? "Desativar" : "Ativar"}
        >
          {a.enabled ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={onRemove}
          className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-[12px] font-semibold text-rose-500 transition-colors hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function AdquerersPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Adquirentes (Admin)</title>
      </Head>
      <LightShell>
        <AcquirersContent />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}

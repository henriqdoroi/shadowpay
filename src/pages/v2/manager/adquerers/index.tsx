"use client";

import { useEffect, useState } from "react";
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
};

type Acquirer = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  enabled: boolean;
  globalPool: boolean;
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
  defaultFeePercent: number | null;
  defaultWithdrawalFee: number | null;
  customFeePercent: number | null;
  customWithdrawalFee: number | null;
  effectiveFeePercent: number | null;
  effectiveWithdrawalFee: number | null;
  active: boolean;
  priority: number;
  addedByAdmin: boolean;
  isGlobalPool: boolean;
};

function token() {
  return typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
}
function authHeaders() {
  return { Authorization: `Bearer ${token()}` };
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
            feePercent: Number(form.feePercent),
            withdrawalFee: Number(form.withdrawalFee),
            globalPool: form.globalPool,
            enabled: form.enabled,
          },
          { headers: authHeaders() }
        );
      } else {
        // Create — usa POST /admin/adquerers (name + config) e depois PATCH pra setar tudo
        const r = await axios.post(
          `${API}/api/admin/adquerers`,
          {
            name: form.name,
            enabled: form.enabled,
            config: {},
          },
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
      style={{ background: "rgba(15, 23, 42, 0.50)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-5"
        style={{
          border: `1px solid ${T.border}`,
          boxShadow: "0 24px 64px -20px rgba(15,23,42,0.30)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-slate-900">
            {isEdit ? "Editar adquirente" : "Nova adquirente"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Nome
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="MERITUSPAY - SISTEMA DE TRANSACOES INST..."
                className="h-10 w-full rounded-lg px-3 text-[13px] outline-none"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Código
              </label>
              <input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="MRT"
                maxLength={6}
                className="h-10 w-full rounded-lg px-3 font-mono text-[13px] uppercase outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Descrição
            </label>
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Adquirente PIX oficial — alta taxa de aprovação"
              className="h-10 w-full rounded-lg px-3 text-[13px] outline-none"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Taxa PIX (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  value={form.feePercent}
                  onChange={(e) =>
                    setForm({ ...form, feePercent: Number(e.target.value) })
                  }
                  className="h-10 w-full rounded-lg px-3 pr-8 text-[13px] outline-none"
                  style={inputStyle}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
                  %
                </span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Taxa de saque (R$)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
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
                  className="h-10 w-full rounded-lg pl-9 pr-3 text-[13px] outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-lg bg-slate-50 p-3">
            <label className="flex items-center gap-2 text-[13px] text-slate-700">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) =>
                  setForm({ ...form, enabled: e.target.checked })
                }
                className="h-4 w-4"
              />
              <b>Habilitada</b> — pode receber roteamento
            </label>
            <label className="flex items-center gap-2 text-[13px] text-slate-700">
              <input
                type="checkbox"
                checked={form.globalPool}
                onChange={(e) =>
                  setForm({ ...form, globalPool: e.target.checked })
                }
                className="h-4 w-4"
              />
              <b>Pool global</b> — disponível pra TODOS os sellers
              automaticamente
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-lg px-4 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
              style={{ border: `1px solid ${T.border}` }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-[12px] font-semibold text-white disabled:opacity-50"
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
                "Salvar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
 * SELLERS MANAGER MODAL — vincula sellers à adquirente com taxa custom
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
  const [saving, setSaving] = useState(false);

  // Lista todos sellers + filtra os que têm vínculo com essa acquirer
  async function fetchAll() {
    setLoading(true);
    try {
      const sRes = await axios.get(`${API}/api/admin/sellers?limit=500`, {
        headers: authHeaders(),
      });
      const rawSellers =
        sRes.data?.data?.sellers ||
        sRes.data?.sellers ||
        sRes.data?.data ||
        [];
      setSellers(
        rawSellers.map((s: any) => ({
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
    fetchAll();
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
    if (selectedSeller) {
      loadSellerLinks(selectedSeller.id);
    }
  }, [selectedSeller]);

  async function linkSeller(sellerId: string, customFee: number | null) {
    setSaving(true);
    try {
      await axios.post(
        `${API}/api/admin/sellers/${sellerId}/acquirers`,
        {
          acquirerId: acquirer.id,
          customFeePercent: customFee,
        },
        { headers: authHeaders() }
      );
      toast.success("Adquirente vinculada ao seller.");
      await loadSellerLinks(sellerId);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao vincular.");
    } finally {
      setSaving(false);
    }
  }

  async function unlinkSeller(linkId: string) {
    if (!confirm("Remover esse vínculo? O seller perde acesso a essa adquirente.")) return;
    try {
      await axios.patch(
        `${API}/api/admin/seller-acquirers/${linkId}/delete`,
        {},
        { headers: authHeaders() }
      );
      toast.success("Vínculo removido.");
      if (selectedSeller) await loadSellerLinks(selectedSeller.id);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao remover.");
    }
  }

  async function updateCustomFee(linkId: string, fee: number | null) {
    try {
      await axios.patch(
        `${API}/api/admin/seller-acquirers/${linkId}`,
        { customFeePercent: fee },
        { headers: authHeaders() }
      );
      toast.success("Taxa custom atualizada.");
      if (selectedSeller) await loadSellerLinks(selectedSeller.id);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao atualizar.");
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

  // Vínculo do seller selecionado com a ACQUIRER específica
  const currentLink = links.find((l) => l.acquirerId === acquirer.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15, 23, 42, 0.55)" }}
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] w-full max-w-4xl flex-col rounded-2xl bg-white"
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
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Gerenciar sellers
            </p>
            <h2 className="text-[15px] font-bold text-slate-900">
              {acquirer.name}
            </h2>
            <p className="text-[11px] text-slate-500">
              Taxa padrão: {acquirer.feePercent?.toFixed(2) ?? "—"}% PIX · Saque R${" "}
              {acquirer.withdrawalFee?.toFixed(2) ?? "—"}{" "}
              {acquirer.globalPool && (
                <>
                  ·{" "}
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
          {/* Sellers list (esquerda) */}
          <div
            className="col-span-5 flex flex-col border-r"
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
                  Nenhum seller encontrado.
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

          {/* Edit panel (direita) */}
          <div className="col-span-7 flex flex-col overflow-y-auto">
            {!selectedSeller ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center text-slate-500">
                <Users className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-[14px] font-semibold text-slate-700">
                  Selecione um seller
                </p>
                <p className="mt-1 text-[12px]">
                  Use a busca à esquerda pra escolher o seller que vai receber
                  essa adquirente.
                </p>
              </div>
            ) : (
              <div className="flex-1 p-5">
                <div className="mb-4">
                  <h3 className="text-[15px] font-bold text-slate-900">
                    {selectedSeller.companyName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedSeller.email}
                  </p>
                </div>

                {currentLink ? (
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "#F8FAFC",
                      border: `1px solid ${T.borderSoft}`,
                    }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle2
                        className="h-4 w-4"
                        style={{ color: T.success }}
                      />
                      <span className="text-[13px] font-semibold text-slate-800">
                        Vinculado{" "}
                        {currentLink.addedByAdmin ? (
                          <span className="text-[11px] text-slate-500">
                            (manual)
                          </span>
                        ) : currentLink.isGlobalPool ? (
                          <span className="text-[11px] text-slate-500">
                            (pool global)
                          </span>
                        ) : null}
                      </span>
                    </div>

                    <FeeEditor
                      defaultFee={currentLink.defaultFeePercent}
                      customFee={currentLink.customFeePercent}
                      effective={currentLink.effectiveFeePercent}
                      onSave={(fee) =>
                        currentLink.linkId
                          ? updateCustomFee(currentLink.linkId, fee)
                          : linkSeller(selectedSeller.id, fee)
                      }
                    />

                    {currentLink.linkId && (
                      <button
                        onClick={() => unlinkSeller(currentLink.linkId!)}
                        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                        style={{ border: "1px solid rgba(239,68,68,0.30)" }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover vínculo
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.25)",
                    }}
                  >
                    <p className="mb-3 text-[12.5px] text-slate-700">
                      Este seller{" "}
                      <b>ainda não tem acesso</b> a essa adquirente. Vincule
                      manualmente com a taxa que quiser:
                    </p>
                    <FeeEditor
                      defaultFee={acquirer.feePercent ?? null}
                      customFee={null}
                      effective={acquirer.feePercent ?? null}
                      onSave={(fee) => linkSeller(selectedSeller.id, fee)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeeEditor({
  defaultFee,
  customFee,
  effective,
  onSave,
}: {
  defaultFee: number | null;
  customFee: number | null;
  effective: number | null;
  onSave: (fee: number | null) => void;
}) {
  const [val, setVal] = useState<string>(
    customFee != null ? customFee.toString() : defaultFee != null ? defaultFee.toString() : ""
  );
  const [useCustom, setUseCustom] = useState(customFee != null);

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Taxa em vigor agora
        </p>
        <p className="text-[20px] font-bold text-slate-900">
          {effective != null ? `${Number(effective).toFixed(2)}%` : "—"}
        </p>
      </div>

      <label className="flex items-center gap-2 text-[12.5px] text-slate-700">
        <input
          type="checkbox"
          checked={useCustom}
          onChange={(e) => setUseCustom(e.target.checked)}
          className="h-4 w-4"
        />
        Definir taxa específica pra esse seller
      </label>

      {useCustom && (
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Ex: 0.99"
            className="h-10 w-full rounded-lg px-3 pr-8 text-[13px] outline-none"
            style={{
              background: "#FFFFFF",
              border: `1px solid ${T.borderSoft}`,
              color: T.text,
            }}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
            %
          </span>
        </div>
      )}

      <button
        onClick={() => onSave(useCustom ? Number(val) : null)}
        className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-semibold text-white"
        style={{
          background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
          boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
        }}
      >
        <Check className="h-3.5 w-3.5" />
        {useCustom ? "Aplicar taxa custom" : "Usar taxa padrão"}
      </button>
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
      toast.error(e?.response?.data?.message || "Erro ao buscar adquirentes.");
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
    } catch (e: any) {
      toast.error("Erro ao atualizar.");
    }
  }

  async function toggleGlobalPool(a: Acquirer) {
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
        !a.globalPool
          ? "Adquirente liberada pro pool global."
          : "Adquirente removida do pool global."
      );
    } catch (e: any) {
      toast.error("Erro ao atualizar.");
    }
  }

  async function removeAcquirer(a: Acquirer) {
    if (!confirm(`Remover "${a.name}"? Vínculos com sellers também serão removidos.`))
      return;
    try {
      await axios.patch(
        `${API}/api/admin/adquerers/${a.id}/delete`,
        {},
        { headers: authHeaders() }
      );
      setList((l) => l.filter((x) => x.id !== a.id));
      toast.success("Adquirente removida.");
    } catch (e: any) {
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
            className="text-[28px] font-bold tracking-tight text-slate-900"
            style={{ letterSpacing: "-0.005em" }}
          >
            Adquirentes
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Cadastre adquirentes (nominais MerituSpay/KIKAI etc), configure
            taxas padrão e libere acesso pra sellers específicos.
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
          <p className="mt-1 text-[12px] text-slate-500">
            Clique em <b>Nova adquirente</b> pra adicionar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {list.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl p-5"
              style={{
                background: "#FFFFFF",
                border: `1px solid ${T.borderSoft}`,
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
                  }}
                >
                  {a.code || a.name.slice(0, 3).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-[14px] font-bold text-slate-900">
                      {a.name}
                    </h3>
                    {a.enabled ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        <XCircle className="h-2.5 w-2.5" /> Inativa
                      </span>
                    )}
                    {a.globalPool && (
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          background: T.primarySoft,
                          color: T.primary,
                        }}
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

              <div
                className="mt-3 grid grid-cols-2 gap-2 rounded-lg p-3"
                style={{ background: "#F8FAFC" }}
              >
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                    Taxa PIX
                  </p>
                  <p className="font-mono text-[14px] font-bold text-slate-900">
                    {a.feePercent != null ? `${a.feePercent.toFixed(2)}%` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                    Taxa de saque
                  </p>
                  <p className="font-mono text-[14px] font-bold text-slate-900">
                    {a.withdrawalFee != null
                      ? `R$ ${a.withdrawalFee.toFixed(2)}`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  onClick={() => setManagingSellers(a)}
                  className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-md text-[11.5px] font-semibold transition-colors hover:bg-slate-50"
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
                  onClick={() => setEditAcquirer(a)}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md px-3 text-[11.5px] font-semibold transition-colors hover:bg-slate-50"
                  style={{
                    background: "#FFFFFF",
                    border: `1px solid ${T.borderSoft}`,
                    color: T.text2,
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => toggleGlobalPool(a)}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md px-3 text-[11.5px] font-semibold transition-colors hover:bg-slate-50"
                  style={{
                    background: a.globalPool ? T.primarySoft : "#FFFFFF",
                    border: `1px solid ${a.globalPool ? T.primary + "44" : T.borderSoft}`,
                    color: a.globalPool ? T.primary : T.text2,
                  }}
                  title={a.globalPool ? "Remover do pool global" : "Adicionar ao pool global"}
                >
                  <Globe className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => toggleEnabled(a)}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md px-3 text-[11.5px] font-semibold transition-colors hover:bg-slate-50"
                  style={{
                    background: a.enabled ? "rgba(22,163,74,0.10)" : "#FFFFFF",
                    border: `1px solid ${a.enabled ? "rgba(22,163,74,0.30)" : T.borderSoft}`,
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
                  onClick={() => removeAcquirer(a)}
                  className="inline-flex h-8 items-center justify-center rounded-md px-3 text-[11.5px] font-semibold text-rose-500 transition-colors hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
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

"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import Head from "next/head";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-backend.onrender.com";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#8A1EF7",
  primaryStrong: "#6C0DE0",
  primaryBg: "rgba(138, 30, 247, 0.08)",
  border: "rgba(15, 23, 42, 0.08)",
  borderSoft: "rgba(15, 23, 42, 0.06)",
};

type Pixel = {
  id: string;
  platform: "META" | "GOOGLE_ADS" | "TIKTOK" | "KWAI";
  label?: string;
  pixelId: string;
  capiEnabled: boolean;
  active: boolean;
  testCode?: string;
  createdAt: string;
};

const PLATFORMS = [
  { value: "META", label: "Meta (Facebook + Instagram)", color: "#1877F2" },
  { value: "GOOGLE_ADS", label: "Google Ads", color: "#4285F4" },
  { value: "TIKTOK", label: "TikTok", color: "#000000" },
  { value: "KWAI", label: "Kwai", color: "#FF4500" },
] as const;

function PixelsContent() {
  const { token } = useAuth();
  const [list, setList] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    platform: "META" as Pixel["platform"],
    label: "",
    pixelId: "",
    accessToken: "",
    capiEnabled: false,
    testCode: "",
  });

  async function fetchPixels() {
    if (!token) return;
    try {
      const r = await axios.get(`${API}/api/integrations/pixels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data?.success) setList(r.data.data || []);
    } catch (e: any) {
      console.error("pixels fetch", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPixels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pixelId) {
      toast.error("Informe o ID do pixel.");
      return;
    }
    setSaving(true);
    try {
      const r = await axios.post(`${API}/api/integrations/pixels`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data?.success) {
        toast.success("Pixel conectado!");
        setShowForm(false);
        setForm({
          platform: "META",
          label: "",
          pixelId: "",
          accessToken: "",
          capiEnabled: false,
          testCode: "",
        });
        await fetchPixels();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este pixel?")) return;
    try {
      await axios.delete(`${API}/api/integrations/pixels/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Pixel removido.");
      setList((l) => l.filter((p) => p.id !== id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao remover.");
    }
  }

  return (
    <div className="w-full">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-[22px] font-semibold sm:text-[26px] text-slate-900"
            style={{ letterSpacing: "-0.005em" }}
          >
            Pixels
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Conecte seu pixel uma vez e o ShadowPay dispara os eventos de
            conversão automaticamente em todas as vendas — sem configurar
            produto por produto.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            background: T.primary,
          }}
        >
          <Plus className="h-4 w-4" />
          Novo pixel
        </button>
      </header>

      {/* Info — envio server-side (CAPI) */}
      <div
        className="mb-6 flex items-start gap-3 rounded-xl p-4"
        style={{
          background: "rgba(138,30,247,0.05)",
          border: `1px solid ${T.borderSoft}`,
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: T.primaryBg, color: T.primary }}
        >
          <Zap className="h-[18px] w-[18px]" />
        </div>
        <div className="text-[12.5px] leading-relaxed text-slate-600">
          <b className="text-slate-900">
            Envio server-side (CAPI) ativo pra Meta e TikTok.
          </b>{" "}
          Conecte o pixel com o <b>Access Token</b> e ligue a{" "}
          <b>Conversions API</b>: o ShadowPay dispara <b>Purchase</b> (venda
          aprovada) e <b>AddPaymentInfo</b> (PIX gerado) direto do backend, sem
          depender do navegador do cliente. Informe um <b>Código de Teste</b> pra
          ver os eventos chegando ao vivo no Gerenciador de Eventos.
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl p-5"
          style={{
            background: "#FFFFFF",
            border: `1px solid ${T.border}`,
          }}
        >
          <h3 className="mb-4 text-[14px] font-bold text-slate-900">
            Conectar novo pixel
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Plataforma
              </label>
              <select
                value={form.platform}
                onChange={(e) =>
                  setForm((f) => ({ ...f, platform: e.target.value as any }))
                }
                className="h-10 w-full rounded-lg bg-slate-50 px-3 text-[13px] outline-none"
                style={{ border: `1px solid ${T.borderSoft}` }}
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Apelido (opcional)
              </label>
              <input
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
                placeholder="Ex: Conta principal"
                className="h-10 w-full rounded-lg bg-slate-50 px-3 text-[13px] outline-none"
                style={{ border: `1px solid ${T.borderSoft}` }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                ID do Pixel *
              </label>
              <input
                value={form.pixelId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pixelId: e.target.value }))
                }
                placeholder="123456789012345"
                className="h-10 w-full rounded-lg bg-slate-50 px-3 font-mono text-[13px] outline-none"
                style={{ border: `1px solid ${T.borderSoft}` }}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Access Token / API secret (CAPI)
              </label>
              <input
                value={form.accessToken}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accessToken: e.target.value }))
                }
                placeholder="opcional — pra Conversions API"
                type="password"
                className="h-10 w-full rounded-lg bg-slate-50 px-3 font-mono text-[13px] outline-none"
                style={{ border: `1px solid ${T.borderSoft}` }}
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <input
                type="checkbox"
                id="capi"
                checked={form.capiEnabled}
                onChange={(e) =>
                  setForm((f) => ({ ...f, capiEnabled: e.target.checked }))
                }
              />
              <label htmlFor="capi" className="text-[13px] text-slate-700">
                Ativar Conversions API (server-side) — dispara Purchase e
                AddPaymentInfo pelo backend (Meta e TikTok)
              </label>
            </div>
            {form.capiEnabled && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Código de Teste (opcional)
                </label>
                <input
                  value={form.testCode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, testCode: e.target.value }))
                  }
                  placeholder="TEST12345"
                  className="h-10 w-full rounded-lg bg-slate-50 px-3 font-mono text-[13px] outline-none"
                  style={{ border: `1px solid ${T.borderSoft}` }}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Pega no Gerenciador de Eventos → Testar eventos. Deixe vazio em
                  produção.
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex h-9 items-center rounded-lg px-4 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
              style={{ border: `1px solid ${T.borderSoft}` }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[12px] font-semibold text-white disabled:opacity-50"
              style={{
                background: T.primary,
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…
                </>
              ) : (
                "Conectar pixel"
              )}
            </button>
          </div>
        </form>
      )}

      <div
        className="overflow-hidden rounded-xl"
        style={{
          background: "#FFFFFF",
          border: `1px solid ${T.borderSoft}`,
        }}
      >
        {loading ? (
          <div className="px-5 py-12 text-center text-[13px] text-slate-500">
            Carregando…
          </div>
        ) : list.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Target
              className="mx-auto mb-3 h-10 w-10"
              style={{ color: T.textMuted }}
            />
            <p className="text-[14px] font-semibold text-slate-700">
              Nenhum pixel conectado
            </p>
            <p className="mt-1 text-[12px] text-slate-500">
              Clique em "Novo pixel" pra começar a rastrear conversões.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr
                  className="text-left text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: T.textMuted, background: "#F8FAFC" }}
                >
                  <th className="px-5 py-2.5">Plataforma</th>
                  <th className="px-5 py-2.5">Pixel ID</th>
                  <th className="px-5 py-2.5">CAPI</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const platform = PLATFORMS.find((x) => x.value === p.platform);
                  return (
                    <tr
                      key={p.id}
                      style={{ borderTop: `1px solid ${T.borderSoft}` }}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                            style={{ background: platform?.color || "#8A1EF7" }}
                          >
                            {p.platform[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {platform?.label || p.platform}
                            </p>
                            {p.label && (
                              <p className="text-[11px] text-slate-500">
                                {p.label}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-700">
                        {p.pixelId}
                      </td>
                      <td className="px-5 py-3">
                        {p.capiEnabled ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Ativado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                            <XCircle className="h-3 w-3" /> Browser-only
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {p.active ? (
                          <span className="text-[12px] font-semibold text-emerald-700">
                            Ativo
                          </span>
                        ) : (
                          <span className="text-[12px] font-semibold text-slate-500">
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PixelsPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Pixels</title>
      </Head>
      <LightShell>
        <PixelsContent />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}

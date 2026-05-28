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
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            NEGÓCIOS · PRODUTOS
          </p>
          <h1
            className="text-[28px] font-bold tracking-tight text-slate-900"
            style={{ letterSpacing: "-0.005em" }}
          >
            Pixels
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Conecte Meta, Google Ads, TikTok e Kwai pra rastrear conversões nas
            campanhas de mídia paga.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
            boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
          }}
        >
          <Plus className="h-4 w-4" />
          Novo pixel
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-2xl p-5"
          style={{
            background: "#FFFFFF",
            border: `1px solid ${T.border}`,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(124,58,237,0.20)",
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
                Ativar Conversions API (server-side) — dispara eventos Purchase
                via backend
              </label>
            </div>
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
                background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                boxShadow: "0 6px 16px -8px rgba(124,58,237,0.45)",
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
                            style={{ background: platform?.color || "#7C3AED" }}
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

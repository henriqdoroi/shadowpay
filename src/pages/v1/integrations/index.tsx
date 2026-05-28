"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import Head from "next/head";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Plug,
  Search,
  CheckCircle2,
  Plus,
  ExternalLink,
  X,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
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

type Integration = {
  id: string;
  providerCode?: string;
  name: string;
  category: "Trackeamento" | "Webhooks" | "Analytics";
  description: string;
  logo: string;
  logoBg: string;
  href?: string;
  fields?: Array<{ key: "apiKey" | "apiSecret" | "webhookUrl"; label: string; placeholder?: string; type?: string }>;
  docsUrl?: string;
};

const INTEGRATIONS: Integration[] = [
  {
    id: "utmify",
    providerCode: "UTMIFY",
    name: "UTMify",
    category: "Trackeamento",
    description: "Trackeamento server-side com UTMs persistentes em todo o funil de PIX.",
    logo: "UT",
    logoBg: "linear-gradient(135deg, #6366F1, #8B5CF6)",
    fields: [
      { key: "apiKey", label: "API Token", placeholder: "utmify_xxx...", type: "password" },
    ],
    docsUrl: "https://utmify.com.br/docs",
  },
  {
    id: "xtracky",
    providerCode: "XTRACKY",
    name: "Xtracky",
    category: "Trackeamento",
    description: "Atribuição multicanal, deduplicação de eventos e CAPI pra escala.",
    logo: "XT",
    logoBg: "linear-gradient(135deg, #F97316, #EF4444)",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "xtk_live_xxx...", type: "password" },
      { key: "webhookUrl", label: "Webhook URL (opcional)", placeholder: "https://..." },
    ],
  },
  {
    id: "google-analytics",
    providerCode: "GA4",
    name: "Google Analytics 4",
    category: "Analytics",
    description: "Eventos de funil + receita enviados pro GA4 via Measurement Protocol.",
    logo: "G4",
    logoBg: "linear-gradient(135deg, #F59E0B, #D97706)",
    fields: [
      { key: "apiKey", label: "Measurement ID", placeholder: "G-XXXXXXXXXX" },
      { key: "apiSecret", label: "API Secret", type: "password" },
    ],
  },
  {
    id: "webhooks",
    name: "Webhooks",
    category: "Webhooks",
    description: "Notifique seus sistemas em tempo real pra cada PIX gerado, pago ou cancelado.",
    logo: "WH",
    logoBg: "linear-gradient(135deg, #7C3AED, #6D28D9)",
    href: "/v1/configs/webhook",
  },
];

const CATEGORIES = ["Tudo", "Trackeamento", "Webhooks", "Analytics"] as const;

type ConnectedProvider = {
  id: string;
  provider: string;
  active: boolean;
  webhookUrl?: string;
  connectedAt: string;
};

function ConnectModal({
  integration,
  onClose,
  onConnected,
  token,
}: {
  integration: Integration;
  onClose: () => void;
  onConnected: () => void;
  token: string;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await axios.post(
        `${API}/api/integrations/providers`,
        { provider: integration.providerCode, ...form },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        toast.success(`${integration.name} conectado!`);
        onConnected();
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao conectar.");
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
        style={{ boxShadow: "0 24px 64px -20px rgba(15,23,42,0.30)" }}
      >
        <div className="mb-4 flex items-start gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-[14px] font-bold text-white"
            style={{ background: integration.logoBg }}
          >
            {integration.logo}
          </div>
          <div className="flex-1">
            <h2 className="text-[16px] font-bold text-slate-900">
              Conectar {integration.name}
            </h2>
            <p className="text-[12px] text-slate-500">{integration.description}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {integration.fields?.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {f.label}
              </label>
              <input
                type={f.type || "text"}
                value={form[f.key] || ""}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="h-10 w-full rounded-lg bg-slate-50 px-3 font-mono text-[13px] outline-none"
                style={{ border: `1px solid ${T.borderSoft}` }}
              />
            </div>
          ))}

          {integration.docsUrl && (
            <a
              href={integration.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[12px] font-semibold"
              style={{ color: T.primary }}
            >
              Onde encontrar essas credenciais
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
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
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Conectando…
                </>
              ) : (
                "Conectar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IntegrationsContent() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Tudo");
  const [connected, setConnected] = useState<ConnectedProvider[]>([]);
  const [modalFor, setModalFor] = useState<Integration | null>(null);

  async function fetchConnected() {
    if (!token) return;
    try {
      const r = await axios.get(`${API}/api/integrations/providers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data?.success) setConnected(r.data.data || []);
    } catch (e) {
      console.error("connected providers", e);
    }
  }

  useEffect(() => {
    fetchConnected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleDisconnect(connectionId: string) {
    if (!confirm("Desconectar essa integração?")) return;
    try {
      await axios.delete(`${API}/api/integrations/providers/${connectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Integração desconectada.");
      fetchConnected();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao desconectar.");
    }
  }

  const filtered = INTEGRATIONS.filter((it) => {
    const matchCat = category === "Tudo" || it.category === category;
    const matchSearch =
      !search ||
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function getConnection(providerCode?: string) {
    return providerCode ? connected.find((c) => c.provider === providerCode) : undefined;
  }

  return (
    <>
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
              AVANÇADO
            </p>
            <h1
              className="text-[28px] font-bold tracking-tight text-slate-900"
              style={{ letterSpacing: "-0.005em" }}
            >
              Integrações
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Conecte UTMify, Xtracky, pixels, webhooks e ferramentas de
              trackeamento ao seu gateway.
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 self-start rounded-xl px-3 py-2 text-[12px] font-semibold sm:self-auto"
            style={{
              background: T.primaryBg,
              color: T.primary,
              border: `1px solid ${T.border}`,
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {connected.length} conectada{connected.length !== 1 ? "s" : ""} ·{" "}
            {INTEGRATIONS.length} disponíveis
          </div>
        </header>

        <div
          className="mb-6 flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center"
          style={{
            background: "#FFFFFF",
            border: `1px solid ${T.borderSoft}`,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div
            className="flex h-10 flex-1 items-center rounded-xl px-3"
            style={{
              background: "#F8FAFC",
              border: `1px solid ${T.borderSoft}`,
            }}
          >
            <Search className="mr-2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar integração (UTMify, Xtracky, Meta Pixel...)"
              className="flex-1 bg-transparent text-[13px] text-slate-700 placeholder-slate-400 outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => {
              const active = c === category;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors"
                  style={{
                    background: active ? T.primary : "#F8FAFC",
                    color: active ? "#FFFFFF" : T.text2,
                    border: `1px solid ${active ? T.primary : T.borderSoft}`,
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it) => {
            const conn = getConnection(it.providerCode);
            return (
              <div
                key={it.id}
                className="group flex flex-col rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                style={{
                  background: "#FFFFFF",
                  border: `1px solid ${T.borderSoft}`,
                  boxShadow:
                    "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[14px] font-bold text-white"
                    style={{ background: it.logoBg }}
                  >
                    {it.logo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[14px] font-bold text-slate-900">
                        {it.name}
                      </h3>
                      {conn && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Conectado
                        </span>
                      )}
                    </div>
                    <p
                      className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: T.textMuted }}
                    >
                      {it.category}
                    </p>
                  </div>
                </div>

                <p className="mt-3 flex-1 text-[12.5px] leading-relaxed text-slate-500">
                  {it.description}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  {it.href ? (
                    <Link
                      href={it.href}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
                      style={{
                        background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                        boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Abrir
                    </Link>
                  ) : conn ? (
                    <button
                      onClick={() => handleDisconnect(conn.id)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                      style={{ border: "1px solid rgba(239,68,68,0.30)" }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Desconectar
                    </button>
                  ) : (
                    <button
                      onClick={() => setModalFor(it)}
                      disabled={!it.providerCode}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{
                        background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                        boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Conectar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div
            className="mt-6 rounded-2xl p-12 text-center"
            style={{
              background: "#FFFFFF",
              border: `1px solid ${T.borderSoft}`,
            }}
          >
            <Plug
              className="mx-auto mb-3 h-10 w-10"
              style={{ color: T.textMuted }}
            />
            <p className="text-[14px] font-semibold text-slate-700">
              Nenhuma integração encontrada
            </p>
          </div>
        )}
      </div>

      {modalFor && token && (
        <ConnectModal
          integration={modalFor}
          onClose={() => setModalFor(null)}
          onConnected={fetchConnected}
          token={token}
        />
      )}
    </>
  );
}

export default function IntegrationsPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Integrações</title>
      </Head>
      <LightShell>
        <IntegrationsContent />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}

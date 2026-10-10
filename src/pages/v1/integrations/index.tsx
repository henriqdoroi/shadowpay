"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import Head from "next/head";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Key,
  Webhook,
  Target,
  BarChart3,
  Crosshair,
  MessageCircle,
  Activity,
  ArrowRight,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-backend.onrender.com";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primaryStrong: "#6D28D9",
  primaryBg: "rgba(124, 58, 237, 0.08)",
  green: "#16A34A",
  border: "rgba(15, 23, 42, 0.08)",
  borderSoft: "rgba(15, 23, 42, 0.06)",
  card: "#FFFFFF",
};

type StatusKind = "apikeys" | "webhooks" | "pixel" | "telegram" | "whatsapp";

type Card = {
  id: string;
  title: string;
  /** "Provedor" do subtítulo (Meta + TikTok, UTMify, etc.) */
  provider: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  href: string;
  /** chave p/ computar a linha de status */
  status: StatusKind | "provider";
  /** quando status === "provider" */
  providerCode?: string;
  fields?: Array<{
    key: string;
    label: string;
    placeholder?: string;
    type?: string;
  }>;
  docsUrl?: string;
};

const CARDS: Card[] = [
  {
    id: "apikeys",
    title: "API Keys",
    provider: "ShadowPay",
    description: "Chaves de integração pra usar a API v1 no seu backend.",
    icon: Key,
    color: "#7C3AED",
    href: "/v1/configs/apikey",
    status: "apikeys",
  },
  {
    id: "webhooks",
    title: "Webhooks",
    provider: "ShadowPay",
    description: "Receba eventos de transações no seu servidor em tempo real.",
    icon: Webhook,
    color: "#0EA5E9",
    href: "/v1/configs/webhook",
    status: "webhooks",
  },
  {
    id: "pixel",
    title: "Pixel Facebook / TikTok",
    provider: "Meta + TikTok",
    description:
      "Envia o evento de compra de todas as vendas pro seu Pixel (CAPI).",
    icon: Target,
    color: "#7C3AED",
    href: "/v1/integrations/pixels",
    status: "pixel",
  },
  {
    id: "utmify",
    title: "UTMify",
    provider: "UTMify",
    description: "Envia vendas com UTMs pra sua conta UTMify, por produto.",
    icon: BarChart3,
    color: "#F59E0B",
    href: "#",
    status: "provider",
    providerCode: "UTMIFY",
    fields: [
      { key: "apiKey", label: "API Token", placeholder: "utmify_xxx...", type: "password" },
    ],
    docsUrl: "https://utmify.com.br",
  },
  {
    id: "xtracky",
    title: "Xtracky",
    provider: "Xtracky",
    description:
      "Envia vendas geradas e pagas pro seu rastreio Xtracky, por produto.",
    icon: Crosshair,
    color: "#D97706",
    href: "#",
    status: "provider",
    providerCode: "XTRACKY",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "xtk_live_xxx...", type: "password" },
    ],
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    provider: "Meta Cloud API",
    description: "Recuperação de carrinho abandonado via Meta Cloud API.",
    icon: MessageCircle,
    color: "#16A34A",
    href: "/v1/automation",
    status: "whatsapp",
  },
];

function ConnectModal({
  card,
  token,
  onClose,
  onConnected,
}: {
  card: Card;
  token: string;
  onClose: () => void;
  onConnected: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await axios.post(
        `${API}/api/integrations/providers`,
        { provider: card.providerCode, ...form },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        toast.success(`${card.title} conectado!`);
        onConnected();
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao conectar.");
    } finally {
      setSaving(false);
    }
  }

  const Icon = card.icon;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15,23,42,0.50)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 24px 64px -20px rgba(15,23,42,0.30)" }}
      >
        <div className="mb-4 flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${card.color}14`, color: card.color }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-[16px] font-bold text-slate-900">
              Conectar {card.title}
            </h2>
            <p className="text-[12px] text-slate-500">{card.description}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {card.fields?.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {f.label}
              </label>
              <input
                type={f.type || "text"}
                value={form[f.key] || ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, [f.key]: e.target.value }))
                }
                placeholder={f.placeholder}
                className="h-10 w-full rounded-lg bg-slate-50 px-3 font-mono text-[13px] outline-none"
                style={{ border: `1px solid ${T.borderSoft}` }}
              />
            </div>
          ))}

          {card.docsUrl && (
            <a
              href={card.docsUrl}
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
              style={{ background: T.primary }}
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
  const router = useRouter();
  const [connected, setConnected] = useState<string[]>([]);
  const [pixelCount, setPixelCount] = useState(0);
  const [modalFor, setModalFor] = useState<Card | null>(null);

  function refetch() {
    if (!token) return;
    const h = { headers: { Authorization: `Bearer ${token}` } };
    axios
      .get(`${API}/api/integrations/providers`, h)
      .then((r) => {
        if (r.data?.success)
          setConnected(
            (r.data.data || [])
              .filter((c: any) => c.active !== false)
              .map((c: any) => c.provider)
          );
      })
      .catch(() => {});
  }

  useEffect(() => {
    if (!token) return;
    refetch();
    // Pixels conectados (endpoint da Fase 2 — falha graciosa enquanto não existe)
    axios
      .get(`${API}/api/user/pixels`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        if (r.data?.success) setPixelCount((r.data.data || []).length);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function statusLine(c: Card): { text: string; active: boolean } {
    if (c.status === "provider") {
      const on = !!c.providerCode && connected.includes(c.providerCode);
      return on
        ? { text: "Integração ativa", active: true }
        : { text: "Não conectado", active: false };
    }
    if (c.status === "pixel") {
      return pixelCount > 0
        ? {
            text: `${pixelCount} pixel${pixelCount > 1 ? "s" : ""} conectado${
              pixelCount > 1 ? "s" : ""
            }`,
            active: true,
          }
        : { text: "Nenhum pixel conectado", active: false };
    }
    if (c.status === "apikeys")
      return { text: "Gerenciar chaves", active: false };
    if (c.status === "webhooks")
      return { text: "Configurar webhooks", active: false };
    if (c.status === "telegram")
      return { text: "Conectar canal", active: false };
    return { text: "Configurar", active: false };
  }

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <header className="mb-6">
        <h1
          className="text-[22px] font-bold tracking-tight text-slate-900 sm:text-[26px]"
          style={{ letterSpacing: "-0.01em" }}
        >
          Integrações
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Conecte pixel, webhooks, rastreio e canais de venda ao seu gateway.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {CARDS.map((c) => {
          const Icon = c.icon;
          const st = statusLine(c);
          return (
            <div
              key={c.id}
              className="flex flex-col rounded-2xl p-5"
              style={{
                background: T.card,
                border: `1px solid ${T.borderSoft}`,
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              {/* topo: ícone + título + ABRIR */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${c.color}14`, color: c.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-bold text-slate-900">
                      {c.title}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-500">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: T.green }}
                      />
                      {c.provider} · Grátis pra usar
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    c.providerCode ? setModalFor(c) : router.push(c.href)
                  }
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-3 text-[11px] font-bold uppercase tracking-wide text-white transition-colors"
                  style={{
                    background: T.primary,
                    boxShadow: "0 6px 16px -8px rgba(124,58,237,0.45)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = T.primaryStrong;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = T.primary;
                  }}
                >
                  Abrir
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div
                className="my-4 h-px w-full"
                style={{ background: T.borderSoft }}
              />

              <p className="text-[13px] leading-relaxed text-slate-600">
                {c.description}
              </p>

              <div
                className="my-4 h-px w-full"
                style={{ background: T.borderSoft }}
              />

              {/* status */}
              <div className="flex items-center gap-1.5">
                <Activity
                  className="h-3.5 w-3.5"
                  style={{ color: st.active ? T.green : T.textMuted }}
                />
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: st.active ? T.green : T.textMuted }}
                >
                  {st.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {modalFor && token && (
        <ConnectModal
          card={modalFor}
          token={token}
          onClose={() => setModalFor(null)}
          onConnected={refetch}
        />
      )}
    </div>
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

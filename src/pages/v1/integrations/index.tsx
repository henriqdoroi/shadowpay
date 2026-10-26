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
import { StatusBadge, type Tone } from "@/components/PanelBits";

const API = "https://shadowpay-backend.onrender.com";

const T = {
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#8A1EF7",
  primaryStrong: "#6C0DE0",
  primaryBg: "rgba(138, 30, 247, 0.08)",
  green: "#16A34A",
  border: "rgba(15, 23, 42, 0.08)",
  borderSoft: "rgba(15, 23, 42, 0.06)",
  card: "#FFFFFF",
};

type StatusKind = "apikeys" | "webhooks" | "pixel" | "whatsapp" | "utmify";

type Card = {
  id: string;
  title: string;
  /** "Provedor" do subtítulo (Meta + TikTok, UTMify, etc.) */
  provider: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  /** tom do ícone (cor de cada integração) */
  tone: Tone;
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
    color: "#8A1EF7",
    tone: "violet",
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
    tone: "teal",
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
    color: "#8A1EF7",
    tone: "blue",
    href: "/v1/integrations/pixels",
    status: "pixel",
  },
  {
    id: "utmify",
    title: "UTMify",
    provider: "UTMify",
    description:
      "Envia todas as suas vendas, com as UTMs, pra sua conta UTMify — direto do servidor, com reenvio automático.",
    icon: BarChart3,
    color: "#F59E0B",
    tone: "amber",
    href: "/v1/integrations/utmify",
    status: "utmify",
  },
  {
    id: "xtracky",
    title: "Xtracky",
    provider: "Xtracky",
    description:
      "Envia vendas geradas e pagas pro seu rastreio Xtracky, por produto.",
    icon: Crosshair,
    color: "#D97706",
    tone: "red",
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
    tone: "green",
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
        className="w-full max-w-md rounded-xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 24px 64px -20px rgba(15,23,42,0.30)" }}
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="sp-chip" data-tone={card.tone} style={{ width: 44, height: 44, borderRadius: 12 }}>
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
  const [utmify, setUtmify] = useState<{ active: boolean; invalid: boolean } | null>(null);
  const [pixelCount, setPixelCount] = useState(0);
  const [modalFor, setModalFor] = useState<Card | null>(null);

  function refetch() {
    if (!token) return;
    const h = { headers: { Authorization: `Bearer ${token}` } };
    axios
      .get(`${API}/api/integrations/providers`, h)
      .then((r) => {
        if (!r.data?.success) return;
        const rows: any[] = r.data.data || [];
        setConnected(rows.filter((c) => c.active !== false).map((c) => c.provider));
        const u = rows.find((c) => c.provider === "UTMIFY");
        setUtmify(u ? { active: u.active !== false, invalid: !!u.credentialInvalid } : null);
      })
      .catch(() => {});
  }

  useEffect(() => {
    if (!token) return;
    refetch();
    // Pixels conectados (só os ativos contam)
    axios
      .get(`${API}/api/integrations/pixels`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        if (r.data?.success) setPixelCount((r.data.data || []).filter((p: any) => p.active !== false).length);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function statusLine(c: Card): { text: string; active: boolean; warn?: boolean } {
    if (c.status === "utmify") {
      if (!utmify) return { text: "Não conectado", active: false };
      if (utmify.invalid) return { text: "Token recusado — revise", active: false, warn: true };
      return utmify.active
        ? { text: "Integração ativa", active: true }
        : { text: "Envios pausados", active: false, warn: true };
    }
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
    return { text: "Configurar", active: false };
  }

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1
          className="text-[22px] font-semibold text-slate-900 sm:text-[26px]"
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
              className="flex flex-col rounded-xl p-5"
              style={{
                background: T.card,
                border: `1px solid ${T.borderSoft}`,
              }}
            >
              {/* topo: ícone + título + ABRIR */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="sp-chip" data-tone={c.tone} style={{ width: 40, height: 40 }}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold text-slate-900">
                      {c.title}
                    </h3>
                    <p className="mt-0.5 text-[12.5px] text-slate-500">
                      {c.provider} · Grátis
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    c.providerCode ? setModalFor(c) : router.push(c.href)
                  }
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-medium text-slate-800 transition-colors hover:bg-[#F6F6F8]"
                >
                  Abrir
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                </button>
              </div>

              <p className="mt-4 text-[14px] leading-relaxed text-slate-600">
                {c.description}
              </p>

              <div className="mt-4" />

              {/* status */}
              <div className="mt-auto">
                <StatusBadge tone={st.active ? "green" : st.warn ? "amber" : "gray"}>{st.text}</StatusBadge>
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

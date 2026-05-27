"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import Head from "next/head";
import { useState } from "react";
import {
  Plug,
  Search,
  CheckCircle2,
  Plus,
  ExternalLink,
  Target,
  Globe,
  Activity,
  Webhook as WebhookIcon,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

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
  name: string;
  category: "Trackeamento" | "Pixels" | "Domínios" | "Webhooks" | "Analytics";
  description: string;
  logo: string; // 1-2 letras (placeholder)
  logoBg: string;
  status: "connected" | "available";
  href?: string;
};

const INTEGRATIONS: Integration[] = [
  {
    id: "utmify",
    name: "UTMify",
    category: "Trackeamento",
    description:
      "Trackeamento server-side com UTMs persistentes em todo o funil de PIX.",
    logo: "UT",
    logoBg: "linear-gradient(135deg, #6366F1, #8B5CF6)",
    status: "available",
  },
  {
    id: "xtracky",
    name: "Xtracky",
    category: "Trackeamento",
    description:
      "Atribuição multicanal, deduplicação de eventos e CAPI pra escala.",
    logo: "XT",
    logoBg: "linear-gradient(135deg, #F97316, #EF4444)",
    status: "available",
  },
  {
    id: "redtrack",
    name: "RedTrack",
    category: "Trackeamento",
    description:
      "Tracker enterprise pra mídia paga com S2S postback automático.",
    logo: "RT",
    logoBg: "linear-gradient(135deg, #DC2626, #B91C1C)",
    status: "available",
  },
  {
    id: "voluum",
    name: "Voluum",
    category: "Trackeamento",
    description:
      "Tracker premium pra afiliados — relatórios em tempo real e A/B testing.",
    logo: "VO",
    logoBg: "linear-gradient(135deg, #0EA5E9, #0284C7)",
    status: "available",
  },
  {
    id: "binom",
    name: "Binom",
    category: "Trackeamento",
    description:
      "Tracker self-hosted ultra rápido — popular entre afiliados de iGaming.",
    logo: "BN",
    logoBg: "linear-gradient(135deg, #16A34A, #15803D)",
    status: "available",
  },
  {
    id: "keitaro",
    name: "Keitaro",
    category: "Trackeamento",
    description:
      "Tracker self-hosted com cloaking, redirect inteligente e proteção anti-bot.",
    logo: "KT",
    logoBg: "linear-gradient(135deg, #14B8A6, #0D9488)",
    status: "available",
  },
  {
    id: "meta-pixel",
    name: "Meta Pixel",
    category: "Pixels",
    description:
      "Eventos de compra (Purchase) enviados via CAPI pra Facebook e Instagram Ads.",
    logo: "M",
    logoBg: "linear-gradient(135deg, #1877F2, #0866FF)",
    status: "available",
    href: "/v1/integrations/pixels",
  },
  {
    id: "google-ads",
    name: "Google Ads",
    category: "Pixels",
    description:
      "Conversion tracking via gtag — atribuição de venda nas campanhas do Google.",
    logo: "GA",
    logoBg: "linear-gradient(135deg, #4285F4, #1A73E8)",
    status: "available",
    href: "/v1/integrations/pixels",
  },
  {
    id: "tiktok-pixel",
    name: "TikTok Pixel",
    category: "Pixels",
    description: "Pixel + Events API pra rastrear compras em campanhas TikTok.",
    logo: "TT",
    logoBg: "linear-gradient(135deg, #000000, #25F4EE)",
    status: "available",
    href: "/v1/integrations/pixels",
  },
  {
    id: "kwai-pixel",
    name: "Kwai Pixel",
    category: "Pixels",
    description:
      "Pixel oficial do Kwai pra campanhas de venda direta no app.",
    logo: "KW",
    logoBg: "linear-gradient(135deg, #FF4500, #FF6B35)",
    status: "available",
    href: "/v1/integrations/pixels",
  },
  {
    id: "google-analytics",
    name: "Google Analytics 4",
    category: "Analytics",
    description:
      "Eventos de funil + receita enviados pro GA4 via Measurement Protocol.",
    logo: "G4",
    logoBg: "linear-gradient(135deg, #F59E0B, #D97706)",
    status: "available",
  },
  {
    id: "custom-domain",
    name: "Domínios próprios",
    category: "Domínios",
    description:
      "Conecte seu domínio (CNAME) pra rodar checkout em seu_dominio.com.br.",
    logo: "DN",
    logoBg: "linear-gradient(135deg, #10B981, #059669)",
    status: "available",
    href: "/v1/integrations/domains",
  },
  {
    id: "webhooks",
    name: "Webhooks",
    category: "Webhooks",
    description:
      "Notifique seus sistemas em tempo real pra cada PIX gerado, pago ou cancelado.",
    logo: "WH",
    logoBg: "linear-gradient(135deg, #7C3AED, #6D28D9)",
    status: "available",
    href: "/v1/configs/webhook",
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "Trackeamento",
    description:
      "Disparo de Zaps a cada venda — conecte com 6000+ apps sem código.",
    logo: "ZP",
    logoBg: "linear-gradient(135deg, #FF4A00, #FF6B00)",
    status: "available",
  },
];

const CATEGORIES = [
  "Tudo",
  "Trackeamento",
  "Pixels",
  "Domínios",
  "Webhooks",
  "Analytics",
] as const;

function IntegrationsContent() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Tudo");

  const filtered = INTEGRATIONS.filter((it) => {
    const matchCat = category === "Tudo" || it.category === category;
    const matchSearch =
      !search ||
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
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
          {INTEGRATIONS.length} integrações disponíveis
        </div>
      </header>

      {/* Search + Categories */}
      <div
        className="mb-6 flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center"
        style={{
          background: "#FFFFFF",
          border: `1px solid ${T.borderSoft}`,
          boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
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

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((it) => (
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
                  {it.status === "connected" && (
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
                  Conectar
                </Link>
              ) : (
                <button
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{
                    background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                    boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Conectar
                </button>
              )}
              <button
                className="inline-flex h-9 items-center justify-center gap-1 rounded-lg px-3 text-[12px] font-semibold transition-colors hover:bg-slate-50"
                style={{
                  background: "#FFFFFF",
                  border: `1px solid ${T.borderSoft}`,
                  color: T.text2,
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
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
          <p className="mt-1 text-[12px] text-slate-500">
            Tente ajustar a busca ou trocar de categoria.
          </p>
        </div>
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
    </ProtectedRoute>
  );
}

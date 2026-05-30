"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import Head from "next/head";
import { toast } from "sonner";
import {
  Plug,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Webhook as WebhookIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";

const API = "https://shadowpay-api-production.up.railway.app";

interface WebhookConnection {
  id: string;
  url: string;
  eventType: "TRANSACTIONS" | "PRODUCTS";
  isActive: boolean;
  createdAt: string;
  lastSentAt?: string;
  description?: string;
  sellerId: string;
}

interface CreateWebhookRequest {
  url: string;
  eventType: "TRANSACTIONS" | "PRODUCTS";
  description?: string;
}

const webhookTypes = [
  { value: "TRANSACTIONS", label: "Transações" },
  { value: "PRODUCTS", label: "Produtos" },
];

function WebhookContent() {
  const { user, token } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState("");
  const [type, setType] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const fetchWebhooks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/webhooks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data?.success) setWebhooks(r.data.data);
      else toast.error("Erro ao carregar webhooks");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!token || !url.trim() || !type) return;
    setCreating(true);
    try {
      const body: CreateWebhookRequest = {
        url: url.trim(),
        eventType: type as "TRANSACTIONS" | "PRODUCTS",
      };
      const r = await axios.post(`${API}/api/webhooks`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data?.success) {
        await fetchWebhooks();
        close();
        toast.success("Webhook criado!");
      } else {
        toast.error(r.data?.message || "Erro ao criar webhook");
      }
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || "Erro ao conectar com o servidor"
      );
    } finally {
      setCreating(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!token) return;
    try {
      const r = await axios.delete(`${API}/api/webhooks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data?.success) {
        await fetchWebhooks();
        toast.success("Webhook deletado!");
      } else {
        toast.error(r.data?.message || "Erro ao deletar");
      }
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || "Erro ao conectar com o servidor"
      );
    }
  };

  useEffect(() => {
    if (user && token) fetchWebhooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const fmt = (s: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(s));

  const statusBadge = (active: boolean) =>
    active ? (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        <CheckCircle className="h-3 w-3" /> Ativo
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
        <XCircle className="h-3 w-3" /> Inativo
      </span>
    );

  const typeBadge = (t: string) => {
    const map: Record<string, { color: string; label: string }> = {
      TRANSACTIONS: {
        color: "bg-violet-50 text-violet-700 border-violet-200",
        label: "Transações",
      },
      PRODUCTS: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Produtos",
      },
    };
    const cfg = map[t] ?? {
      color: "bg-slate-50 text-slate-600 border-slate-200",
      label: t,
    };
    return (
      <span
        className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cfg.color}`}
      >
        {cfg.label}
      </span>
    );
  };

  const close = () => {
    setShowAdd(false);
    setUrl("");
    setType("");
  };

  const truncate = (u: string, n = 50) =>
    u.length <= n ? u : u.substring(0, n) + "...";

  const total = webhooks?.length || 0;
  const active = webhooks?.filter((w) => w.isActive).length || 0;

  const kpis = [
    {
      label: "Total de webhooks",
      value: String(total),
      sub: "Configurados",
      icon: <Plug className="h-4 w-4" />,
      color: "#7C3AED",
    },
    {
      label: "Webhooks ativos",
      value: String(active),
      sub: "Funcionando",
      icon: <CheckCircle className="h-4 w-4" />,
      color: "#22C55E",
    },
  ];

  const inputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100";

  return (
    <>
      <Head>
        <title>ShadowPay — Webhooks</title>
      </Head>
      <LightShell>
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
              Integrações
            </p>
            <h1
              className="text-[22px] font-bold tracking-tight sm:text-[28px] text-slate-900"
              style={{
                fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
                letterSpacing: "-0.005em",
              }}
            >
              Webhooks
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              Receba notificações em tempo real dos eventos da sua conta.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{
              background: "#7C3AED",
              boxShadow: "0 8px 20px -8px rgba(124,58,237,0.55)",
            }}
          >
            <Plus className="h-4 w-4" /> Conectar webhook
          </button>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl p-4 sm:p-5"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(15,23,42,0.06)",
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500">
                  {k.label}
                </p>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: `${k.color}14`, color: k.color }}
                >
                  {k.icon}
                </span>
              </div>
              <div
                className="mt-2 text-[28px] font-bold leading-none tracking-tight text-slate-900"
                style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
              >
                {k.value}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">{k.sub}</p>
            </div>
          ))}
        </section>

        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid rgba(15,23,42,0.06)" }}
          >
            <h2
              className="text-[14px] font-semibold text-slate-900"
              style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
            >
              Webhooks conectados
            </h2>
          </div>

          <div className="p-2 sm:p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl"
                    style={{ background: "#F1F2F6" }}
                  />
                ))}
              </div>
            ) : !webhooks || webhooks.length === 0 ? (
              <div className="py-14 text-center">
                <WebhookIcon className="mx-auto mb-3 h-8 w-8 text-violet-300" />
                <h3 className="text-base font-semibold text-slate-700">
                  Nenhum webhook configurado
                </h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
                  Configure seu primeiro webhook para receber notificações.
                </p>
                <button
                  onClick={() => setShowAdd(true)}
                  className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Conectar primeiro webhook
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                      <th className="px-3 py-2.5 font-semibold">URL</th>
                      <th className="px-3 py-2.5 font-semibold">Tipo</th>
                      <th className="px-3 py-2.5 font-semibold">Status</th>
                      <th className="px-3 py-2.5 font-semibold">Criado</th>
                      <th className="px-3 py-2.5 font-semibold">
                        Último disparo
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhooks.map((w) => (
                      <tr
                        key={w.id}
                        className="transition-colors hover:bg-slate-50/50"
                        style={{ borderTop: "1px solid rgba(15,23,42,0.04)" }}
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                              <WebhookIcon className="h-3.5 w-3.5" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">
                                {truncate(w.url)}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                {w.url
                                  .replace("https://", "")
                                  .replace("http://", "")
                                  .split("/")[0]}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">{typeBadge(w.eventType)}</td>
                        <td className="px-3 py-3">{statusBadge(w.isActive)}</td>
                        <td className="px-3 py-3 text-slate-500">
                          {fmt(w.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-slate-500">
                          {w.lastSentAt ? fmt(w.lastSentAt) : "Nunca"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => deleteWebhook(w.id)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs text-rose-700 hover:bg-rose-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Excluir</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </LightShell>

      {/* Modal adicionar */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar novo webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Plug className="h-4 w-4" />
                URL do webhook
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.exemplo.com/webhook"
                className={inputCls}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                URL completa onde receber as notificações
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Tipo de evento
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={inputCls}
              >
                <option value="">Selecione…</option>
                {webhookTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="rounded-xl p-3 text-xs text-slate-500"
              style={{ background: "#F8F9FC" }}
            >
              <p className="font-semibold text-slate-700">
                Informações importantes
              </p>
              <p>• Será testado após a configuração</p>
              <p>• Certifique-se de que a URL está acessível</p>
              <p>• Dados enviados via POST em JSON</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={close}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={createWebhook}
                disabled={!url.trim() || !type || creating}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#7C3AED" }}
              >
                {creating ? "Conectando…" : "Conectar webhook"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ShadowPanel />
    </>
  );
}

export default function Webhook() {
  return (
    <ProtectedRoute>
      <WebhookContent />
    </ProtectedRoute>
  );
}

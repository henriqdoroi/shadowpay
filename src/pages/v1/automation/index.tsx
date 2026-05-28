"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import Head from "next/head";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Workflow,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
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

type Automation = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  config: any;
  active: boolean;
  runCount: number;
  lastRunAt?: string;
  createdAt: string;
};

const TRIGGERS = [
  { value: "SALE_APPROVED", label: "Venda aprovada" },
  { value: "SALE_PENDING", label: "PIX gerado (pendente)" },
  { value: "SALE_REFUNDED", label: "Venda reembolsada" },
  { value: "WITHDRAWAL_PAID", label: "Saque pago" },
  { value: "KYC_APPROVED", label: "KYC aprovado" },
] as const;

const ACTIONS = [
  { value: "SEND_WEBHOOK", label: "Disparar webhook HTTP" },
  { value: "SEND_EMAIL", label: "Enviar e-mail" },
  { value: "SEND_WHATSAPP", label: "Enviar WhatsApp" },
  { value: "DISPATCH_CAPI", label: "Disparar Conversions API" },
] as const;

function AutomationContent() {
  const { token } = useAuth();
  const [list, setList] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trigger: "SALE_APPROVED",
    action: "SEND_WEBHOOK",
    url: "",
    message: "",
  });

  async function fetchList() {
    if (!token) return;
    try {
      const r = await axios.get(`${API}/api/integrations/automations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data?.success) setList(r.data.data || []);
    } catch (e) {
      console.error("automations", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      toast.error("Dê um nome pra automação.");
      return;
    }
    setSaving(true);
    try {
      const config: any = {};
      if (form.action === "SEND_WEBHOOK" && form.url) config.url = form.url;
      if (form.action === "SEND_EMAIL" || form.action === "SEND_WHATSAPP") {
        config.message = form.message;
      }
      const r = await axios.post(
        `${API}/api/integrations/automations`,
        {
          name: form.name,
          trigger: form.trigger,
          action: form.action,
          config,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        toast.success("Automação criada!");
        setShowForm(false);
        setForm({
          name: "",
          trigger: "SALE_APPROVED",
          action: "SEND_WEBHOOK",
          url: "",
          message: "",
        });
        await fetchList();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao criar.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(a: Automation) {
    try {
      const r = await axios.post(
        `${API}/api/integrations/automations/${a.id}`,
        { active: !a.active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        setList((l) => l.map((x) => (x.id === a.id ? r.data.data : x)));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao atualizar.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta automação?")) return;
    try {
      await axios.delete(`${API}/api/integrations/automations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Automação removida.");
      setList((l) => l.filter((a) => a.id !== id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao remover.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            AVANÇADO
          </p>
          <h1
            className="text-[28px] font-bold tracking-tight text-slate-900"
            style={{ letterSpacing: "-0.005em" }}
          >
            Automações
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Quando X acontecer, faça Y automaticamente. Webhooks, e-mails,
            WhatsApp e CAPI sem código.
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
          Nova automação
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
            Criar automação
          </h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Nome
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ex: Notificar Slack quando venda aprovada"
                className="h-10 w-full rounded-lg bg-slate-50 px-3 text-[13px] outline-none"
                style={{ border: `1px solid ${T.borderSoft}` }}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Quando (gatilho)
                </label>
                <select
                  value={form.trigger}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, trigger: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg bg-slate-50 px-3 text-[13px] outline-none"
                  style={{ border: `1px solid ${T.borderSoft}` }}
                >
                  {TRIGGERS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Então (ação)
                </label>
                <select
                  value={form.action}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, action: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg bg-slate-50 px-3 text-[13px] outline-none"
                  style={{ border: `1px solid ${T.borderSoft}` }}
                >
                  {ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {form.action === "SEND_WEBHOOK" && (
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  URL do webhook
                </label>
                <input
                  value={form.url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, url: e.target.value }))
                  }
                  placeholder="https://hooks.zapier.com/..."
                  className="h-10 w-full rounded-lg bg-slate-50 px-3 font-mono text-[13px] outline-none"
                  style={{ border: `1px solid ${T.borderSoft}` }}
                />
              </div>
            )}
            {(form.action === "SEND_EMAIL" ||
              form.action === "SEND_WHATSAPP") && (
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Mensagem
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                  placeholder="Olá {customerName}, sua venda de {grossAmount} foi confirmada!"
                  rows={3}
                  className="w-full rounded-lg bg-slate-50 px-3 py-2 text-[13px] outline-none"
                  style={{ border: `1px solid ${T.borderSoft}` }}
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Use {"{customerName}"}, {"{grossAmount}"}, {"{productName}"}{" "}
                  como placeholders.
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
                background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                boxShadow: "0 6px 16px -8px rgba(124,58,237,0.45)",
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Criando…
                </>
              ) : (
                "Criar automação"
              )}
            </button>
          </div>
        </form>
      )}

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
          <Workflow
            className="mx-auto mb-3 h-10 w-10"
            style={{ color: T.textMuted }}
          />
          <p className="text-[14px] font-semibold text-slate-700">
            Nenhuma automação criada
          </p>
          <p className="mt-1 text-[12px] text-slate-500">
            Crie sua primeira automação pra economizar tempo no operacional.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a) => {
            const trigger = TRIGGERS.find((t) => t.value === a.trigger);
            const action = ACTIONS.find((x) => x.value === a.action);
            return (
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
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Workflow className="h-4 w-4 text-violet-500" />
                      <p className="truncate text-[14px] font-bold text-slate-900">
                        {a.name}
                      </p>
                      {a.active ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <XCircle className="h-3 w-3" /> Pausada
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] text-slate-600">
                      <span className="font-semibold">Quando:</span>{" "}
                      {trigger?.label || a.trigger}{" "}
                      <span className="mx-1 text-slate-400">→</span>{" "}
                      <span className="font-semibold">então:</span>{" "}
                      {action?.label || a.action}
                    </p>
                    {a.runCount > 0 && (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Zap className="h-3 w-3" />
                        Executou {a.runCount}x
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => toggleActive(a)}
                      className="inline-flex h-9 items-center rounded-lg px-3 text-[12px] font-semibold transition-colors hover:bg-slate-50"
                      style={{
                        border: `1px solid ${T.borderSoft}`,
                        color: T.text2,
                      }}
                    >
                      {a.active ? "Pausar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AutomationPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Automações</title>
      </Head>
      <LightShell>
        <AutomationContent />
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}

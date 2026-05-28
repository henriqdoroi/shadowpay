"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus,
  Lightbulb,
  MessageCircle,
  Mail,
  CheckCircle2,
  Trash2,
  Loader2,
  ChevronDown,
  X,
  Workflow,
  Smartphone,
  ArrowRight,
  Power,
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
  productId?: string | null;
  steps?: any[] | null;
  active: boolean;
  runCount: number;
  createdAt: string;
};

type WhatsAppAccount = {
  id: string;
  label?: string | null;
  phoneNumber?: string | null;
  status: "PENDING" | "CONNECTED" | "DISCONNECTED" | "EXPIRED";
  qrCode?: string | null;
  connectedAt?: string | null;
  createdAt: string;
};

const TRIGGERS = [
  { value: "SALE_PENDING", label: "Pix gerado" },
  { value: "SALE_APPROVED", label: "Compra aprovada" },
  { value: "SUBSCRIPTION_CANCELLED", label: "Assinatura cancelada" },
  { value: "REFUND_REQUESTED", label: "Reembolso solicitado" },
] as const;

const CHANNELS = [
  { value: "EMAIL", label: "E-mail" },
  { value: "WHATSAPP", label: "WhatsApp" },
] as const;

const TEMPLATES = [
  {
    key: "RECOVERY_PIX_WHATSAPP",
    title: "Recuperação Pix gerado — WhatsApp",
    description:
      "Lembre clientes que geraram um PIX e não finalizaram o pagamento via WhatsApp",
    triggerIcon: <span className="text-base">💳</span>,
    channelIcon: <MessageCircle className="h-4 w-4 text-white" />,
    channelBg: "#16A34A",
    triggerType: "SALE_PENDING",
    channel: "WHATSAPP" as const,
    defaultSteps: [
      {
        id: "step-wa-1",
        type: "SEND_WHATSAPP",
        config: {
          mediaUrl: "",
          content:
            "Olá [NOME DO CLIENTE]! 👋\n\nVi que você gerou um Pix para o *[NOME DO PRODUTO]* mas ainda não finalizou.\n\nO valor é de *[VALOR]*. Copie o código Pix abaixo e finalize o pagamento:\n\n[PIX COPIA E COLA]\n\nOu acesse o link direto: [LINK DO CHECKOUT]",
        },
      },
    ],
  },
  {
    key: "RECOVERY_PIX_EMAIL",
    title: "Recuperação Pix gerado — Email",
    description:
      "Lembre clientes que geraram um PIX e não finalizaram o pagamento via Email",
    triggerIcon: <span className="text-base">💳</span>,
    channelIcon: <Mail className="h-4 w-4 text-white" />,
    channelBg: "#7C3AED",
    triggerType: "SALE_PENDING",
    channel: "EMAIL" as const,
    defaultSteps: [
      {
        id: "step-email-1",
        type: "SEND_EMAIL",
        config: {
          from: "no-reply@shadowpay.com.br",
          subject: "Finalize sua compra - Pix pendente",
          content:
            "Olá [NOME DO CLIENTE],\n\nNotamos que você iniciou a compra do [NOME DO PRODUTO] mas ainda não finalizou o pagamento.\n\nO valor é de [VALOR] e você pode completar sua compra clicando no link abaixo:\n\n[LINK DO CHECKOUT]\n\nSe você gerou um Pix, aqui está o código para copiar e colar:\n\n[PIX COPIA E COLA]\n\nCaso tenha alguma dúvida, estamos à disposição para ajudar!\n\nAtenciosamente,\nEquipe de Suporte",
        },
      },
    ],
  },
  {
    key: "DELIVERY_AFTER_PAYMENT",
    title: "Envio de entregável",
    description:
      "Envie automaticamente os arquivos ou links de acesso após a confirmação do pagamento",
    triggerIcon: <CheckCircle2 className="h-4 w-4 text-white" />,
    triggerBg: "#16A34A",
    channelIcon: <Mail className="h-4 w-4 text-white" />,
    channelBg: "#7C3AED",
    triggerType: "SALE_APPROVED",
    channel: "EMAIL" as const,
    defaultSteps: [
      {
        id: "step-email-1",
        type: "SEND_EMAIL",
        config: {
          from: "no-reply@shadowpay.com.br",
          subject: "Sua compra foi confirmada — acesse seu produto",
          content:
            "Olá [NOME DO CLIENTE],\n\nSua compra do [NOME DO PRODUTO] foi confirmada com sucesso!\n\nAcesse seu produto pelo link abaixo:\n\n[LINK DO CHECKOUT]\n\nObrigado pela confiança!",
        },
      },
    ],
  },
];

/* ============================================================
 * Modal: Nova automação
 * ============================================================ */
function NewAutomationModal({
  onClose,
  onCreated,
  whatsappAccounts,
  token,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
  whatsappAccounts: WhatsAppAccount[];
  token: string;
}) {
  const [form, setForm] = useState({
    trigger: "SALE_PENDING",
    productId: "",
    channel: "EMAIL" as "EMAIL" | "WHATSAPP",
    whatsappAccountId: "",
  });
  const [saving, setSaving] = useState(false);

  const connected = whatsappAccounts.filter((a) => a.status === "CONNECTED");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const steps =
        form.channel === "EMAIL"
          ? [
              {
                id: "step-1",
                type: "SEND_EMAIL",
                config: {
                  from: "no-reply@shadowpay.com.br",
                  subject: "Nova mensagem da sua loja",
                  content: "Olá [NOME DO CLIENTE], ...",
                },
              },
            ]
          : [
              {
                id: "step-1",
                type: "SEND_WHATSAPP",
                config: {
                  whatsappAccountId: form.whatsappAccountId,
                  mediaUrl: "",
                  content: "Olá [NOME DO CLIENTE], ...",
                },
              },
            ];
      const r = await axios.post(
        `${API}/api/integrations/automations`,
        {
          name: "Nova automacao",
          trigger: form.trigger,
          action: "MULTI_STEP",
          config: {},
          steps,
          productId: form.productId || null,
          active: true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        toast.success("Automação criada!");
        onCreated(r.data.data.id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao criar.");
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
        style={{
          boxShadow: "0 24px 64px -20px rgba(15,23,42,0.30)",
          border: `1px solid ${T.border}`,
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-slate-900">Nova automação</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-slate-700">
              Quando…
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
            <label className="mb-1 block text-[12px] font-semibold text-slate-700">
              Produto <span className="text-slate-400">(opcional)</span>
            </label>
            <select
              value={form.productId}
              onChange={(e) =>
                setForm((f) => ({ ...f, productId: e.target.value }))
              }
              className="h-10 w-full rounded-lg bg-slate-50 px-3 text-[13px] outline-none"
              style={{ border: `1px solid ${T.borderSoft}` }}
            >
              <option value="">Todos os produtos</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-slate-700">
              Canal de mensagem
            </label>
            <select
              value={form.channel}
              onChange={(e) =>
                setForm((f) => ({ ...f, channel: e.target.value as any }))
              }
              className="h-10 w-full rounded-lg bg-slate-50 px-3 text-[13px] outline-none"
              style={{ border: `1px solid ${T.borderSoft}` }}
            >
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {form.channel === "WHATSAPP" && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[12px] font-semibold text-slate-700">
                  Conta WhatsApp
                </label>
                <Link
                  href="/v1/automation?tab=whatsapp"
                  className="text-[11px] font-semibold"
                  style={{ color: T.primary }}
                >
                  Gerenciar contas →
                </Link>
              </div>
              {connected.length === 0 ? (
                <div
                  className="flex h-20 flex-col items-center justify-center rounded-lg text-center text-[12px] text-slate-500"
                  style={{
                    background: "#F8FAFC",
                    border: `1px dashed ${T.borderSoft}`,
                  }}
                >
                  <MessageCircle className="mb-1 h-4 w-4 text-slate-400" />
                  Nenhum número conectado
                </div>
              ) : (
                <select
                  value={form.whatsappAccountId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      whatsappAccountId: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-lg bg-slate-50 px-3 text-[13px] outline-none"
                  style={{ border: `1px solid ${T.borderSoft}` }}
                  required
                >
                  <option value="">Selecione…</option>
                  {connected.map((a, i) => (
                    <option key={a.id} value={a.id}>
                      {String(i + 1).padStart(2, "0")} ·{" "}
                      {a.phoneNumber || a.label || a.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={
              saving || (form.channel === "WHATSAPP" && !form.whatsappAccountId)
            }
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50"
            style={{
              background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
              boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
            }}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Criando…
              </>
            ) : (
              <>
                Continuar para o editor
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
 * Modal: Conectar novo número WhatsApp (mostra QR code)
 * ============================================================ */
function ConnectWhatsAppModal({
  onClose,
  onConnected,
  token,
}: {
  onClose: () => void;
  onConnected: () => void;
  token: string;
}) {
  const [label, setLabel] = useState("");
  const [step, setStep] = useState<"label" | "qr" | "confirm">("label");
  const [pairingToken, setPairingToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function generateQR(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await axios.post(
        `${API}/api/integrations/whatsapp-accounts`,
        { label },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        setAccountId(r.data.data.id);
        setPairingToken(r.data.pairing?.token || r.data.data.qrCode || "");
        setStep("qr");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao gerar QR.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmConnection(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await axios.post(
        `${API}/api/integrations/whatsapp-accounts/${accountId}/confirm`,
        { phoneNumber: phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        toast.success("Conta WhatsApp conectada!");
        onConnected();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao confirmar.");
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-slate-900">
            Conectar WhatsApp
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "label" && (
          <form onSubmit={generateQR} className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Apelido (opcional)
              </label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Suporte, Vendas, Loja principal"
                className="h-10 w-full rounded-lg bg-slate-50 px-3 text-[13px] outline-none"
                style={{ border: `1px solid ${T.borderSoft}` }}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50"
              style={{
                background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
              }}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Gerar QR Code"
              )}
            </button>
          </form>
        )}

        {step === "qr" && (
          <div className="space-y-4 text-center">
            <p className="text-[13px] text-slate-600">
              Abra o WhatsApp no celular → ⋮ → <b>Aparelhos conectados</b> →{" "}
              <b>Conectar um aparelho</b> e aponte a câmera pra esse QR.
            </p>
            <div
              className="mx-auto flex h-48 w-48 items-center justify-center rounded-xl"
              style={{
                background: "#F8FAFC",
                border: `1px solid ${T.borderSoft}`,
              }}
            >
              {/* QR placeholder — quando provider real estiver plugado vira PNG */}
              <div className="text-center">
                <Smartphone className="mx-auto mb-2 h-12 w-12 text-slate-300" />
                <p className="break-all px-3 font-mono text-[9px] text-slate-400">
                  {pairingToken}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Após escanear, informe o número conectado abaixo.
            </p>
            <button
              onClick={() => setStep("confirm")}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-semibold text-white"
              style={{
                background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
              }}
            >
              Já escaneei
            </button>
          </div>
        )}

        {step === "confirm" && (
          <form onSubmit={confirmConnection} className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Número conectado (com DDD)
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="h-10 w-full rounded-lg bg-slate-50 px-3 font-mono text-[13px] outline-none"
                style={{ border: `1px solid ${T.borderSoft}` }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50"
              style={{
                background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
              }}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar conexão"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * AUTOMATIONS TAB CONTENT
 * ============================================================ */
function AutomationsTab({
  list,
  loading,
  onDelete,
  onToggle,
  onCreateFromTemplate,
}: {
  list: Automation[];
  loading: boolean;
  onDelete: (id: string) => void;
  onToggle: (a: Automation) => void;
  onCreateFromTemplate: (tpl: (typeof TEMPLATES)[number]) => void;
}) {
  return (
    <>
      {/* Ideias de automação */}
      <section className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <h2 className="text-[13px] font-semibold text-slate-700">
            Ideias de automação
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {TEMPLATES.map((tpl) => (
            <div
              key={tpl.key}
              className="rounded-2xl p-4"
              style={{
                background: "#FFFFFF",
                border: `1px solid ${T.borderSoft}`,
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{
                    background: (tpl as any).triggerBg || "#F1F5F9",
                    color: (tpl as any).triggerBg ? "#FFFFFF" : T.text2,
                  }}
                >
                  {tpl.triggerIcon}
                </span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: tpl.channelBg, color: "#FFFFFF" }}
                >
                  {tpl.channelIcon}
                </span>
              </div>
              <h3 className="text-[13px] font-bold text-slate-900">
                {tpl.title}
              </h3>
              <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-slate-500">
                {tpl.description}
              </p>
              <button
                onClick={() => onCreateFromTemplate(tpl)}
                className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                style={{ border: `1px solid ${T.borderSoft}` }}
              >
                Usar template
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Minhas automações */}
      <section>
        <h2 className="mb-3 text-[13px] font-semibold text-slate-700">
          Minhas automações
        </h2>
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
            <p className="text-[13px] text-slate-500">
              Você ainda não tem automações. Crie uma nova ou use um template
              para começar.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((a) => {
              const trigger = TRIGGERS.find((t) => t.value === a.trigger);
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-2xl p-4"
                  style={{
                    background: "#FFFFFF",
                    border: `1px solid ${T.borderSoft}`,
                    boxShadow:
                      "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
                  }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: T.primaryBg, color: T.primary }}
                  >
                    <Workflow className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/v1/automation/${a.id}`}
                      className="text-[14px] font-semibold text-slate-900 hover:underline"
                    >
                      {a.name}
                    </Link>
                    <p className="text-[11px] text-slate-500">
                      Quando: {trigger?.label || a.trigger} ·{" "}
                      {Array.isArray(a.steps) ? a.steps.length : 0} etapa(s) ·{" "}
                      {a.runCount}x execuções
                    </p>
                  </div>
                  <button
                    onClick={() => onToggle(a)}
                    className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-[11px] font-semibold transition-colors"
                    style={{
                      background: a.active
                        ? "rgba(22,163,74,0.10)"
                        : "#F1F5F9",
                      color: a.active ? "#15803D" : T.text2,
                    }}
                  >
                    <Power className="h-3 w-3" />
                    {a.active ? "Ativa" : "Pausada"}
                  </button>
                  <button
                    onClick={() => onDelete(a.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

/* ============================================================
 * WHATSAPP TAB CONTENT
 * ============================================================ */
function WhatsAppTab({
  list,
  loading,
  onConnect,
  onDelete,
}: {
  list: WhatsAppAccount[];
  loading: boolean;
  onConnect: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-slate-700">
          Contas WhatsApp conectadas
        </h2>
        <button
          onClick={onConnect}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition-colors hover:bg-slate-50"
          style={{ border: `1px solid ${T.borderSoft}`, color: T.text2 }}
        >
          <Plus className="h-3.5 w-3.5" />
          Conectar novo número
        </button>
      </div>

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
          <MessageCircle
            className="mx-auto mb-3 h-10 w-10"
            style={{ color: T.textMuted }}
          />
          <p className="text-[14px] font-semibold text-slate-700">
            Nenhum número conectado
          </p>
          <p className="mt-1 text-[12px] text-slate-500">
            Conecte um número WhatsApp pra disparar mensagens automáticas.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-2xl p-4"
              style={{
                background: "#FFFFFF",
                border: `1px solid ${T.borderSoft}`,
                boxShadow:
                  "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                style={{ background: "#16A34A" }}
              >
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {a.label || "WhatsApp"}
                  </span>
                  {a.status === "CONNECTED" ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      {a.status === "PENDING" ? "Pareando" : a.status}
                    </span>
                  )}
                </div>
                <p className="text-[12px] font-mono text-slate-500">
                  {a.phoneNumber || "—"}
                </p>
              </div>
              <button
                onClick={() => onDelete(a.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================
 * PAGE
 * ============================================================ */
function AutomationContent() {
  const { token } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"automations" | "whatsapp">(
    router.query.tab === "whatsapp" ? "whatsapp" : "automations"
  );
  const [list, setList] = useState<Automation[]>([]);
  const [whatsapp, setWhatsapp] = useState<WhatsAppAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [waLoading, setWaLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showConnectWA, setShowConnectWA] = useState(false);

  async function fetchAutomations() {
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

  async function fetchWhatsApp() {
    if (!token) return;
    try {
      const r = await axios.get(`${API}/api/integrations/whatsapp-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data?.success) setWhatsapp(r.data.data || []);
    } catch (e) {
      console.error("whatsapp", e);
    } finally {
      setWaLoading(false);
    }
  }

  useEffect(() => {
    fetchAutomations();
    fetchWhatsApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (router.query.tab === "whatsapp") setTab("whatsapp");
  }, [router.query.tab]);

  async function toggleActive(a: Automation) {
    try {
      const r = await axios.post(
        `${API}/api/integrations/automations/${a.id}`,
        { active: !a.active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        setList((l) =>
          l.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x))
        );
      }
    } catch {}
  }

  async function deleteAutomation(id: string) {
    if (!confirm("Remover esta automação?")) return;
    try {
      await axios.delete(`${API}/api/integrations/automations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Removida.");
      setList((l) => l.filter((a) => a.id !== id));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao remover.");
    }
  }

  async function deleteWhatsApp(id: string) {
    if (!confirm("Remover esta conta WhatsApp?")) return;
    try {
      await axios.delete(
        `${API}/api/integrations/whatsapp-accounts/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Conta removida.");
      setWhatsapp((l) => l.filter((a) => a.id !== id));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao remover.");
    }
  }

  async function createFromTemplate(tpl: (typeof TEMPLATES)[number]) {
    try {
      const r = await axios.post(
        `${API}/api/integrations/automations`,
        {
          name: tpl.title,
          trigger: tpl.triggerType,
          action: "MULTI_STEP",
          steps: tpl.defaultSteps,
          templateKey: tpl.key,
          active: true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        toast.success("Automação criada!");
        router.push(`/v1/automation/${r.data.data.id}`);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao criar.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.20em] text-slate-400">
            AVANÇADO
          </p>
          <h1
            className="text-[28px] font-bold tracking-tight text-slate-900"
            style={{ letterSpacing: "-0.005em" }}
          >
            Automations
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div
            className="inline-flex rounded-xl p-1"
            style={{ background: "#F1F5F9" }}
          >
            {(["automations", "whatsapp"] as const).map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors"
                  style={{
                    background: active ? T.primary : "transparent",
                    color: active ? "#FFFFFF" : T.text2,
                  }}
                >
                  {t === "automations" ? "Automações" : "Contas WhatsApp"}
                </button>
              );
            })}
          </div>
          {tab === "automations" && (
            <button
              onClick={() => setShowNew(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white"
              style={{
                background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
                boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
              }}
            >
              <Plus className="h-4 w-4" />
              Criar automação
            </button>
          )}
        </div>
      </header>

      {tab === "automations" ? (
        <AutomationsTab
          list={list}
          loading={loading}
          onDelete={deleteAutomation}
          onToggle={toggleActive}
          onCreateFromTemplate={createFromTemplate}
        />
      ) : (
        <WhatsAppTab
          list={whatsapp}
          loading={waLoading}
          onConnect={() => setShowConnectWA(true)}
          onDelete={deleteWhatsApp}
        />
      )}

      {showNew && token && (
        <NewAutomationModal
          onClose={() => setShowNew(false)}
          onCreated={(id) => {
            setShowNew(false);
            fetchAutomations();
            router.push(`/v1/automation/${id}`);
          }}
          whatsappAccounts={whatsapp}
          token={token}
        />
      )}

      {showConnectWA && token && (
        <ConnectWhatsAppModal
          onClose={() => setShowConnectWA(false)}
          onConnected={() => {
            setShowConnectWA(false);
            fetchWhatsApp();
          }}
          token={token}
        />
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

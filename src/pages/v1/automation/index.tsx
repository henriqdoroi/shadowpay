"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Plus,
  Lightbulb,
  Mail,
  CheckCircle2,
  Trash2,
  Loader2,
  X,
  Workflow,
  Smartphone,
  ArrowRight,
  Power,
  ShoppingBag,
} from "lucide-react";

/* ============================================================
 * SVG REAIS — WhatsApp e Pix oficiais (inline pra reaproveitar
 * sem criar dependência externa)
 * ============================================================ */
function WhatsAppIcon({ size = 16, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488" />
    </svg>
  );
}
function PixIcon({ size = 16, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M19.295 13.567a3.78 3.78 0 0 1-2.689-1.114l-3.85-3.85a.738.738 0 0 0-1.018 0L7.875 12.46A3.78 3.78 0 0 1 5.186 13.57H4.43L9.292 8.71c1.493-1.493 3.916-1.493 5.41 0l3.864 3.864a.736.736 0 0 0 .526.219h.752ZM4.43 10.435h.756a3.78 3.78 0 0 1 2.69 1.115l3.863-3.864c1.493-1.493 3.916-1.493 5.41 0l3.864 3.864a.736.736 0 0 0 .527.219h.752l-4.864-4.864c-1.493-1.493-3.916-1.493-5.41 0L7.155 11.65A.738.738 0 0 1 6.63 11.87H4.43Zm0 5.13h2.2c.196 0 .388.078.527.219l3.864 3.864c1.493 1.493 3.916 1.493 5.41 0l4.864-4.864h-.752a.736.736 0 0 0-.527.219l-3.864 3.864c-1.493 1.493-3.916 1.493-5.41 0L6.876 14.78a3.78 3.78 0 0 0-2.69-1.114H4.43Z" />
    </svg>
  );
}
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
    triggerIcon: <PixIcon size={16} color="#32BCAD" />,
    triggerBg: "rgba(50, 188, 173, 0.12)",
    channelIcon: <WhatsAppIcon size={16} color="#25D366" />,
    channelBg: "rgba(37, 211, 102, 0.12)",
    triggerType: "SALE_PENDING",
    channel: "WHATSAPP" as const,
    defaultSteps: [
      {
        id: "step-wa-1",
        type: "SEND_WHATSAPP",
        config: {
          mediaUrl: "",
          content:
            "Olá [NOME DO CLIENTE]!\n\nVi que você gerou um Pix para o *[NOME DO PRODUTO]* mas ainda não finalizou.\n\nO valor é de *[VALOR]*. Copie o código Pix abaixo e finalize o pagamento:\n\n[PIX COPIA E COLA]\n\nOu acesse o link direto: [LINK DO CHECKOUT]",
        },
      },
    ],
  },
  {
    key: "RECOVERY_PIX_EMAIL",
    title: "Recuperação Pix gerado — Email",
    description:
      "Lembre clientes que geraram um PIX e não finalizaram o pagamento via Email",
    triggerIcon: <PixIcon size={16} color="#32BCAD" />,
    triggerBg: "rgba(50, 188, 173, 0.12)",
    channelIcon: <Mail className="h-4 w-4" style={{ color: "#7C3AED" }} />,
    channelBg: "rgba(124, 58, 237, 0.12)",
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
    triggerIcon: <ShoppingBag className="h-4 w-4" style={{ color: "#16A34A" }} />,
    triggerBg: "rgba(22, 163, 74, 0.12)",
    channelIcon: <Mail className="h-4 w-4" style={{ color: "#7C3AED" }} />,
    channelBg: "rgba(124, 58, 237, 0.12)",
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
                  <WhatsAppIcon size={16} color="#94A3B8" />
                  <span className="mt-1">Nenhum número conectado</span>
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
  const [step, setStep] = useState<"label" | "qr">("label");
  const [qrPng, setQrPng] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");
  const [saving, setSaving] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const pollRef = useRef<any>(null);

  async function startConnection(e: React.FormEvent) {
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
        setQrPng(r.data.qrPng || null);
        setStep("qr");
        setWaiting(true);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao iniciar.");
    } finally {
      setSaving(false);
    }
  }

  // Polling status + QR
  useEffect(() => {
    if (step !== "qr" || !accountId) return;
    let stopped = false;
    async function tick() {
      try {
        const r = await axios.get(
          `${API}/api/integrations/whatsapp-accounts/${accountId}/qr`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (r.data?.success) {
          if (r.data.qrPng) setQrPng(r.data.qrPng);
          if (r.data.status === "CONNECTED") {
            stopped = true;
            setConnectedPhone(r.data.phoneNumber || "—");
            setWaiting(false);
            toast.success("WhatsApp conectado!");
            setTimeout(() => onConnected(), 1500);
            return;
          }
        }
      } catch {}
      if (!stopped) {
        pollRef.current = setTimeout(tick, 2500);
      }
    }
    tick();
    return () => {
      stopped = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, accountId]);

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
          <form onSubmit={startConnection} className="space-y-3">
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
              <p className="mt-2 text-[11px] text-slate-500">
                Você vai escanear um QR code com o app do WhatsApp pra conectar
                este número à sua conta ShadowPay.
              </p>
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
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Gerando QR…
                </>
              ) : (
                "Gerar QR Code"
              )}
            </button>
          </form>
        )}

        {step === "qr" && (
          <div className="space-y-3 text-center">
            {!connectedPhone ? (
              <>
                <p className="text-[13px] text-slate-600">
                  No celular: abra o <b>WhatsApp</b> → <b>⋮</b> →{" "}
                  <b>Aparelhos conectados</b> → <b>Conectar um aparelho</b> e
                  aponte a câmera pra esse QR.
                </p>
                <div
                  className="mx-auto flex h-64 w-64 items-center justify-center rounded-xl bg-white"
                  style={{ border: `1px solid ${T.borderSoft}` }}
                >
                  {qrPng ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={qrPng}
                      alt="QR Code WhatsApp"
                      className="h-60 w-60"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p className="text-[11px]">Gerando QR code…</p>
                    </div>
                  )}
                </div>
                {waiting && (
                  <p className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Aguardando você escanear…
                  </p>
                )}
                <p className="text-[10px] text-slate-400">
                  O QR atualiza automaticamente a cada poucos segundos. Não
                  feche essa janela.
                </p>
              </>
            ) : (
              <div className="space-y-3 py-4">
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: "rgba(22,163,74,0.12)", color: "#16A34A" }}
                >
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900">
                  Conectado!
                </h3>
                <p className="text-[13px] text-slate-600">
                  Número conectado:{" "}
                  <span className="font-mono font-semibold text-slate-900">
                    +{connectedPhone}
                  </span>
                </p>
              </div>
            )}
          </div>
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: tpl.triggerBg }}
                >
                  {tpl.triggerIcon}
                </span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: tpl.channelBg }}
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
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center">
            <WhatsAppIcon size={36} color={T.textMuted} />
          </div>
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
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(37, 211, 102, 0.12)", color: "#25D366" }}
              >
                <WhatsAppIcon size={18} color="#25D366" />
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

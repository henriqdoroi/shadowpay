"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Braces,
  Settings,
  Eye,
  Save,
  Copy,
  Plus,
  X,
  MessageCircle,
  Mail,
  Clock,
  Sparkles,
  Loader2,
  Lock,
  Maximize,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app";

const T = {
  bg: "#0B0B0F",            // canvas escuro estilo das imagens
  surface: "#15151D",
  surfaceSoft: "#1B1B25",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
  text: "#F8FAFC",
  text2: "#A1A1AA",
  textMuted: "#64748B",
  primary: "#7C3AED",
  primaryStrong: "#6D28D9",
  primaryBg: "rgba(124, 58, 237, 0.14)",
  email: "#7C3AED",
  whatsapp: "#16A34A",
  timer: "#F59E0B",
};

const TRIGGERS = [
  { value: "SALE_PENDING", label: "Pix gerado" },
  { value: "SALE_APPROVED", label: "Compra aprovada" },
  { value: "SUBSCRIPTION_CANCELLED", label: "Assinatura cancelada" },
  { value: "REFUND_REQUESTED", label: "Reembolso solicitado" },
];

const VARIABLES = [
  "[NOME DO CLIENTE]",
  "[NOME DO PRODUTO]",
  "[VALOR]",
  "[PIX COPIA E COLA]",
  "[LINK DO CHECKOUT]",
];

type Step = {
  id: string;
  type: "SEND_WHATSAPP" | "SEND_EMAIL" | "TIMER";
  config: Record<string, any>;
};

type Automation = {
  id: string;
  name: string;
  trigger: string;
  productId?: string | null;
  offerId?: string | null;
  steps: Step[];
  active: boolean;
};

type WhatsAppAccount = {
  id: string;
  label?: string | null;
  phoneNumber?: string | null;
  status: string;
};

/* ============================================================
 * EDITOR PAGE
 * ============================================================ */
function EditorContent({ id }: { id: string }) {
  const { token } = useAuth();
  const router = useRouter();
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebar, setSidebar] = useState<"none" | "vars" | "config">("none");
  const [showAddStep, setShowAddStep] = useState<{
    afterIdx: number;
  } | null>(null);
  const [whatsappAccounts, setWhatsappAccounts] = useState<WhatsAppAccount[]>(
    []
  );
  const [openStepId, setOpenStepId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      axios.get(`${API}/api/integrations/automations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios
        .get(`${API}/api/integrations/whatsapp-accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => null),
    ])
      .then(([r1, r2]) => {
        if (r1.data?.success) {
          const a = r1.data.data;
          setAutomation({
            ...a,
            steps: Array.isArray(a.steps) ? a.steps : [],
          });
          if (Array.isArray(a.steps) && a.steps.length > 0) {
            setOpenStepId(a.steps[0].id);
          }
        }
        if (r2?.data?.success) setWhatsappAccounts(r2.data.data || []);
      })
      .catch(() => toast.error("Erro ao carregar automação."))
      .finally(() => setLoading(false));
  }, [id, token]);

  async function save() {
    if (!automation || !token) return;
    setSaving(true);
    try {
      const r = await axios.post(
        `${API}/api/integrations/automations/${id}`,
        {
          name: automation.name,
          trigger: automation.trigger,
          productId: automation.productId,
          offerId: automation.offerId,
          steps: automation.steps,
          active: automation.active,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) {
        toast.success("Automação salva!");
        setAutomation((a) =>
          a ? { ...a, ...r.data.data, steps: a.steps } : a
        );
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    if (!automation) return;
    setAutomation({ ...automation, active: !automation.active });
  }

  function updateStep(idx: number, patch: Partial<Step>) {
    if (!automation) return;
    const steps = [...automation.steps];
    steps[idx] = { ...steps[idx]!, ...patch } as Step;
    setAutomation({ ...automation, steps });
  }

  function updateStepConfig(idx: number, configPatch: Record<string, any>) {
    if (!automation) return;
    const steps = [...automation.steps];
    const cur = steps[idx]!;
    steps[idx] = { ...cur, config: { ...cur.config, ...configPatch } } as Step;
    setAutomation({ ...automation, steps });
  }

  function removeStep(idx: number) {
    if (!automation) return;
    const steps = automation.steps.filter((_, i) => i !== idx);
    setAutomation({ ...automation, steps });
  }

  function addStep(afterIdx: number, type: Step["type"]) {
    if (!automation) return;
    const newStep: Step = {
      id: `step-${Date.now()}`,
      type,
      config:
        type === "SEND_WHATSAPP"
          ? { whatsappAccountId: "", mediaUrl: "", content: "" }
          : type === "SEND_EMAIL"
          ? {
              from: "no-reply@shadowpay.com.br",
              subject: "",
              content: "",
            }
          : { delayValue: 5, delayUnit: "minutes" },
    };
    const steps = [...automation.steps];
    steps.splice(afterIdx + 1, 0, newStep);
    setAutomation({ ...automation, steps });
    setShowAddStep(null);
    setOpenStepId(newStep.id);
  }

  if (loading || !automation) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: T.bg, color: T.text2 }}
      >
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const triggerLabel =
    TRIGGERS.find((t) => t.value === automation.trigger)?.label ||
    automation.trigger;

  return (
    <div
      className="relative flex h-screen flex-col"
      style={{
        background: T.bg,
        color: T.text,
        fontFamily:
          "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* TOPBAR */}
      <header
        className="flex h-14 shrink-0 items-center gap-3 px-4"
        style={{ borderBottom: `1px solid ${T.border}` }}
      >
        <Link
          href="/v1/automation"
          className="rounded-md p-1.5 hover:bg-white/5"
          style={{ color: T.text2 }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <input
          value={automation.name}
          onChange={(e) =>
            setAutomation({ ...automation, name: e.target.value })
          }
          className="flex-1 bg-transparent text-[14px] font-semibold outline-none"
          style={{ color: T.text }}
        />
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setSidebar((s) => (s === "vars" ? "none" : "vars"))
            }
            className="rounded-md p-2 hover:bg-white/5"
            style={{
              background: sidebar === "vars" ? T.primaryBg : "transparent",
              color: sidebar === "vars" ? T.primary : T.text2,
            }}
            title="Variáveis"
          >
            <Braces className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              setSidebar((s) => (s === "config" ? "none" : "config"))
            }
            className="rounded-md p-2 hover:bg-white/5"
            style={{
              background: sidebar === "config" ? T.primaryBg : "transparent",
              color: sidebar === "config" ? T.primary : T.text2,
            }}
            title="Configurações"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            className="rounded-md p-2 hover:bg-white/5"
            style={{ color: T.text2 }}
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
        <div className="mx-2 h-6 w-px" style={{ background: T.border }} />
        <button
          onClick={toggleActive}
          className="flex items-center gap-2 text-[12px] font-semibold"
        >
          <span
            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
            style={{
              background: automation.active ? T.primary : "rgba(255,255,255,0.10)",
            }}
          >
            <span
              className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              style={{
                transform: automation.active
                  ? "translateX(18px)"
                  : "translateX(2px)",
              }}
            />
          </span>
          <span style={{ color: automation.active ? T.text : T.text2 }}>
            {automation.active ? "Ativa" : "Pausada"}
          </span>
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[12px] font-semibold text-white disabled:opacity-50"
          style={{
            background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
          }}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Salvar
        </button>
      </header>

      {/* CANVAS + SIDEBAR */}
      <div className="relative flex flex-1 overflow-hidden">
        <div
          className="relative flex-1 overflow-auto"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        >
          <div className="flex min-h-full items-center px-12 py-10">
            <div className="flex flex-wrap items-start gap-3">
              {/* TRIGGER NODE */}
              <TriggerNode
                triggerLabel={triggerLabel}
                onClickAlter={() => setSidebar("config")}
              />

              {/* STEPS */}
              {automation.steps.map((step, idx) => (
                <div key={step.id} className="flex items-start">
                  <Connector />
                  <StepNode
                    step={step}
                    expanded={openStepId === step.id}
                    onClick={() =>
                      setOpenStepId((cur) => (cur === step.id ? null : step.id))
                    }
                    onClose={() => setOpenStepId(null)}
                    onChange={(patch) => updateStep(idx, patch)}
                    onChangeConfig={(cfg) => updateStepConfig(idx, cfg)}
                    onRemove={() => removeStep(idx)}
                    whatsappAccounts={whatsappAccounts}
                  />
                </div>
              ))}

              {/* ADD STEP */}
              <div className="flex items-start">
                <Connector />
                <button
                  onClick={() =>
                    setShowAddStep({ afterIdx: automation.steps.length - 1 })
                  }
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    background: T.surface,
                    border: `2px dashed ${T.borderStrong}`,
                    color: T.text2,
                  }}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Canvas zoom/lock controls — apenas visual */}
          <div className="absolute bottom-6 left-4 flex flex-col gap-1">
            {[
              { icon: Plus, key: "zoomin" },
              { icon: Minus, key: "zoomout" },
              { icon: Maximize, key: "fullscreen" },
              { icon: Lock, key: "lock" },
            ].map((b) => (
              <button
                key={b.key}
                className="flex h-8 w-8 items-center justify-center rounded-md"
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  color: T.text2,
                }}
              >
                <b.icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>

        {/* SIDEBAR DIREITA */}
        {sidebar === "vars" && (
          <VariablesPanel onClose={() => setSidebar("none")} />
        )}
        {sidebar === "config" && (
          <ConfigPanel
            automation={automation}
            whatsappAccounts={whatsappAccounts}
            onClose={() => setSidebar("none")}
            onChange={(patch) => setAutomation({ ...automation, ...patch })}
            onSave={save}
            saving={saving}
          />
        )}
      </div>

      {/* MODAL: ADICIONAR ETAPA */}
      {showAddStep && (
        <AddStepModal
          onClose={() => setShowAddStep(null)}
          onAdd={(type) => addStep(showAddStep.afterIdx, type)}
        />
      )}
    </div>
  );
}

/* ============================================================
 * TRIGGER NODE
 * ============================================================ */
function TriggerNode({
  triggerLabel,
  onClickAlter,
}: {
  triggerLabel: string;
  onClickAlter: () => void;
}) {
  return (
    <div
      className="w-[280px] rounded-2xl p-4"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4" style={{ color: T.primary }} />
        <span className="text-[13px] font-semibold">Quando…</span>
      </div>
      <div
        className="mb-3 flex items-center justify-between rounded-lg px-3 py-2"
        style={{ background: T.surfaceSoft }}
      >
        <span className="text-[13px] font-medium">{triggerLabel}</span>
        <span
          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ background: "rgba(255,255,255,0.08)", color: T.text2 }}
        >
          Demonstracao
        </span>
      </div>
      <p className="text-[12px]" style={{ color: T.text2 }}>
        Produto: <b style={{ color: T.text }}>Todos</b>
      </p>
      <p className="text-[12px]" style={{ color: T.text2 }}>
        Oferta: <b style={{ color: T.text }}>Todas</b>
      </p>
      <div
        className="mt-3 flex items-center justify-between border-t pt-3 text-[11px]"
        style={{ borderColor: T.border, color: T.text2 }}
      >
        <button onClick={onClickAlter} className="hover:underline">
          Alterar gatilho
        </button>
        <span
          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ background: "rgba(255,255,255,0.08)", color: T.text2 }}
        >
          Em breve
        </span>
      </div>
    </div>
  );
}

/* ============================================================
 * STEP NODE (renderiza WhatsApp/Email/Timer)
 * ============================================================ */
function StepNode({
  step,
  expanded,
  onClick,
  onClose,
  onChange,
  onChangeConfig,
  onRemove,
  whatsappAccounts,
}: {
  step: Step;
  expanded: boolean;
  onClick: () => void;
  onClose: () => void;
  onChange: (patch: Partial<Step>) => void;
  onChangeConfig: (cfg: Record<string, any>) => void;
  onRemove: () => void;
  whatsappAccounts: WhatsAppAccount[];
}) {
  const meta =
    step.type === "SEND_WHATSAPP"
      ? { color: T.whatsapp, icon: MessageCircle, title: "Enviar WhatsApp" }
      : step.type === "SEND_EMAIL"
      ? { color: T.email, icon: Mail, title: "Enviar e-mail" }
      : { color: T.timer, icon: Clock, title: "Temporizador" };
  const Icon = meta.icon;

  if (!expanded) {
    return (
      <button
        onClick={onClick}
        className="flex w-[240px] items-center gap-2 rounded-2xl p-4 text-left"
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          color: T.text,
        }}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
          style={{ background: meta.color }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[13px] font-semibold">{meta.title}</span>
      </button>
    );
  }

  return (
    <div
      className="w-[320px] rounded-2xl p-4"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-md text-white"
          style={{ background: meta.color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1 text-[13px] font-semibold">{meta.title}</span>
        <button
          onClick={onClose}
          className="rounded p-1 hover:bg-white/5"
          style={{ color: T.text2 }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {step.type === "SEND_WHATSAPP" && (
        <>
          <div className="mb-3 flex items-center gap-2 text-[12px]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: T.whatsapp }}
            />
            <span style={{ color: T.text2 }}>Ativo</span>
          </div>
          <div className="mb-3">
            <label
              className="mb-1 flex items-center gap-1 text-[12px]"
              style={{ color: T.text2 }}
            >
              <Plus className="h-3 w-3" />
              Link de mídia{" "}
              <span style={{ color: T.textMuted }}>(opcional)</span>
            </label>
            <input
              value={step.config.mediaUrl || ""}
              onChange={(e) => onChangeConfig({ mediaUrl: e.target.value })}
              placeholder="https://… imagem, áudio, vídeo ou arquivo"
              className="w-full rounded-md px-2 py-1.5 text-[12px] outline-none"
              style={{
                background: T.surfaceSoft,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
            />
          </div>
          <div className="mb-2">
            <label className="text-[12px]" style={{ color: T.text2 }}>
              Conta WhatsApp
            </label>
            <select
              value={step.config.whatsappAccountId || ""}
              onChange={(e) =>
                onChangeConfig({ whatsappAccountId: e.target.value })
              }
              className="mt-1 w-full rounded-md px-2 py-1.5 text-[12px] outline-none"
              style={{
                background: T.surfaceSoft,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
            >
              <option value="">Selecione…</option>
              {whatsappAccounts
                .filter((a) => a.status === "CONNECTED")
                .map((a, i) => (
                  <option key={a.id} value={a.id}>
                    {String(i + 1).padStart(2, "0")} ·{" "}
                    {a.phoneNumber || a.label || a.id.slice(0, 6)}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-[12px]" style={{ color: T.text2 }}>
              Conteúdo
            </label>
            <textarea
              value={step.config.content || ""}
              onChange={(e) => onChangeConfig({ content: e.target.value })}
              rows={8}
              className="mt-1 w-full resize-none rounded-md p-2 text-[12px] outline-none"
              style={{
                background: T.surfaceSoft,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
            />
          </div>
        </>
      )}

      {step.type === "SEND_EMAIL" && (
        <>
          <p className="mb-3 text-[12px]" style={{ color: T.text2 }}>
            Enviar de:{" "}
            <b style={{ color: T.text }}>
              {step.config.from || "no-reply@shadowpay.com.br"}
            </b>
          </p>
          <div className="mb-3">
            <label className="text-[12px]" style={{ color: T.text2 }}>
              Assunto
            </label>
            <input
              value={step.config.subject || ""}
              onChange={(e) => onChangeConfig({ subject: e.target.value })}
              className="mt-1 w-full rounded-md px-2 py-1.5 text-[12px] outline-none"
              style={{
                background: T.surfaceSoft,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
            />
          </div>
          <div>
            <label className="text-[12px]" style={{ color: T.text2 }}>
              Conteúdo
            </label>
            <textarea
              value={step.config.content || ""}
              onChange={(e) => onChangeConfig({ content: e.target.value })}
              rows={12}
              className="mt-1 w-full resize-none rounded-md p-2 text-[12px] outline-none"
              style={{
                background: T.surfaceSoft,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
            />
          </div>
        </>
      )}

      {step.type === "TIMER" && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-[12px]" style={{ color: T.text2 }}>
              Aguardar
            </label>
            <input
              type="number"
              min={1}
              value={step.config.delayValue || 5}
              onChange={(e) =>
                onChangeConfig({ delayValue: Number(e.target.value) })
              }
              className="mt-1 w-full rounded-md px-2 py-1.5 text-[12px] outline-none"
              style={{
                background: T.surfaceSoft,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
            />
          </div>
          <select
            value={step.config.delayUnit || "minutes"}
            onChange={(e) => onChangeConfig({ delayUnit: e.target.value })}
            className="rounded-md px-2 py-1.5 text-[12px] outline-none"
            style={{
              background: T.surfaceSoft,
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          >
            <option value="minutes">Minutos</option>
            <option value="hours">Horas</option>
            <option value="days">Dias</option>
          </select>
        </div>
      )}

      <button
        onClick={onRemove}
        className="mt-3 w-full rounded-md py-1.5 text-[11px]"
        style={{ color: "#FCA5A5", background: "rgba(239,68,68,0.10)" }}
      >
        Remover etapa
      </button>
    </div>
  );
}

/* ============================================================
 * CONNECTOR (linha pontilhada violeta entre nós)
 * ============================================================ */
function Connector() {
  return (
    <div className="flex h-12 items-center" style={{ marginTop: 60 }}>
      <svg width="48" height="20" viewBox="0 0 48 20" fill="none">
        <line
          x1="0"
          y1="10"
          x2="42"
          y2="10"
          stroke={T.primary}
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <polygon points="40,4 48,10 40,16" fill={T.primary} />
      </svg>
    </div>
  );
}

/* ============================================================
 * VARIABLES PANEL
 * ============================================================ */
function VariablesPanel({ onClose }: { onClose: () => void }) {
  function copy(v: string) {
    navigator.clipboard.writeText(v).then(() => toast.success("Copiado!"));
  }
  return (
    <aside
      className="flex h-full w-72 shrink-0 flex-col"
      style={{
        background: T.surface,
        borderLeft: `1px solid ${T.border}`,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${T.border}` }}
      >
        <h2 className="text-[13px] font-bold">Variáveis</h2>
        <button
          onClick={onClose}
          className="rounded p-1 hover:bg-white/5"
          style={{ color: T.text2 }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 space-y-2 p-3">
        {VARIABLES.map((v) => (
          <button
            key={v}
            onClick={() => copy(v)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12px] font-mono"
            style={{
              background: T.primaryBg,
              border: `1px solid ${T.border}`,
              color: T.primary,
            }}
          >
            {v}
            <Copy className="h-3 w-3" />
          </button>
        ))}
      </div>
    </aside>
  );
}

/* ============================================================
 * CONFIG PANEL
 * ============================================================ */
function ConfigPanel({
  automation,
  whatsappAccounts,
  onClose,
  onChange,
  onSave,
  saving,
}: {
  automation: Automation;
  whatsappAccounts: WhatsAppAccount[];
  onClose: () => void;
  onChange: (patch: Partial<Automation>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const connected = whatsappAccounts.filter((a) => a.status === "CONNECTED");
  return (
    <aside
      className="flex h-full w-72 shrink-0 flex-col"
      style={{
        background: T.surface,
        borderLeft: `1px solid ${T.border}`,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${T.border}` }}
      >
        <h2 className="text-[13px] font-bold">Configurações</h2>
        <button
          onClick={onClose}
          className="rounded p-1 hover:bg-white/5"
          style={{ color: T.text2 }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label className="mb-1 block text-[12px] font-semibold">
            Nome da automacao
          </label>
          <input
            value={automation.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full rounded-md px-2 py-2 text-[12px] outline-none"
            style={{
              background: T.surfaceSoft,
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold">
            Produto
          </label>
          <select
            value={automation.productId || ""}
            onChange={(e) =>
              onChange({ productId: e.target.value || null })
            }
            className="w-full rounded-md px-2 py-2 text-[12px] outline-none"
            style={{
              background: T.surfaceSoft,
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          >
            <option value="">Todos os produtos</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold">Oferta</label>
          <select
            value={automation.offerId || ""}
            onChange={(e) => onChange({ offerId: e.target.value || null })}
            className="w-full rounded-md px-2 py-2 text-[12px] outline-none"
            style={{
              background: T.surfaceSoft,
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          >
            <option value="">Todas as ofertas</option>
          </select>
        </div>

        <div
          className="h-px"
          style={{ background: T.border }}
        />

        <div>
          <label className="mb-1 block text-[12px] font-semibold">
            Evento de gatilho
          </label>
          <select
            value={automation.trigger}
            onChange={(e) => onChange({ trigger: e.target.value })}
            className="w-full rounded-md px-2 py-2 text-[12px] outline-none"
            style={{
              background: T.surfaceSoft,
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          >
            {TRIGGERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <p
            className="mt-1 text-[11px]"
            style={{ color: T.textMuted }}
          >
            A automacao sera disparada quando este evento ocorrer.
          </p>
        </div>

        <div
          className="h-px"
          style={{ background: T.border }}
        />

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[12px] font-semibold">Conta WhatsApp</label>
            <Link
              href="/v1/automation?tab=whatsapp"
              className="text-[11px] font-semibold"
              style={{ color: T.primary }}
            >
              Gerenciar contas →
            </Link>
          </div>
          {connected.length === 0 ? (
            <p
              className="rounded-md px-2 py-2 text-[12px]"
              style={{ background: T.surfaceSoft, color: T.text2 }}
            >
              Nenhuma conta conectada.
            </p>
          ) : (
            <select
              className="w-full rounded-md px-2 py-2 text-[12px] outline-none"
              style={{
                background: T.surfaceSoft,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
            >
              {connected.map((a, i) => (
                <option key={a.id} value={a.id}>
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: T.whatsapp }}
                  />{" "}
                  {String(i + 1).padStart(2, "0")}{" "}
                  {a.phoneNumber || a.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md text-[13px] font-semibold text-white disabled:opacity-50"
          style={{
            background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
          }}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Salvar automacao
        </button>
      </div>
    </aside>
  );
}

/* ============================================================
 * ADD STEP MODAL
 * ============================================================ */
function AddStepModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (type: Step["type"]) => void;
}) {
  const [type, setType] = useState<Step["type"]>("TIMER");
  const [open, setOpen] = useState(false);

  const options: Array<{ value: Step["type"]; label: string; icon: any; color: string }> = [
    { value: "TIMER", label: "Temporizador", icon: Clock, color: T.timer },
    { value: "SEND_WHATSAPP", label: "Enviar WhatsApp", icon: MessageCircle, color: T.whatsapp },
    { value: "SEND_EMAIL", label: "Enviar e-mail", icon: Mail, color: T.email },
  ];
  const current = options.find((o) => o.value === type)!;
  const CurrentIcon = current.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5"
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          boxShadow: "0 24px 64px -20px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[14px] font-bold">Adicionar etapa</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-white/5"
            style={{ color: T.text2 }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <label className="mb-2 block text-[12px]" style={{ color: T.text2 }}>
          Tipo de etapa
        </label>
        <div className="relative mb-4">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-[13px]"
            style={{
              background: T.surfaceSoft,
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          >
            <span className="flex items-center gap-2">
              <CurrentIcon className="h-4 w-4" style={{ color: current.color }} />
              {current.label}
            </span>
            <Plus className="h-3.5 w-3.5" style={{ color: T.text2 }} />
          </button>
          {open && (
            <div
              className="absolute left-0 top-full z-10 mt-1 w-full rounded-md p-1"
              style={{
                background: T.surface,
                border: `1px solid ${T.borderStrong}`,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              {options.map((o) => {
                const Icon = o.icon;
                return (
                  <button
                    key={o.value}
                    onClick={() => {
                      setType(o.value);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-[13px] hover:bg-white/5"
                    style={{
                      color: type === o.value ? T.primary : T.text,
                      background:
                        type === o.value ? T.primaryBg : "transparent",
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: o.color }} />
                      {o.label}
                    </span>
                    {type === o.value && (
                      <span style={{ color: T.primary }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => onAdd(type)}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md text-[13px] font-semibold text-white"
          style={{
            background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
          }}
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

export default function EditorPage() {
  const router = useRouter();
  const { id } = router.query;
  if (typeof id !== "string") return null;
  return (
    <ProtectedRoute>
      <Head>
        <title>ShadowPay — Editor de automação</title>
      </Head>
      <EditorContent id={id} />
    </ProtectedRoute>
  );
}

"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
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
  Mail,
  Clock,
  Sparkles,
  Loader2,
  Lock,
  Maximize,
  Minus,
  ShoppingBag,
  CalendarOff,
  Undo2,
  Trash2,
  ChevronDown,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app";

/* ============================================================
 * TOKENS — light theme igual o resto do gateway
 * ============================================================ */
const T = {
  bg: "#F4F5F9",            // canvas bg
  dot: "#C7CBD4",           // bullet do background dotted
  surface: "#FFFFFF",
  surfaceSoft: "#F8FAFC",
  border: "rgba(15, 23, 42, 0.08)",
  borderSoft: "rgba(15, 23, 42, 0.06)",
  borderStrong: "rgba(15, 23, 42, 0.14)",
  text: "#0F172A",
  text2: "#475569",
  textMuted: "#94A3B8",
  primary: "#7C3AED",
  primaryStrong: "#6D28D9",
  primarySoft: "rgba(124, 58, 237, 0.10)",
  whatsapp: "#25D366",
  whatsappSoft: "rgba(37, 211, 102, 0.12)",
  email: "#7C3AED",
  emailSoft: "rgba(124, 58, 237, 0.12)",
  timer: "#F59E0B",
  timerSoft: "rgba(245, 158, 11, 0.12)",
  pix: "#32BCAD",
  pixSoft: "rgba(50, 188, 173, 0.12)",
  approved: "#16A34A",
  approvedSoft: "rgba(22, 163, 74, 0.12)",
  subscription: "#6366F1",
  subscriptionSoft: "rgba(99, 102, 241, 0.12)",
  refund: "#EF4444",
  refundSoft: "rgba(239, 68, 68, 0.12)",
};

const TRIGGERS = [
  { value: "SALE_PENDING", label: "Pix gerado", color: T.pix, soft: T.pixSoft },
  { value: "SALE_APPROVED", label: "Compra aprovada", color: T.approved, soft: T.approvedSoft },
  { value: "SUBSCRIPTION_CANCELLED", label: "Assinatura cancelada", color: T.subscription, soft: T.subscriptionSoft },
  { value: "REFUND_REQUESTED", label: "Reembolso solicitado", color: T.refund, soft: T.refundSoft },
] as const;

const VARIABLES = [
  "[NOME DO CLIENTE]",
  "[NOME DO PRODUTO]",
  "[VALOR]",
  "[PIX COPIA E COLA]",
  "[LINK DO CHECKOUT]",
];

/* ============================================================
 * SVG REAIS — WhatsApp e Pix oficiais
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

/* ============================================================
 * TYPES
 * ============================================================ */
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

type FocusedField = {
  stepIdx: number;
  field: "content" | "subject" | "mediaUrl";
} | null;

/* ============================================================
 * EDITOR PAGE
 * ============================================================ */
function EditorContent({ id }: { id: string }) {
  const { token } = useAuth();
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebar, setSidebar] = useState<"none" | "vars" | "config">("none");
  const [showAddStep, setShowAddStep] = useState<{ afterIdx: number } | null>(null);
  const [whatsappAccounts, setWhatsappAccounts] = useState<WhatsAppAccount[]>([]);
  const [openStepId, setOpenStepId] = useState<string | null>(null);
  const [focused, setFocused] = useState<FocusedField>(null);

  /* ===== Canvas: zoom + pan + auto-center ===== */
  const canvasRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [centered, setCentered] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  function centerFlow(forceZoom?: number) {
    const canvas = canvasRef.current?.getBoundingClientRect();
    const flow = flowRef.current?.getBoundingClientRect();
    if (!canvas || !flow) return;
    const z = forceZoom ?? zoom;
    // largura/altura reais do flow no zoom=1
    const realW = flow.width / z;
    const realH = flow.height / z;
    const nextPanX = (canvas.width - realW * z) / 2;
    const nextPanY = (canvas.height - realH * z) / 2;
    setPan({ x: nextPanX, y: nextPanY });
  }

  useEffect(() => {
    if (!loading && !centered) {
      const t = setTimeout(() => {
        centerFlow();
        setCentered(true);
      }, 50);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, centered]);

  function zoomIn() {
    setZoom((z) => Math.min(1.8, Math.round((z + 0.1) * 10) / 10));
  }
  function zoomOut() {
    setZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 10) / 10));
  }
  function fitView() {
    setZoom(1);
    setTimeout(() => centerFlow(1), 10);
  }
  const [locked, setLocked] = useState(false);

  function onWheel(e: React.WheelEvent) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) => {
      const next = z - e.deltaY * 0.001;
      return Math.max(0.4, Math.min(1.8, Math.round(next * 100) / 100));
    });
  }

  function startPan(e: React.MouseEvent) {
    if (locked) return;
    // ignora se clicou dentro de um node (data-node)
    const target = e.target as HTMLElement;
    if (target.closest("[data-node]")) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: pan.x, baseY: pan.y };
  }
  function doPan(e: React.MouseEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy });
  }
  function endPan() {
    dragRef.current = null;
  }

  /* ===== Fetch ===== */
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

  /* ===== Mutations ===== */
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
        toast.success("Automação salva");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
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
    if (!confirm("Remover esta etapa?")) return;
    const steps = automation.steps.filter((_, i) => i !== idx);
    setAutomation({ ...automation, steps });
    setOpenStepId(null);
    setFocused(null);
    toast.success("Etapa removida.");
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
          ? { from: "no-reply@shadowpay.com.br", subject: "", content: "" }
          : { delayValue: 5, delayUnit: "minutes" },
    };
    const steps = [...automation.steps];
    steps.splice(afterIdx + 1, 0, newStep);
    setAutomation({ ...automation, steps });
    setShowAddStep(null);
    setOpenStepId(newStep.id);
  }

  function insertVariable(v: string) {
    if (!focused || !automation) {
      navigator.clipboard.writeText(v);
      toast.success("Variável copiada.");
      return;
    }
    const step = automation.steps[focused.stepIdx];
    if (!step) return;
    const cur = (step.config as any)[focused.field] || "";
    updateStepConfig(focused.stepIdx, { [focused.field]: cur + v });
    toast.success("Variável inserida.");
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

  const trigger = TRIGGERS.find((t) => t.value === automation.trigger) || TRIGGERS[0];

  return (
    <div
      className="relative flex h-screen flex-col"
      style={{
        background: T.bg,
        color: T.text,
        fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* TOPBAR */}
      <header
        className="flex h-14 shrink-0 items-center gap-3 px-4"
        style={{
          background: "#FFFFFF",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <Link
          href="/v1/automation"
          className="rounded-md p-1.5 hover:bg-slate-100"
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
            onClick={() => setSidebar((s) => (s === "vars" ? "none" : "vars"))}
            className="rounded-md p-2 hover:bg-slate-100"
            style={{
              background: sidebar === "vars" ? T.primarySoft : "transparent",
              color: sidebar === "vars" ? T.primary : T.text2,
            }}
            title="Variáveis"
          >
            <Braces className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSidebar((s) => (s === "config" ? "none" : "config"))}
            className="rounded-md p-2 hover:bg-slate-100"
            style={{
              background: sidebar === "config" ? T.primarySoft : "transparent",
              color: sidebar === "config" ? T.primary : T.text2,
            }}
            title="Configurações"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            className="rounded-md p-2 hover:bg-slate-100"
            style={{ color: T.text2 }}
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
        <div className="mx-2 h-6 w-px" style={{ background: T.border }} />
        <button
          onClick={() => setAutomation({ ...automation, active: !automation.active })}
          className="flex items-center gap-2 text-[12px] font-semibold"
        >
          <span
            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
            style={{ background: automation.active ? T.primary : "#E2E8F0" }}
          >
            <span
              className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
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
            boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
          }}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Salvar
        </button>
      </header>

      {/* CANVAS + SIDEBAR */}
      <div className="relative flex flex-1 overflow-hidden">
        <div
          ref={canvasRef}
          className="relative flex-1 overflow-hidden"
          onWheel={onWheel}
          onMouseDown={startPan}
          onMouseMove={doPan}
          onMouseUp={endPan}
          onMouseLeave={endPan}
          style={{
            backgroundImage: `radial-gradient(${T.dot} 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
            cursor: dragRef.current ? "grabbing" : locked ? "default" : "grab",
          }}
        >
          {/* Flow */}
          <div
            ref={flowRef}
            className="absolute left-0 top-0 inline-flex items-start"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              transition: dragRef.current ? "none" : "transform 0.15s ease-out",
            }}
          >
            <TriggerNode
              automation={automation}
              trigger={trigger}
              onClickAlter={() => setSidebar("config")}
            />

            {automation.steps.map((step, idx) => (
              <div key={step.id} data-node className="flex items-start">
                <Connector />
                <StepNode
                  step={step}
                  stepIdx={idx}
                  expanded={openStepId === step.id}
                  onClick={() =>
                    setOpenStepId((cur) => (cur === step.id ? null : step.id))
                  }
                  onClose={() => setOpenStepId(null)}
                  onChange={(patch) => updateStep(idx, patch)}
                  onChangeConfig={(cfg) => updateStepConfig(idx, cfg)}
                  onRemove={() => removeStep(idx)}
                  whatsappAccounts={whatsappAccounts}
                  onFieldFocus={setFocused}
                />
              </div>
            ))}

            <div data-node className="flex items-start">
              <Connector />
              <button
                onClick={() =>
                  setShowAddStep({ afterIdx: automation.steps.length - 1 })
                }
                className="flex h-12 w-12 items-center justify-center rounded-full transition-all hover:scale-110"
                style={{
                  background: T.surface,
                  border: `2px dashed ${T.borderStrong}`,
                  color: T.primary,
                  marginTop: 60,
                }}
                title="Adicionar etapa"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Canvas controls — bottom left */}
          <div className="absolute bottom-6 left-4 flex flex-col gap-1.5">
            {[
              { icon: Plus, action: zoomIn, title: "Aproximar" },
              { icon: Minus, action: zoomOut, title: "Afastar" },
              { icon: Maximize, action: fitView, title: "Centralizar" },
              {
                icon: Lock,
                action: () => setLocked((l) => !l),
                title: locked ? "Destravar" : "Travar canvas",
                active: locked,
              },
            ].map((b, i) => {
              const Ic = b.icon;
              return (
                <button
                  key={i}
                  onClick={b.action}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-slate-50"
                  style={{
                    background: (b as any).active ? T.primarySoft : T.surface,
                    border: `1px solid ${T.border}`,
                    color: (b as any).active ? T.primary : T.text2,
                    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                  }}
                  title={b.title}
                >
                  <Ic className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>

          {/* Zoom indicator */}
          <div
            className="absolute bottom-6 right-6 rounded-lg px-3 py-1.5 text-[11px] font-mono font-bold"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              color: T.text2,
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            }}
          >
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* SIDEBAR DIREITA */}
        {sidebar === "vars" && (
          <VariablesPanel
            onClose={() => setSidebar("none")}
            onInsert={insertVariable}
            hasFocused={!!focused}
          />
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
 * TRIGGER NODE — agora com SVG real do gatilho
 * ============================================================ */
function TriggerNode({
  automation,
  trigger,
  onClickAlter,
}: {
  automation: Automation;
  trigger: (typeof TRIGGERS)[number];
  onClickAlter: () => void;
}) {
  const TriggerSvg = ({ color }: { color: string }) => {
    if (trigger.value === "SALE_PENDING") return <PixIcon size={14} color={color} />;
    if (trigger.value === "SALE_APPROVED")
      return <ShoppingBag className="h-3.5 w-3.5" style={{ color }} />;
    if (trigger.value === "SUBSCRIPTION_CANCELLED")
      return <CalendarOff className="h-3.5 w-3.5" style={{ color }} />;
    return <Undo2 className="h-3.5 w-3.5" style={{ color }} />;
  };

  return (
    <div
      data-node
      className="w-[300px] rounded-2xl p-4"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.08)",
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: T.primarySoft, color: T.primary }}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span className="text-[13px] font-bold" style={{ color: T.text }}>
          Quando…
        </span>
      </div>
      <div
        className="mb-3 flex items-center justify-between rounded-lg px-3 py-2.5"
        style={{
          background: trigger.soft,
          border: `1px solid ${trigger.color}33`,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{ background: trigger.color + "22" }}
          >
            <TriggerSvg color={trigger.color} />
          </span>
          <span className="text-[13px] font-semibold" style={{ color: T.text }}>
            {trigger.label}
          </span>
        </div>
      </div>
      <p className="text-[12px]" style={{ color: T.text2 }}>
        Produto:{" "}
        <b style={{ color: T.text }}>
          {automation.productId || "Todos"}
        </b>
      </p>
      <p className="text-[12px]" style={{ color: T.text2 }}>
        Oferta:{" "}
        <b style={{ color: T.text }}>
          {automation.offerId || "Todas"}
        </b>
      </p>
      <div
        className="mt-3 flex items-center justify-between border-t pt-3 text-[11px]"
        style={{ borderColor: T.borderSoft, color: T.text2 }}
      >
        <button
          onClick={onClickAlter}
          className="font-semibold hover:underline"
          style={{ color: T.primary }}
        >
          Alterar gatilho
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * STEP NODE
 * ============================================================ */
function StepNode({
  step,
  stepIdx,
  expanded,
  onClick,
  onClose,
  onChangeConfig,
  onRemove,
  whatsappAccounts,
  onFieldFocus,
}: {
  step: Step;
  stepIdx: number;
  expanded: boolean;
  onClick: () => void;
  onClose: () => void;
  onChange: (patch: Partial<Step>) => void;
  onChangeConfig: (cfg: Record<string, any>) => void;
  onRemove: () => void;
  whatsappAccounts: WhatsAppAccount[];
  onFieldFocus: (f: FocusedField) => void;
}) {
  const meta =
    step.type === "SEND_WHATSAPP"
      ? {
          color: T.whatsapp,
          soft: T.whatsappSoft,
          title: "Enviar WhatsApp",
          renderIcon: (size: number) => <WhatsAppIcon size={size} />,
        }
      : step.type === "SEND_EMAIL"
      ? {
          color: T.email,
          soft: T.emailSoft,
          title: "Enviar e-mail",
          renderIcon: (size: number) => <Mail style={{ width: size, height: size }} />,
        }
      : {
          color: T.timer,
          soft: T.timerSoft,
          title: "Temporizador",
          renderIcon: (size: number) => <Clock style={{ width: size, height: size }} />,
        };

  if (!expanded) {
    return (
      <button
        data-node
        onClick={onClick}
        className="flex w-[240px] items-center gap-2.5 rounded-2xl p-3.5 text-left transition-all hover:-translate-y-0.5"
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          color: T.text,
          boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px -4px rgba(15,23,42,0.06)",
        }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
          style={{ background: meta.soft, color: meta.color }}
        >
          {meta.renderIcon(18)}
        </span>
        <span className="text-[13px] font-bold">{meta.title}</span>
      </button>
    );
  }

  return (
    <div
      data-node
      className="w-[340px] rounded-2xl p-4"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -12px rgba(15,23,42,0.14)",
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: meta.soft, color: meta.color }}
        >
          {meta.renderIcon(16)}
        </span>
        <span className="flex-1 text-[13px] font-bold" style={{ color: T.text }}>
          {meta.title}
        </span>
        <button
          onClick={onRemove}
          className="rounded p-1.5 transition-colors hover:bg-rose-50"
          style={{ color: "#EF4444" }}
          title="Remover etapa"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onClose}
          className="rounded p-1.5 hover:bg-slate-100"
          style={{ color: T.text2 }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {step.type === "SEND_WHATSAPP" && (
        <>
          <div
            className="mb-3 flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px]"
            style={{ background: T.whatsappSoft }}
          >
            <span
              className="relative flex h-2 w-2"
              style={{ background: T.whatsapp, borderRadius: 999 }}
            />
            <span style={{ color: "#15803D", fontWeight: 600 }}>Ativo</span>
          </div>

          <div className="mb-3">
            <label
              className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: T.text2 }}
            >
              Link de mídia{" "}
              <span style={{ color: T.textMuted, textTransform: "none" }}>
                (opcional)
              </span>
            </label>
            <input
              value={step.config.mediaUrl || ""}
              onChange={(e) => onChangeConfig({ mediaUrl: e.target.value })}
              onFocus={() => onFieldFocus({ stepIdx, field: "mediaUrl" })}
              placeholder="https://… imagem, áudio, vídeo ou arquivo"
              className="w-full rounded-md px-2.5 py-2 text-[12px] outline-none focus:border-violet-400"
              style={{
                background: T.surfaceSoft,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
            />
          </div>

          <div className="mb-3">
            <label
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: T.text2 }}
            >
              Conta WhatsApp
            </label>
            <select
              value={step.config.whatsappAccountId || ""}
              onChange={(e) =>
                onChangeConfig({ whatsappAccountId: e.target.value })
              }
              className="w-full rounded-md px-2.5 py-2 text-[12px] outline-none"
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
            <label
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: T.text2 }}
            >
              Conteúdo
            </label>
            <textarea
              value={step.config.content || ""}
              onChange={(e) => onChangeConfig({ content: e.target.value })}
              onFocus={() => onFieldFocus({ stepIdx, field: "content" })}
              rows={9}
              className="w-full resize-none rounded-md p-2.5 text-[12px] outline-none focus:border-violet-400"
              style={{
                background: T.surfaceSoft,
                border: `1px solid ${T.border}`,
                color: T.text,
                lineHeight: 1.5,
              }}
              placeholder="Olá [NOME DO CLIENTE]! ..."
            />
          </div>
        </>
      )}

      {step.type === "SEND_EMAIL" && (
        <>
          <p
            className="mb-3 flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px]"
            style={{ background: T.emailSoft, color: T.email }}
          >
            <span style={{ color: T.text2 }}>Enviar de:</span>
            <b>{step.config.from || "no-reply@shadowpay.com.br"}</b>
          </p>
          <div className="mb-3">
            <label
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: T.text2 }}
            >
              Assunto
            </label>
            <input
              value={step.config.subject || ""}
              onChange={(e) => onChangeConfig({ subject: e.target.value })}
              onFocus={() => onFieldFocus({ stepIdx, field: "subject" })}
              className="w-full rounded-md px-2.5 py-2 text-[12px] outline-none focus:border-violet-400"
              style={{
                background: T.surfaceSoft,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
              placeholder="Assunto do e-mail"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: T.text2 }}
            >
              Conteúdo
            </label>
            <textarea
              value={step.config.content || ""}
              onChange={(e) => onChangeConfig({ content: e.target.value })}
              onFocus={() => onFieldFocus({ stepIdx, field: "content" })}
              rows={12}
              className="w-full resize-none rounded-md p-2.5 text-[12px] outline-none focus:border-violet-400"
              style={{
                background: T.surfaceSoft,
                border: `1px solid ${T.border}`,
                color: T.text,
                lineHeight: 1.5,
              }}
              placeholder="Olá [NOME DO CLIENTE], ..."
            />
          </div>
        </>
      )}

      {step.type === "TIMER" && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: T.text2 }}
            >
              Aguardar
            </label>
            <input
              type="number"
              min={1}
              value={step.config.delayValue || 5}
              onChange={(e) =>
                onChangeConfig({ delayValue: Number(e.target.value) })
              }
              className="w-full rounded-md px-2.5 py-2 text-[12px] outline-none focus:border-violet-400"
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
            className="rounded-md px-2.5 py-2 text-[12px] outline-none"
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
    </div>
  );
}

/* ============================================================
 * CONNECTOR — seta violeta tracejada
 * ============================================================ */
function Connector() {
  return (
    <div className="flex items-center" style={{ height: 56, marginTop: 60 }}>
      <svg width="56" height="20" viewBox="0 0 56 20" fill="none">
        <defs>
          <linearGradient id="conn-grad" x1="0" y1="0" x2="56" y2="0">
            <stop offset="0%" stopColor={T.primary} stopOpacity="0.4" />
            <stop offset="100%" stopColor={T.primary} stopOpacity="1" />
          </linearGradient>
        </defs>
        <line
          x1="0"
          y1="10"
          x2="50"
          y2="10"
          stroke="url(#conn-grad)"
          strokeWidth="2"
          strokeDasharray="5 3"
          strokeLinecap="round"
        />
        <polygon points="48,4 56,10 48,16" fill={T.primary} />
      </svg>
    </div>
  );
}

/* ============================================================
 * VARIABLES PANEL — clique insere no campo focado
 * ============================================================ */
function VariablesPanel({
  onClose,
  onInsert,
  hasFocused,
}: {
  onClose: () => void;
  onInsert: (v: string) => void;
  hasFocused: boolean;
}) {
  return (
    <aside
      className="flex h-full w-72 shrink-0 flex-col"
      style={{
        background: T.surface,
        borderLeft: `1px solid ${T.border}`,
        boxShadow: "-12px 0 32px -16px rgba(15,23,42,0.10)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${T.borderSoft}` }}
      >
        <h2 className="text-[14px] font-bold" style={{ color: T.text }}>
          Variáveis
        </h2>
        <button
          onClick={onClose}
          className="rounded p-1 hover:bg-slate-100"
          style={{ color: T.text2 }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 space-y-2 p-3">
        <p
          className="mb-3 rounded-md px-3 py-2 text-[11px]"
          style={{
            background: T.surfaceSoft,
            color: T.text2,
            border: `1px solid ${T.borderSoft}`,
          }}
        >
          {hasFocused
            ? "Clique pra inserir no campo selecionado."
            : "Foque num campo de texto e clique pra inserir, ou clique pra copiar."}
        </p>
        {VARIABLES.map((v) => (
          <button
            key={v}
            onClick={() => onInsert(v)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[12px] font-mono font-bold transition-colors hover:opacity-80"
            style={{
              background: T.primarySoft,
              border: `1px solid ${T.primary}33`,
              color: T.primary,
            }}
          >
            {v}
            {hasFocused ? <Plus className="h-3.5 w-3.5" /> : <Copy className="h-3 w-3" />}
          </button>
        ))}
      </div>
    </aside>
  );
}

/* ============================================================
 * CONFIG PANEL — todos os gatilhos
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
      className="flex h-full w-80 shrink-0 flex-col"
      style={{
        background: T.surface,
        borderLeft: `1px solid ${T.border}`,
        boxShadow: "-12px 0 32px -16px rgba(15,23,42,0.10)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${T.borderSoft}` }}
      >
        <h2 className="text-[14px] font-bold" style={{ color: T.text }}>
          Configurações
        </h2>
        <button
          onClick={onClose}
          className="rounded p-1 hover:bg-slate-100"
          style={{ color: T.text2 }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: T.text2 }}
          >
            Nome da automação
          </label>
          <input
            value={automation.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full rounded-md px-2.5 py-2 text-[12px] outline-none focus:border-violet-400"
            style={{
              background: T.surfaceSoft,
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          />
        </div>

        <div>
          <label
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: T.text2 }}
          >
            Produto
          </label>
          <select
            value={automation.productId || ""}
            onChange={(e) => onChange({ productId: e.target.value || null })}
            className="w-full rounded-md px-2.5 py-2 text-[12px] outline-none"
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
          <label
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: T.text2 }}
          >
            Oferta
          </label>
          <select
            value={automation.offerId || ""}
            onChange={(e) => onChange({ offerId: e.target.value || null })}
            className="w-full rounded-md px-2.5 py-2 text-[12px] outline-none"
            style={{
              background: T.surfaceSoft,
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          >
            <option value="">Todas as ofertas</option>
          </select>
        </div>

        <div className="h-px" style={{ background: T.borderSoft }} />

        <div>
          <label
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: T.text2 }}
          >
            Evento de gatilho
          </label>
          <select
            value={automation.trigger}
            onChange={(e) => onChange({ trigger: e.target.value })}
            className="w-full rounded-md px-2.5 py-2 text-[12px] outline-none focus:border-violet-400"
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
            A automação será disparada quando este evento ocorrer.
          </p>
        </div>

        <div className="h-px" style={{ background: T.borderSoft }} />

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: T.text2 }}
            >
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
            <p
              className="rounded-md px-2.5 py-2 text-[12px]"
              style={{
                background: T.surfaceSoft,
                border: `1px solid ${T.borderSoft}`,
                color: T.text2,
              }}
            >
              Nenhuma conta conectada.
            </p>
          ) : (
            <select
              className="w-full rounded-md px-2.5 py-2 text-[12px] outline-none"
              style={{
                background: T.surfaceSoft,
                border: `1px solid ${T.border}`,
                color: T.text,
              }}
            >
              {connected.map((a, i) => (
                <option key={a.id} value={a.id}>
                  {String(i + 1).padStart(2, "0")} ·{" "}
                  {a.phoneNumber || a.label || a.id.slice(0, 6)}
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
            boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
          }}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Salvar automação
        </button>
      </div>
    </aside>
  );
}

/* ============================================================
 * ADD STEP MODAL — light theme
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

  const options: Array<{
    value: Step["type"];
    label: string;
    icon: any;
    color: string;
    soft: string;
  }> = [
    { value: "TIMER", label: "Temporizador", icon: Clock, color: T.timer, soft: T.timerSoft },
    {
      value: "SEND_WHATSAPP",
      label: "Enviar WhatsApp",
      icon: WhatsAppIcon,
      color: T.whatsapp,
      soft: T.whatsappSoft,
    },
    { value: "SEND_EMAIL", label: "Enviar e-mail", icon: Mail, color: T.email, soft: T.emailSoft },
  ];
  const current = options.find((o) => o.value === type)!;

  function renderIcon(opt: (typeof options)[number], size = 14) {
    if (opt.value === "SEND_WHATSAPP")
      return <WhatsAppIcon size={size} color={opt.color} />;
    const Ic = opt.icon as any;
    return <Ic style={{ width: size, height: size, color: opt.color }} />;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15, 23, 42, 0.50)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5"
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          boxShadow: "0 24px 64px -20px rgba(15,23,42,0.30)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-bold" style={{ color: T.text }}>
            Adicionar etapa
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-slate-100"
            style={{ color: T.text2 }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <label
          className="mb-2 block text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: T.text2 }}
        >
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
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md"
                style={{ background: current.soft }}
              >
                {renderIcon(current)}
              </span>
              {current.label}
            </span>
            <ChevronDown
              className="h-3.5 w-3.5 transition-transform"
              style={{
                color: T.text2,
                transform: open ? "rotate(180deg)" : "none",
              }}
            />
          </button>
          {open && (
            <div
              className="absolute left-0 top-full z-10 mt-1 w-full rounded-md p-1"
              style={{
                background: T.surface,
                border: `1px solid ${T.borderStrong}`,
                boxShadow: "0 12px 32px -8px rgba(15,23,42,0.20)",
              }}
            >
              {options.map((o) => (
                <button
                  key={o.value}
                  onClick={() => {
                    setType(o.value);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-[13px] hover:bg-slate-50"
                  style={{
                    color: type === o.value ? T.primary : T.text,
                    background: type === o.value ? T.primarySoft : "transparent",
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-md"
                      style={{ background: o.soft }}
                    >
                      {renderIcon(o)}
                    </span>
                    {o.label}
                  </span>
                  {type === o.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onAdd(type)}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md text-[13px] font-semibold text-white"
          style={{
            background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
            boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
          }}
        >
          <Plus className="h-3.5 w-3.5" />
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

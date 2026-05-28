"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import ShadowPanel from "@/components/ShadowPanel";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
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
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const API = "https://shadowpay-api-production.up.railway.app";

/* ============================================================
 * TOKENS — light theme
 * ============================================================ */
const T = {
  bg: "#F4F5F9",
  dot: "#C7CBD4",
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
  {
    value: "SUBSCRIPTION_CANCELLED",
    label: "Assinatura cancelada",
    color: T.subscription,
    soft: T.subscriptionSoft,
  },
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
 * SVG REAIS — WhatsApp e Pix
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
type StepType = "SEND_WHATSAPP" | "SEND_EMAIL" | "TIMER";

type StepConfig = Record<string, any>;

type AutomationFlow = {
  nodes: Node[];
  edges: Edge[];
};

type Automation = {
  id: string;
  name: string;
  trigger: string;
  productId?: string | null;
  offerId?: string | null;
  steps: any;
  active: boolean;
};

type WhatsAppAccount = {
  id: string;
  label?: string | null;
  phoneNumber?: string | null;
  status: string;
};

type FocusedField = { stepId: string; field: string } | null;

/* ============================================================
 * Confirm modal customizado (substitui o confirm() do browser)
 * ============================================================ */
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Remover",
  cancelLabel = "Cancelar",
  destructive = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(15,23,42,0.55)" }}
      onClick={onCancel}
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
        <div className="mb-3 flex items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: destructive ? "rgba(239,68,68,0.12)" : T.primarySoft,
              color: destructive ? "#EF4444" : T.primary,
            }}
          >
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <h3 className="text-[14px] font-bold" style={{ color: T.text }}>
              {title}
            </h3>
            <p className="mt-1 text-[12.5px]" style={{ color: T.text2 }}>
              {message}
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="inline-flex h-9 items-center rounded-lg px-4 text-[12px] font-semibold hover:bg-slate-50"
            style={{ border: `1px solid ${T.border}`, color: T.text2 }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex h-9 items-center rounded-lg px-4 text-[12px] font-semibold text-white"
            style={{
              background: destructive
                ? "linear-gradient(120deg, #EF4444, #DC2626)"
                : `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
              boxShadow: destructive
                ? "0 6px 16px -8px rgba(239,68,68,0.40)"
                : "0 6px 16px -8px rgba(124,58,237,0.45)",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * EDGE customizada — bezier suave violeta + arrow + delete on click
 * ============================================================ */
function FlowEdge(props: any) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const { setEdges } = useReactFlow();
  const [hover, setHover] = useState(false);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={props.markerEnd}
        style={{
          stroke: T.primary,
          strokeWidth: 2,
          strokeDasharray: "5 4",
          opacity: hover ? 1 : 0.85,
          cursor: "pointer",
        }}
      />
      {/* hitbox transparente mais largo pra facilitar o click */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: "pointer" }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      />
      {hover && (
        <EdgeLabelRenderer>
          <button
            onClick={() => setEdges((eds) => eds.filter((e) => e.id !== id))}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              background: "#EF4444",
              color: "#FFFFFF",
              border: "2px solid #FFFFFF",
              borderRadius: 999,
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.20)",
            }}
            title="Desconectar"
          >
            <X size={12} strokeWidth={3} />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

/* ============================================================
 * Custom Handles — pontas pra plugar/desplugar
 * ============================================================ */
function HandleDot({ type, position }: { type: "source" | "target"; position: Position }) {
  return (
    <Handle
      type={type}
      position={position}
      style={{
        width: 12,
        height: 12,
        background: T.primary,
        border: `2px solid ${T.surface}`,
        boxShadow: "0 0 0 1px " + T.primary,
      }}
    />
  );
}

/* ============================================================
 * TRIGGER NODE (react-flow custom)
 * ============================================================ */
function TriggerNode({ data }: any) {
  const trigger =
    TRIGGERS.find((t) => t.value === data.trigger) || TRIGGERS[0];
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
      className="w-[300px] rounded-2xl p-4"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.08)",
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
        className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2.5"
        style={{
          background: trigger.soft,
          border: `1px solid ${trigger.color}33`,
        }}
      >
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
      <p className="text-[12px]" style={{ color: T.text2 }}>
        Produto: <b style={{ color: T.text }}>{data.productId || "Todos"}</b>
      </p>
      <p className="text-[12px]" style={{ color: T.text2 }}>
        Oferta: <b style={{ color: T.text }}>{data.offerId || "Todas"}</b>
      </p>
      <div
        className="mt-3 flex items-center justify-between border-t pt-3 text-[11px]"
        style={{ borderColor: T.borderSoft, color: T.text2 }}
      >
        <button
          onClick={data.onClickAlter}
          className="font-semibold hover:underline"
          style={{ color: T.primary }}
        >
          Alterar gatilho
        </button>
      </div>
      <HandleDot type="source" position={Position.Right} />
    </div>
  );
}

/* ============================================================
 * STEP NODE
 * ============================================================ */
function StepCardNode({ data }: any) {
  const stepType: StepType = data.stepType;
  const meta =
    stepType === "SEND_WHATSAPP"
      ? {
          color: T.whatsapp,
          soft: T.whatsappSoft,
          title: "Enviar WhatsApp",
          renderIcon: (size: number) => <WhatsAppIcon size={size} color={T.whatsapp} />,
        }
      : stepType === "SEND_EMAIL"
      ? {
          color: T.email,
          soft: T.emailSoft,
          title: "Enviar e-mail",
          renderIcon: (size: number) => <Mail style={{ width: size, height: size, color: T.email }} />,
        }
      : {
          color: T.timer,
          soft: T.timerSoft,
          title: "Temporizador",
          renderIcon: (size: number) => <Clock style={{ width: size, height: size, color: T.timer }} />,
        };

  const expanded = data.expanded;

  if (!expanded) {
    return (
      <>
        <HandleDot type="target" position={Position.Left} />
        <button
          onClick={data.onClick}
          className="flex w-[240px] items-center gap-2.5 rounded-2xl p-3.5 text-left transition-all hover:-translate-y-0.5"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            color: T.text,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px -4px rgba(15,23,42,0.06)",
          }}
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: meta.soft }}
          >
            {meta.renderIcon(18)}
          </span>
          <span className="text-[13px] font-bold">{meta.title}</span>
        </button>
        <HandleDot type="source" position={Position.Right} />
      </>
    );
  }

  return (
    <>
      <HandleDot type="target" position={Position.Left} />
      <div
        className="w-[340px] rounded-2xl p-4"
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          boxShadow:
            "0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -12px rgba(15,23,42,0.14)",
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: meta.soft }}
          >
            {meta.renderIcon(16)}
          </span>
          <span className="flex-1 text-[13px] font-bold" style={{ color: T.text }}>
            {meta.title}
          </span>
          <button
            onClick={data.onRequestRemove}
            className="rounded p-1.5 hover:bg-rose-50"
            style={{ color: "#EF4444" }}
            title="Remover etapa"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={data.onClose}
            className="rounded p-1.5 hover:bg-slate-100"
            style={{ color: T.text2 }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {stepType === "SEND_WHATSAPP" && (
          <WhatsAppForm
            config={data.config}
            onChange={data.onChangeConfig}
            whatsappAccounts={data.whatsappAccounts}
            onFieldFocus={(field: string) => data.onFieldFocus({ stepId: data.stepId, field })}
          />
        )}
        {stepType === "SEND_EMAIL" && (
          <EmailForm
            config={data.config}
            onChange={data.onChangeConfig}
            onFieldFocus={(field: string) => data.onFieldFocus({ stepId: data.stepId, field })}
          />
        )}
        {stepType === "TIMER" && (
          <TimerForm config={data.config} onChange={data.onChangeConfig} />
        )}
      </div>
      <HandleDot type="source" position={Position.Right} />
    </>
  );
}

/* ============================================================
 * Sub-forms
 * ============================================================ */
function WhatsAppForm({
  config,
  onChange,
  whatsappAccounts,
  onFieldFocus,
}: {
  config: StepConfig;
  onChange: (cfg: StepConfig) => void;
  whatsappAccounts: WhatsAppAccount[];
  onFieldFocus: (field: string) => void;
}) {
  const inputStyle: React.CSSProperties = {
    background: T.surfaceSoft,
    border: `1px solid ${T.border}`,
    color: T.text,
  };
  return (
    <>
      <div
        className="mb-3 flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px]"
        style={{ background: T.whatsappSoft }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: T.whatsapp }}
        />
        <span style={{ color: "#15803D", fontWeight: 600 }}>Ativo</span>
      </div>
      <div className="mb-3">
        <label
          className="mb-1 block text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: T.text2 }}
        >
          Link de mídia <span style={{ color: T.textMuted, textTransform: "none" }}>(opcional)</span>
        </label>
        <input
          value={config.mediaUrl || ""}
          onChange={(e) => onChange({ ...config, mediaUrl: e.target.value })}
          onFocus={() => onFieldFocus("mediaUrl")}
          placeholder="https://… imagem, áudio, vídeo ou arquivo"
          className="w-full rounded-md px-2.5 py-2 text-[12px] outline-none"
          style={inputStyle}
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
          value={config.whatsappAccountId || ""}
          onChange={(e) => onChange({ ...config, whatsappAccountId: e.target.value })}
          className="w-full rounded-md px-2.5 py-2 text-[12px] outline-none"
          style={inputStyle}
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
          value={config.content || ""}
          onChange={(e) => onChange({ ...config, content: e.target.value })}
          onFocus={() => onFieldFocus("content")}
          rows={9}
          className="w-full resize-none rounded-md p-2.5 text-[12px] outline-none nodrag"
          style={{ ...inputStyle, lineHeight: 1.5 }}
          placeholder="Olá [NOME DO CLIENTE]! ..."
        />
      </div>
    </>
  );
}

function EmailForm({
  config,
  onChange,
  onFieldFocus,
}: {
  config: StepConfig;
  onChange: (cfg: StepConfig) => void;
  onFieldFocus: (field: string) => void;
}) {
  const inputStyle: React.CSSProperties = {
    background: T.surfaceSoft,
    border: `1px solid ${T.border}`,
    color: T.text,
  };
  return (
    <>
      <p
        className="mb-3 flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px]"
        style={{ background: T.emailSoft, color: T.email }}
      >
        <span style={{ color: T.text2 }}>Enviar de:</span>
        <b>{config.from || "no-reply@shadowpay.com.br"}</b>
      </p>
      <div className="mb-3">
        <label
          className="mb-1 block text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: T.text2 }}
        >
          Assunto
        </label>
        <input
          value={config.subject || ""}
          onChange={(e) => onChange({ ...config, subject: e.target.value })}
          onFocus={() => onFieldFocus("subject")}
          className="w-full rounded-md px-2.5 py-2 text-[12px] outline-none"
          style={inputStyle}
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
          value={config.content || ""}
          onChange={(e) => onChange({ ...config, content: e.target.value })}
          onFocus={() => onFieldFocus("content")}
          rows={12}
          className="w-full resize-none rounded-md p-2.5 text-[12px] outline-none nodrag"
          style={{ ...inputStyle, lineHeight: 1.5 }}
          placeholder="Olá [NOME DO CLIENTE], ..."
        />
      </div>
    </>
  );
}

function TimerForm({
  config,
  onChange,
}: {
  config: StepConfig;
  onChange: (cfg: StepConfig) => void;
}) {
  const inputStyle: React.CSSProperties = {
    background: T.surfaceSoft,
    border: `1px solid ${T.border}`,
    color: T.text,
  };
  return (
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
          value={config.delayValue || 5}
          onChange={(e) => onChange({ ...config, delayValue: Number(e.target.value) })}
          className="w-full rounded-md px-2.5 py-2 text-[12px] outline-none"
          style={inputStyle}
        />
      </div>
      <select
        value={config.delayUnit || "minutes"}
        onChange={(e) => onChange({ ...config, delayUnit: e.target.value })}
        className="rounded-md px-2.5 py-2 text-[12px] outline-none"
        style={inputStyle}
      >
        <option value="minutes">Minutos</option>
        <option value="hours">Horas</option>
        <option value="days">Dias</option>
      </select>
    </div>
  );
}

/* ============================================================
 * Sidebars
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
            : "Foque num campo e clique pra inserir."}
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
  const inputStyle: React.CSSProperties = {
    background: T.surfaceSoft,
    border: `1px solid ${T.border}`,
    color: T.text,
  };
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
        <button onClick={onClose} className="rounded p-1 hover:bg-slate-100" style={{ color: T.text2 }}>
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
            className="w-full rounded-md px-2.5 py-2 text-[12px] outline-none"
            style={inputStyle}
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
            style={inputStyle}
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
            style={inputStyle}
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
            className="w-full rounded-md px-2.5 py-2 text-[12px] outline-none"
            style={inputStyle}
          >
            {TRIGGERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px]" style={{ color: T.textMuted }}>
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
              style={inputStyle}
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
 * PREVIEW PANEL — Dados da automação (clica no olho)
 * ============================================================ */
function PreviewPanel({
  automation,
  onClose,
}: {
  automation: Automation;
  onClose: () => void;
}) {
  const trigger = TRIGGERS.find((t) => t.value === automation.trigger);
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
          Dados da automação
        </h2>
        <button
          onClick={onClose}
          className="rounded p-1 hover:bg-slate-100"
          style={{ color: T.text2 }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Nome + trigger */}
        <div className="mb-5">
          <h3 className="text-[15px] font-bold" style={{ color: T.text }}>
            {automation.name}
          </h3>
          {trigger && (
            <span
              className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: trigger.soft,
                border: `1px solid ${trigger.color}33`,
                color: T.text,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: trigger.color }}
              />
              {trigger.label}
            </span>
          )}
        </div>

        <div className="h-px" style={{ background: T.borderSoft }} />

        {/* Conexão */}
        <div className="my-4">
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: T.text2 }}
          >
            Conexão
          </p>
          <div
            className="flex items-center gap-3 rounded-xl p-3"
            style={{
              background: T.surfaceSoft,
              border: `1px solid ${T.borderSoft}`,
            }}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: T.emailSoft, color: T.email }}
            >
              <Mail className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="text-[13px] font-semibold"
                style={{ color: T.text }}
              >
                SMTP conectado
              </p>
              <p
                className="truncate text-[11px] font-mono"
                style={{ color: T.text2 }}
              >
                no-reply@shadowpay.com.br
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: T.primarySoft, color: T.primary }}
            >
              Ativo
            </span>
          </div>
        </div>

        <div className="h-px" style={{ background: T.borderSoft }} />

        {/* Desempenho */}
        <div className="mt-4">
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: T.text2 }}
          >
            Desempenho
          </p>
          {automation.active ? (
            <div className="space-y-2">
              {[
                { label: "Disparos", value: "—" },
                { label: "Entregues", value: "—" },
                { label: "Aberturas", value: "—" },
                { label: "Conversões", value: "—" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="flex items-center justify-between rounded-md px-3 py-2"
                  style={{
                    background: T.surfaceSoft,
                    border: `1px solid ${T.borderSoft}`,
                  }}
                >
                  <span className="text-[12px]" style={{ color: T.text2 }}>
                    {m.label}
                  </span>
                  <span
                    className="font-mono text-[13px] font-bold"
                    style={{ color: T.text }}
                  >
                    {m.value}
                  </span>
                </div>
              ))}
              <p
                className="mt-2 text-[11px]"
                style={{ color: T.textMuted }}
              >
                Métricas vão aparecer assim que a automação for executada.
              </p>
            </div>
          ) : (
            <p
              className="text-[12.5px] leading-relaxed"
              style={{ color: T.text2 }}
            >
              Salve a automação para ver os dados de desempenho.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ============================================================
 * Add Step Modal
 * ============================================================ */
function AddStepModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (type: StepType) => void;
}) {
  const [type, setType] = useState<StepType>("TIMER");
  const [open, setOpen] = useState(false);

  const options: Array<{
    value: StepType;
    label: string;
    color: string;
    soft: string;
    renderIcon: (size: number) => React.ReactNode;
  }> = [
    {
      value: "TIMER",
      label: "Temporizador",
      color: T.timer,
      soft: T.timerSoft,
      renderIcon: (s) => <Clock style={{ width: s, height: s, color: T.timer }} />,
    },
    {
      value: "SEND_WHATSAPP",
      label: "Enviar WhatsApp",
      color: T.whatsapp,
      soft: T.whatsappSoft,
      renderIcon: (s) => <WhatsAppIcon size={s} color={T.whatsapp} />,
    },
    {
      value: "SEND_EMAIL",
      label: "Enviar e-mail",
      color: T.email,
      soft: T.emailSoft,
      renderIcon: (s) => <Mail style={{ width: s, height: s, color: T.email }} />,
    },
  ];
  const current = options.find((o) => o.value === type)!;

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
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100" style={{ color: T.text2 }}>
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
                {current.renderIcon(14)}
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
                      {o.renderIcon(14)}
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

/* ============================================================
 * FLOW <-> Automation persistence helpers
 * ============================================================ */
function flowFromSteps(stepsRaw: any): AutomationFlow {
  // Novo formato: { nodes, edges }
  if (stepsRaw && typeof stepsRaw === "object" && !Array.isArray(stepsRaw)) {
    if (Array.isArray(stepsRaw.nodes) && Array.isArray(stepsRaw.edges)) {
      return { nodes: stepsRaw.nodes, edges: stepsRaw.edges };
    }
  }
  // Legado: array linear
  const arr = Array.isArray(stepsRaw) ? stepsRaw : [];
  const nodes: Node[] = [
    {
      id: "trigger",
      type: "trigger",
      position: { x: 0, y: 0 },
      data: {},
      deletable: false,
    },
    ...arr.map((s: any, i: number) => ({
      id: s.id || `step-${i}`,
      type: "step",
      position: { x: 380 * (i + 1), y: 0 },
      data: {
        stepType: s.type,
        stepId: s.id || `step-${i}`,
        config: s.config || {},
      },
    })),
  ];
  const edges: Edge[] = [];
  if (arr.length > 0) {
    edges.push({
      id: "e-trigger-0",
      source: "trigger",
      target: arr[0].id || "step-0",
      type: "flow",
    });
    for (let i = 0; i < arr.length - 1; i++) {
      edges.push({
        id: `e-${i}-${i + 1}`,
        source: arr[i].id || `step-${i}`,
        target: arr[i + 1].id || `step-${i + 1}`,
        type: "flow",
      });
    }
  }
  return { nodes, edges };
}

function flowToSteps(nodes: Node[], edges: Edge[]) {
  // Limpa data callbacks pra não persistir funções
  const cleanNodes = nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: {
      stepType: (n.data as any)?.stepType,
      stepId: (n.data as any)?.stepId,
      config: (n.data as any)?.config,
    },
  }));
  const cleanEdges = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type,
  }));
  return { nodes: cleanNodes, edges: cleanEdges };
}

/* ============================================================
 * EDITOR — wrapper com ReactFlowProvider
 * ============================================================ */
function FlowEditor({ id }: { id: string }) {
  const { token } = useAuth();
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebar, setSidebar] = useState<"none" | "vars" | "config" | "preview">("none");
  const [showAddStep, setShowAddStep] = useState(false);
  const [whatsappAccounts, setWhatsappAccounts] = useState<WhatsAppAccount[]>([]);
  const [openStepId, setOpenStepId] = useState<string | null>(null);
  const [focused, setFocused] = useState<FocusedField>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    onYes: () => void;
  } | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const rf = useReactFlow();

  /* ===== fetch ===== */
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
          setAutomation({ ...a });
          const flow = flowFromSteps(a.steps);
          setNodes(flow.nodes);
          setEdges(flow.edges.map((e) => ({ ...e, type: "flow" })));
        }
        if (r2?.data?.success) setWhatsappAccounts(r2.data.data || []);
      })
      .catch(() => toast.error("Erro ao carregar automação."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  /* ===== Build node data com callbacks ===== */
  const enrichedNodes = useMemo(() => {
    return nodes.map((n) => {
      if (n.type === "trigger") {
        return {
          ...n,
          data: {
            ...n.data,
            trigger: automation?.trigger,
            productId: automation?.productId,
            offerId: automation?.offerId,
            onClickAlter: () => setSidebar("config"),
          },
        };
      }
      const stepId = (n.data as any)?.stepId || n.id;
      const expanded = openStepId === stepId;
      return {
        ...n,
        data: {
          ...n.data,
          expanded,
          whatsappAccounts,
          onClick: () => setOpenStepId((c) => (c === stepId ? null : stepId)),
          onClose: () => setOpenStepId(null),
          onChangeConfig: (cfg: StepConfig) => {
            setNodes((nds) =>
              nds.map((x) =>
                x.id === n.id ? { ...x, data: { ...x.data, config: cfg } } : x
              )
            );
          },
          onRequestRemove: () => {
            setConfirm({
              title: "Remover esta etapa?",
              message:
                "Essa ação remove a etapa do fluxo. As conexões adjacentes serão desfeitas.",
              onYes: () => {
                setNodes((nds) => nds.filter((x) => x.id !== n.id));
                setEdges((eds) =>
                  eds.filter((e) => e.source !== n.id && e.target !== n.id)
                );
                if (openStepId === stepId) setOpenStepId(null);
                if (focused?.stepId === stepId) setFocused(null);
                setConfirm(null);
                toast.success("Etapa removida.");
              },
            });
          },
          onFieldFocus: setFocused,
        },
      };
    });
  }, [
    nodes,
    automation,
    openStepId,
    whatsappAccounts,
    focused?.stepId,
    setNodes,
    setEdges,
  ]);

  /* ===== Connect ===== */
  const onConnect = useCallback(
    (params: Connection) => {
      // só uma edge a partir de cada source pra manter linearidade visual
      setEdges((eds) =>
        addEdge(
          { ...params, type: "flow", id: `e-${params.source}-${params.target}` },
          eds.filter((e) => e.source !== params.source)
        )
      );
    },
    [setEdges]
  );

  /* ===== Add step ===== */
  function addStep(type: StepType) {
    const id = `step-${Date.now()}`;
    const lastX = Math.max(0, ...nodes.map((n) => n.position.x));
    const newNode: Node = {
      id,
      type: "step",
      position: { x: lastX + 380, y: 0 },
      data: {
        stepId: id,
        stepType: type,
        config:
          type === "SEND_WHATSAPP"
            ? { whatsappAccountId: "", mediaUrl: "", content: "" }
            : type === "SEND_EMAIL"
            ? { from: "no-reply@shadowpay.com.br", subject: "", content: "" }
            : { delayValue: 5, delayUnit: "minutes" },
      },
    };
    setNodes((nds) => [...nds, newNode]);
    // conecta automaticamente ao último node se não houver edge a partir dele
    const lastNode = [...nodes].sort((a, b) => b.position.x - a.position.x)[0];
    if (lastNode) {
      const hasEdge = edges.some((e) => e.source === lastNode.id);
      if (!hasEdge) {
        setEdges((eds) => [
          ...eds,
          {
            id: `e-${lastNode.id}-${id}`,
            source: lastNode.id,
            target: id,
            type: "flow",
          },
        ]);
      }
    }
    setOpenStepId(id);
    setShowAddStep(false);
  }

  /* ===== Save ===== */
  async function save() {
    if (!automation || !token) return;
    setSaving(true);
    try {
      const flow = flowToSteps(nodes, edges);
      const r = await axios.post(
        `${API}/api/integrations/automations/${id}`,
        {
          name: automation.name,
          trigger: automation.trigger,
          productId: automation.productId,
          offerId: automation.offerId,
          steps: flow,
          active: automation.active,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data?.success) toast.success("Automação salva");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  /* ===== Variable insert ===== */
  function insertVariable(v: string) {
    if (!focused) {
      navigator.clipboard.writeText(v);
      toast.success("Variável copiada.");
      return;
    }
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === focused.stepId || (n.data as any)?.stepId === focused.stepId) {
          const cfg = (n.data as any).config || {};
          const cur = cfg[focused.field] || "";
          return {
            ...n,
            data: { ...n.data, config: { ...cfg, [focused.field]: cur + v } },
          };
        }
        return n;
      })
    );
    toast.success("Variável inserida.");
  }

  const nodeTypes = useMemo(
    () => ({ trigger: TriggerNode as any, step: StepCardNode as any }),
    []
  );
  const edgeTypes = useMemo(() => ({ flow: FlowEdge as any }), []);

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

  return (
    <div
      className="relative flex flex-col"
      style={{
        background: T.bg,
        color: T.text,
        fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
        // -8 = -32px (anula o padding-x do main do LightShell em md+)
        // -mt-8 = anula py-8; -mb-24 = compensa pb-24 do mobile / -mb-8 desktop
        marginLeft: "-2rem",
        marginRight: "-2rem",
        marginTop: "-2rem",
        marginBottom: "-2rem",
        height: "calc(100vh - 64px)", // 64px = topbar fixa do LightShell
        overflow: "hidden",
        borderRadius: 0,
      }}
    >
      {/* TOPBAR DO EDITOR */}
      <header
        className="flex h-14 shrink-0 items-center gap-3 px-4"
        style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}
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
          onChange={(e) => setAutomation({ ...automation, name: e.target.value })}
          className="flex-1 bg-transparent text-[14px] font-semibold outline-none"
          style={{ color: T.text }}
        />
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
          onClick={() => setSidebar((s) => (s === "preview" ? "none" : "preview"))}
          className="rounded-md p-2 hover:bg-slate-100"
          style={{
            background: sidebar === "preview" ? T.primarySoft : "transparent",
            color: sidebar === "preview" ? T.primary : T.text2,
          }}
          title="Dados da automação"
        >
          <Eye className="h-4 w-4" />
        </button>
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
              style={{ transform: automation.active ? "translateX(18px)" : "translateX(2px)" }}
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

      {/* CANVAS */}
      <div className="relative flex flex-1 overflow-hidden">
        <div className="relative flex-1">
          <ReactFlow
            nodes={enrichedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{
              type: "flow",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: T.primary,
                width: 22,
                height: 22,
              },
            }}
            connectionLineStyle={{
              stroke: T.primary,
              strokeWidth: 2,
              strokeDasharray: "5 4",
            }}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            style={{ background: T.bg }}
          >
            <Background variant={"dots" as any} color={T.dot} gap={20} size={1.2} />
          </ReactFlow>

          {/* Botão adicionar etapa flutuante */}
          <button
            onClick={() => setShowAddStep(true)}
            className="absolute right-6 top-6 z-10 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[12px] font-semibold text-white"
            style={{
              background: `linear-gradient(120deg, ${T.primary}, ${T.primaryStrong})`,
              boxShadow: "0 8px 20px -8px rgba(124,58,237,0.45)",
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar etapa
          </button>

          {/* Controles canvas (canto inferior esquerdo) */}
          <div className="absolute bottom-6 left-4 z-10 flex flex-col gap-1.5">
            {[
              { icon: Plus, action: () => rf.zoomIn(), title: "Aproximar" },
              { icon: Minus, action: () => rf.zoomOut(), title: "Afastar" },
              { icon: Maximize, action: () => rf.fitView({ padding: 0.2 }), title: "Centralizar" },
            ].map((b, i) => {
              const Ic = b.icon;
              return (
                <button
                  key={i}
                  onClick={b.action}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-slate-50"
                  style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    color: T.text2,
                    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                  }}
                  title={b.title}
                >
                  <Ic className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* SIDEBARS */}
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
        {sidebar === "preview" && (
          <PreviewPanel
            automation={automation}
            onClose={() => setSidebar("none")}
          />
        )}
      </div>

      {/* MODALS */}
      {showAddStep && (
        <AddStepModal onClose={() => setShowAddStep(false)} onAdd={addStep} />
      )}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        onConfirm={() => confirm?.onYes?.()}
        onCancel={() => setConfirm(null)}
      />
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
      <LightShell>
        <ReactFlowProvider>
          <FlowEditor id={id} />
        </ReactFlowProvider>
      </LightShell>
      <ShadowPanel />
    </ProtectedRoute>
  );
}

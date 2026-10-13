"use client";

/**
 * PushEnableCard — ativar e acompanhar as notificações push deste aparelho
 * (Android, iPhone e computador). A lógica fica em src/lib/push.ts; aqui é só
 * a tela. `PushSetupView` é a parte visual (sem estado) de cada situação.
 */
import {
  AlertTriangle,
  BellOff,
  BellRing,
  Check,
  Loader2,
  Monitor,
  PlusSquare,
  RefreshCw,
  Send,
  Share,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePush } from "@/hooks/usePush";
import type { PushDeviceInfo, PushPlatform, PushState } from "@/lib/push";

const T = {
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  primarySoft: "rgba(124,58,237,0.08)",
  green: "#10B981",
  greenSoft: "rgba(16,185,129,0.10)",
  amber: "#F59E0B",
  amberSoft: "rgba(245,158,11,0.10)",
  rose: "#F43F5E",
  roseSoft: "rgba(244,63,94,0.08)",
  border: "rgba(15,23,42,0.08)",
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "há 1 dia" : `há ${d} dias`;
}

/** Prévia de como a notificação aparece no celular. */
function NotificationPreview() {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl p-3"
      style={{
        background: "rgba(255,255,255,0.85)",
        border: `1px solid ${T.border}`,
        boxShadow: "0 12px 32px -16px rgba(15,23,42,0.35)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/pwa/icon-192.png" alt="" className="h-9 w-9 shrink-0 rounded-[10px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">ShadowPay</p>
          <p className="text-[11px] text-slate-400">agora</p>
        </div>
        <p className="mt-0.5 text-[13px] font-bold text-slate-900">🟢 Venda aprovada!</p>
        <p className="text-[12.5px] leading-snug text-slate-600">Você recebeu R$ 197,00 de Maria · Curso Completo</p>
      </div>
    </div>
  );
}

function Step({ n, icon, children }: { n: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
        style={{ background: T.primary }}
      >
        {n}
      </span>
      <span className="flex-1 text-[13px] text-slate-700">{children}</span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: T.primarySoft, color: T.primary }}>
        {icon}
      </span>
    </li>
  );
}

export function DeviceRow({ d, isThis }: { d: PushDeviceInfo; isThis: boolean }) {
  const Icon = d.platform === "desktop" ? Monitor : Smartphone;
  const failing = !!d.lastError && !d.lastSuccessAt;
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "#F1F5F9", color: "#475569" }}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-[13px] font-semibold text-slate-800">
          {d.label}
          {isThis && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: T.primarySoft, color: T.primary }}>
              este aparelho
            </span>
          )}
        </p>
        <p className="truncate text-[11.5px]" style={{ color: !d.enabled || failing ? "#B45309" : "#64748B" }}>
          {!d.enabled
            ? "Pausado — abra o app neste aparelho para reativar"
            : d.lastSuccessAt
              ? `Última notificação entregue ${timeAgo(d.lastSuccessAt)}`
              : failing
                ? "Não está recebendo — desative e ative de novo neste aparelho"
                : `Ativado ${timeAgo(d.createdAt)} · aguardando a primeira notificação`}
        </p>
      </div>
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: !d.enabled || failing ? T.amber : T.green }}
        aria-hidden="true"
      />
    </li>
  );
}

export function deniedHelp(platform: PushPlatform): string {
  if (platform === "ios") return "Abra Ajustes → Notificações → ShadowPay e ative “Permitir Notificações”.";
  if (platform === "android")
    return "Toque e segure o ícone da ShadowPay → Informações do app → Notificações → Permitir. No navegador: toque no cadeado ao lado do endereço → Permissões → Notificações.";
  return "Clique no cadeado ao lado do endereço do site → Notificações → Permitir.";
}

export type PushSetupViewProps = {
  state: PushState;
  platform: PushPlatform;
  busy: null | "enable" | "test" | "disable";
  devices: PushDeviceInfo[] | null;
  thisHint: string | null;
  onEnable: () => void;
  onTest: () => void;
  onDisable: () => void;
  onRefresh: () => void;
  /** Layout empilhado (ex.: dentro do painel do sino), independente da tela. */
  compact?: boolean;
  /** Sem moldura própria (quando já está dentro de outro cartão). */
  bare?: boolean;
};

export function PushSetupView(p: PushSetupViewProps) {
  const card = p.bare ? "" : p.compact ? "rounded-2xl bg-white p-4" : "rounded-2xl bg-white p-5";
  const cardStyle = p.bare ? {} : { border: `1px solid ${T.border}` };

  if (p.state === "checking") {
    return (
      <div className={card} style={cardStyle}>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (p.state === "ios-install") {
    return (
      <div className={card} style={cardStyle}>
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})` }}>
            <Smartphone className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[15px] font-bold text-slate-900">Instale o app para receber no iPhone</p>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              O iPhone só envia notificações para apps instalados na Tela de Início. Leva 10 segundos:
            </p>
          </div>
        </div>
        <ol className="space-y-3">
          <Step n={1} icon={<Share className="h-4 w-4" />}>
            Toque em <b>Compartilhar</b> na barra do Safari
          </Step>
          <Step n={2} icon={<PlusSquare className="h-4 w-4" />}>
            Escolha <b>“Adicionar à Tela de Início”</b>
          </Step>
          <Step
            n={3}
            icon={
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/pwa/icon-192.png" alt="" className="h-6 w-6 rounded-md" />
            }
          >
            Abra a <b>ShadowPay pelo ícone</b> e volte aqui para ativar
          </Step>
        </ol>
        <p className="mt-4 text-[11.5px] text-slate-400">Precisa do iOS 16.4 ou mais novo.</p>
      </div>
    );
  }

  if (p.state === "ios-outdated" || p.state === "unsupported") {
    const ios = p.state === "ios-outdated";
    return (
      <div className={card} style={cardStyle}>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "#F1F5F9", color: "#64748B" }}>
            <BellOff className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[15px] font-bold text-slate-900">
              {ios ? "Atualize o iPhone para receber notificações" : "Este navegador não recebe notificações"}
            </p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">
              {ios
                ? "Notificações de apps instalados precisam do iOS 16.4 ou mais novo: Ajustes → Geral → Atualização de Software."
                : "No Android, use o Chrome. No iPhone, instale o app (Compartilhar → “Adicionar à Tela de Início”) e abra pelo ícone. No computador, Chrome, Edge ou Firefox."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (p.state === "denied") {
    return (
      <div className={card} style={p.bare ? undefined : { ...cardStyle, background: "linear-gradient(180deg, #FFF 0%, #FFF7F8 100%)" }}>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: T.roseSoft, color: T.rose }}>
            <BellOff className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-bold text-slate-900">Notificações bloqueadas neste aparelho</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">{deniedHelp(p.platform)}</p>
            <button
              onClick={p.onRefresh}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[12.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              style={{ border: `1px solid ${T.border}` }}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Já liberei
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (p.state === "prompt") {
    return (
      <div
        className={p.bare ? "" : `overflow-hidden rounded-2xl ${p.compact ? "p-4" : "p-5"}`}
        style={p.bare ? undefined : { ...cardStyle, background: "radial-gradient(120% 140% at 100% 0%, rgba(124,58,237,0.10) 0%, #FFFFFF 55%)" }}
      >
        <div className={p.compact ? "grid gap-4" : "grid items-center gap-5 sm:grid-cols-[1fr_280px]"}>
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`, boxShadow: "0 10px 24px -10px rgba(124,58,237,0.7)" }}>
              <BellRing className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[17px] font-bold tracking-[-0.01em] text-slate-900">Receba suas vendas no celular</p>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
              Avisamos na hora quando um PIX é gerado e quando ele é pago — mesmo com o app fechado.
            </p>
            <button
              onClick={p.onEnable}
              disabled={p.busy === "enable"}
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[13.5px] font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: T.primary, boxShadow: "0 10px 24px -10px rgba(124,58,237,0.65)" }}
            >
              {p.busy === "enable" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
              {p.busy === "enable" ? "Ativando…" : "Ativar notificações"}
            </button>
          </div>
          <NotificationPreview />
        </div>
      </div>
    );
  }

  // enabled
  const devices = p.devices || [];
  return (
    <div className={card} style={cardStyle}>
      <div className={p.compact ? "flex flex-col gap-3" : "flex flex-col gap-4 sm:flex-row sm:items-center"}>
        <div className="flex flex-1 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: T.greenSoft, color: T.green }}>
            <Check className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[15px] font-bold text-slate-900">Notificações ativas neste aparelho</p>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              Você recebe aviso de PIX gerado, venda aprovada e saque pago — conforme as opções abaixo.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={p.onTest}
            disabled={!!p.busy}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[12.5px] font-bold text-white disabled:opacity-60"
            style={{ background: T.primary }}
          >
            {p.busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {p.busy === "test" ? "Enviando…" : "Enviar teste"}
          </button>
          <button
            onClick={p.onDisable}
            disabled={!!p.busy}
            className="inline-flex h-10 items-center rounded-xl px-3 text-[12.5px] font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-60"
          >
            {p.busy === "disable" ? "Desativando…" : "Desativar"}
          </button>
        </div>
      </div>

      {p.platform === "ios" && (
        <p className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-[11.5px] text-slate-600" style={{ background: T.amberSoft }}>
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: T.amber }} />
          No iPhone, com o app aberto na tela o aviso pode ir direto para a Central de Notificações. Bloqueie a tela para ver o teste chegar.
        </p>
      )}

      <div className="mt-4 border-t pt-3" style={{ borderColor: T.border }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Aparelhos que recebem suas vendas {devices.length ? `(${devices.length})` : ""}
        </p>
        {p.devices === null ? (
          <div className="mt-3 h-10 animate-pulse rounded-xl bg-slate-50" />
        ) : devices.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-slate-500">Registrando este aparelho…</p>
        ) : (
          <ul className="divide-y" style={{ borderColor: T.border }}>
            {devices.map((d) => (
              <DeviceRow key={d.id} d={d} isThis={!!p.thisHint && d.endpointHint === p.thisHint} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function PushEnableCard({ compact = false, bare = false }: { compact?: boolean; bare?: boolean } = {}) {
  const { token } = useAuth();
  const push = usePush(token);

  return (
    <div className={compact || bare ? "" : "mb-5"}>
      <PushSetupView
        compact={compact}
        bare={bare}
        state={push.state}
        platform={push.platform}
        busy={push.busy}
        devices={push.devices}
        thisHint={push.thisHint}
        onRefresh={() => push.refresh()}
        onEnable={() => {
          // chamado direto no toque: o pedido de permissão sai na hora
          push.enable().then((r) => (r.ok ? toast.success(r.message) : toast.error(r.message, { duration: 8000 })));
        }}
        onTest={async () => {
          const r = await push.test();
          if (r.ok) toast.success(r.message, { duration: 7000 });
          else toast.error(r.message, { duration: 9000 });
        }}
        onDisable={async () => {
          const r = await push.disable();
          toast.success(r.message);
        }}
      />
    </div>
  );
}

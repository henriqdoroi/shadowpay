"use client";

/**
 * PushPromptBanner — convite no dashboard pra ativar as notificações neste
 * aparelho. Aparece quando ainda não está ativo: pra ativar na hora, pra
 * instalar o app (iPhone) ou pra liberar (bloqueado). Some por 7 dias se o
 * seller fechar. "Ver como" abre o painel do sino com o passo a passo.
 */
import { useEffect, useState } from "react";
import { BellOff, BellRing, Loader2, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { enablePush, getPushState, prefetchVapidKey, type PushState } from "@/lib/push";
import { openNotificationsPanel } from "@/components/NotificationsBell";

const DISMISS_KEY = "sp_push_banner_dismissed_at";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

const COPY: Partial<Record<PushState, { title: string; text: string }>> = {
  prompt: { title: "Receba suas vendas no celular", text: "Aviso na hora de PIX gerado e de venda aprovada." },
  "ios-install": { title: "Instale o app e receba suas vendas", text: "No iPhone, as notificações chegam pelo app na Tela de Início." },
  denied: { title: "Notificações bloqueadas neste aparelho", text: "Libere nas configurações pra receber suas vendas na hora." },
};

export function PushPromptBanner({ token }: { token: string | null }) {
  const [state, setState] = useState<PushState>("checking");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    try {
      if (Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < DISMISS_MS) return;
    } catch {
      /* ignora */
    }
    getPushState().then((s) => {
      if (!alive) return;
      setState(s);
      if (COPY[s]) {
        setVisible(true);
        if (s === "prompt") prefetchVapidKey();
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const copy = COPY[state];
  if (!visible || !token || !copy) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignora */
    }
    setVisible(false);
  };

  const activate = () => {
    setBusy(true);
    // chamado direto no toque: o pedido de permissão sai na hora
    enablePush(token).then(async (r) => {
      setBusy(false);
      if (r.ok) toast.success(r.message);
      else toast.error(r.message, { duration: 8000 });
      const s = await getPushState();
      setState(s);
      if (!COPY[s]) setVisible(false);
    });
  };

  const Icon = state === "ios-install" ? Smartphone : state === "denied" ? BellOff : BellRing;
  return (
    <div
      className="mb-6 flex items-center gap-3 rounded-xl p-3.5 sm:p-4"
      style={{ background: "#F6F6F8" }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700"
        style={{ border: "1px solid #E5E7EB" }}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-slate-900">{copy.title}</p>
        <p className="text-[13px] leading-snug text-slate-500">{copy.text}</p>
      </div>
      {state === "prompt" ? (
        <button
          onClick={activate}
          disabled={busy}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#6C0DE0] disabled:opacity-60"
          style={{ background: "#8A1EF7" }}
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {busy ? "Ativando…" : "Ativar"}
        </button>
      ) : (
        <button
          onClick={openNotificationsPanel}
          className="inline-flex h-9 shrink-0 items-center rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] font-medium text-slate-800 transition-colors hover:bg-slate-50"
        >
          Ver como
        </button>
      )}
      <button
        onClick={dismiss}
        aria-label="Fechar"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

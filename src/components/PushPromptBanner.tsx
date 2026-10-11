"use client";

/**
 * PushPromptBanner — convite compacto no dashboard pra ativar as notificações
 * neste aparelho. Só aparece quando dá pra ativar (ou no iPhone sem o app
 * instalado, com o caminho pra instalar). Some por 7 dias se o seller fechar.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, Loader2, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { enablePush, getPushState, prefetchVapidKey, type PushState } from "@/lib/push";

const DISMISS_KEY = "sp_push_banner_dismissed_at";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

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
      if (s === "prompt" || s === "ios-install") {
        setVisible(true);
        prefetchVapidKey();
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!visible || !token) return null;

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
      if (s !== "prompt") setVisible(false);
    });
  };

  const ios = state === "ios-install";
  return (
    <div
      className="mb-6 flex items-center gap-3 rounded-2xl p-3.5 sm:p-4"
      style={{
        border: "1px solid rgba(124,58,237,0.18)",
        background: "linear-gradient(90deg, rgba(124,58,237,0.08) 0%, #FFFFFF 65%)",
      }}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)", boxShadow: "0 8px 20px -10px rgba(124,58,237,0.7)" }}
      >
        {ios ? <Smartphone className="h-5 w-5" /> : <BellRing className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-slate-900">
          {ios ? "Instale o app e receba suas vendas" : "Receba suas vendas no celular"}
        </p>
        <p className="text-[12px] leading-snug text-slate-500">
          {ios
            ? "No iPhone, as notificações chegam pelo app na Tela de Início."
            : "Aviso na hora de PIX gerado e de venda aprovada."}
        </p>
      </div>
      {ios ? (
        <Link
          href="/v1/configs/notifications"
          className="inline-flex h-9 shrink-0 items-center rounded-xl px-4 text-[12.5px] font-bold text-white"
          style={{ background: "#7C3AED" }}
        >
          Ver como
        </Link>
      ) : (
        <button
          onClick={activate}
          disabled={busy}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-4 text-[12.5px] font-bold text-white disabled:opacity-60"
          style={{ background: "#7C3AED" }}
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {busy ? "Ativando…" : "Ativar"}
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

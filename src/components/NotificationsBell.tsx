"use client";

/**
 * NotificationsBell — o sino do topo. Abre o painel de notificações push deste
 * aparelho (ativar, status/teste, como liberar se bloqueado, instalar no
 * iPhone). Pontinho roxo pulsando = ainda não ativo neste aparelho.
 *
 * O painel vai pra document.body (portal): o topo usa backdrop-filter, que
 * prende elementos `fixed` dentro dele.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, SlidersHorizontal, X } from "lucide-react";
import { PushEnableCard } from "@/components/PushEnableCard";
import { getPushState, type PushState } from "@/lib/push";

const OPEN_EVENT = "sp:open-notifications";

/** Abre o painel do sino de qualquer lugar (ex.: banner do dashboard). */
export function openNotificationsPanel() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVENT));
}

export function NotificationsBell({ borderColor, primary }: { borderColor: string; primary: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<PushState>("checking");

  const refresh = () => {
    getPushState()
      .then(setState)
      .catch(() => {});
  };

  useEffect(() => {
    setMounted(true);
    refresh();
    const onOpen = () => setOpen(true);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // ao fechar o painel, atualiza o pontinho (pode ter acabado de ativar)
  useEffect(() => {
    if (!open) refresh();
  }, [open]);

  // Esc fecha
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const needsAction = state === "prompt" || state === "ios-install" || state === "denied";

  const panel = (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Notificações no celular">
      <div className="absolute inset-0 bg-slate-900/40 md:bg-slate-900/10" onClick={() => setOpen(false)} />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-[#F8FAFC] p-4 pb-[max(20px,env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-auto md:right-6 md:top-[72px] md:w-[420px] md:rounded-2xl md:p-3"
        style={{ border: `1px solid ${borderColor}`, boxShadow: "0 24px 60px -20px rgba(15,23,42,0.45)" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 md:hidden" aria-hidden="true" />
        <div className="mb-3 flex items-center justify-between px-1">
          <div>
            <p className="text-[15px] font-bold text-slate-900">Notificações no celular</p>
            <p className="text-[12px] text-slate-500">Avisos de venda direto na tela, mesmo com o app fechado.</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <PushEnableCard compact />

        <Link
          href="/v1/configs/notifications"
          onClick={() => setOpen(false)}
          className="mt-3 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold transition-colors hover:bg-white"
          style={{ color: primary }}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Escolher quais avisos receber
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={needsAction ? "Notificações (não ativadas neste aparelho)" : "Notificações"}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        style={{ border: `1px solid ${borderColor}` }}
      >
        <Bell className="h-4 w-4" />
        {needsAction && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: primary }} />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: primary }} />
          </span>
        )}
      </button>
      {mounted && open && createPortal(panel, document.body)}
    </>
  );
}

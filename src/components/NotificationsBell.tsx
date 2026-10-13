"use client";

/**
 * NotificationsBell — o sino do topo.
 *  - "Avisos da ShadowPay": recados que o admin dispara (com contador de não
 *    lidos) — chegam pra todos, mesmo quem não ativou o push.
 *  - Notificações no celular: ativar/testar o push deste aparelho.
 * Pontinho roxo pulsando = push ainda não ativo neste aparelho.
 *
 * O painel vai pra document.body (portal): o topo usa backdrop-filter, que
 * prende elementos `fixed` dentro dele.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { Bell, ChevronRight, Megaphone, SlidersHorizontal, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PushEnableCard } from "@/components/PushEnableCard";
import { getPushState, PUSH_API, type PushState } from "@/lib/push";

const OPEN_EVENT = "sp:open-notifications";

type Announcement = { id: string; title: string; body: string; url: string; createdAt: string };

// cache curto: cada página monta o topo de novo
let cache: { token: string; at: number; items: Announcement[] } | null = null;

const REFRESH_EVENT = "sp:announcements-changed";

/** Abre o painel do sino de qualquer lugar (ex.: banner do dashboard). */
export function openNotificationsPanel() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Recarrega os avisos do sino agora (ex.: o admin acabou de disparar um). */
export function refreshAnnouncements() {
  cache = null;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(REFRESH_EVENT));
}

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / 86400);
  if (d < 30) return d === 1 ? "ontem" : `há ${d} dias`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function NotificationsBell({ borderColor, primary }: { borderColor: string; primary: string }) {
  const { token, user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<PushState>("checking");
  const [items, setItems] = useState<Announcement[]>(() => (cache && cache.token === token ? cache.items : []));
  const [seenAt, setSeenAt] = useState(0);
  // o que estava "novo" quando o painel abriu (pra marcar os itens na lista)
  const [newSince, setNewSince] = useState(0);
  const seenKey = user?.id ? `sp_ann_seen_${user.id}` : null;

  const refreshPush = () => {
    getPushState()
      .then(setState)
      .catch(() => {});
  };

  const loadAnnouncements = useCallback(
    async (force = false) => {
      if (!token) return;
      if (!force && cache && cache.token === token && Date.now() - cache.at < 60_000) {
        setItems(cache.items);
        return;
      }
      try {
        const r = await axios.get(`${PUSH_API}/api/user/push/announcements`, { headers: { Authorization: `Bearer ${token}` } });
        const list: Announcement[] = r.data?.data || [];
        cache = { token, at: Date.now(), items: list };
        setItems(list);
      } catch {
        /* sem avisos se o servidor estiver acordando */
      }
    },
    [token],
  );

  useEffect(() => {
    if (!seenKey) return;
    try {
      setSeenAt(Number(localStorage.getItem(seenKey)) || 0);
    } catch {
      /* modo privado */
    }
  }, [seenKey]);

  useEffect(() => {
    setMounted(true);
    refreshPush();
    const onOpen = () => setOpen(true);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshPush();
        loadAnnouncements();
      }
    };
    const onRefresh = () => loadAnnouncements(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener(REFRESH_EVENT, onRefresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener(REFRESH_EVENT, onRefresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadAnnouncements]);

  useEffect(() => {
    loadAnnouncements();
    const t = setInterval(() => loadAnnouncements(true), 3 * 60_000);
    return () => clearInterval(t);
  }, [loadAnnouncements]);

  const newest = useMemo(() => items.reduce((m, i) => Math.max(m, new Date(i.createdAt).getTime()), 0), [items]);
  const unread = items.filter((i) => new Date(i.createdAt).getTime() > seenAt).length;

  // abriu o painel: marca tudo como lido (mantendo o destaque nesta abertura)
  useEffect(() => {
    if (!open) {
      refreshPush();
      return;
    }
    loadAnnouncements(true);
    setNewSince(seenAt);
    if (newest > seenAt && seenKey) {
      setSeenAt(newest);
      try {
        localStorage.setItem(seenKey, String(newest));
      } catch {
        /* modo privado */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // chegou aviso novo com o painel aberto: já conta como lido
  useEffect(() => {
    if (open && newest > seenAt && seenKey) {
      setSeenAt(newest);
      try {
        localStorage.setItem(seenKey, String(newest));
      } catch {
        /* modo privado */
      }
    }
  }, [open, newest, seenAt, seenKey]);

  // Esc fecha
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const needsAction = state === "prompt" || state === "ios-install" || state === "denied";

  const panel = (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Notificações">
      <div className="absolute inset-0 bg-slate-900/40 md:bg-slate-900/10" onClick={() => setOpen(false)} />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-[#F8FAFC] p-4 pb-[max(20px,env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-auto md:right-6 md:top-[72px] md:max-h-[calc(100vh-96px)] md:w-[420px] md:rounded-2xl md:p-3"
        style={{ border: `1px solid ${borderColor}`, boxShadow: "0 24px 60px -20px rgba(15,23,42,0.45)" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 md:hidden" aria-hidden="true" />
        <div className="mb-3 flex items-center justify-between px-1">
          <div>
            <p className="text-[15px] font-bold text-slate-900">Notificações</p>
            <p className="text-[12px] text-slate-500">Avisos da ShadowPay e alertas de venda neste aparelho.</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {items.length > 0 && (
          <div className="mb-3 overflow-hidden rounded-2xl bg-white" style={{ border: `1px solid ${borderColor}` }}>
            <p className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              <Megaphone className="h-3.5 w-3.5" /> Avisos da ShadowPay
            </p>
            <ul className="divide-y divide-slate-100">
              {items.slice(0, 8).map((a) => {
                const isNew = new Date(a.createdAt).getTime() > newSince;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        if (a.url && a.url !== router.asPath) router.push(a.url);
                      }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: isNew ? primary : "transparent" }} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-bold leading-snug text-slate-900">{a.title}</span>
                        <span className="mt-0.5 line-clamp-3 block whitespace-pre-line text-[12.5px] leading-snug text-slate-600">{a.body}</span>
                        <span className="mt-1 block text-[11px] text-slate-400">{ago(a.createdAt)}</span>
                      </span>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <PushEnableCard compact />

        <Link
          href="/v1/configs/profile?tab=notificacoes"
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
        aria-label={
          unread ? `Notificações (${unread} ${unread === 1 ? "aviso novo" : "avisos novos"})` : needsAction ? "Notificações (não ativadas neste aparelho)" : "Notificações"
        }
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        style={{ border: `1px solid ${borderColor}` }}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-white"
            style={{ background: primary }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : (
          needsAction && (
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: primary }} />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: primary }} />
            </span>
          )
        )}
      </button>
      {mounted && open && createPortal(panel, document.body)}
    </>
  );
}

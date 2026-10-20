import { useCallback, useEffect, useRef, useState } from "react";
import { FAILED, Order, PAID, fetchOrder } from "./lib";

/**
 * Pedido público + acompanhamento. Enquanto estiver pendente consulta a cada
 * 5s (a rota pergunta ao PSP; quem confirma o pagamento é o servidor — webhook
 * ou consulta — nunca o navegador). Para quando paga/falha/expira ou a aba
 * fica escondida por muito tempo.
 */
export function useOrder(id: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (!id) return null;
    try {
      const o = await fetchOrder(id);
      if (!alive.current) return null;
      setOrder(o);
      setError(null);
      setOffline(false);
      return o;
    } catch (e: any) {
      if (!alive.current) return null;
      if (e?.code === "offline") setOffline(true);
      else setError(e?.message || "Pedido não encontrado.");
      return null;
    }
  }, [id]);

  useEffect(() => {
    alive.current = true;
    if (!id) return;
    let stopped = false;
    const tick = async () => {
      const o = await load();
      if (stopped) return;
      const done = o && (PAID(o.status) || FAILED(o.status));
      if (!done) timer.current = setTimeout(tick, document.hidden ? 15000 : 5000);
    };
    tick();
    return () => {
      stopped = true;
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [id, load]);

  return { order, error, offline, reload: load };
}

/** Segundos até expirar (null = sem prazo informado). */
export function useCountdown(expiresAt: string | null | undefined) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) {
      setLeft(null);
      return;
    }
    const end = new Date(expiresAt).getTime();
    if (!Number.isFinite(end)) return;
    const upd = () => setLeft(Math.max(0, Math.round((end - Date.now()) / 1000)));
    upd();
    const t = setInterval(upd, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return left;
}

export function fmtLeft(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

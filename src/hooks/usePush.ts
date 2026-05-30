"use client";

/**
 * usePush — gerencia a inscrição Web Push do PWA do seller.
 *
 *  - Registra o service worker (`/sw.js`).
 *  - Pega a VAPID public key do backend (/api/user/push/vapid-key).
 *  - Pede permissão de notificação.
 *  - Cria a PushSubscription no navegador.
 *  - Envia ela pro backend (/api/user/push/subscribe).
 *
 * O envio pro backend só acontece se o seller já está logado (token).
 */
import { useCallback, useEffect, useState } from "react";

const API = "https://shadowpay-api-production.up.railway.app";

type Status =
  | "loading"      // verificando ambiente / SW
  | "unsupported"  // navegador não tem push
  | "denied"       // user bloqueou
  | "default"      // user ainda não escolheu
  | "subscribed"   // tudo certo
  | "error";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.error("[push] registerSW failed", e);
    return null;
  }
}

async function getVapidKey(): Promise<string | null> {
  try {
    const r = await fetch(`${API}/api/user/push/vapid-key`);
    const j = await r.json();
    return j?.publicKey || null;
  } catch {
    return null;
  }
}

export function usePush(token: string | null) {
  const [status, setStatus] = useState<Status>("loading");
  const [supported, setSupported] = useState(false);

  // descobre estado atual ao montar
  useEffect(() => {
    let alive = true;
    (async () => {
      if (typeof window === "undefined") return;
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        if (alive) setStatus("unsupported");
        return;
      }
      if (alive) setSupported(true);

      const reg = await registerSW();
      if (!reg) {
        if (alive) setStatus("error");
        return;
      }
      const existing = await reg.pushManager.getSubscription().catch(() => null);
      if (existing) {
        if (alive) setStatus("subscribed");
        return;
      }
      if (Notification.permission === "denied") {
        if (alive) setStatus("denied");
        return;
      }
      if (alive) setStatus("default");
    })();
    return () => {
      alive = false;
    };
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return false;
    }

    // 1) Permissão (precisa ser dentro de gesture do usuário em iOS)
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setStatus(perm === "denied" ? "denied" : "default");
      return false;
    }

    // 2) SW
    const reg = await registerSW();
    if (!reg) {
      setStatus("error");
      return false;
    }

    // 3) VAPID
    const vapid = await getVapidKey();
    if (!vapid) {
      setStatus("error");
      console.error("[push] VAPID key ausente no backend.");
      return false;
    }

    // 4) Subscription
    let sub = await reg.pushManager.getSubscription().catch(() => null);
    if (!sub) {
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid),
        });
      } catch (e) {
        console.error("[push] pushManager.subscribe failed", e);
        setStatus("error");
        return false;
      }
    }

    // 5) Manda pro backend
    if (!token) {
      // sem login agora — guarda na "fila"; a tela de notificações chamará
      // de novo depois com token.
      setStatus("subscribed");
      return true;
    }
    try {
      const json = sub.toJSON() as any;
      await fetch(`${API}/api/user/push/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      setStatus("subscribed");
      return true;
    } catch (e) {
      console.error("[push] subscribe POST failed", e);
      setStatus("error");
      return false;
    }
  }, [token]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (!("serviceWorker" in navigator)) return false;
    const reg = await navigator.serviceWorker.getRegistration("/").catch(() => null);
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription().catch(() => null);
    if (!sub) {
      setStatus("default");
      return true;
    }
    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => null);
    if (token && endpoint) {
      await fetch(`${API}/api/user/push/unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint }),
      }).catch(() => null);
    }
    setStatus("default");
    return true;
  }, [token]);

  const sendTest = useCallback(async () => {
    if (!token) return false;
    try {
      const r = await fetch(`${API}/api/user/push/test`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      return !!j?.success && (j?.delivered ?? 0) > 0;
    } catch {
      return false;
    }
  }, [token]);

  return { status, supported, subscribe, unsubscribe, sendTest };
}

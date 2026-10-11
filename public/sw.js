/* eslint-disable no-undef */
/**
 * Service Worker da ShadowPay (PWA) — push refeito do zero.
 *
 *  - push: SEMPRE mostra uma notificação (o iPhone cancela a inscrição se um
 *    push chegar sem notificação visível).
 *  - notificationclick: foca o app aberto e navega pra tela da notificação,
 *    ou abre o app nela.
 *  - pushsubscriptionchange: o navegador renovou a inscrição — reinscreve e
 *    avisa o backend (sem login: o backend reconhece pelo endpoint antigo).
 *
 *  Não faz cache de páginas: o app sempre carrega a versão nova.
 */
const SW_VERSION = "2026-10-11-push-v2";
const API = "https://shadowpay-backend.onrender.com";
const DEFAULT_URL = "/v1/dashboard";
const ICON = "/pwa/icon-192.png";
const BADGE = "/pwa/badge-96.png";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Remove caches de versões antigas (este SW não usa cache).
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

function parsePayload(event) {
  if (!event.data) return {};
  try {
    return event.data.json() || {};
  } catch (_) {
    try {
      return { body: event.data.text() };
    } catch (__) {
      return {};
    }
  }
}

self.addEventListener("push", (event) => {
  const p = parsePayload(event);
  const title = p.title || "ShadowPay";
  const options = {
    body: p.body || "Você tem uma nova notificação.",
    icon: p.icon || ICON,
    badge: p.badge || BADGE,
    data: Object.assign({}, p.data || {}, { url: p.url || DEFAULT_URL }),
    timestamp: p.timestamp || Date.now(),
    vibrate: [120, 60, 120],
  };
  if (p.tag) {
    options.tag = p.tag;
    // mesma tag (ex.: venda gerada -> aprovada) substitui e toca de novo
    options.renotify = true;
  }
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = new URL(data.url || DEFAULT_URL, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        try {
          await client.focus();
        } catch (_) {}
        if (client.url !== target && "navigate" in client) {
          try {
            await client.navigate(target);
          } catch (_) {
            // aba não controlada por este SW: abre a tela numa janela nova
            if (self.clients.openWindow) await self.clients.openWindow(target);
          }
        }
        return;
      }
      if (self.clients.openWindow) await self.clients.openWindow(target);
    })()
  );
});

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const old = event.oldSubscription || null;
      let sub = event.newSubscription || null;
      if (!sub) {
        let key = old && old.options && old.options.applicationServerKey;
        if (!key) {
          const r = await fetch(API + "/api/push/vapid-key");
          const j = await r.json();
          if (!j || !j.publicKey) return;
          key = urlBase64ToUint8Array(j.publicKey);
        }
        sub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        });
      }
      if (!old || !old.endpoint) return; // o app re-registra na próxima abertura
      await fetch(API + "/api/push/resubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldEndpoint: old.endpoint, subscription: sub.toJSON() }),
      });
    })().catch(() => {})
  );
});

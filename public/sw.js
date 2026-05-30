/* eslint-disable no-undef */
/**
 * Service Worker da ShadowPay PWA.
 *
 *  - Install/activate: limpa caches antigos e assume controle imediato.
 *  - push: mostra notificação com title/body vindos do backend.
 *  - notificationclick: foca a aba aberta ou abre uma nova com `url`.
 *
 *  Não faz cache de HTML/JS — o app é SPA e queremos sempre versão
 *  fresca. O foco é estritamente PWA install + push.
 */
const VERSION = "v1.0.0";

self.addEventListener("install", (event) => {
  // ativa imediatamente, sem esperar abas antigas
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.includes(VERSION)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

/**
 * Push event — backend envia { title, body, url, tag, data }.
 * Payload é JSON em event.data.text().
 */
self.addEventListener("push", (event) => {
  let payload = {
    title: "ShadowPay",
    body: "Você tem uma nova notificação.",
    url: "/v1/dashboard",
    tag: "shadowpay",
    data: {},
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    }
  } catch (e) {
    // payload texto
    if (event.data) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: "/shadow-panther.png",
    badge: "/shadow-panther.png",
    tag: payload.tag,
    renotify: true, // reapresenta mesmo que a tag já exista
    data: { url: payload.url, ...payload.data },
    vibrate: [120, 60, 120],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

/**
 * Clique na notificação — foca aba aberta ou abre nova com `url`.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/v1/dashboard";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // tenta achar aba já no mesmo domínio e focar
      for (const client of allClients) {
        try {
          const url = new URL(client.url);
          if (url.origin === self.location.origin) {
            await client.focus();
            // navega pra rota da notificação
            if ("navigate" in client) {
              await client.navigate(targetUrl);
            }
            return;
          }
        } catch (_) {}
      }
      // senão, abre nova
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  // O navegador renovou a subscription — o frontend re-inscreve na próxima
  // abertura via `usePush()`. Aqui não fazemos nada de especial.
});

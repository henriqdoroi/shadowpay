// service-worker.js (ex: /sk.js)

// Evento de recebimento de push
self.addEventListener("push", function (event) {
  console.log("[Service Worker] Push Received.");

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error(
      "[Service Worker] Erro ao processar o JSON da notificação:",
      error
    );
  }

  const title = data.title || "Safira Cash";
  let bodyText = data.body || "Foi adicionado tanto em sua carteira.";

  // Remove linhas que começam com "From "
  bodyText = bodyText
    .split("\n")
    .filter((line) => !/^from\s+/i.test(line))
    .join("\n")
    .trim();

  const options = {
    body: bodyText,
    icon: data.icon || "/icon-safira.png",
    badge: data.badge || "/badge.png",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Evento de clique na notificação
self.addEventListener("notificationclick", function (event) {
  console.log("[Service Worker] Notification click Received.");

  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          // Se já existe uma aba aberta com essa URL, foca nela
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Se não, abre uma nova aba com a URL
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Opcional: Evento para atualização da push subscription (ex: quando expira)
self.addEventListener("pushsubscriptionchange", function (event) {
  console.log("[Service Worker] pushsubscriptionchange event fired.");

  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then(function (newSubscription) {
        // Aqui você deve enviar a nova subscription para seu backend para atualizar
        console.log(
          "[Service Worker] Subscription atualizada:",
          newSubscription
        );
      })
  );
});

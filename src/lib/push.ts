/**
 * Web Push no navegador/PWA — refeito do zero. ÚNICO lugar do frontend que
 * mexe com permissão, service worker e inscrição de push.
 *
 * Regras (Android + iPhone):
 *  - O pedido de permissão SÓ pode sair de um toque do usuário: chame
 *    enablePush() direto no onClick. Pedir sozinho (no login/abertura) faz o
 *    iPhone recusar e o Chrome bloquear o site.
 *  - iPhone: só funciona com o app INSTALADO na Tela de Início (iOS 16.4+) e
 *    aberto pelo ícone.
 *  - A inscrição usa a chave VAPID atual do backend; inscrição feita com outra
 *    chave é refeita automaticamente.
 *  - Só mostramos "ativo" depois que o backend confirma que salvou o aparelho.
 */
import axios from "axios";

export const PUSH_API = "https://shadowpay-backend.onrender.com";
const ENDPOINT_KEY = "sp_push_endpoint";
const LAST_SYNC_KEY = "sp_push_last_sync";
// "Desativar" neste aparelho: a permissão do navegador continua, então
// marcamos aqui pra sincronização automática não reinscrever sozinha.
const OFF_KEY = "sp_push_off";

function isTurnedOff(): boolean {
  try {
    return localStorage.getItem(OFF_KEY) === "1";
  } catch {
    return false;
  }
}

function setTurnedOff(off: boolean) {
  try {
    if (off) localStorage.setItem(OFF_KEY, "1");
    else localStorage.removeItem(OFF_KEY);
  } catch {
    /* modo privado */
  }
}

export type PushPlatform = "ios" | "android" | "desktop" | "other";
export type PushState =
  | "checking"
  | "unsupported" // navegador sem Web Push
  | "ios-install" // iPhone fora do app instalado: precisa "Adicionar à Tela de Início"
  | "ios-outdated" // app instalado, mas iOS sem Web Push (< 16.4)
  | "denied" // bloqueado nas configurações
  | "prompt" // ainda não perguntamos
  | "enabled"; // permitido (o app mantém a inscrição sincronizada)

export type PushResult = { ok: boolean; message: string };

export type PushDeviceInfo = {
  id: string;
  platform: string;
  label: string;
  enabled: boolean;
  lastSuccessAt: string | null;
  lastError: string | null;
  createdAt: string;
  endpointHint: string;
};

export const IOS_INSTALL_MSG =
  'No iPhone, instale o app primeiro: toque em Compartilhar e depois em "Adicionar à Tela de Início". Abra a ShadowPay pelo ícone e ative aqui.';

// ---------------------------------------------------------------- ambiente

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPadOS 13+ se apresenta como Mac com tela de toque
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1);
}

export function isAndroid(): boolean {
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent || "");
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mm = (q: string) => !!window.matchMedia && window.matchMedia(q).matches;
  return mm("(display-mode: standalone)") || mm("(display-mode: fullscreen)") || (navigator as any).standalone === true;
}

export function detectPlatform(): PushPlatform {
  if (isIOS()) return "ios";
  if (isAndroid()) return "android";
  if (typeof navigator !== "undefined" && /windows|macintosh|linux|cros/i.test(navigator.userAgent || "")) return "desktop";
  return "other";
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// ---------------------------------------------------------------- service worker

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    // updateViaCache "none": o navegador sempre busca o sw.js novo.
    return await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  } catch (e) {
    console.warn("[push] falha ao registrar o service worker:", e);
    return null;
  }
}

async function readyRegistration(timeoutMs = 15000): Promise<ServiceWorkerRegistration> {
  await registerServiceWorker();
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("sw-timeout")), timeoutMs)),
  ]);
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    return (await reg?.pushManager.getSubscription()) ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- chave VAPID

let vapidCache: string | null = null;

export async function getVapidKey(): Promise<string> {
  if (vapidCache) return vapidCache;
  const r = await axios.get(`${PUSH_API}/api/push/vapid-key`, { timeout: 25000 });
  const key = r.data?.publicKey;
  if (!key) throw new Error("vapid-missing");
  vapidCache = key;
  return key;
}

/** Busca a chave antes do toque (o servidor pode estar acordando). */
export function prefetchVapidKey(): void {
  getVapidKey().catch(() => {});
}

export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function sameKey(current: ArrayBuffer | null | undefined, wanted: Uint8Array): boolean {
  if (!current) return false;
  const a = new Uint8Array(current);
  if (a.length !== wanted.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== wanted[i]) return false;
  return true;
}

// ---------------------------------------------------------------- estado

export async function getPushState(): Promise<PushState> {
  if (typeof window === "undefined") return "checking";
  if (isIOS()) {
    if (!isStandalone()) return "ios-install";
    if (!pushSupported()) return "ios-outdated";
  } else if (!pushSupported()) {
    return "unsupported";
  }
  const perm = Notification.permission;
  if (perm === "denied") return "denied";
  if (perm === "default" || isTurnedOff()) return "prompt";
  return "enabled";
}

function friendlyError(e: any): string {
  if (e?.response) return e.response.data?.message || "O servidor recusou o registro deste aparelho.";
  if (e?.message === "sw-timeout") return "O app ainda está carregando. Tente de novo em alguns segundos.";
  if (e?.message === "vapid-missing" || e?.isAxiosError || e?.code === "ECONNABORTED") {
    return "Não consegui falar com o servidor (ele pode estar acordando). Tente de novo em alguns segundos.";
  }
  if (e?.name === "NotAllowedError") return "O navegador não permitiu. Confira a permissão de notificações deste app.";
  return "O serviço de notificações do aparelho não respondeu. Tente de novo.";
}

function storeEndpoint(endpoint: string | null) {
  try {
    if (endpoint) localStorage.setItem(ENDPOINT_KEY, endpoint);
    else localStorage.removeItem(ENDPOINT_KEY);
  } catch {
    /* modo privado */
  }
}

function storedEndpoint(): string | null {
  try {
    return localStorage.getItem(ENDPOINT_KEY);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- ações

/**
 * Ativa as notificações NESTE aparelho. Chame DIRETO no onClick: o pedido de
 * permissão é a primeira coisa executada (precisa do toque do usuário).
 */
export async function enablePush(token: string): Promise<PushResult> {
  if (!pushSupported()) {
    return {
      ok: false,
      message: isIOS() && !isStandalone() ? IOS_INSTALL_MSG : "Este navegador não suporta notificações. Use o Chrome no Android ou o app instalado no iPhone.",
    };
  }
  let perm: NotificationPermission;
  try {
    perm = await Notification.requestPermission();
  } catch {
    return { ok: false, message: "Não consegui pedir a permissão. Toque em ativar de novo." };
  }
  if (perm === "denied") {
    return { ok: false, message: "Você bloqueou as notificações. Libere nas configurações do aparelho e tente de novo." };
  }
  if (perm !== "granted") {
    return { ok: false, message: 'Você fechou o pedido sem permitir. Toque em ativar e escolha "Permitir".' };
  }
  setTurnedOff(false);
  return syncPush(token, true);
}

/**
 * Garante a inscrição no aparelho + o registro no servidor, SEM pedir
 * permissão (só funciona se ela já foi dada). Refaz a inscrição se foi feita
 * com outra chave.
 */
export async function syncPush(token: string, force = false): Promise<PushResult> {
  if (!pushSupported() || Notification.permission !== "granted") {
    return { ok: false, message: "Permissão de notificação não concedida." };
  }
  if (!force && isTurnedOff()) {
    return { ok: false, message: "Notificações desativadas neste aparelho." };
  }
  try {
    const reg = await readyRegistration();
    const key = urlBase64ToUint8Array(await getVapidKey());
    let sub = await reg.pushManager.getSubscription();
    if (sub && !sameKey(sub.options?.applicationServerKey, key)) {
      await sub.unsubscribe().catch(() => false);
      sub = null;
    }
    if (!sub) {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    }
    const json = sub.toJSON();
    const r = await axios.post(
      `${PUSH_API}/api/user/push/devices`,
      { subscription: { endpoint: json.endpoint, keys: json.keys }, platform: detectPlatform() },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 25000 },
    );
    if (!r.data?.success) {
      return { ok: false, message: r.data?.message || "Não consegui registrar este aparelho." };
    }
    storeEndpoint(json.endpoint || null);
    try {
      localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
    } catch {
      /* ignora */
    }
    return { ok: true, message: force ? "Notificações ativadas neste aparelho! 🎉" : "Aparelho sincronizado." };
  } catch (e) {
    return { ok: false, message: friendlyError(e) };
  }
}

/**
 * Na abertura do app/login: se a permissão JÁ foi dada, mantém o aparelho
 * registrado (refaz se a chave mudou, re-registra se o servidor perdeu).
 * Nunca pede permissão. Na abertura roda no máximo 1x a cada 30 min; no
 * login (`force`) sempre — o aparelho passa a ser da conta que acabou de entrar.
 */
export async function syncPushIfGranted(token: string | null, force = false): Promise<void> {
  if (!token || !pushSupported() || Notification.permission !== "granted") return;
  if (!force) {
    try {
      const last = Number(localStorage.getItem(LAST_SYNC_KEY) || 0);
      if (Date.now() - last < 30 * 60 * 1000) return;
    } catch {
      /* ignora */
    }
  }
  await syncPush(token).catch(() => null);
}

/** Desativa as notificações NESTE aparelho (cancela a inscrição + remove do servidor). */
export async function disablePush(token: string | null): Promise<PushResult> {
  const sub = await currentSubscription();
  const endpoint = sub?.endpoint || storedEndpoint();
  if (sub) await sub.unsubscribe().catch(() => false);
  if (token && endpoint) {
    await axios
      .post(`${PUSH_API}/api/user/push/devices/remove`, { endpoint }, { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 })
      .catch(() => null);
  }
  storeEndpoint(null);
  setTurnedOff(true);
  return { ok: true, message: "Notificações desativadas neste aparelho." };
}

/** No logout: este aparelho para de receber as vendas da conta (a permissão continua). */
export async function forgetDeviceOnLogout(token: string | null): Promise<void> {
  try {
    const endpoint = (await currentSubscription())?.endpoint || storedEndpoint();
    if (token && endpoint) {
      await axios.post(
        `${PUSH_API}/api/user/push/devices/remove`,
        { endpoint },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 },
      );
    }
    localStorage.removeItem(LAST_SYNC_KEY);
  } catch {
    /* logout nunca falha por causa do push */
  }
}

export async function sendTestPush(token: string): Promise<PushResult & { sent: number; total: number }> {
  try {
    const r = await axios.post(`${PUSH_API}/api/user/push/test`, {}, { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 });
    return {
      ok: !!r.data?.success,
      message: r.data?.message || "Teste enviado.",
      sent: r.data?.data?.sent ?? 0,
      total: r.data?.data?.total ?? 0,
    };
  } catch (e) {
    return { ok: false, message: friendlyError(e), sent: 0, total: 0 };
  }
}

export async function listPushDevices(token: string): Promise<PushDeviceInfo[]> {
  try {
    const r = await axios.get(`${PUSH_API}/api/user/push/devices`, { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 });
    return Array.isArray(r.data?.data) ? r.data.data : [];
  } catch {
    return [];
  }
}

/** Final do endpoint deste aparelho — pra marcar "este aparelho" na lista. */
export async function thisDeviceHint(): Promise<string | null> {
  const endpoint = (await currentSubscription())?.endpoint || storedEndpoint();
  return endpoint ? endpoint.slice(-12) : null;
}

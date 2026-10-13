/**
 * "Instalar app" (PWA). O Chrome/Edge disparam `beforeinstallprompt` logo no
 * carregamento — guardamos o evento (initInstallPrompt no _app) pra usar
 * quando o seller tocar em "Instalar app". iPhone não tem esse evento: lá é
 * Compartilhar → "Adicionar à Tela de Início".
 */
type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BIPEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export function initInstallPrompt() {
  if (typeof window === "undefined" || (window as any).__spInstallInit) return;
  (window as any).__spInstallInit = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // nada de mini-barra automática: o seller decide
    deferred = e as BIPEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export function canPromptInstall(): boolean {
  return !!deferred;
}

/** Abre o pedido de instalação do navegador. true = instalou. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const ev = deferred;
  deferred = null;
  notify();
  await ev.prompt();
  const choice = await ev.userChoice.catch(() => ({ outcome: "dismissed" as const }));
  return choice.outcome === "accepted";
}

export function onInstallChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

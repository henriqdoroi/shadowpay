"use client";

/**
 * "Baixar app" (PWA) no topo do painel.
 *  - Android/Chrome com o pedido de instalação disponível: abre direto a
 *    janela "Instalar app" do navegador.
 *  - Sem o pedido (iPhone, navegador do Instagram/Facebook, Samsung etc.):
 *    mostra o passo a passo certo pra aquele aparelho.
 *  - Já abriu pelo app instalado: o botão some.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Download, X } from "lucide-react";
import { toast } from "sonner";
import { canPromptInstall, onInstallChange, promptInstall } from "@/lib/install";
import { detectPlatform, isStandalone, type PushPlatform } from "@/lib/push";

const VIOLET = "#7C3AED";

/** Navegador embutido de app (Instagram, Facebook, TikTok...): não instala PWA. */
function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /FBAN|FBAV|Instagram|Line\/|TikTok|musical_ly|Bytedance|; wv\)/i.test(navigator.userAgent || "");
}

function isSamsungBrowser(): boolean {
  return typeof navigator !== "undefined" && /SamsungBrowser/i.test(navigator.userAgent || "");
}

type Guide = { title: string; steps: string[] };

function guideFor(platform: PushPlatform, inApp: boolean): Guide {
  if (inApp) {
    return {
      title: "Abra no navegador pra instalar",
      steps: [
        "Este navegador (de dentro do Instagram/Facebook) não instala apps.",
        "Toque nos três pontinhos (⋯ ou ⋮) no canto da tela.",
        platform === "ios" ? "Escolha “Abrir no Safari”." : "Escolha “Abrir no Chrome” (ou “Abrir no navegador”).",
        "Lá, toque de novo em “Baixar app”.",
      ],
    };
  }
  if (platform === "ios") {
    return {
      title: "Instalar no iPhone",
      steps: [
        "Abra a ShadowPay no Safari.",
        "Toque em Compartilhar (o quadrado com a setinha pra cima), na barra de baixo.",
        "Role e toque em “Adicionar à Tela de Início”.",
        "Toque em “Adicionar”. Pronto: o ícone da ShadowPay aparece na sua tela.",
      ],
    };
  }
  if (platform === "android" && isSamsungBrowser()) {
    return {
      title: "Instalar no Android",
      steps: [
        "Toque no menu ☰ (três risquinhos) na barra de baixo.",
        "Toque em “Adicionar página a” → “Tela inicial”.",
        "Confirme em “Adicionar”. Pronto: o ícone da ShadowPay aparece na sua tela.",
      ],
    };
  }
  if (platform === "android") {
    return {
      title: "Instalar no Android",
      steps: [
        "Abra a ShadowPay no Google Chrome.",
        "Toque no menu ⋮ (três pontinhos) no canto de cima.",
        "Toque em “Instalar app” (ou “Adicionar à tela inicial”).",
        "Confirme em “Instalar”. Pronto: o ícone da ShadowPay aparece na sua tela.",
      ],
    };
  }
  return {
    title: "Instalar no computador",
    steps: [
      "Use o Google Chrome ou o Microsoft Edge.",
      "Clique no ícone de instalar no fim da barra de endereço (ou menu ⋮ → “Instalar ShadowPay”).",
      "Pronto: a ShadowPay abre como um app, numa janela própria.",
    ],
  };
}

export function InstallAppButton({ variant = "icon" }: { variant?: "icon" | "menu" }) {
  const [ready, setReady] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [platform, setPlatform] = useState<PushPlatform>("other");
  const [inApp, setInApp] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setStandalone(isStandalone());
    setInApp(isInAppBrowser());
    setCanPrompt(canPromptInstall());
    setReady(true);
    return onInstallChange(() => setCanPrompt(canPromptInstall()));
  }, []);

  // Esc fecha
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!ready || standalone) return null;
  const mobile = platform === "android" || platform === "ios";
  // no computador o botão do topo só aparece quando dá pra instalar com 1 clique
  if (variant === "icon" && !mobile && !canPrompt) return null;

  const onClick = async () => {
    if (canPrompt && !inApp) {
      const ok = await promptInstall();
      if (ok) toast.success("App instalado! Abra a ShadowPay pelo ícone na sua tela.");
      return;
    }
    setOpen(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + "/v1/dashboard");
      toast.success("Link copiado. Cole no navegador.");
    } catch {
      toast.error("Não deu pra copiar. Abra pelo menu do app.");
    }
  };

  const guide = guideFor(platform, inApp);

  const sheet = (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Baixar o app da ShadowPay">
      <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(22px,env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[420px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
        style={{ boxShadow: "0 24px 60px -20px rgba(15,23,42,0.45)" }}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" aria-hidden="true" />
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pwa/icon-192.png" alt="" className="h-12 w-12 shrink-0 rounded-2xl shadow-sm" />
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-bold text-slate-900">{guide.title}</p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500">
              O app abre direto da tela inicial, em tela cheia, e recebe as notificações de venda.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ol className="mt-5 space-y-3">
          {guide.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-[13.5px] leading-snug text-slate-700">
              <span
                className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                style={{ background: VIOLET }}
              >
                {i + 1}
              </span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>

        {inApp && (
          <button
            type="button"
            onClick={copyLink}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-[13.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Copy className="h-4 w-4" /> Copiar o link da ShadowPay
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-3 h-11 w-full rounded-xl text-[14px] font-semibold text-white"
          style={{ background: VIOLET, boxShadow: "0 10px 24px -12px rgba(124,58,237,0.8)" }}
        >
          Entendi
        </button>
      </div>
    </div>
  );

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={onClick}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[12.5px] font-semibold text-violet-700 transition-colors hover:bg-violet-50"
          style={{ background: "rgba(124, 58, 237, 0.08)" }}
          aria-label="Baixar o app da ShadowPay"
          title="Baixar o app"
        >
          <Download className="h-[17px] w-[17px]" />
          <span>Baixar app</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" />
          Baixar app
        </button>
      )}
      {open && typeof document !== "undefined" && createPortal(sheet, document.body)}
    </>
  );
}

export default InstallAppButton;

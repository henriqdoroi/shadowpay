/**
 * Config do Checkout Builder (v1) — mesma forma que o backend guarda e saneia
 * (Backend ShadowPay/src/compat/checkout-builder.ts). Aqui ficam os padrões,
 * os presets de cor, a conversão do checkout "clássico" (checkoutConfig antigo
 * do produto) e helpers de exibição (tema, vídeo, links).
 */
import { readStoreConfig } from "@/components/store-checkout/lib";

export type BuilderTemplate = "padrao" | "compacto" | "pix-direto" | "loja";
export type BuilderCorners = "reto" | "suave" | "redondo";
export type SealIcon = "shield" | "lock" | "medal" | "bolt" | "rocket" | "handshake";

export type BuilderBump = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  image: string;
  active: boolean;
};

export type BuilderTestimonial = { name: string; text: string; rating: number; image: string };

export type CheckoutBuilderConfig = {
  v: 1;
  template: BuilderTemplate;
  layout: "duas" | "uma";
  content: {
    title: string;
    subtitle: string;
    image: string;
    logo: string;
    buttonText: string;
    securityText: string;
    pixTitle: string;
    pixInstructions: string;
    copyButton: string;
  };
  fields: { name: boolean; email: boolean; phone: boolean; cpf: boolean; bankNotice: boolean };
  bumps: BuilderBump[];
  pixDiscountPercent: number;
  extras: {
    announcement: { enabled: boolean; text: string; bg: string; color: string };
    banner: { enabled: boolean; image: string; link: string };
    timer: { enabled: boolean; minutes: number; text: string; bg: string; color: string };
    imageBelow: { enabled: boolean; image: string; link: string; full: boolean };
    vsl: { enabled: boolean; url: string; headline: string };
    whatsapp: { enabled: boolean; number: string; message: string };
    seals: { enabled: boolean; items: { icon: SealIcon; label: string }[] };
    testimonials: { enabled: boolean; items: BuilderTestimonial[] };
  };
  colors: {
    preset: string;
    page: string;
    card: string;
    text: string;
    accent: string;
    header: string;
    headerText: string;
    button: string;
    buttonText: string;
    corners: BuilderCorners;
  };
  post: { guarantee: string };
};

export type ColorSet = Omit<CheckoutBuilderConfig["colors"], "preset" | "corners">;

/** Paletas prontas. "ShadowPay" = o roxo da logo. */
export const PRESETS: { key: string; label: string; colors: ColorSet }[] = [
  {
    key: "shadowpay",
    label: "ShadowPay",
    colors: { page: "#f5f2fb", card: "#ffffff", text: "#16121f", accent: "#8a1ef7", header: "#14101f", headerText: "#ffffff", button: "#8a1ef7", buttonText: "#ffffff" },
  },
  {
    key: "noite",
    label: "Noite",
    colors: { page: "#0c0a12", card: "#16131f", text: "#f2f0f7", accent: "#b552f9", header: "#8a1ef7", headerText: "#ffffff", button: "#8a1ef7", buttonText: "#ffffff" },
  },
  {
    key: "claro",
    label: "Claro",
    colors: { page: "#f4f5f7", card: "#ffffff", text: "#111827", accent: "#111827", header: "#111827", headerText: "#ffffff", button: "#111827", buttonText: "#ffffff" },
  },
  {
    key: "verde",
    label: "Verde",
    colors: { page: "#f0fdf4", card: "#ffffff", text: "#052e16", accent: "#16a34a", header: "#15803d", headerText: "#ffffff", button: "#16a34a", buttonText: "#ffffff" },
  },
  {
    key: "azul",
    label: "Azul",
    colors: { page: "#eff6ff", card: "#ffffff", text: "#0b1b3a", accent: "#2563eb", header: "#1e3a8a", headerText: "#ffffff", button: "#2563eb", buttonText: "#ffffff" },
  },
  {
    key: "rosa",
    label: "Rosa",
    colors: { page: "#fdf2f8", card: "#ffffff", text: "#3b0a24", accent: "#db2777", header: "#9d174d", headerText: "#ffffff", button: "#db2777", buttonText: "#ffffff" },
  },
  {
    key: "laranja",
    label: "Laranja",
    colors: { page: "#fff7ed", card: "#ffffff", text: "#2b1405", accent: "#ea580c", header: "#9a3412", headerText: "#ffffff", button: "#ea580c", buttonText: "#ffffff" },
  },
];

export const TEMPLATES: { key: BuilderTemplate; label: string; text: string }[] = [
  { key: "padrao", label: "Padrão", text: "Dados do comprador ao lado do resumo do pedido. No celular vira uma coluna." },
  { key: "compacto", label: "Compacto", text: "Um cartão só: produto, dados e Pix. Direto ao ponto, ótimo no celular." },
  { key: "pix-direto", label: "Pix direto", text: "Gera o Pix assim que a página abre, sem formulário. Ideal pra tráfego direto." },
  { key: "loja", label: "Loja", text: "Estilo e-commerce: endereço, frete e cupom. Pra produto físico." },
];

export const SEAL_OPTIONS: { icon: SealIcon; label: string }[] = [
  { icon: "shield", label: "Compra segura" },
  { icon: "lock", label: "Dados protegidos" },
  { icon: "bolt", label: "Liberação imediata" },
  { icon: "medal", label: "Garantia de satisfação" },
  { icon: "rocket", label: "Entrega rápida" },
  { icon: "handshake", label: "Suporte dedicado" },
];

export function defaultConfig(): CheckoutBuilderConfig {
  const p = PRESETS[0]!.colors;
  return {
    v: 1,
    template: "padrao",
    layout: "duas",
    content: {
      title: "",
      subtitle: "",
      image: "",
      logo: "",
      buttonText: "",
      securityText: "",
      pixTitle: "",
      pixInstructions: "",
      copyButton: "",
    },
    fields: { name: true, email: true, phone: false, cpf: false, bankNotice: false },
    bumps: [],
    pixDiscountPercent: 0,
    extras: {
      announcement: { enabled: false, text: "", bg: "", color: "" },
      banner: { enabled: false, image: "", link: "" },
      timer: { enabled: false, minutes: 10, text: "", bg: "", color: "" },
      imageBelow: { enabled: false, image: "", link: "", full: false },
      vsl: { enabled: false, url: "", headline: "" },
      whatsapp: { enabled: false, number: "", message: "" },
      seals: { enabled: true, items: SEAL_OPTIONS.slice(0, 3) },
      testimonials: { enabled: false, items: [] },
    },
    colors: { preset: "shadowpay", ...p, corners: "suave" },
    post: { guarantee: "" },
  };
}

const obj = (v: unknown): Record<string, any> => (v && typeof v === "object" && !Array.isArray(v) ? (v as any) : {});
const isOn = (v: unknown) => v === true || v === "t" || v === "true";
const hex = (v: unknown) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v.trim()) ? v.trim().toLowerCase() : "");
const str = (v: unknown) => (typeof v === "string" ? v : "");

/**
 * Completa a config que veio do servidor (ou do rascunho) com os padrões —
 * nunca falta um campo pros componentes.
 */
export function normalizeConfig(input: unknown): CheckoutBuilderConfig {
  const d = defaultConfig();
  const c = obj(input);
  const ex = obj(c.extras);
  const merge = <T extends Record<string, any>>(base: T, v: unknown): T => ({ ...base, ...obj(v) });
  return {
    ...d,
    template: (["padrao", "compacto", "pix-direto", "loja"] as const).includes(c.template) ? c.template : d.template,
    layout: c.layout === "uma" ? "uma" : "duas",
    content: merge(d.content, c.content),
    fields: merge(d.fields, c.fields),
    bumps: Array.isArray(c.bumps) ? c.bumps.map((b: any) => ({ ...b, id: String(b.id ?? ""), image: str(b.image) })) : [],
    pixDiscountPercent: Math.max(0, Math.min(90, Number(c.pixDiscountPercent) || 0)),
    extras: {
      announcement: merge(d.extras.announcement, ex.announcement),
      banner: merge(d.extras.banner, ex.banner),
      timer: merge(d.extras.timer, ex.timer),
      imageBelow: merge(d.extras.imageBelow, ex.imageBelow),
      vsl: merge(d.extras.vsl, ex.vsl),
      whatsapp: merge(d.extras.whatsapp, ex.whatsapp),
      seals: { ...d.extras.seals, ...obj(ex.seals), items: Array.isArray(obj(ex.seals).items) ? obj(ex.seals).items : d.extras.seals.items },
      testimonials: { ...d.extras.testimonials, ...obj(ex.testimonials), items: Array.isArray(obj(ex.testimonials).items) ? obj(ex.testimonials).items : [] },
    },
    colors: merge(d.colors, c.colors),
    post: merge(d.post, c.post),
  };
}

/**
 * Checkout clássico (checkoutConfig antigo do produto) → config v1 — ponto de
 * partida do builder pra quem nunca publicou por ele. Os ids dos bumps ficam
 * iguais (id || posição+1): carrinho aberto continua batendo com o servidor.
 */
export function legacyToConfig(checkoutConfig: unknown): CheckoutBuilderConfig {
  const cfg = obj(checkoutConfig);
  const d = defaultConfig();
  const primary = hex(cfg.primaryColor);
  const pix = obj(obj(cfg.payments).pix);
  const pixAlt = obj(obj(cfg.paymentMethods).pix);
  const ff = obj(cfg.formFields);
  const banner = str(cfg.bannerImageUrl);
  const testimonials = (Array.isArray(cfg.testimonials) ? cfg.testimonials : [])
    .map((t: any) => ({ name: str(t?.name), text: str(t?.text), rating: Math.min(5, Math.max(1, Number(t?.rating) || 5)), image: str(t?.image) }))
    .filter((t: BuilderTestimonial) => t.name && t.text);
  const bumps = (Array.isArray(obj(cfg.customFields).orderBumps) ? obj(cfg.customFields).orderBumps : [])
    .map((b: any, idx: number) => ({
      id: String(b?.id || idx + 1),
      title: str(b?.title).trim(),
      description: str(b?.description),
      priceCents: Math.round(parseFloat(String(b?.price ?? "")) * 100),
      image: str(b?.image),
      active: b?.active ?? false,
    }))
    .filter((b: BuilderBump) => b.title && Number.isFinite(b.priceCents) && b.priceCents > 0);
  return {
    ...d,
    template: readStoreConfig(cfg).enabled ? "loja" : "padrao",
    content: { ...d.content, logo: str(cfg.logoUrl) },
    fields: {
      name: isOn(cfg.showName) || isOn(ff.nome),
      email: isOn(cfg.showEmail) || isOn(ff.email),
      phone: isOn(cfg.showPhone) || isOn(ff.celular),
      cpf: isOn(cfg.showCpf) || isOn(ff.cpf),
      bankNotice: false,
    },
    bumps,
    pixDiscountPercent: Math.max(0, Math.min(90, Number(pix.percent ?? pixAlt.percent) || 0)),
    extras: {
      ...d.extras,
      announcement: {
        enabled: "showTopbar" in cfg ? isOn(cfg.showTopbar) : false,
        text: str(cfg.customTimerText),
        bg: "",
        color: "",
      },
      banner: { enabled: !!banner && ("showBanner" in cfg ? isOn(cfg.showBanner) : true), image: banner, link: "" },
      timer: {
        ...d.extras.timer,
        enabled: "showTimer" in cfg ? isOn(cfg.showTimer) : false,
        minutes: Math.max(1, Math.min(180, Number(cfg.timerMinutes) || 10)),
      },
      testimonials: { enabled: isOn(cfg.showTestimonials) && testimonials.length > 0, items: testimonials },
    },
    colors: primary
      ? { ...d.colors, preset: "personalizado", accent: primary, header: primary, button: hex(cfg.buttonColor) || primary }
      : d.colors,
  };
}

/* ------------------------------------------------------------------ exibição */

const RADIUS: Record<BuilderCorners, string> = { reto: "4px", suave: "14px", redondo: "24px" };

/** Variáveis CSS do checkout (cores + cantos), com fallback do preset. */
export function themeVars(c: CheckoutBuilderConfig): Record<string, string> {
  const base = PRESETS[0]!.colors;
  const col = (k: keyof ColorSet) => hex(c.colors[k]) || base[k];
  return {
    "--ck-page": col("page"),
    "--ck-card": col("card"),
    "--ck-text": col("text"),
    "--ck-accent": col("accent"),
    "--ck-header": col("header"),
    "--ck-header-text": col("headerText"),
    "--ck-btn": col("button"),
    "--ck-btn-text": col("buttonText"),
    "--ck-radius": RADIUS[c.colors.corners] ?? RADIUS.suave,
  };
}

/** Só links http(s) saem do checkout (nada de "javascript:..."). */
export function safeLink(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Imagem que dá pra mostrar: link http(s), data:image ou blob. */
export function safeImage(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return /^(https?:|data:image\/(png|jpe?g|webp|gif|avif);|blob:)/i.test(s) ? s : null;
}

/** VSL: player do YouTube/Vimeo (iframe) ou arquivo de vídeo. */
export function vslSource(url: string): { kind: "iframe" | "video"; src: string } | null {
  const u = safeLink(url);
  if (!u || !u.startsWith("https://")) return null;
  try {
    const p = new URL(u);
    const host = p.hostname.replace(/^www\.|^m\./, "");
    let yt = "";
    if (host === "youtu.be") yt = p.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      yt = p.searchParams.get("v") || p.pathname.replace(/^\/(embed|shorts|live)\//, "").replace(/^\//, "");
    }
    yt = yt.split(/[/?&#]/)[0] ?? "";
    if (yt && /^[\w-]{6,20}$/.test(yt)) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1` };
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = p.pathname.match(/(\d{5,})/)?.[1];
      if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
    }
    if (/\.(mp4|webm)$/i.test(p.pathname)) return { kind: "video", src: u };
  } catch {
    /* inválido */
  }
  return null;
}

export const brlCents = (cents: number) =>
  (Math.max(0, cents) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

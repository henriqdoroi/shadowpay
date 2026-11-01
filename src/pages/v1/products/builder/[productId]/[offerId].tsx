"use client";

/**
 * /v1/products/builder/:productId/:offerId — Checkout Builder de um checkout
 * (oferta) do produto.
 *
 * Colunas: abas · ajustes · prévia ao vivo (Desktop/Celular). A prévia é a
 * PRÓPRIA página do checkout num iframe (?preview=1) recebendo o rascunho por
 * postMessage — o que aparece aqui é o que o comprador vê. "Publicar" salva
 * (PUT /api/products/:id/offers/:offerId); o servidor saneia tudo.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  ImagePlus,
  LayoutTemplate,
  ListChecks,
  Loader2,
  Monitor,
  Palette,
  Plus,
  Redo2,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { LightShell } from "@/components/LightShell";
import { Button, FieldLabel, Hint, Switch, TextInput, inputCls } from "@/components/account/ui";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage } from "@/lib/axiosErrors";
import { CHECKOUT_IMAGE_ACCEPT, makeCheckoutImage } from "@/lib/checkoutImage";
import {
  type BuilderBump,
  type BuilderTemplate,
  type CheckoutBuilderConfig,
  PRESETS,
  SEAL_OPTIONS,
  TEMPLATES,
  brlCents,
  legacyToConfig,
  normalizeConfig,
} from "@/lib/checkoutConfig";
import type { PreviewScreen } from "@/components/checkout/OfferCheckout";

const API = "https://shadowpay-backend.onrender.com";

type Tab = "template" | "conteudo" | "campos" | "ofertas" | "extras" | "cores" | "pos";
const TABS: { key: Tab; label: string; icon: typeof LayoutTemplate }[] = [
  { key: "template", label: "Template", icon: LayoutTemplate },
  { key: "conteudo", label: "Conteúdo", icon: FileText },
  { key: "campos", label: "Campos", icon: ListChecks },
  { key: "ofertas", label: "Order bumps", icon: Tag },
  { key: "extras", label: "Extras", icon: Sparkles },
  { key: "cores", label: "Cores", icon: Palette },
  { key: "pos", label: "Pós-pagamento", icon: Redo2 },
];

type OfferView = {
  id: string;
  productId: string;
  internalName: string;
  active: boolean;
  isDefault: boolean;
  priceCents: number | null;
  effectivePriceCents: number;
  legacy: boolean;
  upsellUrl: string | null;
  backRedirectUrl: string | null;
  updatedAt: string;
  config: CheckoutBuilderConfig | null;
};
type BuilderProduct = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  status: string;
  imageUrl: string | null;
  upsellUrl: string | null;
  backRedirectUrl: string | null;
  warrantyDays: number;
  checkoutConfig: any;
};
type Draft = {
  internalName: string;
  price: string;
  upsellUrl: string;
  backRedirectUrl: string;
  config: CheckoutBuilderConfig;
};

const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function parseMoney(s: string): number {
  const t = String(s || "").trim();
  if (!t) return NaN;
  const n = t.includes(",") ? Number(t.replace(/\./g, "").replace(",", ".")) : Number(t);
  return Math.round(n * 100);
}
const newId = () => `b_${Math.random().toString(36).slice(2, 10)}`;

function toDraft(o: OfferView, p: BuilderProduct): Draft {
  return {
    internalName: o.internalName,
    price: o.priceCents != null ? money(o.priceCents) : "",
    upsellUrl: o.upsellUrl || "",
    backRedirectUrl: o.backRedirectUrl || "",
    config: o.config ? normalizeConfig(o.config) : legacyToConfig(p.checkoutConfig),
  };
}

/* ------------------------------------------------------------------ peças */

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-b border-slate-200 px-4 py-5 last:border-b-0">
      <h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>
      {hint && <p className="mt-0.5 text-[12.5px] text-slate-500">{hint}</p>}
      <div className="mt-3.5 space-y-3.5">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {children}
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-slate-800">{label}</p>
        {hint && <p className="mt-0.5 text-[12px] leading-snug text-slate-500">{hint}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

function ColorInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : placeholder || "#8a1ef7"}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="h-10 w-11 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
        />
        <input
          className={`${inputCls} h-10 font-mono text-[13px] uppercase`}
          value={text}
          placeholder={placeholder ? placeholder.toUpperCase() : "AUTO"}
          maxLength={7}
          onChange={(e) => {
            const v = e.target.value.trim();
            setText(v);
            if (/^#[0-9a-f]{6}$/i.test(v)) onChange(v.toLowerCase());
            if (!v) onChange("");
          }}
        />
      </div>
    </div>
  );
}

function ImagePick({
  label,
  hint,
  value,
  onChange,
  maxSide = 1600,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  maxSide?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const isLink = /^https?:\/\//i.test(value);
  // o link digitado fica aqui até ser um https:// completo (o servidor só aceita https)
  const [linkText, setLinkText] = useState(isLink ? value : "");
  useEffect(() => {
    setLinkText(/^https?:\/\//i.test(value) ? value : "");
  }, [value]);
  const linkBad = !!linkText && !/^https:\/\/\S+$/i.test(linkText);
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      onChange(await makeCheckoutImage(f, maxSide));
    } catch (e: any) {
      toast.error(e?.message || "Não consegui usar essa imagem.");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input ref={ref} type="file" accept={CHECKOUT_IMAGE_ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-14 w-14 shrink-0 rounded-lg bg-slate-100 object-contain" />
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            <Button variant="outline" className="h-9 px-3 text-[12.5px]" loading={busy} onClick={() => ref.current?.click()}>
              Trocar
            </Button>
            <Button variant="ghost" className="h-9 px-3 text-[12.5px] text-rose-600" onClick={() => onChange("")}>
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-3 py-4 text-[13px] font-medium text-slate-500 transition-colors hover:border-violet-300 hover:text-violet-600"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          Enviar imagem
        </button>
      )}
      {!value || isLink ? (
        <input
          className={`${inputCls} mt-2 h-9 text-[12.5px]`}
          placeholder="ou cole o link da imagem (https://...)"
          value={linkText}
          onChange={(e) => {
            const v = e.target.value.trim();
            setLinkText(v);
            if (/^https:\/\/\S+$/i.test(v)) onChange(v);
            else if (!v && isLink) onChange("");
          }}
        />
      ) : null}
      {linkBad && <Hint tone="error">O link precisa começar com https://</Hint>}
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

function Accordion({ title, on, children }: { title: string; on: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-3.5 py-3 text-left">
        <span className="flex-1 text-[13.5px] font-medium text-slate-800">{title}</span>
        {on && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">Ligado</span>}
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-3.5 border-t border-slate-200 px-3.5 py-3.5">{children}</div>}
    </div>
  );
}

/** Desenho do template (miniatura). */
function TemplateThumb({ t }: { t: BuilderTemplate }) {
  const bar = "rounded-[3px] bg-violet-300/70";
  const box = "rounded-[4px] border border-slate-300 bg-white";
  return (
    <div className="flex h-16 w-20 shrink-0 flex-col gap-1 rounded-lg bg-slate-100 p-1.5">
      <div className="h-1.5 rounded-sm bg-slate-700" />
      {t === "padrao" && (
        <div className="flex flex-1 gap-1">
          <div className={`${box} flex-[3] p-1`}>
            <div className={`${bar} h-1`} />
            <div className="mt-1 h-1 rounded-sm bg-slate-200" />
            <div className="mt-1 h-1 rounded-sm bg-slate-200" />
          </div>
          <div className={`${box} flex-[2]`} />
        </div>
      )}
      {t === "compacto" && (
        <div className={`${box} mx-auto w-3/5 flex-1 p-1`}>
          <div className={`${bar} h-1`} />
          <div className="mt-1 h-1 rounded-sm bg-slate-200" />
        </div>
      )}
      {t === "pix-direto" && (
        <div className={`${box} mx-auto flex w-3/5 flex-1 items-center justify-center`}>
          <div className="h-5 w-5 rounded-[2px] border-2 border-slate-500" />
        </div>
      )}
      {t === "loja" && (
        <div className="flex flex-1 flex-col gap-1">
          <div className={`${box} h-3`} />
          <div className={`${box} h-3`} />
          <div className={`${bar} mt-auto h-2`} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ página */

function BuilderContent() {
  const router = useRouter();
  const { token } = useAuth();
  const productId = typeof router.query.productId === "string" ? router.query.productId : "";
  const offerId = typeof router.query.offerId === "string" ? router.query.offerId : "";

  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [product, setProduct] = useState<BuilderProduct | null>(null);
  const [offer, setOffer] = useState<OfferView | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [savedJson, setSavedJson] = useState("");
  const [tab, setTab] = useState<Tab>("template");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [screen, setScreen] = useState<PreviewScreen>("checkout");
  const [publishing, setPublishing] = useState(false);
  const [pane, setPane] = useState<"ajustes" | "previa">("ajustes");

  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  useEffect(() => {
    if (!token || !productId || !offerId) return;
    axios
      .get(`${API}/api/products/${productId}/offers/${offerId}`, auth)
      .then((r) => {
        const o: OfferView = r.data?.data?.offer;
        const p: BuilderProduct = r.data?.data?.product;
        setProduct(p);
        setOffer(o);
        const d = toDraft(o, p);
        setDraft(d);
        setSavedJson(JSON.stringify(d));
      })
      .catch((e) => setLoadErr(apiErrorMessage(e, "Não consegui abrir esse checkout.")));
  }, [token, productId, offerId, auth]);

  const dirty = !!draft && JSON.stringify(draft) !== savedJson;
  const canPublish = !!draft && (dirty || !!offer?.legacy);
  const draftRef = useRef<Draft | null>(null);
  draftRef.current = draft;

  // sair por um link do painel com alteração pendente: pergunta antes
  useEffect(() => {
    if (!dirty) return;
    const onRoute = (url: string) => {
      if (url === router.asPath) return;
      if (window.confirm("Você tem alterações não publicadas. Sair mesmo assim?")) return;
      router.events.emit("routeChangeError");
      // cancela a navegação (padrão do Next pages router)
      throw "Navegação cancelada: alterações não publicadas.";
    };
    router.events.on("routeChangeStart", onRoute);
    return () => router.events.off("routeChangeStart", onRoute);
  }, [dirty, router]);

  /* ---------- edição ---------- */
  const setCfg = (fn: (c: CheckoutBuilderConfig) => CheckoutBuilderConfig) =>
    setDraft((d) => (d ? { ...d, config: fn(d.config) } : d));
  const setMeta = (patch: Partial<Omit<Draft, "config">>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const setContent = (patch: Partial<CheckoutBuilderConfig["content"]>) => setCfg((c) => ({ ...c, content: { ...c.content, ...patch } }));
  const setFields = (patch: Partial<CheckoutBuilderConfig["fields"]>) => setCfg((c) => ({ ...c, fields: { ...c.fields, ...patch } }));
  const setColors = (patch: Partial<CheckoutBuilderConfig["colors"]>) => setCfg((c) => ({ ...c, colors: { ...c.colors, ...patch } }));
  function setExtra<K extends keyof CheckoutBuilderConfig["extras"]>(k: K, patch: Partial<CheckoutBuilderConfig["extras"][K]>) {
    setCfg((c) => ({ ...c, extras: { ...c.extras, [k]: { ...c.extras[k], ...patch } } }));
  }
  // listas (selos, depoimentos) sempre sobre o estado ATUAL — uma foto que
  // termina de comprimir depois não desfaz o que foi digitado nesse meio-tempo
  type Sealed = CheckoutBuilderConfig["extras"]["seals"]["items"];
  type Testis = CheckoutBuilderConfig["extras"]["testimonials"]["items"];
  const setSeals = (fn: (items: Sealed) => Sealed) =>
    setCfg((c) => ({ ...c, extras: { ...c.extras, seals: { ...c.extras.seals, items: fn(c.extras.seals.items) } } }));
  const setTestis = (fn: (items: Testis) => Testis) =>
    setCfg((c) => ({
      ...c,
      extras: { ...c.extras, testimonials: { ...c.extras.testimonials, items: fn(c.extras.testimonials.items) } },
    }));
  const setBump = (i: number, patch: Partial<BuilderBump>) =>
    setCfg((c) => ({ ...c, bumps: c.bumps.map((b, k) => (k === i ? { ...b, ...patch } : b)) }));
  const moveBump = (i: number, dir: -1 | 1) =>
    setCfg((c) => {
      const list = c.bumps.slice();
      const j = i + dir;
      if (j < 0 || j >= list.length) return c;
      [list[i], list[j]] = [list[j]!, list[i]!];
      return { ...c, bumps: list };
    });

  /* ---------- publicar ---------- */
  const publish = useCallback(async () => {
    if (!draft || !offer || !product || publishing) return;
    const cents = draft.price.trim() ? parseMoney(draft.price) : null;
    if (cents != null && !(cents >= 100)) {
      toast.error("Preço do checkout: mínimo R$ 1,00 (ou deixe vazio pra usar o do produto).");
      setTab("conteudo");
      return;
    }
    const badBump = draft.config.bumps.find((b) => !b.title.trim() || !(b.priceCents > 0));
    if (badBump) {
      toast.error("Todo order bump precisa de nome e preço.");
      setTab("ofertas");
      return;
    }
    setPublishing(true);
    const sent = JSON.stringify(draft);
    try {
      const r = await axios.put(
        `${API}/api/products/${product.id}/offers/${offer.id}`,
        {
          internalName: draft.internalName,
          priceCents: cents,
          upsellUrl: draft.upsellUrl,
          backRedirectUrl: draft.backRedirectUrl,
          config: draft.config,
          baseUpdatedAt: offer.updatedAt,
        },
        auth,
      );
      const o: OfferView = r.data?.data;
      setOffer(o);
      const d = toDraft(o, product);
      setSavedJson(JSON.stringify(d));
      // editou enquanto publicava? mantém o rascunho (continua "não publicado")
      if (JSON.stringify(draftRef.current) === sent) setDraft(d);
      toast.success("Checkout publicado! O link já mostra a versão nova.");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Não consegui publicar. Tente de novo."));
    } finally {
      setPublishing(false);
    }
  }, [draft, offer, product, publishing, auth]);

  // Ctrl+S publica; sair com alteração pendente pergunta antes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void publish();
      }
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [publish, dirty]);

  /* ---------- prévia (iframe da própria página do checkout) ---------- */
  const frameRef = useRef<HTMLIFrameElement>(null);
  const effPrice = draft && draft.price.trim() && parseMoney(draft.price) >= 100 ? parseMoney(draft.price) : product?.priceCents ?? 0;
  const postPreview = useCallback(() => {
    const w = frameRef.current?.contentWindow;
    if (!w || !draft || !product || !offer) return;
    w.postMessage(
      {
        type: "sp:checkout-preview",
        screen,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          image: product.checkoutConfig?.productImageUrl || product.imageUrl,
          warrantyDays: product.warrantyDays,
          checkoutConfig: product.checkoutConfig,
          priceCents: effPrice,
        },
        offer: { id: offer.id, priceCents: effPrice, config: draft.config },
      },
      window.location.origin,
    );
  }, [draft, product, offer, screen, effPrice]);
  useEffect(() => {
    const t = setTimeout(postPreview, 120);
    return () => clearTimeout(t);
  }, [postPreview]);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === "sp:preview-ready") postPreview();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [postPreview]);

  // escala do iframe pra caber na coluna
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: 800, h: 700 });
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => e && setStage({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [draft != null]);
  const frame = device === "desktop" ? { w: 1280, h: 0 } : { w: 390, h: 844 };
  const scale =
    device === "desktop"
      ? Math.min(1, (stage.w - 24) / frame.w)
      : Math.min(1, (stage.h - 48) / frame.h, (stage.w - 48) / frame.w);
  const frameH = device === "desktop" ? Math.max(400, (stage.h - 24) / scale) : frame.h;

  const publicUrl =
    typeof window !== "undefined" && offer
      ? `${window.location.origin}/v1/checkout/${offer.productId}${offer.isDefault ? "" : `?o=${offer.id}`}`
      : "";

  if (loadErr) {
    return (
      <LightShell>
        <div className="mx-auto mt-10 max-w-md text-center">
          <p className="text-[15px] text-slate-700">{loadErr}</p>
          <Link href="/v1/products" className="mt-3 inline-block text-[14px] font-medium text-violet-600 underline">
            Voltar pros produtos
          </Link>
        </div>
      </LightShell>
    );
  }
  if (!draft || !product || !offer) {
    return (
      <LightShell>
        <div className="flex h-[60vh] items-center justify-center text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Abrindo o builder…
        </div>
      </LightShell>
    );
  }

  const c = draft.config;
  const ex = c.extras;

  /* ---------- abas ---------- */
  const panels: Record<Tab, ReactNode> = {
    template: (
      <>
        <Section title="Escolha o template" hint="O estilo da página de pagamento. Os textos, cores e extras ficam nas outras abas.">
          <div className="space-y-2.5">
            {TEMPLATES.map((t) => {
              const on = c.template === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setCfg((x) => ({ ...x, template: t.key }))}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    on ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <TemplateThumb t={t.key} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-900">
                      {t.label}
                      {on && <CheckCircle2 className="h-4 w-4 text-violet-600" />}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-slate-500">{t.text}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Section>
        {c.template === "padrao" && (
          <Section title="Colunas no computador" hint="No celular é sempre uma coluna.">
            <div className="grid grid-cols-2 gap-2">
              {(["duas", "uma"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setCfg((x) => ({ ...x, layout: l }))}
                  className={`rounded-xl border px-3 py-2.5 text-[13px] font-medium ${
                    c.layout === l ? "border-violet-400 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-600"
                  }`}
                >
                  {l === "duas" ? "2 colunas" : "1 coluna"}
                </button>
              ))}
            </div>
          </Section>
        )}
        {c.template === "loja" && (
          <Section title="Loja" hint="Frete, prazo e cupons ficam em Editar produto › Checkouts (valem pra todos os checkouts Loja do produto).">
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-amber-800">
              O template Loja tem visual próprio de e-commerce (endereço, frete e cupom). Dele valem: nome e imagem do
              produto, logo, campos do comprador, order bumps, desconto no Pix, preço e pós-pagamento. Cores, extras e os
              textos da tela do Pix das outras abas valem só nos templates Padrão, Compacto e Pix direto.
            </p>
          </Section>
        )}
      </>
    ),
    conteudo: (
      <>
        <Section title="Identificação" hint="Só você vê.">
          <Row label="Nome interno">
            <TextInput value={draft.internalName} maxLength={60} onChange={(e) => setMeta({ internalName: e.target.value })} />
          </Row>
        </Section>
        <Section title="Preço deste checkout" hint="Cada checkout pode ter preço próprio. Vazio = preço do produto.">
          <Row label="Preço (R$)" hint={`Preço do produto: ${brlCents(product.priceCents)} · este checkout: ${brlCents(effPrice)}`}>
            <TextInput
              inputMode="decimal"
              placeholder={money(product.priceCents)}
              value={draft.price}
              onChange={(e) => setMeta({ price: e.target.value.replace(/[^\d.,]/g, "") })}
              onBlur={() => {
                const v = parseMoney(draft.price);
                if (v > 0) setMeta({ price: money(v) });
              }}
            />
          </Row>
        </Section>
        <Section title="O que o comprador vê">
          <Row label="Nome do produto" hint="Vazio = nome do produto.">
            <TextInput value={c.content.title} maxLength={120} placeholder={product.name} onChange={(e) => setContent({ title: e.target.value })} />
          </Row>
          <Row label="Descrição curta">
            <textarea
              className={`${inputCls} h-auto resize-none py-2.5`}
              rows={3}
              maxLength={400}
              placeholder={product.description || "O que a pessoa está levando"}
              value={c.content.subtitle}
              onChange={(e) => setContent({ subtitle: e.target.value })}
            />
          </Row>
          <ImagePick label="Imagem do produto" hint="Vazio = imagem do produto." value={c.content.image} maxSide={900} onChange={(v) => setContent({ image: v })} />
          <ImagePick label="Logo (cabeçalho)" value={c.content.logo} maxSide={500} onChange={(v) => setContent({ logo: v })} />
          <Row label="Texto do botão">
            <TextInput value={c.content.buttonText} maxLength={40} placeholder="Comprar agora com Pix" onChange={(e) => setContent({ buttonText: e.target.value })} />
          </Row>
          <Row label="Texto do cabeçalho de segurança">
            <TextInput value={c.content.securityText} maxLength={80} placeholder="Pagamento 100% seguro" onChange={(e) => setContent({ securityText: e.target.value })} />
          </Row>
        </Section>
        <Section title="Tela do Pix" hint="Depois que o Pix é gerado.">
          <Row label="Título">
            <TextInput value={c.content.pixTitle} maxLength={80} placeholder="Pague com Pix pra finalizar" onChange={(e) => setContent({ pixTitle: e.target.value })} />
          </Row>
          <Row label="Instruções">
            <textarea
              className={`${inputCls} h-auto resize-none py-2.5`}
              rows={3}
              maxLength={300}
              placeholder="1. Copie o código. 2. Abra o app do banco… "
              value={c.content.pixInstructions}
              onChange={(e) => setContent({ pixInstructions: e.target.value })}
            />
          </Row>
          <Row label="Botão de copiar">
            <TextInput value={c.content.copyButton} maxLength={40} placeholder="Copiar código Pix" onChange={(e) => setContent({ copyButton: e.target.value })} />
          </Row>
        </Section>
      </>
    ),
    campos: (
      <>
        <Section title="Dados do comprador" hint="Menos campos = mais conversão. Sem nenhum, o Pix sai só com o clique.">
          <Toggle label="Nome" checked={c.fields.name} onChange={(v) => setFields({ name: v })} />
          <Toggle label="E-mail" hint="Recomendado: é por onde o comprador recebe o acesso." checked={c.fields.email} onChange={(v) => setFields({ email: v })} />
          <Toggle label="Celular (WhatsApp)" checked={c.fields.phone} onChange={(v) => setFields({ phone: v })} />
          <Toggle label="CPF" checked={c.fields.cpf} onChange={(v) => setFields({ cpf: v })} />
        </Section>
        <Section title="Pix">
          <Row label="Desconto no Pix (%)" hint="Aparece no resumo e é aplicado pelo servidor.">
            <TextInput
              inputMode="numeric"
              value={c.pixDiscountPercent ? String(c.pixDiscountPercent) : ""}
              placeholder="0"
              onChange={(e) => setCfg((x) => ({ ...x, pixDiscountPercent: Math.min(90, Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0)) }))}
            />
          </Row>
          <Toggle
            label="Aviso do banco na tela do Pix"
            hint="Na 1ª transferência pra um recebedor novo o banco mostra um alerta. Avisar antes evita que o comprador desista."
            checked={c.fields.bankNotice}
            onChange={(v) => setFields({ bankNotice: v })}
          />
        </Section>
      </>
    ),
    ofertas: (
      <Section title="Order bumps" hint="Ofertas extras marcadas antes de pagar. O preço é conferido pelo servidor.">
        {c.bumps.map((b, i) => (
          <div key={b.id} className="space-y-3 rounded-xl border border-slate-200 p-3.5">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Bump {i + 1}</span>
              <span className="flex-1" />
              <button type="button" aria-label="Subir" onClick={() => moveBump(i, -1)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" aria-label="Descer" onClick={() => moveBump(i, 1)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
                <ArrowDown className="h-4 w-4" />
              </button>
              <Switch checked={b.active} onChange={(v) => setBump(i, { active: v })} label={`Ligar bump ${i + 1}`} />
              <button
                type="button"
                aria-label="Remover bump"
                onClick={() => setCfg((x) => ({ ...x, bumps: x.bumps.filter((_, k) => k !== i) }))}
                className="rounded-md p-1 text-rose-500 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <TextInput placeholder="Nome do bump" maxLength={80} value={b.title} onChange={(e) => setBump(i, { title: e.target.value })} />
              <TextInput
                inputMode="decimal"
                placeholder="0,00"
                aria-label={`Preço do bump ${i + 1}`}
                defaultValue={b.priceCents ? money(b.priceCents) : ""}
                // preço vale a cada tecla (prévia ao vivo); ao sair do campo, formata
                onChange={(e) => setBump(i, { priceCents: Math.max(0, parseMoney(e.target.value) || 0) })}
                onBlur={(e) => {
                  const v = parseMoney(e.target.value);
                  if (v > 0) e.target.value = money(v);
                }}
              />
            </div>
            <textarea
              className={`${inputCls} h-auto resize-none py-2.5`}
              rows={2}
              maxLength={240}
              placeholder="Por que vale a pena levar junto"
              value={b.description}
              onChange={(e) => setBump(i, { description: e.target.value })}
            />
            <ImagePick label="Imagem (opcional)" value={b.image} maxSide={500} onChange={(v) => setBump(i, { image: v })} />
          </div>
        ))}
        {c.bumps.length < 10 && (
          <Button
            variant="outline"
            icon={<Plus className="h-4 w-4" />}
            onClick={() =>
              setCfg((x) => ({ ...x, bumps: [...x.bumps, { id: newId(), title: "", description: "", priceCents: 0, image: "", active: true }] }))
            }
          >
            Adicionar order bump
          </Button>
        )}
      </Section>
    ),
    extras: (
      <Section title="Extras" hint="Blocos opcionais da página. Ligue só o que ajuda a vender.">
        <Accordion title="Faixa de anúncio" on={ex.announcement.enabled}>
          <Toggle label="Mostrar faixa no topo" checked={ex.announcement.enabled} onChange={(v) => setExtra("announcement", { enabled: v })} />
          <Row label="Texto">
            <TextInput maxLength={140} placeholder="Frete grátis só hoje!" value={ex.announcement.text} onChange={(e) => setExtra("announcement", { text: e.target.value })} />
          </Row>
          <div className="grid grid-cols-2 gap-2">
            <ColorInput label="Fundo" value={ex.announcement.bg} placeholder={c.colors.accent} onChange={(v) => setExtra("announcement", { bg: v })} />
            <ColorInput label="Texto" value={ex.announcement.color} placeholder="#ffffff" onChange={(v) => setExtra("announcement", { color: v })} />
          </div>
        </Accordion>
        <Accordion title="Banner em imagem (topo)" on={ex.banner.enabled}>
          <Toggle label="Mostrar banner" checked={ex.banner.enabled} onChange={(v) => setExtra("banner", { enabled: v })} />
          <ImagePick label="Imagem" hint="Largura recomendada: 1200px ou mais." value={ex.banner.image} onChange={(v) => setExtra("banner", { image: v })} />
          <Row label="Link ao clicar (opcional)">
            <TextInput placeholder="https://" value={ex.banner.link} onChange={(e) => setExtra("banner", { link: e.target.value })} />
          </Row>
        </Accordion>
        <Accordion title="Contador de escassez" on={ex.timer.enabled}>
          <Toggle label="Mostrar contador" checked={ex.timer.enabled} onChange={(v) => setExtra("timer", { enabled: v })} />
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <Row label="Minutos">
              <TextInput
                inputMode="numeric"
                value={String(ex.timer.minutes)}
                onChange={(e) => setExtra("timer", { minutes: Math.min(180, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)) })}
              />
            </Row>
            <Row label="Texto">
              <TextInput maxLength={100} placeholder="Oferta por tempo limitado" value={ex.timer.text} onChange={(e) => setExtra("timer", { text: e.target.value })} />
            </Row>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ColorInput label="Fundo" value={ex.timer.bg} placeholder={c.colors.accent} onChange={(v) => setExtra("timer", { bg: v })} />
            <ColorInput label="Texto" value={ex.timer.color} placeholder="#ffffff" onChange={(v) => setExtra("timer", { color: v })} />
          </div>
        </Accordion>
        <Accordion title="Vídeo de vendas (VSL)" on={ex.vsl.enabled}>
          <Toggle label="Mostrar vídeo" checked={ex.vsl.enabled} onChange={(v) => setExtra("vsl", { enabled: v })} />
          <Row label="Link do vídeo" hint="YouTube, Vimeo ou arquivo .mp4.">
            <TextInput placeholder="https://youtu.be/..." value={ex.vsl.url} onChange={(e) => setExtra("vsl", { url: e.target.value.trim() })} />
          </Row>
          <Row label="Frase acima do vídeo">
            <TextInput maxLength={140} value={ex.vsl.headline} onChange={(e) => setExtra("vsl", { headline: e.target.value })} />
          </Row>
        </Accordion>
        <Accordion title="Imagem abaixo do checkout" on={ex.imageBelow.enabled}>
          <Toggle label="Mostrar imagem" checked={ex.imageBelow.enabled} onChange={(v) => setExtra("imageBelow", { enabled: v })} />
          <ImagePick label="Imagem" hint="Boa pra bandeiras de pagamento, Reclame Aqui ou arte de garantia." value={ex.imageBelow.image} onChange={(v) => setExtra("imageBelow", { image: v })} />
          <Row label="Link ao clicar (opcional)">
            <TextInput placeholder="https://" value={ex.imageBelow.link} onChange={(e) => setExtra("imageBelow", { link: e.target.value })} />
          </Row>
          <Toggle label="Esticar de ponta a ponta" checked={ex.imageBelow.full} onChange={(v) => setExtra("imageBelow", { full: v })} />
        </Accordion>
        <Accordion title="Suporte no WhatsApp" on={ex.whatsapp.enabled}>
          <Toggle label="Botão flutuante" checked={ex.whatsapp.enabled} onChange={(v) => setExtra("whatsapp", { enabled: v })} />
          <Row label="Número com DDI e DDD">
            <TextInput inputMode="tel" placeholder="5511999999999" value={ex.whatsapp.number} onChange={(e) => setExtra("whatsapp", { number: e.target.value.replace(/\D/g, "").slice(0, 15) })} />
          </Row>
          <Row label="Mensagem inicial">
            <TextInput maxLength={200} placeholder="Oi! Tenho uma dúvida sobre a compra." value={ex.whatsapp.message} onChange={(e) => setExtra("whatsapp", { message: e.target.value })} />
          </Row>
        </Accordion>
        <Accordion title="Selos de segurança" on={ex.seals.enabled}>
          <Toggle label="Mostrar selos" checked={ex.seals.enabled} onChange={(v) => setExtra("seals", { enabled: v })} />
          {ex.seals.items.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                aria-label="Ícone"
                className={`${inputCls} h-10 w-[120px] shrink-0 text-[13px]`}
                value={s.icon}
                onChange={(e) =>
                  setSeals((items) => items.map((x, k) => (k === i ? { ...x, icon: e.target.value as any } : x)))
                }
              >
                <option value="shield">Escudo</option>
                <option value="lock">Cadeado</option>
                <option value="medal">Medalha</option>
                <option value="bolt">Raio</option>
                <option value="rocket">Foguete</option>
                <option value="handshake">Aperto de mão</option>
              </select>
              <TextInput
                className="h-10"
                maxLength={40}
                value={s.label}
                onChange={(e) => setSeals((items) => items.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))}
              />
              <button type="button" aria-label="Remover selo" onClick={() => setSeals((items) => items.filter((_, k) => k !== i))} className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {ex.seals.items.length < 6 && (
            <Button
              variant="ghost"
              className="h-9 px-3 text-[12.5px]"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                const next = SEAL_OPTIONS.find((o) => !ex.seals.items.some((s) => s.icon === o.icon)) ?? SEAL_OPTIONS[0]!;
                setSeals((items) => [...items, next]);
              }}
            >
              Adicionar selo
            </Button>
          )}
        </Accordion>
        <Accordion title="Depoimentos" on={ex.testimonials.enabled}>
          <Toggle label="Mostrar depoimentos" checked={ex.testimonials.enabled} onChange={(v) => setExtra("testimonials", { enabled: v })} />
          {ex.testimonials.items.map((t, i) => {
            const upd = (patch: Partial<typeof t>) =>
              setTestis((items) => items.map((x, k) => (k === i ? { ...x, ...patch } : x)));
            return (
              <div key={i} className="space-y-2.5 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <TextInput className="h-10" placeholder="Nome" maxLength={60} value={t.name} onChange={(e) => upd({ name: e.target.value })} />
                  <select aria-label="Nota" className={`${inputCls} h-10 w-[84px] shrink-0 text-[13px]`} value={t.rating} onChange={(e) => upd({ rating: Number(e.target.value) })}>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} ★
                      </option>
                    ))}
                  </select>
                  <button type="button" aria-label="Remover depoimento" onClick={() => setTestis((items) => items.filter((_, k) => k !== i))} className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea className={`${inputCls} h-auto resize-none py-2.5`} rows={2} maxLength={500} placeholder="O que a pessoa disse" value={t.text} onChange={(e) => upd({ text: e.target.value })} />
                <ImagePick label="Foto (opcional)" value={t.image} maxSide={240} onChange={(v) => upd({ image: v })} />
              </div>
            );
          })}
          {ex.testimonials.items.length < 12 && (
            <Button
              variant="ghost"
              className="h-9 px-3 text-[12.5px]"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setTestis((items) => [...items, { name: "", text: "", rating: 5, image: "" }])}
            >
              Adicionar depoimento
            </Button>
          )}
        </Accordion>
      </Section>
    ),
    cores: (
      <>
        <Section title="Paletas prontas" hint="Comece por uma e ajuste o que quiser.">
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => {
              const on = c.colors.preset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setColors({ preset: p.key, ...p.colors })}
                  className={`overflow-hidden rounded-xl border text-left ${on ? "border-violet-400 ring-2 ring-violet-200" : "border-slate-200"}`}
                >
                  <div className="flex h-10">
                    <span className="flex-1" style={{ background: p.colors.page }} />
                    <span className="flex-1" style={{ background: p.colors.button }} />
                    <span className="flex-1" style={{ background: p.colors.header }} />
                  </div>
                  <p className="px-2.5 py-1.5 text-[12.5px] font-medium text-slate-700">{p.label}</p>
                </button>
              );
            })}
          </div>
        </Section>
        <Section title="Cores">
          <div className="grid grid-cols-2 gap-3">
            <ColorInput label="Fundo da página" value={c.colors.page} onChange={(v) => setColors({ page: v, preset: "personalizado" })} />
            <ColorInput label="Fundo dos cards" value={c.colors.card} onChange={(v) => setColors({ card: v, preset: "personalizado" })} />
            <ColorInput label="Texto" value={c.colors.text} onChange={(v) => setColors({ text: v, preset: "personalizado" })} />
            <ColorInput label="Destaque (preço)" value={c.colors.accent} onChange={(v) => setColors({ accent: v, preset: "personalizado" })} />
            <ColorInput label="Cabeçalho" value={c.colors.header} onChange={(v) => setColors({ header: v, preset: "personalizado" })} />
            <ColorInput label="Texto do cabeçalho" value={c.colors.headerText} onChange={(v) => setColors({ headerText: v, preset: "personalizado" })} />
            <ColorInput label="Botão" value={c.colors.button} onChange={(v) => setColors({ button: v, preset: "personalizado" })} />
            <ColorInput label="Texto do botão" value={c.colors.buttonText} onChange={(v) => setColors({ buttonText: v, preset: "personalizado" })} />
          </div>
        </Section>
        <Section title="Cantos">
          <div className="grid grid-cols-3 gap-2">
            {(["reto", "suave", "redondo"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setColors({ corners: k })}
                className={`border px-3 py-2.5 text-[13px] font-medium capitalize ${
                  c.colors.corners === k ? "border-violet-400 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-600"
                }`}
                style={{ borderRadius: k === "reto" ? 4 : k === "suave" ? 12 : 22 }}
              >
                {k}
              </button>
            ))}
          </div>
        </Section>
      </>
    ),
    pos: (
      <>
        <Section title="Depois de pagar" hint="Pra onde o comprador vai na hora que o Pix é aprovado: outra oferta (upsell) ou sua página de obrigado.">
          <Row label="URL de destino" hint={product.upsellUrl ? `Vazio = a do produto (${product.upsellUrl}).` : "Vazio = fica na tela de pagamento aprovado."}>
            <TextInput placeholder="https://seusite.com/obrigado" value={draft.upsellUrl} onChange={(e) => setMeta({ upsellUrl: e.target.value })} />
          </Row>
        </Section>
        <Section title="Saída sem pagar (back redirect)" hint="Pra onde vai quem aperta voltar no navegador.">
          <Row label="URL do back redirect" hint={product.backRedirectUrl ? `Vazio = a do produto (${product.backRedirectUrl}).` : undefined}>
            <TextInput placeholder="https://seusite.com/oferta-especial" value={draft.backRedirectUrl} onChange={(e) => setMeta({ backRedirectUrl: e.target.value })} />
          </Row>
        </Section>
        <Section title="Garantia">
          <Row label="Texto de garantia" hint={product.warrantyDays ? `Vazio = "Garantia de ${product.warrantyDays} dias…"` : undefined}>
            <textarea
              className={`${inputCls} h-auto resize-none py-2.5`}
              rows={3}
              maxLength={300}
              value={c.post.guarantee}
              onChange={(e) => setCfg((x) => ({ ...x, post: { ...x.post, guarantee: e.target.value } }))}
            />
          </Row>
        </Section>
      </>
    ),
  };

  return (
    <LightShell>
      <Head>
        <title>ShadowPay — Checkout Builder</title>
      </Head>

      {/* barra do builder */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          href={`/v1/products/edit/${product.id}?tab=checkouts`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          aria-label="Voltar pro produto"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium uppercase tracking-wide text-violet-600">Checkout Builder</p>
          <h1 className="truncate text-[18px] font-semibold text-slate-900">
            {draft.internalName || "Checkout"} <span className="font-normal text-slate-400">· {product.name}</span>
          </h1>
        </div>
        <span
          className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold sm:inline-flex ${
            canPublish ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {canPublish ? (offer.legacy && !dirty ? "Visual clássico" : "Alterações não publicadas") : "Tudo publicado"}
        </span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(publicUrl).then(() => toast.success("Link copiado."));
          }}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
        >
          <Copy className="h-4 w-4" /> Link
        </button>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
        >
          <ExternalLink className="h-4 w-4" /> Abrir
        </a>
        <Button className="h-9 px-4" loading={publishing} disabled={!canPublish} icon={<Upload className="h-4 w-4" />} onClick={publish}>
          Publicar
        </Button>
      </div>

      {offer.legacy && (
        <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-[13px] text-violet-800">
          Esse checkout ainda usa o visual clássico. Ajuste aqui e clique em <strong>Publicar</strong> pra ele passar a usar o visual do builder.
        </div>
      )}

      {/* celular: alterna ajustes e prévia */}
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 lg:hidden">
        {(["ajustes", "previa"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setPane(k)}
            className={`rounded-lg py-2 text-[13px] font-semibold ${pane === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            {k === "ajustes" ? "Ajustes" : "Prévia"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:h-[calc(100vh-11.5rem)] lg:grid-cols-[176px_360px_minmax(0,1fr)]">
        {/* abas */}
        <nav className={`${pane === "ajustes" ? "flex" : "hidden"} gap-1 overflow-x-auto lg:flex lg:flex-col lg:overflow-visible`}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                data-active={on ? "true" : "false"}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors ${
                  on ? "bg-violet-600 text-white shadow-[0_8px_20px_-10px_rgba(138,30,247,0.8)]" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* ajustes */}
        <div className={`${pane === "ajustes" ? "block" : "hidden"} overflow-y-auto rounded-2xl border border-slate-200 bg-white lg:block`}>
          {panels[tab]}
        </div>

        {/* prévia */}
        <div className={`${pane === "previa" ? "flex" : "hidden"} min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 lg:flex lg:min-h-0`}>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
            <span className="text-[12.5px] font-semibold text-slate-700">Prévia ao vivo</span>
            <span className="flex-1" />
            {/* no Loja a tela do Pix é a página própria do pedido (sem prévia aqui) */}
            <div className={`${c.template === "loja" ? "hidden" : "flex"} rounded-lg bg-slate-100 p-0.5`}>
              {(["checkout", "pix", "paid"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScreen(s)}
                  className={`rounded-md px-2.5 py-1 text-[12px] font-medium ${screen === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  {s === "checkout" ? "Checkout" : s === "pix" ? "Tela do Pix" : "Aprovado"}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              <button
                type="button"
                aria-label="Computador"
                onClick={() => setDevice("desktop")}
                className={`rounded-md px-2 py-1 ${device === "desktop" ? "bg-white text-violet-600 shadow-sm" : "text-slate-500"}`}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Celular"
                onClick={() => setDevice("mobile")}
                className={`rounded-md px-2 py-1 ${device === "mobile" ? "bg-white text-violet-600 shadow-sm" : "text-slate-500"}`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div ref={stageRef} className="relative flex flex-1 items-start justify-center overflow-hidden p-3">
            <div
              style={{
                width: frame.w * scale,
                height: frameH * scale,
                borderRadius: device === "mobile" ? 36 * scale : 12,
                overflow: "hidden",
                // moldura do celular fora da área do iframe (não corta a página)
                boxShadow:
                  device === "mobile"
                    ? `0 0 0 ${Math.max(4, 10 * scale)}px #16131f, 0 20px 50px -20px rgba(16,12,24,0.45)`
                    : "0 0 0 1px rgba(16,12,24,0.08), 0 20px 50px -20px rgba(16,12,24,0.35)",
                marginTop: device === "mobile" ? Math.max(4, 10 * scale) : 0,
                background: "#fff",
              }}
            >
              <iframe
                ref={frameRef}
                title="Prévia do checkout"
                src={`/v1/checkout/${product.id}?preview=1`}
                onLoad={postPreview}
                style={{ width: frame.w, height: frameH, transform: `scale(${scale})`, transformOrigin: "0 0", border: 0 }}
              />
            </div>
          </div>
        </div>
      </div>
    </LightShell>
  );
}

export default function CheckoutBuilderPage() {
  return (
    <ProtectedRoute>
      <BuilderContent />
    </ProtectedRoute>
  );
}

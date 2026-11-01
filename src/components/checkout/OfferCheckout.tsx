"use client";

/**
 * Checkout montado pelo Checkout Builder (config v1 da oferta).
 *
 * Templates: Padrão (2 colunas no computador), Compacto (um cartão) e Pix
 * direto (gera o Pix ao abrir). O template Loja usa o StoreCheckout.
 * O VALOR nunca sai daqui: o servidor recalcula (oferta + bumps − Pix).
 *
 * `preview` (builder): sem rede nenhuma — não gera Pix, não registra visita
 * e mostra telas de exemplo do Pix e do pagamento aprovado.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Award,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Handshake,
  Loader2,
  Lock,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";
import {
  API_ORIGIN,
  FAILED,
  PAID,
  createSale,
  digits,
  isValidCpf,
  isValidEmail,
  maskCpf,
  maskPhone,
  newCheckoutKey,
} from "@/components/store-checkout/lib";
import { fmtLeft, useCountdown, useOrder } from "@/components/store-checkout/useOrder";
import {
  type CheckoutBuilderConfig,
  type SealIcon,
  brlCents,
  safeImage,
  safeLink,
  themeVars,
  vslSource,
} from "@/lib/checkoutConfig";

export type OfferProduct = {
  id: string;
  sellerId?: string;
  name: string;
  description?: string | null;
  image?: string | null;
  warrantyDays?: number | null;
  backRedirectUrl?: string | null;
};

export type PreviewScreen = "checkout" | "pix" | "paid";

type Props = {
  product: OfferProduct;
  offerId: string | null;
  priceCents: number;
  config: CheckoutBuilderConfig;
  preview?: boolean;
  previewScreen?: PreviewScreen;
  attribution?: () => Record<string, unknown>;
  onInitiateCheckout?: (valueReais: number) => void;
};

type Sale = { id: string; qrCode: string; amount: number; expiresAt?: string | null };

const SEAL_ICONS: Record<SealIcon, typeof ShieldCheck> = {
  shield: ShieldCheck,
  lock: Lock,
  medal: Award,
  bolt: Zap,
  rocket: Rocket,
  handshake: Handshake,
};

/** Mistura duas cores hex (t = peso de `a`). */
function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  if (x.some(isNaN) || y.some(isNaN)) return a;
  return `#${x.map((v, i) => Math.round(v * t + y[i]! * (1 - t)).toString(16).padStart(2, "0")).join("")}`;
}

function trackVisit(productId: string) {
  const url = new URL(window.location.href);
  const q = (k: string) => url.searchParams.get(k) || undefined;
  let stored: Record<string, any> = {};
  try {
    stored = JSON.parse(localStorage.getItem("utmParams") || "{}");
  } catch {
    /* ignora */
  }
  const pick = (k: string) => q(k) || stored[k] || null;
  fetch(`${API_ORIGIN}/api/tracking/visit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId,
      utm_source: pick("utm_source"),
      utm_medium: pick("utm_medium"),
      utm_campaign: pick("utm_campaign"),
      utm_content: pick("utm_content"),
      utm_term: pick("utm_term"),
      fbclid: pick("fbclid"),
      src: pick("src"),
      sck: pick("sck"),
      referrer: document.referrer || null,
    }),
  }).catch(() => {});
}

/* ------------------------------------------------------------------ blocos */

function Card({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`p-5 sm:p-6 ${className}`}
      style={{
        background: "var(--ck-card)",
        borderRadius: "var(--ck-radius)",
        border: "1px solid var(--ck-border)",
        boxShadow: "0 1px 2px rgba(16,12,24,0.04), 0 8px 24px -12px rgba(16,12,24,0.10)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ n, children }: { n?: number; children: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      {n != null && (
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold"
          style={{ background: "var(--ck-btn)", color: "var(--ck-btn-text)" }}
        >
          {n}
        </span>
      )}
      <h2 className="text-[16px] font-semibold">{children}</h2>
    </div>
  );
}

function ScarcityTimer({ cfg, storageKey, preview }: { cfg: CheckoutBuilderConfig["extras"]["timer"]; storageKey: string; preview?: boolean }) {
  const total = Math.max(1, cfg.minutes || 10) * 60;
  const [left, setLeft] = useState(total);
  useEffect(() => {
    let start = Date.now();
    if (!preview) {
      try {
        const saved = Number(localStorage.getItem(storageKey));
        if (saved && Date.now() - saved < total * 1000) start = saved;
        else localStorage.setItem(storageKey, String(start));
      } catch {
        /* modo privado */
      }
    }
    const tick = () => setLeft(Math.max(0, total - Math.floor((Date.now() - start) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [storageKey, total, preview]);
  const bg = cfg.bg || (left > 0 ? "var(--ck-accent)" : "#dc2626");
  return (
    <div className="flex items-center justify-center gap-2.5 px-4 py-2.5 text-center text-[13.5px] font-semibold" style={{ background: bg, color: cfg.color || "#ffffff" }}>
      <Clock className="h-4 w-4 shrink-0" />
      <span>{cfg.text || "Oferta por tempo limitado"}</span>
      <span className="rounded-md bg-black/15 px-2 py-0.5 font-mono tabular-nums">{fmtLeft(left)}</span>
    </div>
  );
}

function Seals({ items }: { items: { icon: SealIcon; label: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 pt-1">
      {items.map((s, i) => {
        const Icon = SEAL_ICONS[s.icon] ?? ShieldCheck;
        return (
          <span key={i} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium" style={{ color: "var(--ck-muted)" }}>
            <Icon className="h-4 w-4" style={{ color: "var(--ck-accent)" }} />
            {s.label}
          </span>
        );
      })}
    </div>
  );
}

function Vsl({ url, headline }: { url: string; headline: string }) {
  const src = vslSource(url);
  if (!src) return null;
  return (
    <div>
      {headline && <p className="mb-3 text-center text-[18px] font-bold leading-snug sm:text-[20px]">{headline}</p>}
      <div className="overflow-hidden bg-black" style={{ borderRadius: "var(--ck-radius)", aspectRatio: "16 / 9" }}>
        {src.kind === "iframe" ? (
          <iframe
            src={src.src}
            title="Vídeo"
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <video src={src.src} className="h-full w-full" controls playsInline preload="metadata" />
        )}
      </div>
    </div>
  );
}

function Testimonials({ items }: { items: CheckoutBuilderConfig["extras"]["testimonials"]["items"] }) {
  if (!items.length) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-center text-[18px] font-bold">Quem comprou, aprovou</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t, i) => {
          const img = safeImage(t.image);
          return (
            <Card key={i} className="!p-5">
              <div className="flex items-center gap-3">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold" style={{ background: "var(--ck-soft)", color: "var(--ck-accent)" }}>
                    {(t.name[0] || "C").toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold">{t.name}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, k) => (
                      <Star key={k} className="h-3.5 w-3.5" style={{ color: "#f5b301", fill: k < t.rating ? "#f5b301" : "transparent" }} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-[13.5px] leading-relaxed" style={{ color: "var(--ck-muted)" }}>
                {t.text}
              </p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function LinkedImage({ image, link, className, style }: { image: string; link: string; className?: string; style?: CSSProperties }) {
  const src = safeImage(image);
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src={src} alt="" className={`block h-auto w-full ${className ?? ""}`} style={style} />;
  const href = safeLink(link);
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {img}
    </a>
  ) : (
    img
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[12px] font-medium text-[#dc2626]">{error}</span>}
    </label>
  );
}

/* ------------------------------------------------------------------ Pix */

function PixPanel({
  sale,
  cfg,
  status,
  preview,
  onRetry,
}: {
  sale: Sale;
  cfg: CheckoutBuilderConfig;
  status: "pending" | "paid" | "failed";
  preview?: boolean;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const left = useCountdown(preview ? null : sale.expiresAt ?? null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sale.qrCode);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = sale.qrCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (status === "paid") {
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14" style={{ color: "#16a34a" }} />
        <h2 className="mt-3 text-[20px] font-bold">Pagamento aprovado!</h2>
        <p className="mt-1.5 text-[14px]" style={{ color: "var(--ck-muted)" }}>
          Obrigado pela compra. Você vai receber o acesso no e-mail informado.
        </p>
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="py-6 text-center">
        <h2 className="text-[18px] font-bold">Esse Pix expirou</h2>
        <p className="mt-1.5 text-[14px]" style={{ color: "var(--ck-muted)" }}>
          Gere um novo pra concluir a compra.
        </p>
        <button onClick={onRetry} className="mt-4 h-11 px-6 text-[14px] font-semibold" style={{ background: "var(--ck-btn)", color: "var(--ck-btn-text)", borderRadius: "var(--ck-radius)" }}>
          Gerar novo Pix
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-[18px] font-bold">{cfg.content.pixTitle || "Pague com Pix pra finalizar"}</h2>
      <p className="mt-1 text-[14px]" style={{ color: "var(--ck-muted)" }}>
        Valor: <strong style={{ color: "var(--ck-accent)" }}>{brlCents(Math.round(sale.amount * 100))}</strong>
      </p>
      <div className="mx-auto mt-4 w-fit bg-white p-3" style={{ borderRadius: "var(--ck-radius)", border: "1px solid var(--ck-border)" }}>
        {preview ? (
          <div className="flex h-[200px] w-[200px] flex-col items-center justify-center gap-2 text-[12px] font-semibold text-[#6b7280]">
            <QRCodeSVG value="PREVIA-SHADOWPAY-NAO-E-PIX" size={150} fgColor="#c4c4cc" />
            Prévia · Pix não gerado
          </div>
        ) : (
          <QRCodeSVG value={sale.qrCode} size={200} />
        )}
      </div>
      {left != null && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: "var(--ck-muted)" }}>
          <Clock className="h-4 w-4" /> Expira em <span className="font-mono tabular-nums">{fmtLeft(left)}</span>
        </p>
      )}
      <div
        className="mx-auto mt-4 max-w-md truncate px-3 py-2.5 text-left font-mono text-[12px]"
        style={{ background: "var(--ck-soft)", borderRadius: "var(--ck-radius)", color: "var(--ck-muted)" }}
      >
        {preview ? "00020126...PREVIA...NAO-E-UM-PIX" : sale.qrCode}
      </div>
      <button
        onClick={preview ? undefined : copy}
        className="mx-auto mt-3 flex h-12 w-full max-w-md items-center justify-center gap-2 text-[15px] font-bold transition-transform active:scale-[0.99]"
        style={{ background: "var(--ck-btn)", color: "var(--ck-btn-text)", borderRadius: "var(--ck-radius)" }}
      >
        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
        {copied ? "Código copiado!" : cfg.content.copyButton || "Copiar código Pix"}
      </button>
      {cfg.fields.bankNotice && (
        <p className="mx-auto mt-3 max-w-md text-[12.5px] leading-relaxed" style={{ color: "var(--ck-muted)" }}>
          Se for sua primeira compra com a gente, o seu banco pode mostrar um aviso de segurança. É normal: é só confirmar o pagamento.
        </p>
      )}
      <div className="mx-auto mt-5 max-w-md text-left">
        <p className="text-[13.5px] font-semibold">Como pagar</p>
        <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed" style={{ color: "var(--ck-muted)" }}>
          {cfg.content.pixInstructions ||
            "1. Copie o código acima.\n2. Abra o app do seu banco e escolha Pix › Pix copia e cola.\n3. Cole o código e confirme. A aprovação é na hora."}
        </p>
      </div>
      <p className="mt-4 inline-flex items-center gap-2 text-[12.5px] font-medium" style={{ color: "var(--ck-muted)" }}>
        <Loader2 className="h-4 w-4 animate-spin" /> Aguardando o pagamento…
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ página */

export default function OfferCheckout({
  product,
  offerId,
  priceCents,
  config: cfg,
  preview,
  previewScreen = "checkout",
  attribution,
  onInitiateCheckout,
}: Props) {
  const ex = cfg.extras;
  const vars = useMemo(() => {
    const v = themeVars(cfg);
    return {
      ...v,
      "--ck-muted": mix(v["--ck-text"]!, v["--ck-card"]!, 0.62),
      "--ck-border": mix(v["--ck-text"]!, v["--ck-card"]!, 0.1),
      "--ck-soft": mix(v["--ck-accent"]!, v["--ck-card"]!, 0.08),
      "--ck-input": mix(v["--ck-text"]!, v["--ck-card"]!, 0.03),
    } as Record<string, string>;
  }, [cfg]);

  const title = cfg.content.title || product.name;
  const subtitle = cfg.content.subtitle || product.description || "";
  const image = safeImage(cfg.content.image) || safeImage(product.image);
  const logo = safeImage(cfg.content.logo);
  const bumps = cfg.bumps.filter((b) => b.active && b.title && b.priceCents > 0);
  const seals = ex.seals.enabled ? ex.seals.items : [];
  const warranty = Number(product.warrantyDays) || 0;
  const guarantee =
    cfg.post.guarantee ||
    (warranty > 0 ? `Garantia de ${warranty} dias: se não gostar, devolvemos o seu dinheiro.` : "");

  /* ---------- pedido ---------- */
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", cpf: "" });
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const submittingRef = useRef(false);

  const subtotal = priceCents + bumps.filter((b) => selected.includes(b.id)).reduce((s, b) => s + b.priceCents, 0);
  const pct = Math.max(0, Math.min(90, cfg.pixDiscountPercent || 0));
  const total = pct > 0 ? Math.round((subtotal * (100 - pct)) / 100) : subtotal;

  const errors: Partial<Record<keyof typeof form, string>> = {};
  if (cfg.fields.name && form.name.trim().length < 3) errors.name = "Digite seu nome completo.";
  if (cfg.fields.email && !isValidEmail(form.email)) errors.email = "Digite um e-mail válido.";
  if (cfg.fields.phone && digits(form.phone).length < 10) errors.phone = "Digite seu celular com DDD.";
  if (cfg.fields.cpf && !isValidCpf(form.cpf)) errors.cpf = "Digite um CPF válido.";
  const hasErrors = Object.keys(errors).length > 0;

  // mesmo pedido = mesma chave (clique duplo não gera 2 Pix); `keySalt` muda
  // no "gerar novo Pix" — senão o servidor devolveria o Pix expirado
  const [keySalt, setKeySalt] = useState(0);
  const checkoutKey = useMemo(
    () => newCheckoutKey(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected.slice().sort().join(","), form.name, form.email, form.phone, form.cpf, keySalt],
  );

  const send = async (key: string) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    onInitiateCheckout?.(total / 100);
    try {
      const s = await createSale({
        productId: product.id,
        offerId: offerId || undefined,
        bumpIds: selected,
        paymentType: "PIX",
        name: cfg.fields.name ? form.name.trim() : undefined,
        email: cfg.fields.email ? form.email.trim() : undefined,
        document: cfg.fields.cpf ? digits(form.cpf) : undefined,
        celular: cfg.fields.phone ? `+55${digits(form.phone)}` : undefined,
        checkoutKey: key,
        ...(attribution?.() ?? {}),
      });
      setSale({ id: s.id, qrCode: s.qrCode, amount: Number(s.amount) || total / 100, expiresAt: s.expiresAt ?? null });
    } catch (e: any) {
      setError(e?.message || "Não foi possível gerar o Pix. Tente de novo.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const submit = () => {
    setAttempted(true);
    if (preview) return;
    if (hasErrors) {
      setError("Confira os campos destacados.");
      return;
    }
    void send(checkoutKey);
  };

  /* ---------- Pix direto: gera ao abrir (mesma chave se recarregar) ---------- */
  const direct = cfg.template === "pix-direto";
  const directKeyName = `sp:pixkey:${product.id}:${offerId || "padrao"}`;
  const directStarted = useRef(false);
  useEffect(() => {
    if (!direct || preview || directStarted.current) return;
    if ((navigator as any).webdriver) return;
    const start = () => {
      if (directStarted.current || document.hidden) return;
      directStarted.current = true;
      let key = "";
      try {
        key = sessionStorage.getItem(directKeyName) || "";
        if (!key) {
          key = newCheckoutKey();
          sessionStorage.setItem(directKeyName, key);
        }
      } catch {
        key = newCheckoutKey();
      }
      void send(key);
    };
    const t = setTimeout(start, 600);
    document.addEventListener("visibilitychange", start);
    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direct, preview]);

  /* ---------- acompanhamento do pagamento ---------- */
  const { order: rawOrder } = useOrder(!preview && sale ? sale.id : null);
  // só vale o pedido do Pix atual (nunca o estado do anterior)
  const order = rawOrder && sale && rawOrder.id === sale.id ? rawOrder : null;
  const status: "pending" | "paid" | "failed" = order && PAID(order.status) ? "paid" : order && FAILED(order.status) ? "failed" : "pending";
  useEffect(() => {
    if (status !== "paid") return;
    const link = safeLink(order?.linkUpSell);
    if (!link) return;
    const t = setTimeout(() => window.location.assign(link), 4000);
    return () => clearTimeout(t);
  }, [status, order?.linkUpSell]);

  const retry = () => {
    try {
      sessionStorage.removeItem(directKeyName);
    } catch {
      /* ignora */
    }
    setSale(null);
    setKeySalt((n) => n + 1);
    directStarted.current = false;
    if (direct) {
      const key = newCheckoutKey();
      try {
        sessionStorage.setItem(directKeyName, key);
      } catch {
        /* ignora */
      }
      directStarted.current = true;
      void send(key);
    }
  };

  /* ---------- visita + "voltar" ---------- */
  const visited = useRef(false);
  useEffect(() => {
    if (preview || visited.current) return;
    visited.current = true;
    trackVisit(product.id);
  }, [preview, product.id]);

  useEffect(() => {
    const back = safeLink(product.backRedirectUrl);
    if (preview || !back) return;
    history.pushState(null, "", window.location.href);
    const onBack = () => window.location.assign(back);
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [preview, product.backRedirectUrl]);

  /* ---------- telas da prévia ---------- */
  const shownSale: Sale | null = preview
    ? previewScreen === "checkout"
      ? null
      : { id: "previa", qrCode: "", amount: total / 100 }
    : sale;
  const shownStatus: "pending" | "paid" | "failed" = preview ? (previewScreen === "paid" ? "paid" : "pending") : status;

  /* ---------- pedaços ---------- */
  const inputStyle: CSSProperties = {
    background: "var(--ck-input)",
    border: "1px solid var(--ck-border)",
    borderRadius: "calc(var(--ck-radius) * 0.7)",
    color: "var(--ck-text)",
  };
  const inputCls = "h-12 w-full px-3.5 text-[15px] outline-none transition-shadow focus:shadow-[0_0_0_3px_var(--ck-soft)]";
  const fieldErr = (k: keyof typeof form) => (attempted ? errors[k] : undefined);

  const fieldsBlock =
    cfg.fields.name || cfg.fields.email || cfg.fields.phone || cfg.fields.cpf ? (
      <div className="grid gap-3.5 sm:grid-cols-2">
        {cfg.fields.name && (
          <div className="sm:col-span-2">
            <Field label="Nome completo" error={fieldErr("name")}>
              <input className={inputCls} style={inputStyle} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" />
            </Field>
          </div>
        )}
        {cfg.fields.email && (
          <div className="sm:col-span-2">
            <Field label="E-mail" error={fieldErr("email")}>
              <input className={inputCls} style={inputStyle} type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" />
            </Field>
          </div>
        )}
        {cfg.fields.phone && (
          <Field label="Celular (WhatsApp)" error={fieldErr("phone")}>
            <input className={inputCls} style={inputStyle} inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} placeholder="(11) 99999-9999" />
          </Field>
        )}
        {cfg.fields.cpf && (
          <Field label="CPF" error={fieldErr("cpf")}>
            <input className={inputCls} style={inputStyle} inputMode="numeric" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: maskCpf(e.target.value) })} placeholder="000.000.000-00" />
          </Field>
        )}
      </div>
    ) : null;

  const bumpsBlock = bumps.length ? (
    <div className="space-y-3">
      <p className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: "var(--ck-accent)" }}>
        Aproveite também
      </p>
      {bumps.map((b) => {
        const on = selected.includes(b.id);
        const img = safeImage(b.image);
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => setSelected((s) => (on ? s.filter((x) => x !== b.id) : [...s, b.id]))}
            className="flex w-full items-start gap-3 p-3.5 text-left transition-colors"
            style={{
              border: `2px dashed ${on ? "var(--ck-accent)" : "var(--ck-border)"}`,
              background: on ? "var(--ck-soft)" : "transparent",
              borderRadius: "var(--ck-radius)",
            }}
          >
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px]"
              style={{ background: on ? "var(--ck-accent)" : "transparent", border: `2px solid ${on ? "var(--ck-accent)" : "var(--ck-muted)"}` }}
            >
              {on && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </span>
            {img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="h-14 w-14 shrink-0 object-cover" style={{ borderRadius: "calc(var(--ck-radius) * 0.6)" }} />
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold">{b.title}</span>
              {b.description && (
                <span className="mt-0.5 block text-[12.5px] leading-snug" style={{ color: "var(--ck-muted)" }}>
                  {b.description}
                </span>
              )}
              <span className="mt-1 block text-[14px] font-bold" style={{ color: "var(--ck-accent)" }}>
                + {brlCents(b.priceCents)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  ) : null;

  const totals = (
    <div className="space-y-1.5 text-[14px]">
      <div className="flex justify-between">
        <span style={{ color: "var(--ck-muted)" }}>{title}</span>
        <span className="tabular-nums">{brlCents(priceCents)}</span>
      </div>
      {bumps
        .filter((b) => selected.includes(b.id))
        .map((b) => (
          <div key={b.id} className="flex justify-between">
            <span style={{ color: "var(--ck-muted)" }}>{b.title}</span>
            <span className="tabular-nums">{brlCents(b.priceCents)}</span>
          </div>
        ))}
      {pct > 0 && (
        <div className="flex justify-between" style={{ color: "#16a34a" }}>
          <span>Desconto no Pix ({pct}%)</span>
          <span className="tabular-nums">− {brlCents(subtotal - total)}</span>
        </div>
      )}
      <div className="flex items-baseline justify-between pt-2" style={{ borderTop: "1px solid var(--ck-border)" }}>
        <span className="font-semibold">Total</span>
        <span className="text-[22px] font-extrabold tabular-nums" style={{ color: "var(--ck-accent)" }}>
          {brlCents(total)}
        </span>
      </div>
    </div>
  );

  const payButton = (
    <div>
      {error && (
        <p className="mb-2.5 text-center text-[13px] font-medium text-[#dc2626]" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="flex h-[54px] w-full items-center justify-center gap-2 text-[16px] font-bold shadow-[0_10px_24px_-10px_var(--ck-btn)] transition-transform active:scale-[0.99] disabled:opacity-70"
        style={{ background: "var(--ck-btn)", color: "var(--ck-btn-text)", borderRadius: "var(--ck-radius)" }}
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-[18px] w-[18px]" />}
        {submitting ? "Gerando seu Pix…" : cfg.content.buttonText || "Comprar agora com Pix"}
      </button>
      <p className="mt-2.5 text-center text-[12px]" style={{ color: "var(--ck-muted)" }}>
        Pagamento via Pix · aprovação na hora
      </p>
    </div>
  );

  const productHead = (
    <div className="flex items-start gap-3.5">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-[72px] w-[72px] shrink-0 object-cover" style={{ borderRadius: "calc(var(--ck-radius) * 0.7)" }} />
      )}
      <div className="min-w-0">
        <p className="text-[16px] font-bold leading-snug">{title}</p>
        {subtitle && (
          <p className="mt-1 line-clamp-3 whitespace-pre-line text-[13px] leading-snug" style={{ color: "var(--ck-muted)" }}>
            {subtitle}
          </p>
        )}
        <p className="mt-1.5 text-[18px] font-extrabold" style={{ color: "var(--ck-accent)" }}>
          {brlCents(priceCents)}
        </p>
      </div>
    </div>
  );

  const guaranteeBlock = guarantee ? (
    <div className="flex items-start gap-3 p-4 text-[13px] leading-relaxed" style={{ background: "var(--ck-soft)", borderRadius: "var(--ck-radius)" }}>
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--ck-accent)" }} />
      <span>{guarantee}</span>
    </div>
  ) : null;

  const pix = shownSale ? (
    <PixPanel sale={shownSale} cfg={cfg} status={shownStatus} preview={preview} onRetry={retry} />
  ) : null;

  const vsl = ex.vsl.enabled && ex.vsl.url ? <Vsl url={ex.vsl.url} headline={ex.vsl.headline} /> : null;

  /* ---------- templates ---------- */
  let main: ReactNode;
  if (direct) {
    main = (
      <div className="mx-auto w-full max-w-[520px] space-y-5">
        {vsl}
        <Card>
          {productHead}
          <div className="my-5 h-px" style={{ background: "var(--ck-border)" }} />
          {pix ??
            (error ? (
              <div className="py-4 text-center">
                <p className="text-[14px] font-medium text-[#dc2626]">{error}</p>
                <button onClick={retry} className="mt-3 h-11 px-6 text-[14px] font-semibold" style={{ background: "var(--ck-btn)", color: "var(--ck-btn-text)", borderRadius: "var(--ck-radius)" }}>
                  Tentar de novo
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-9 w-9 animate-spin" style={{ color: "var(--ck-accent)" }} />
                <p className="text-[15px] font-semibold">Gerando seu Pix…</p>
                <p className="text-[13px]" style={{ color: "var(--ck-muted)" }}>
                  {preview ? "Prévia: na página de verdade o Pix aparece aqui em segundos." : "Só um instante."}
                </p>
              </div>
            ))}
        </Card>
        <Seals items={seals} />
        {guaranteeBlock}
      </div>
    );
  } else if (cfg.template === "compacto" || cfg.layout === "uma") {
    main = (
      <div className="mx-auto w-full max-w-[560px] space-y-5">
        {vsl}
        <Card>
          {productHead}
          <div className="my-5 h-px" style={{ background: "var(--ck-border)" }} />
          {pix ?? (
            <div className="space-y-5">
              {fieldsBlock}
              {bumpsBlock}
              {totals}
              {payButton}
            </div>
          )}
        </Card>
        <Seals items={seals} />
        {guaranteeBlock}
      </div>
    );
  } else {
    main = (
      <div className="mx-auto grid w-full max-w-[1080px] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          {vsl}
          <Card>
            {pix ?? (
              <div className="space-y-6">
                {fieldsBlock && (
                  <div>
                    <SectionTitle n={1}>Seus dados</SectionTitle>
                    {fieldsBlock}
                  </div>
                )}
                {bumpsBlock}
                <div>
                  <SectionTitle n={fieldsBlock ? 2 : 1}>Pagamento</SectionTitle>
                  <div className="mb-4 flex items-center gap-3 p-3.5" style={{ border: "2px solid var(--ck-accent)", borderRadius: "var(--ck-radius)", background: "var(--ck-soft)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/pix.png" alt="" className="h-6 w-6" />
                    <span className="flex-1 text-[14px] font-semibold">Pix</span>
                    {pct > 0 && <span className="rounded-full bg-[#16a34a] px-2 py-0.5 text-[11.5px] font-bold text-white">{pct}% OFF</span>}
                  </div>
                  {payButton}
                </div>
              </div>
            )}
          </Card>
          <Seals items={seals} />
        </div>
        <aside className="order-first space-y-4 lg:sticky lg:top-6 lg:order-none">
          <Card>
            <p className="mb-4 text-[13px] font-semibold uppercase tracking-wide" style={{ color: "var(--ck-muted)" }}>
              Resumo do pedido
            </p>
            {productHead}
            <div className="mt-5">{totals}</div>
          </Card>
          {guaranteeBlock}
        </aside>
      </div>
    );
  }

  const wa = ex.whatsapp.enabled && ex.whatsapp.number.length >= 10 ? ex.whatsapp : null;

  return (
    <div className="min-h-screen" style={{ ...(vars as CSSProperties), background: "var(--ck-page)", color: "var(--ck-text)", fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}>
      {ex.announcement.enabled && ex.announcement.text && (
        <div className="px-4 py-2 text-center text-[13px] font-semibold" style={{ background: ex.announcement.bg || "var(--ck-accent)", color: ex.announcement.color || "#ffffff" }}>
          {ex.announcement.text}
        </div>
      )}
      {ex.banner.enabled && ex.banner.image && <LinkedImage image={ex.banner.image} link={ex.banner.link} />}
      <header className="flex items-center justify-center gap-3 px-4 py-3" style={{ background: "var(--ck-header)", color: "var(--ck-header-text)" }}>
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-7 w-auto max-w-[140px] object-contain" />
        )}
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
          <Lock className="h-4 w-4" />
          {cfg.content.securityText || "Pagamento 100% seguro"}
        </span>
      </header>
      {ex.timer.enabled && <ScarcityTimer cfg={ex.timer} storageKey={`checkoutStartTime:${product.id}:${offerId || "padrao"}`} preview={preview} />}

      <main className="px-4 py-6 sm:py-10">
        {main}
        <div className="mx-auto w-full max-w-[1080px]">
          {ex.testimonials.enabled && <Testimonials items={ex.testimonials.items} />}
          {ex.imageBelow.enabled && ex.imageBelow.image && (
            <div className={`mt-8 ${ex.imageBelow.full ? "" : "mx-auto max-w-[560px]"}`}>
              <LinkedImage image={ex.imageBelow.image} link={ex.imageBelow.link} style={{ borderRadius: ex.imageBelow.full ? 0 : "var(--ck-radius)" }} />
            </div>
          )}
        </div>
      </main>

      <footer className="px-4 pb-10 text-center text-[12px]" style={{ color: "var(--ck-muted)" }}>
        Compra processada com segurança. Seus dados são protegidos.
      </footer>

      {wa && (
        <a
          href={`https://wa.me/${wa.number}${wa.message ? `?text=${encodeURIComponent(wa.message)}` : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={preview ? (e) => e.preventDefault() : undefined}
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_10px_24px_-8px_rgba(0,0,0,0.45)]"
          aria-label="Falar no WhatsApp"
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      )}
    </div>
  );
}

/**
 * Checkout "Loja": formatação, máscaras e chamadas à API pública.
 * Os VALORES cobrados sempre vêm do servidor (POST /api/sales/public/quote);
 * aqui só se formata o que ele devolve.
 */
import axios from "axios";
import { OFFLINE_MSG } from "@/lib/axiosErrors";

/** Backend (env só pra testar local; produção usa o Render). */
export const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN || "https://shadowpay-backend.onrender.com";
export const API = `${API_ORIGIN}/api`;

/* ---------------- tipos ---------------- */

export type StoreShipping = {
  mode: "free" | "fixed";
  priceCents: number;
  daysMin: number;
  daysMax: number;
  label: string;
};

export type StoreConfig = {
  enabled: boolean;
  title: string;
  headerColor: string;
  tag: string;
  variant: string;
  requireAddress: boolean;
  shipping: StoreShipping;
  couponsEnabled: boolean;
};

export type Quote = {
  subtotalCents: number;
  couponDiscountCents: number;
  pixDiscountCents: number;
  pixDiscountPercent: number;
  shippingCents: number;
  totalCents: number;
  coupon: { code: string; type: "percent" | "fixed"; value: number } | null;
};

export type Address = {
  recipient: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

export type Billing = { name: string; email: string; cpf: string; phone: string };

export type OrderItem = { name: string; kind: "product" | "bump" | "shipping"; priceCents: number; quantity: number };

export type Order = {
  id: string;
  status: string; // approved | pending | processing | failed | expired | refunded | chargeback
  qrCode: string;
  qrCodeImage: string | null;
  amount: number;
  paidAt: string | null;
  productId: string | null;
  productName: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  items: OrderItem[];
  delivery: { city: string; state: string; daysMin: number | null; daysMax: number | null } | null;
  store: { title: string; headerColor: string } | null;
  linkUpSell: string | null;
};

/* ---------------- config do produto ---------------- */

const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * Lê `checkoutConfig.storeCheckout`. O público já vem normalizado pelo
 * servidor; o dono logado recebe a forma salva (preço em reais e lista de
 * cupons) — os dois formatos são aceitos.
 */
export function readStoreConfig(checkoutConfig: any): StoreConfig {
  const cfg = checkoutConfig && typeof checkoutConfig === "object" ? checkoutConfig : {};
  const raw = cfg.storeCheckout && typeof cfg.storeCheckout === "object" ? cfg.storeCheckout : {};
  const ship = raw.shipping && typeof raw.shipping === "object" ? raw.shipping : {};
  const physical = String(cfg.productType ?? "").toLowerCase().includes("sic");
  const priceCents =
    ship.priceCents != null ? Math.round(num(ship.priceCents, 0)) : Math.round(num(ship.price, 0) * 100);
  const mode = ship.mode === "fixed" && priceCents > 0 ? "fixed" : "free";
  const daysMin = Math.max(0, Math.round(num(ship.daysMin, 3)));
  const enabled = raw.enabled === undefined ? physical : raw.enabled === true;
  return {
    enabled,
    title: (typeof raw.title === "string" && raw.title.trim()) || "Finalize sua compra",
    headerColor: typeof raw.headerColor === "string" && /^#[0-9a-f]{6}$/i.test(raw.headerColor) ? raw.headerColor : "",
    tag: typeof raw.tag === "string" ? raw.tag.trim().slice(0, 24) : "",
    variant: typeof raw.variant === "string" ? raw.variant.trim().slice(0, 60) : "",
    requireAddress: raw.requireAddress === undefined ? physical || enabled : raw.requireAddress === true,
    shipping: {
      mode,
      priceCents: mode === "fixed" ? priceCents : 0,
      daysMin,
      daysMax: Math.max(daysMin, Math.round(num(ship.daysMax, Math.max(daysMin, 7)))),
      label: (typeof ship.label === "string" && ship.label.trim()) || "Envio padrão",
    },
    couponsEnabled:
      raw.couponsEnabled === true ||
      (Array.isArray(raw.coupons) && raw.coupons.some((c: any) => c && c.active !== false)),
  };
}

/* ---------------- dinheiro / datas ---------------- */

export function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "R$ 499" + centavos separados (o visual "R$ 499⁰⁰"). */
export function moneyParts(cents: number): { int: string; dec: string } {
  const c = Math.max(0, Math.round(cents));
  const int = Math.floor(c / 100).toLocaleString("pt-BR");
  return { int: `R$ ${int}`, dec: String(c % 100).padStart(2, "0") };
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "Chegará entre 15 e 19/jan" (dias corridos a partir de hoje). */
export function deliveryWindow(daysMin: number, daysMax: number, from = new Date()): string {
  const a = new Date(from);
  a.setDate(a.getDate() + daysMin);
  const b = new Date(from);
  b.setDate(b.getDate() + daysMax);
  if (daysMin === daysMax) return `Chegará em ${b.getDate()}/${MONTHS[b.getMonth()]}`;
  const first = a.getMonth() === b.getMonth() ? `${a.getDate()}` : `${a.getDate()}/${MONTHS[a.getMonth()]}`;
  return `Chegará entre ${first} e ${b.getDate()}/${MONTHS[b.getMonth()]}`;
}

/* ---------------- máscaras ---------------- */

export const digits = (v: string) => v.replace(/\D/g, "");

export function maskCep(v: string): string {
  const d = digits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function maskCpf(v: string): string {
  const d = digits(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function maskPhone(v: string): string {
  const d = digits(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function isValidCpf(v: string): boolean {
  const d = digits(v);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += Number(d[i]) * (len + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** CPF pra exibir no resumo, sem mostrar o documento inteiro na tela. */
export function cpfHint(v: string): string {
  const d = digits(v);
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : "";
}

/** Texto legível sobre a cor da marca (preto ou branco). */
export function onColor(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#ffffff";
  const n = parseInt(m[1] ?? "", 16);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.45 ? "rgba(0,0,0,0.88)" : "#ffffff";
}

export function newCheckoutKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
}

/* ---------------- API ---------------- */

export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

async function call<T>(fn: () => Promise<{ data: any }>, fallback: string): Promise<T> {
  let res;
  try {
    res = await fn();
  } catch (e: any) {
    if (!e?.response) throw new ApiError(OFFLINE_MSG, "offline");
    const d = e.response.data;
    throw new ApiError(d?.message || d?.error?.message || fallback, d?.code || d?.error?.code);
  }
  if (res.data?.success === false) throw new ApiError(res.data?.message || fallback, res.data?.code);
  return res.data as T;
}

export async function fetchQuote(body: {
  productId: string;
  bumpIds: string[];
  couponCode?: string | null;
}): Promise<Quote> {
  const r = await call<{ data: Quote }>(
    () => axios.post(`${API}/sales/public/quote`, body, { timeout: 20000 }),
    "Não foi possível calcular o total.",
  );
  return r.data;
}

export type CreatedSale = { id: string; qrCode: string; amount: number; status: string; expiresAt?: string };

export async function createSale(body: Record<string, unknown>): Promise<CreatedSale> {
  const r = await call<CreatedSale>(
    () => axios.post(`${API}/sales/public`, body, { timeout: 45000 }),
    "Não foi possível gerar o Pix. Tente de novo.",
  );
  if (!r?.id) throw new ApiError("Não foi possível gerar o Pix. Tente de novo.");
  return r;
}

export async function fetchOrder(id: string): Promise<Order> {
  const r = await call<any>(() => axios.get(`${API}/sales/public/${encodeURIComponent(id)}/order`, { timeout: 20000 }), "Pedido não encontrado.");
  return {
    id: r.id,
    status: String(r.status || "pending"),
    qrCode: r.qrCode || "",
    qrCodeImage: r.qrCodeImage || null,
    amount: Number(r.amount) || 0,
    paidAt: r.paidAt ?? null,
    productId: r.productId ?? null,
    productName: r.productName ?? null,
    createdAt: r.createdAt ?? null,
    expiresAt: r.expiresAt ?? null,
    items: Array.isArray(r.items) ? r.items : [],
    delivery: r.delivery ?? null,
    store: r.store ?? null,
    linkUpSell: r.linkUpSell ?? null,
  };
}

/** Endereço pelo CEP (ViaCEP). Falhou? O comprador digita à mão. */
export async function lookupCep(cep: string): Promise<Partial<Address> | null> {
  const d = digits(cep);
  if (d.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
    if (!r.ok) return null;
    const j = await r.json();
    if (j?.erro) return null;
    return { street: j.logradouro || "", district: j.bairro || "", city: j.localidade || "", state: j.uf || "" };
  } catch {
    return null;
  }
}

export const PAID = (s: string) => s === "approved" || s === "paid";
export const FAILED = (s: string) => ["failed", "expired", "refunded", "chargeback", "canceled", "cancelled"].includes(s);
